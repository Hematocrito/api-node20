import { Injectable, Inject, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { ConfigService } from 'nestjs-config';
import { S3 } from 'aws-sdk';

import {
  StringHelper,
  QueueEventService,
  QueueEvent,
  getConfig,
  EntityNotFoundException
} from 'src/kernel';
import {
  writeFileSync, unlinkSync, existsSync, createReadStream
} from 'fs';
import { join } from 'path';
import * as jwt from 'jsonwebtoken';
import { FILE_MODEL_PROVIDER } from '../providers';
import { FileModel } from '../models';
import { IMulterUploadedFile } from '../lib/multer/multer.utils';
import { FileDto } from '../dtos';
import { IFileUploadOptions } from '../lib';
import { ImageService } from './image.service';
import { FileVideoService } from './video.service';

const VIDEO_QUEUE_CHANNEL = 'VIDEO_PROCESS';
const PHOTO_QUEUE_CHANNEL = 'PHOTO_PROCESS';

export const FILE_EVENT = {
  VIDEO_PROCESSED: 'VIDEO_PROCESSED',
  PHOTO_PROCESSED: 'PHOTO_PROCESSED'
};

@Injectable()
export class FileService {
  constructor(
    private readonly config: ConfigService,
    @Inject(FILE_MODEL_PROVIDER)
    private readonly fileModel: Model<FileModel>,
    private readonly imageService: ImageService,
    private readonly videoService: FileVideoService,
    private readonly queueEventService: QueueEventService
  ) {
    this.queueEventService.subscribe(
      VIDEO_QUEUE_CHANNEL,
      'PROCESS_VIDEO',
      this._processVideo.bind(this)
    );

    this.queueEventService.subscribe(
      PHOTO_QUEUE_CHANNEL,
      'PROCESS_PHOTO',
      this._processPhoto.bind(this)
    );
  }

  public async findById(id: string | ObjectId): Promise<FileDto> {
    const model = await this.fileModel.findById(id);
    if (!model) return null;
    return new FileDto(model);
  }

  public async findByIds(ids: string[] | ObjectId[]): Promise<FileDto[]> {
    const items = await this.fileModel.find({
      _id: {
        $in: ids
      }
    });

    return items.map((i) => new FileDto(i));
  }

  public async countByRefType(itemType: string): Promise<any> {
    const count = await this.fileModel.countDocuments({
      refItems: { $elemMatch: { itemType } }
    });
    return count;
  }

  public async findByRefType(itemType: string, limit: number, offset: number): Promise<any> {
    const items = await this.fileModel.find({
      refItems: { $elemMatch: { itemType } }
    }).limit(limit).skip(offset * limit);
    return items.map((item) => new FileDto(item));
  }

  public async createFromMulter(
    type: string,
    multerData: IMulterUploadedFile | any,
    options?: IFileUploadOptions
  ): Promise<FileDto> {
    console.log(multerData);
    // eslint-disable-next-line no-param-reassign
    options = options || {};
    const publicDir = this.config.get('file.publicDir');
    const photoDir = this.config.get('file.photoDir');
    const thumbnails = [];
    const blurImagePath = '';
    // replace new photo without exif, ignore video
    // if (multerData.mimetype.includes('image')) {
    //   const buffer = await this.imageService.replaceWithoutExif(multerData.path);
    //   let thumbBuffer = null;
    //   let blurBuffer = null;
    //   if (options.generateThumbnail) {
    //     thumbBuffer = await this.imageService.createThumbnail(
    //       multerData.path,
    //       options?.thumbnailSize || { width: 250, height: 250 }
    //     ) as Buffer;
    //     const thumbName = `${StringHelper.randomString(5)}_thumb${StringHelper.getExt(multerData.path)}`;
    //     !options?.replaceByThumbnail && writeFileSync(join(photoDir, thumbName), thumbBuffer);
    //     !options?.replaceByThumbnail && thumbnails.push({
    //       thumbnailSize: options.thumbnailSize,
    //       path: join(photoDir, thumbName).replace(publicDir, ''),
    //       absolutePath: join(photoDir, thumbName)
    //     });

    //     // generate blur image
    //     blurBuffer = await this.imageService.createThumbnail(
    //       multerData.path,
    //       { width: 30, height: 30 }
    //     ) as Buffer;
    //   }
    //   unlinkSync(multerData.path);
    //   writeFileSync(multerData.path, options?.replaceByThumbnail && thumbBuffer ? thumbBuffer : buffer);
    //   if (blurBuffer) {
    //     blurImagePath = join(photoDir, `${StringHelper.randomString(5)}_small${StringHelper.getExt(multerData.path)}`);
    //     writeFileSync(blurImagePath, blurBuffer);
    //   }
    // }

    const data = {
      type,
      name: multerData.filename,
      description: '', // TODO - get from options
      mimeType: multerData.mimetype,
      server: options.server || 'local' || 's3',
      // todo - get path from public
      path: multerData.location,
      absolutePath: multerData.key,
      blurImagePath: multerData.location,
      // TODO - update file size
      size: multerData.size,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: options.uploader ? options.uploader._id : null,
      updatedBy: options.uploader ? options.uploader._id : null
    } as FileModel;

    const file = await this.fileModel.create(data);
    // TODO - check option and process
    // eg create thumbnail, video converting, etc...
    return FileDto.fromModel(file);
  }

  public async addRef(
    fileId: ObjectId,
    ref: {
      itemId: ObjectId;
      itemType: string;
    }
  ) {
    return this.fileModel.updateOne(
      { _id: fileId },
      {
        $addToSet: {
          refItems: ref
        }
      }
    );
  }

  public async remove(fileId: string | ObjectId) {
    const file = await this.fileModel.findOne({ _id: fileId });
    if (!file) {
      return false;
    }

    await file.remove();

    const filePaths = [
      {
        absolutePath: file.absolutePath,
        path: file.path
      }
    ].concat(file.thumbnails || []);

    filePaths.forEach((fp) => {
      if (existsSync(fp.absolutePath)) {
        unlinkSync(fp.absolutePath);
      } else {
        const publicDir = this.config.get('file.publicDir');
        const filePublic = join(publicDir, fp.path);
        existsSync(filePublic) && unlinkSync(filePublic);
      }
    });
    // TODO - fire event
    return true;
  }

  public async removeIfNotHaveRef(fileId: string | ObjectId) {
    const file = await this.fileModel.findOne({ _id: fileId });
    if (!file) {
      return false;
    }

    if (file.refItems && !file.refItems.length) {
      return false;
    }

    await file.remove();

    if (existsSync(file.absolutePath)) {
      unlinkSync(file.absolutePath);
    } else {
      const publicDir = this.config.get('file.publicDir');
      const filePublic = join(publicDir, file.path);
      existsSync(filePublic) && unlinkSync(filePublic);
    }

    // TODO - fire event
    return true;
  }

  // TODO - fix here, currently we just support local server, need a better solution if scale?
  /**
   * generate mp4 video & thumbnail
   * @param fileId
   * @param options
   */
  public async queueProcessVideo(
    fileId: string | ObjectId,
    options?: {
      meta: Record<string, any>;
      publishChannel: string;
    }
  ) {
    // add queue and convert file to mp4 and generate thumbnail
    const file = await this.fileModel.findOne({ _id: fileId });
    if (!file || file.status === 'processing') {
      return false;
    }
    await this.queueEventService.publish(
      new QueueEvent({
        channel: VIDEO_QUEUE_CHANNEL,
        eventName: 'processVideo',
        data: {
          file: new FileDto(file),
          options
        }
      })
    );
    return true;
  }

  private async _processVideo(event: QueueEvent) {
    if (event.eventName !== 'processVideo') {
      return;
    }
    const fileData = event.data.file as FileDto;
    const options = event.data.options || {};
    try {
      await this.fileModel.updateOne(
        { _id: fileData._id },
        {
          $set: {
            status: 'processing'
          }
        }
      );

      // get thumb of the file, then convert to mp4
      const publicDir = this.config.get('file.publicDir');
      const videoDir = this.config.get('file.videoDir');
      // eslint-disable-next-line no-nested-ternary
      const videoPath = existsSync(fileData.absolutePath)
        ? fileData.absolutePath
        : existsSync(join(publicDir, fileData.path))
          ? join(publicDir, fileData.path)
          : null;

      if (!videoPath) {
        // eslint-disable-next-line no-throw-literal
        throw 'No file file!';
      }

      const respVideo = await this.videoService.convert2Mp4(videoPath);
      // delete old video and replace with new one
      const newAbsolutePath = respVideo.toPath;
      const newPath = respVideo.toPath.replace(publicDir, '');
      const meta = await this.videoService.getMetaData(videoPath);
      const videoMeta = meta.streams.find((s) => s.codec_type === 'video');
      const { width, height } = videoMeta || {};
      const respThumb = await this.videoService.createThumbs(videoPath, {
        toFolder: videoDir,
        size: options?.size || (width && height && `${width}x${height}`) || '640x480', // thumnail dimension
        count: options?.count || 3 // number of thumbnails-screenshots
      });
      const thumbnails = respThumb.map((name) => ({
        absolutePath: join(videoDir, name),
        path: join(videoDir, name).replace(publicDir, '')
      }));
      existsSync(videoPath) && unlinkSync(videoPath);
      await this.fileModel.updateOne(
        { _id: fileData._id },
        {
          $set: {
            status: 'finished',
            absolutePath: newAbsolutePath as any,
            path: newPath,
            thumbnails: thumbnails as any,
            duration: parseInt(meta.format.duration, 10),
            width,
            height
          }
        }
      );
    } catch (e) {
      await this.fileModel.updateOne(
        { _id: fileData._id },
        {
          $set: {
            status: 'error'
          }
        }
      );

      throw e;
    } finally {
      // TODO - fire event to subscriber
      if (options.publishChannel) {
        await this.queueEventService.publish(
          new QueueEvent({
            channel: options.publishChannel,
            eventName: FILE_EVENT.VIDEO_PROCESSED,
            data: {
              meta: options.meta,
              fileId: fileData._id
            }
          })
        );
      }
    }
  }

  /**
   * process to create photo thumbnails
   * @param fileId file item
   * @param options
   */
  public async queueProcessPhoto(
    fileId: string | ObjectId,
    options?: {
      meta?: Record<string, any>;
      publishChannel?: string;
      thumbnailSize?: {
        width: number;
        height: number;
      };
    }
  ) {
    // add queue and convert file to mp4 and generate thumbnail
    const file = await this.fileModel.findOne({ _id: fileId });
    if (!file || file.status === 'processing') {
      return false;
    }
    await this.queueEventService.publish(
      new QueueEvent({
        channel: PHOTO_QUEUE_CHANNEL,
        eventName: 'processPhoto',
        data: {
          file: new FileDto(file),
          options
        }
      })
    );
    return true;
  }

  private async _processPhoto(event: QueueEvent) {
    if (event.eventName !== 'processPhoto') {
      return;
    }
    const fileData = event.data.file as FileDto;
    const options = event.data.options || {};
    try {
      await this.fileModel.updateOne(
        { _id: fileData._id },
        {
          $set: {
            status: 'processing'
          }
        }
      );

      // get thumb of the file, then convert to mp4
      const publicDir = this.config.get('file.publicDir');
      const photoDir = this.config.get('file.photoDir');
      // eslint-disable-next-line no-nested-ternary
      const photoPath = existsSync(fileData.absolutePath)
        ? fileData.absolutePath
        : existsSync(join(publicDir, fileData.path))
          ? join(publicDir, fileData.path)
          : null;

      if (!photoPath) {
        // eslint-disable-next-line no-throw-literal
        throw 'No file!';
      }

      const meta = await this.imageService.getMetaData(photoPath);
      const buffer = await this.imageService.createThumbnail(
        photoPath,
        options.thumbnailSize || {
          width: 250,
          height: 250
        }
      );

      // store to a file
      const thumbName = `${StringHelper.randomString(5)
      }_thumb${
        StringHelper.getExt(photoPath)}`;
      writeFileSync(join(photoDir, thumbName), buffer);
      await this.fileModel.updateOne(
        { _id: fileData._id },
        {
          $set: {
            status: 'finished',
            width: meta.width,
            height: meta.height,
            thumbnails: [
              {
                path: join(photoDir, thumbName).replace(publicDir, '') as any,
                absolutePath: join(photoDir, thumbName)
              }
            ]
          }
        }
      );
    } catch (e) {
      await this.fileModel.updateOne(
        { _id: fileData._id },
        {
          $set: {
            status: 'error'
          }
        }
      );

      throw e;
    } finally {
      // fire event to subscriber
      if (options.publishChannel) {
        await this.queueEventService.publish(
          new QueueEvent({
            channel: options.publishChannel,
            eventName: FILE_EVENT.PHOTO_PROCESSED,
            data: {
              meta: options.meta,
              fileId: fileData._id
            }
          })
        );
      }
    }
  }

  /**
   * just generate key for
   */
  private generateJwt(fileId: string | ObjectId) {
    // 3h
    const expiresIn = 60 * 60 * 3;
    return jwt.sign(
      {
        fileId
      },
      process.env.TOKEN_SECRET,
      {
        expiresIn
      }
    );
  }

  /**
   * generate download file url with expired time check
   * @param fileId
   * @param param1
   */
  public async generateDownloadLink(fileId: string | ObjectId) {
    const newUrl = new URL('files/download', getConfig('app').baseUrl);
    newUrl.searchParams.append('key', this.generateJwt(fileId));
    return newUrl.href;
  }

  public async getStreamToDownload(key: string) {
    try {
      const decoded = jwt.verify(key, process.env.TOKEN_SECRET);
      const file = await this.fileModel.findById(decoded.fileId);
      if (!file) throw new EntityNotFoundException();
      let filePath;
      const publicDir = this.config.get('file.publicDir');
      if (existsSync(file.absolutePath)) {
        filePath = file.absolutePath;
      } else if (existsSync(join(publicDir, file.path))) {
        filePath = join(publicDir, file.path);
      } else {
        throw new EntityNotFoundException();
      }

      return {
        file,
        stream: createReadStream(filePath)
      };
    } catch (e) {
      throw new EntityNotFoundException();
    }
  }

  async uploadVideo(file) {
    const { originalname } = file;
    const bucketS3 = process.env.AWS_S3_BUCKET;
    // return await this.uploadS3(file.buffer, bucketS3, originalname);

    const fileUploaded: {} = await this.uploadS3(file.buffer, bucketS3, originalname);
    const copyFile = Object.assign(fileUploaded);
    const { Location } = copyFile;
    const fileCreated = await this.fileModel.create({ type: 'performer-video', absolutePath: Location });
    fileCreated.save();

    return {
      fileUploaded,
      fileCreated
    };
  }

  async upload(file) {
    const { originalname } = file;
    const bucketS3 = process.env.AWS_S3_BUCKET;
    await this.uploadS3(file.buffer, bucketS3, originalname);
  }

  async uploadPhotFeed(file) {
    const { originalname } = file;
    const bucketS3 = process.env.AWS_S3_BUCKET;
    // return await this.uploadS3(file.buffer, bucketS3, originalname);

    const fileUploaded: {} = await this.uploadS3(file.buffer, bucketS3, originalname);
    const copyFile = Object.assign(fileUploaded);
    const { Location } = copyFile;
    const fileCreated = await this.fileModel.create({ type: 'photo-feed', absolutePath: Location });
    fileCreated.save();

    return {
      fileCreated
    };
  }

  async uploadAvatar(file) {
    const { originalname } = file;
    const bucketS3 = process.env.AWS_S3_BUCKET;
    // return await this.uploadS3(file.buffer, bucketS3, originalname);

    const fileUploaded: {} = await this.uploadS3(file.buffer, bucketS3, originalname);
    const copyFile = Object.assign(fileUploaded);
    const { Location } = copyFile;
    const fileCreated = await this.fileModel.create({ type: 'avatar', absolutePath: Location });
    fileCreated.save();

    return {
      fileUploaded,
      fileCreated
    };
  }

  async uploadCover(file) {
    const { originalname } = file;
    const bucketS3 = process.env.AWS_S3_BUCKET;
    // return await this.uploadS3(file.buffer, bucketS3, originalname);

    const fileUploaded: {} = await this.uploadS3(file.buffer, bucketS3, originalname);
    const copyFile = Object.assign(fileUploaded);
    const { Location } = copyFile;
    const fileCreated = await this.fileModel.create({ type: 'cover', absolutePath: Location });
    fileCreated.save();

    return {
      fileUploaded,
      fileCreated
    };
  }

  async uploadS3(file, bucket, name) {
    const s3 = this.getS3();
    const params = {
      Bucket: bucket,
      Key: String(name),
      Body: file
    };
    return new Promise((resolve, reject) => {
      s3.upload(params, (err, data) => {
        if (err) {
          Logger.error(err);
          reject(err.message);
        }
        resolve(data);
      });
    });
  }

  getS3() {
    return new S3({
      accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_S3_SECRET
    });
  }
}

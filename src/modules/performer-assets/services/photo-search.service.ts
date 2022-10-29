/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-param-reassign */
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import { PageableData } from 'src/kernel';
import { PerformerService } from 'src/modules/performer/services';
import { FileService } from 'src/modules/file/services';
import { OrderService } from 'src/modules/payment/services';
import { UserDto } from 'src/modules/user/dtos';
import { PerformerDto } from 'src/modules/performer/dtos';
import { toObjectId } from 'src/kernel/helpers/string.helper';
import { PERFORMER_PHOTO_MODEL_PROVIDER } from '../providers';
import { PhotoModel } from '../models';
import { PhotoDto } from '../dtos';
import { PhotoSearchRequest } from '../payloads';
import { GalleryService } from './gallery.service';

@Injectable()
export class PhotoSearchService {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(PERFORMER_PHOTO_MODEL_PROVIDER)
    private readonly photoModel: Model<PhotoModel>,
    private readonly galleryService: GalleryService,
    @Inject(forwardRef(() => OrderService))
    private readonly orderService: OrderService,
    private readonly fileService: FileService
  ) { }

  public async adminSearch(req: PhotoSearchRequest, jwToken: string): Promise<PageableData<PhotoDto>> {
    const query = {} as any;
    if (req.q) query.title = { $regex: req.q };
    if (req.performerId) query.performerId = req.performerId;
    if (req.galleryId) query.galleryId = req.galleryId;
    if (req.status) query.status = req.status;
    let sort = {
      createdAt: -1
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.photoModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.photoModel.countDocuments(query)
    ]);

    const performerIds = data.map((d) => d.performerId);
    const galleryIds = data.map((d) => d.galleryId);
    const fileIds = data.map((d) => d.fileId);
    const photos = data.map((v) => new PhotoDto(v));
    const [performers, galleries, files] = await Promise.all([
      performerIds.length ? this.performerService.findByIds(performerIds) : [],
      galleryIds.length ? this.galleryService.findByIds(galleryIds) : [],
      fileIds.length ? this.fileService.findByIds(fileIds) : []
    ]);
    photos.forEach((v) => {
      // TODO - should get picture (thumbnail if have?)
      const performer = performers.find((p) => p._id.toString() === v.performerId.toString());
      if (performer) {
        // eslint-disable-next-line no-param-reassign
        v.performer = new PerformerDto(performer).toResponse();
      }

      if (v.galleryId) {
        const gallery = galleries.find((p) => p._id.toString() === v.galleryId.toString());
        // eslint-disable-next-line no-param-reassign
        if (gallery) v.gallery = gallery;
      }

      const file = files.find((f) => f._id.toString() === v.fileId.toString());
      if (file) {
        const url = file.getUrl();
        // eslint-disable-next-line no-param-reassign
        v.photo = {
          size: file.size,
          thumbnails: file.getThumbnails(),
          url: jwToken ? `${url}?photoId=${v._id}&token=${jwToken}` : url || null,
          width: file.width,
          height: file.height,
          mimeType: file.mimeType
        };
      }
    });

    return {
      data: photos,
      total
    };
  }

  public async performerSearch(req: PhotoSearchRequest, user: UserDto, jwToken: string): Promise<PageableData<PhotoDto>> {
    const query = {} as any;
    if (req.q) query.title = { $regex: req.q };
    query.performerId = user._id;
    if (req.galleryId) query.galleryId = req.galleryId;
    if (req.status) query.status = req.status;
    const [data, total] = await Promise.all([
      this.photoModel
        .find(query)
        .lean()
        .sort('-createdAt')
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.photoModel.countDocuments(query)
    ]);

    const performerIds = data.map((d) => d.performerId);
    const fileIds = data.map((d) => d.fileId);
    const photos = data.map((v) => new PhotoDto(v));
    const [performers, files] = await Promise.all([
      performerIds.length ? this.performerService.findByIds(performerIds) : [],
      fileIds.length ? this.fileService.findByIds(fileIds) : []
    ]);

    photos.forEach((v) => {
      // TODO - should get picture (thumbnail if have?)
      const performer = performers.find((p) => p._id.toString() === v.performerId.toString());
      if (performer) {
        // eslint-disable-next-line no-param-reassign
        v.performer = new PerformerDto(performer).toResponse();
      }

      const file = files.find((f) => f._id.toString() === v.fileId.toString());
      if (file) {
        const url = file.getUrl();
        // eslint-disable-next-line no-param-reassign
        v.photo = {
          size: file.size,
          thumbnails: file.getThumbnails(),
          blurImagePath: file.blurImagePath,
          url: jwToken ? `${url}?photoId=${v._id}&token=${jwToken}` : url || null,
          width: file.width,
          height: file.height,
          mimeType: file.mimeType
        };
      }
    });

    return {
      data: photos,
      total
    };
  }

  public async getModelPhotosWithGalleryCheck(req: PhotoSearchRequest, jwToken: string) {
    const query = {
      galleryId: req.galleryId,
      status: 'active',
      processing: false
    } as any;
    const sort = { createdAt: -1 };
    const [data, total] = await Promise.all([
      this.photoModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.photoModel.countDocuments(query)
    ]);

    const fileIds = data.map((d) => d.fileId);
    const photos = data.map((v) => new PhotoDto(v));

    const galleryIds = data.filter((d) => d.galleryId).map((p) => p.galleryId);
    const [galleries, files] = await Promise.all([
      galleryIds.length ? this.galleryService.findByIds(galleryIds) : [],
      fileIds.length ? this.fileService.findByIds(fileIds) : []
    ]);
    photos.forEach((v) => {
      if (v.galleryId) {
        const gallery = galleries.find(
          (p) => p._id.toString() === v.galleryId.toString()
        );
        // eslint-disable-next-line no-param-reassign
        if (gallery) v.gallery = gallery;
      }

      const file = files.find((f) => f._id.toString() === v.fileId.toString());
      if (file) {
        const url = file.getUrl();
        // eslint-disable-next-line no-param-reassign
        v.photo = {
          size: file.size,
          thumbnails: file.getThumbnails(),
          url: jwToken ? `${url}?photoId=${v._id}&token=${jwToken}` : url || null,
          width: file.width,
          height: file.height,
          mimeType: file.mimeType
        };
      }
    });

    return {
      data: photos,
      total
    };
  }

  public async searchPhotos(userId: string, req: PhotoSearchRequest, jwToken: string) {
    const query = {
      processing: false
    } as any;
    if (req.galleryId) query.galleryId = req.galleryId;
    const sort = { createdAt: -1 };
    const [data, total] = await Promise.all([
      this.photoModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.photoModel.countDocuments(query)
    ]);

    const fileIds = data.map((d) => d.fileId);
    const photos = data.map((v) => new PhotoDto(v));
    const photoIds = photos.map((photo) => photo._id);
    const galleryIds = data.filter((d) => d.galleryId).map((p) => p.galleryId);
    const [galleries, files, orderDetails] = await Promise.all([
      galleryIds.length ? this.galleryService.findByIds(galleryIds) : [],
      fileIds.length ? this.fileService.findByIds(fileIds) : [],
      photoIds.length && userId ? this.orderService.findDetailsByQuery({
        buyerId: toObjectId(userId), productType: 'sale_photo', productId: { $in: photoIds }, paymentStatus: 'success'
      }) : []
    ]);
    const buyedPhotoIds = orderDetails.map((order) => order.productId.toString());
    for (const photo of photos) {
      if (photo.galleryId) {
        const gallery = galleries.find(
          (p) => p._id.toString() === photo.galleryId.toString()
        );
        if (gallery) photo.gallery = gallery;
      }
      const isBought = (buyedPhotoIds.length > 0 && buyedPhotoIds.find((id) => photo._id.equals(id))) || userId.toString() === photo.performerId.toString();
      photo.isBought = !!isBought;
      const file = files.find((f) => f._id.toString() === photo.fileId.toString());
      if (file) {
        photo.photo = {
          width: file.width,
          height: file.height,
          mimeType: file.mimeType,
          blurImagePath: file.getBlurImage()
        };
        if (!photo.isSale || photo.isBought) {
          const url = file.getUrl();
          photo.photo.thumbnails = file.getThumbnails();
          photo.photo.url = jwToken ? `${url}?photoId=${photo._id}&token=${jwToken}` : url || null;
        }
      }
    }

    return {
      data: photos,
      total
    };
  }
}

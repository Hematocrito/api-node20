import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  mixin,
  Type
} from '@nestjs/common';
import { Observable } from 'rxjs';
import * as multer from 'multer';
import { ConfigService } from 'nestjs-config';
import { existsSync } from 'fs';
import * as mkdirp from 'mkdirp';
import { StringHelper } from 'src/kernel';
import { FileService } from '../services';
import { transformException } from '../lib/multer/multer.utils';
import { IFileUploadOptions } from '../lib';
var aws = require('aws-sdk');
var multerS3 = require('multer-s3');

export interface IMultiFileUpload {
  type: string;
  fieldName: string;
  options: IFileUploadOptions;
}

export function MultiFileUploadInterceptor(data: IMultiFileUpload[], opts = {} as any) {
  @Injectable()
  class MixinInterceptor implements NestInterceptor {
    constructor(
      private readonly config: ConfigService,
      private readonly fileService: FileService
    ) {
      data.map(async (conf) => {
        const { options = {} } = conf;
        const uploadDir = options.destination || this.config.get('file').publicDir;
        this.createFolderIfNotExists(uploadDir);
      });
    }

    private async createFolderIfNotExists(dir: string) {
      !existsSync(dir) && mkdirp.sync(dir);
    }

    async intercept(
      context: ExecutionContext,
      next: CallHandler
    ): Promise<Observable<any>> {
      const ctx = context.switchToHttp();
      // todo - support other storage type?
      const uploadDir = {} as any;
      const fileName = {} as any;

      data.forEach((conf) => {
        const { fieldName, options = {} } = conf;
        uploadDir[fieldName] = options.destination || this.config.get('file').publicDir;

        if (options.fileName) {
          fileName[fieldName] = options.fileName;
        }
      });

      var s3 = new aws.S3({
        accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_S3_SECRET,
        Bucket: process.env.AWS_S3_BUCKET
      })

      const upload = multer({
        limits: {
          fileSize: 20971520, // 10 Mb
        },
        storage: multerS3({
          s3: s3,
          bucket: process.env.AWS_S3_BUCKET,
          contentType: multerS3.AUTO_CONTENT_TYPE,
          metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
          },
          key(req, file, cb) {
            if (fileName[file.fieldname]) {
              return cb(null, fileName[file.fieldname]);
            }

            const ext = (
              StringHelper.getExt(file.originalname) || ''
            ).toLocaleLowerCase();
            const orgName = StringHelper.getFileName(file.originalname, true);
            const randomText = StringHelper.randomString(5); // avoid duplicated name, we might check file name first?
            let name = StringHelper.createAlias(
              `${randomText}-${orgName}`
            ).toLocaleLowerCase() + ext;

            if(uploadDir[file.fieldname])
              name = uploadDir[file.fieldname]+"/"+name;

            return cb(null, name);
          }
        })
      }).fields(data.map((conf) => ({ name: conf.fieldName })));

      await new Promise<void>((resolve, reject) => upload(ctx.getRequest(), ctx.getResponse(), (err: any) => {
        if (err) {
          const error = transformException(err);
          // TODO - trace error and throw error
          return reject(error);
        }
        return resolve();
      }));

      /**
      {
        fieldname: 'avatar',
        originalname: 'abc.tif',
        encoding: '7bit',
        mimetype: 'image/tiff',
        destination: '/absolute/path/public',
        filename: 'q1pjq-abc.tif',
        path: '/absolute/path/public/q1pjq-abc.tif',
        size: 15866
      } */
      const ctxRequest = ctx.getRequest();
      if (!ctxRequest.files) ctxRequest.files = {};
      const files = ctxRequest.files || {} as any;

      // store media and overwrite multer file property in request
      // hook user uploader if user logged in?
      if (!opts.uploader && ctxRequest.user) {
        // eslint-disable-next-line no-param-reassign
        opts.uploader = ctxRequest.user;
      }

      // do not use promise all here
      // eslint-disable-next-line no-restricted-syntax
      for (const f of data) {
        const fileContent = files[f.fieldName];
        if (fileContent && fileContent.length) {
          // eslint-disable-next-line no-await-in-loop
          const file = await this.fileService.createFromMulter(
            f.type,
            fileContent[0],
            f.options
          );
          ctxRequest.files[f.fieldName] = file;
        }
      }

      return next.handle();
    }
  }

  const Interceptor = mixin(MixinInterceptor);
  return Interceptor as Type<NestInterceptor>;
}

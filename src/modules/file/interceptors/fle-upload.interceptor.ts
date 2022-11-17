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

export function FileUploadInterceptor(
  type = 'file',
  fieldName = 'file',
  options = {} as IFileUploadOptions
) {
  @Injectable()
  class MixinInterceptor implements NestInterceptor {
    private uploadDir: string;

    constructor(
      private readonly config: ConfigService,
      private readonly fileService: FileService
    ) {
      this.uploadDir = options.destination || this.config.get('file').publicDir;
      this.createFolderIfNotExists(this.uploadDir);
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
      const { uploadDir } = this;

      var s3 = new aws.S3({
        accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_S3_SECRET,
        Bucket: process.env.AWS_S3_BUCKET
      })
      
      const upload = multer({
        storage: multerS3({
          s3: s3,
          bucket: process.env.AWS_S3_BUCKET,
          contentType: multerS3.AUTO_CONTENT_TYPE,
          metadata: function (req, file, cb) {
            cb(null, { fieldName, });
          },
          key(req, file, cb) {
            if (options.fileName) {
              return cb(null, options.fileName);
            }
  
            const ext = (
              StringHelper.getExt(file.originalname) || ''
            ).toLocaleLowerCase();
            const orgName = StringHelper.getFileName(file.originalname, true);
            const randomText = StringHelper.randomString(5); // avoid duplicated name, we might check file name first?
            let name = StringHelper.createAlias(
              `${randomText}-${orgName}`
            ).toLocaleLowerCase() + ext;

            if(uploadDir)
              name = uploadDir+"/"+name;

            return cb(null, name);
          }
        })
      }).single(fieldName);
      
      await new Promise((resolve, reject) => upload(ctx.getRequest(), ctx.getResponse(), (err: any) => {
        if (err) {
          const error = transformException(err);
          // TODO - trace error and throw error
          return reject(error);
        }
        return resolve(true);
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
      const fileContent = ctxRequest.file;
      // store media and overwrite multer file property in request
      // hook user uploader if user logged in?
      if (!options.uploader && ctxRequest.user) {
        // eslint-disable-next-line no-param-reassign
        options.uploader = ctxRequest.user;
      }
      const file = await this.fileService.createFromMulter(type, fileContent, options);
      ctxRequest.file = file;

      return next.handle();
    }
  }

  const Interceptor = mixin(MixinInterceptor);
  return Interceptor as Type<NestInterceptor>;
}

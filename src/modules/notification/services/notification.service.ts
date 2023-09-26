import { Inject, Injectable } from '@nestjs/common';
import { merge } from 'lodash';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { toObjectId } from 'src/kernel/helpers/string.helper';
import { FeedModel } from 'src/modules/feed/models';
import { FEED_PROVIDER } from 'src/modules/feed/providers';
import { PERFORMER_GALLERY_MODEL_PROVIDER, PERFORMER_VIDEO_MODEL_PROVIDER } from 'src/modules/performer-assets/providers';
import { GalleryModel, VideoModel } from 'src/modules/performer-assets/models';
import { NotificationModel } from '../models';
import { NOTIFICATION_MODEL_PROVIDER } from '../notification.constant';
import { CreateNotificationOptions } from '../notification.interface';

@Injectable()
export class NotificationService {
  constructor(
    @Inject(NOTIFICATION_MODEL_PROVIDER)
    private readonly notificationModel: Model<NotificationModel>,
    @Inject(FEED_PROVIDER)
    private readonly feedModel: Model<FeedModel>,
    @Inject(PERFORMER_VIDEO_MODEL_PROVIDER)
    private readonly performerVideoModel: Model<VideoModel>,
    @Inject(PERFORMER_GALLERY_MODEL_PROVIDER)
    private readonly galleryModel: Model<GalleryModel>
  ) { }

  async create(options: CreateNotificationOptions) {
    const objeto = options;
    if (options.type === 'feed') {
      const post = await this.feedModel.findOne({ _id: options.refId });
      objeto.title = post.text;
    }
    if (options.type === 'video') {
      const video = await this.performerVideoModel.findOne({ _id: options.refId });
      objeto.title = video.title;
    }
    if (options.type === 'gallery') {
      const galeria = await this.galleryModel.findOne({ _id: options.refId });
      objeto.title = galeria.name;
    }

    const notification = this.notificationModel.create(objeto);

    return notification;
  }

  async read(id: string | ObjectId) {
    await this.notificationModel.updateOne({ _id: id }, {
      $set: {
        read: true
      }
    });
    return true;
  }

  async readAll(userId: string | ObjectId) {
    return this.notificationModel.updateMany({ userId }, {
      $set: {
        read: true
      }
    });
  }
}

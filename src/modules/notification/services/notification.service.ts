import { Inject, Injectable } from '@nestjs/common';
import { merge } from 'lodash';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { toObjectId } from 'src/kernel/helpers/string.helper';
import { NotificationModel } from '../models';
import { NOTIFICATION_MODEL_PROVIDER } from '../notification.constant';
import { CreateNotificationOptions } from '../notification.interface';

@Injectable()
export class NotificationService {
  constructor(
    @Inject(NOTIFICATION_MODEL_PROVIDER)
    private readonly notificationModel: Model<NotificationModel>
  ) { }

  async create(options: CreateNotificationOptions) {
    const notification = await this.notificationModel.findOne({
      type: options.type,
      action: options.action,
      userId: toObjectId(options.userId),
      createdBy: toObjectId(options.createdBy)
    });

    if (!notification) {
      return this.notificationModel.create(options);
    }

    merge(notification, options);
    notification.updatedAt = new Date();
    notification.read = false;
    await notification.save();
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

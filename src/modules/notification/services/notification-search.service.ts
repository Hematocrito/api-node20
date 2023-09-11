import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { ObjectId } from 'mongodb';
import { FilterQuery, Model } from 'mongoose';
import { uniq } from 'lodash';
import { PageableData } from 'src/kernel';
import { toObjectId } from 'src/kernel/helpers/string.helper';
import { UserDto } from 'src/modules/user/dtos';
import { UserService } from 'src/modules/user/services';
import { NotificationModel } from '../models';
import { NOTIFICATION_MODEL_PROVIDER } from '../notification.constant';
import { NotificationDto } from '../notification.dto';
import { SearchNotificationPayload } from '../payloads';

@Injectable()
export class NotificationSearchService {
  constructor(
    @Inject(NOTIFICATION_MODEL_PROVIDER)
    private readonly notificationModel: Model<NotificationModel>
  ) {}

  async search(
    payload: SearchNotificationPayload,
    currentUser: UserDto
  ): Promise<PageableData<NotificationDto>> {
    const query: FilterQuery<NotificationModel> = {
      userId: toObjectId(currentUser._id)
    };

    if (payload.status === 'read') query.readAt = { $exists: true };
    if (payload.type) query.type = payload.type || 'performer';

    let model = 'User';

    if (currentUser.isPerformer) {
      model = 'Performer';
    }

    const sort = {
      [payload.sortBy || 'creadtedAt']: payload.sort || 'desc'
    };
    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find(query)
        .populate({
          path: 'createdBy',
          model
        })
        .limit(+payload.limit)
        .skip(+payload.offset)
        .sort(sort)
        .lean(),
      this.notificationModel.countDocuments(query)
    ]);
    return {
      data: notifications.map((notification) => plainToClass(NotificationDto, notification)),
      total
    };
  }

  async getTotalUnread(userId: string | ObjectId): Promise<any> {
    return this.notificationModel
      .count({
        userId,
        read: false
      });
  }
  /*
  private async populateNotifications(notifications: NotificationModel[], user: UserDto) {
    const userIds = uniq(notifications.map((f) => f.userId.toString()));

    const users = await this.userService.findByIds(userIds);

    return notifications.map(async (f) => {
      const notification = new NotificationDto();
      const usuario = await this.userService.findById(f.userId.toString());
      if (usuario) {
        notification.userId = usuario._id;
      }
      return notification;
    });
  } */
}

import { Injectable, Inject } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import { UserDto } from 'src/modules/user/dtos';
import { NotificationMessageModel } from '../models';
import { NOTIFICATION_MESSAGE_MODEL_PROVIDER } from '../providers';

@Injectable()
export class NotificationMessageService {
  constructor(
    @Inject(NOTIFICATION_MESSAGE_MODEL_PROVIDER)
    private readonly notificationMessageModel: Model<NotificationMessageModel>,
    private readonly socketUserService: SocketUserService
  ) { }

  public async recipientReadAllMessageInConversation(user: UserDto, conversationId: string): Promise<any> {
    await this.notificationMessageModel.updateOne({
      recipientId: user._id,
      conversationId
    }, { totalNotReadMessage: 0 });
    const total = await this.countTotalNotReadMessage(user._id);
    await this.socketUserService.emitToUsers(user._id, 'nofify_read_messages_in_conversation', total);
    return { ok: true };
  }

  public async countTotalNotReadMessage(userId: ObjectId): Promise<any> {
    const totalNotReadMessage = await this.notificationMessageModel.aggregate<any>([
      {
        $match: { recipientId: userId }
      },
      {
        $group: {
          _id: '$conversationId',
          total: {
            $sum: '$totalNotReadMessage'
          }
        }
      }
    ]);
    let total = 0;
    if (!totalNotReadMessage || !totalNotReadMessage.length) {
      return { total };
    }
    totalNotReadMessage.forEach((data) => {
      if (data.total) {
        total += 1;
      }
    });
    return { total };
  }
}

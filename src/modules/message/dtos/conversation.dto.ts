import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { IUserResponse } from 'src/modules/user/dtos';
import { IRecipient } from '../models';

export class ConversationDto {
  _id: ObjectId;

  type: string;

  name: string;

  recipients: IRecipient[];

  lastMessage: string;

  lastSenderId: string | ObjectId;

  lastMessageCreatedAt: Date;

  meta: any;

  createdAt: Date;

  updatedAt: Date;

  recipientInfo?: IUserResponse;

  totalNotSeenMessages?: number;

  isSubscribed?: boolean;

  isBlocked?: boolean;

  streamId: ObjectId;

  performerId: ObjectId;

  constructor(data?: Partial<ConversationDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'type',
        'name',
        'recipients',
        'lastMessage',
        'lastSenderId',
        'lastMessageCreatedAt',
        'meta',
        'createdAt',
        'updatedAt',
        'recipientInfo',
        'totalNotSeenMessages',
        'isSubscribed',
        'isBlocked',
        'streamId',
        'performerId'
      ])
    );
  }

  public getRoomName(): string {
    return `conversation-${this.type}-${this._id}`;
  }
}

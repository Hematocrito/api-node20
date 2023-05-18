import { ObjectId } from 'mongodb';
import { pick } from 'lodash';

export class MessageDto {
  _id: ObjectId;

  conversationId: ObjectId;

  type: string;

  fileId: ObjectId;

  text: string;

  senderId: ObjectId;

  senderSource?: string;

  meta: any;

  createdAt: Date;

  updatedAt: Date;

  imageUrl?: string;

  senderInfo?: any

  constructor(data?: Partial<MessageDto>) {
    Object.assign(this, pick(data, [
      '_id', 'conversationId', 'type', 'fileId', 'imageUrl', 'senderInfo',
      'text', 'senderId', 'meta', 'createdAt', 'updatedAt', 'senderSource'
    ]));
  }
}

export class UserMessageDto {
  _id: ObjectId;

  conversationId: ObjectId;

  type: string;

  fileId: ObjectId;

  text: string;

  senderId: ObjectId;

  senderSource?: string;

  meta: any;

  createdAt: Date;

  updatedAt: Date;

  imageUrl?: string;

  senderInfo?: any

  constructor(data?: Partial<MessageDto>) {
    Object.assign(this, pick(data, [
      '_id', 'conversationId', 'type', 'fileId', 'imageUrl', 'senderInfo',
      'text', 'senderId', 'meta', 'createdAt', 'updatedAt', 'senderSource'
    ]));
  }
}

export class PerformerMessageDto {
  _id: ObjectId;

  conversationId: ObjectId;

  type: string;

  fileId: ObjectId;

  text: string;

  senderId: ObjectId;

  senderSource?: string;

  meta: any;

  createdAt: Date;

  updatedAt: Date;

  imageUrl?: string;

  senderInfo?: any

  constructor(data?: Partial<MessageDto>) {
    Object.assign(this, pick(data, [
      '_id', 'conversationId', 'type', 'fileId', 'imageUrl', 'senderInfo',
      'text', 'senderId', 'meta', 'createdAt', 'updatedAt', 'senderSource'
    ]));
  }
}

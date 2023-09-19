import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class NotificationModel extends Document {
  userId: ObjectId;

  type: string;

  action: string;

  title: string;

  message: string;

  thumbnail: string;

  refId: ObjectId;

  read: boolean;

  readAt: Date;

  createdBy: ObjectId;

  createdByModel: string;

  createdAt: Date;

  updatedAt: Date;
}

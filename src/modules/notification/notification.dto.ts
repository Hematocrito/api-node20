import { Expose } from 'class-transformer';
import { ObjectId } from 'mongodb';

export class NotificationDto {
  @Expose()
  _id: ObjectId;

  @Expose()
  userId: ObjectId;

  @Expose()
  type: string;

  @Expose()
  title: string;

  @Expose()
  message: string;

  @Expose()
  refId: ObjectId;

  @Expose()
  reference: any;

  @Expose()
  readAt: Date;

  @Expose()
  createdBy: ObjectId;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  refItem?: any;
}

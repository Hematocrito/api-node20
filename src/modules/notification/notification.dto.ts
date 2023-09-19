import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, IsIn } from 'class-validator';
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
  @IsString()
  @IsIn(['Performer', 'User'])
  @IsNotEmpty()
  createdByModel: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  refItem?: any;
}

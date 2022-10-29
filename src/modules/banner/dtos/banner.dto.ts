import { ObjectId } from 'mongodb';
import { pick } from 'lodash';

export class BannerDto {
  _id?: ObjectId;

  fileId?: ObjectId;

  title?: string;

  description?: string;

  link?: string;

  status?: string;

  position?: string;

  photo?: any;

  createdAt?: Date;

  updatedAt?: Date;

  constructor(init?: Partial<BannerDto>) {
    Object.assign(
      this,
      pick(init, [
        '_id',
        'fileId',
        'title',
        'description',
        'link',
        'status',
        'position',
        'photo',
        'createdAt',
        'updatedAt'
      ])
    );
  }
}

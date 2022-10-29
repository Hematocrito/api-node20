import { ObjectId } from 'mongodb';
import { pick } from 'lodash';

export class ReportDto {
  _id?: ObjectId;

  title: string;

  description: string;

  source: string;

  sourceId: ObjectId;

  sourceInfo?: any;

  performerId: ObjectId;

  performerInfo?: any;

  target: string;

  targetId: ObjectId;

  targetInfo?: any;

  status: string;

  createdAt: Date;

  updatedAt: Date;

  constructor(data?: Partial<ReportDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'title',
        'description',
        'source',
        'sourceId',
        'sourceInfo',
        'performerId',
        'performerInfo',
        'target',
        'targetId',
        'targetInfo',
        'status',
        'createdAt',
        'updatedAt'
      ])
    );
  }
}

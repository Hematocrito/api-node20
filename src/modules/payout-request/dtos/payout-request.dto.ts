import { pick } from 'lodash';
import { ObjectId } from 'mongodb';

export class PayoutRequestDto {
  _id: any;

  source: string;

  sourceId: ObjectId;

  sourceInfo: any;

  paymentAccountInfo: any;

  paymentAccountType: string;

  requestNote: string;

  adminNote?: string;

  status: string;

  requestedPrice: number;

  fromDate: Date;

  toDate: Date;

  createdAt: Date;

  updatedAt: Date;

  constructor(data?: Partial<PayoutRequestDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'source',
        'sourceId',
        'sourceInfo',
        'paymentAccountType',
        'paymentAccountInfo',
        'requestNote',
        'adminNote',
        'status',
        'sourceType',
        'requestedPrice',
        'fromDate',
        'toDate',
        'createdAt',
        'updatedAt'
      ])
    );
  }
}

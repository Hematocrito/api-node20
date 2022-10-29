import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class PayoutRequestModel extends Document {
  source: string;

  sourceId: ObjectId;

  paymentAccountType: string;

  paymentAccountInfo: any;

  requestNote: string;

  adminNote: string

  status: string;

  requestedPrice: number;

  fromDate: Date;

  toDate: Date;

  createdAt: Date;

  updatedAt: Date;
}

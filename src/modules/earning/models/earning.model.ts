import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class EarningModel extends Document {
  transactionId: ObjectId;

  orderId: ObjectId;

  performerId: ObjectId;

  userId: ObjectId;

  sourceType: string;

  type: string;

  productType: string;

  grossPrice: number;

  netPrice: number;

  commission: number;

  isPaid: boolean;

  createdAt: Date;

  paidAt: Date;

  transactionStatus: string;

  paymentMethod: string;

  paymentStatus: string;

  payoutStatus: string;
}

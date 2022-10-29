import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class CommissionSettingModel extends Document {
  performerId: ObjectId;

  monthlySubscriptionCommission: number;

  yearlySubscriptionCommission: number;

  videoSaleCommission: number;

  productSaleCommission: number;

  privateChatCommission: number;

  groupChatCommission: number;

  tokenTipCommission: number;

  createdAt: Date;

  updatedAt: Date;
}

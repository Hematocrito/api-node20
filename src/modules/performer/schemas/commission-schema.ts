import { Schema } from 'mongoose';

export const CommissionSettingSchema = new Schema({
  performerId: {
    type: Schema.Types.ObjectId,
    index: true
  },
  monthlySubscriptionCommission: { type: Number, default: 0.1 },
  yearlySubscriptionCommission: { type: Number, default: 0.1 },
  videoSaleCommission: { type: Number, default: 0.1 },
  productSaleCommission: { type: Number, default: 0.1 },
  privateChatCommission: { type: Number, default: 0.2 },
  groupChatCommission: { type: Number, default: 0.3 },
  tokenTipCommission: { type: Number, default: 0.2 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

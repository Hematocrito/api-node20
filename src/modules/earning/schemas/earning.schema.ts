import * as mongoose from 'mongoose';
import { STATUSES } from 'src/modules/payout-request/constants';

export const EarningSchema = new mongoose.Schema({
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  performerId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  // group of item and rename
  sourceType: {
    type: String,
    index: true
  },
  // from details of item
  type: {
    type: String,
    index: true
  },
  productType: {
    type: String
  },
  grossPrice: {
    type: Number,
    default: 0
  },
  netPrice: {
    type: Number,
    default: 0
  },
  commission: {
    type: Number,
    default: 0.1
  },
  isPaid: {
    type: Boolean,
    default: false,
    index: true
  },
  transactionStatus: {
    type: String,
    index: true
  },
  paymentMethod: {
    type: String
  },
  paymentStatus: {
    type: String
  },
  payoutStatus: {
    type: String,
    default: STATUSES.PENDING
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  paidAt: {
    type: Date
  }
});

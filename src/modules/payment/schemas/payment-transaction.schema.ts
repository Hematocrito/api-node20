import { Schema } from 'mongoose';

export const PaymentTransactionSchema = new Schema({
  paymentGateway: {
    type: String
  },
  orderId: {
    type: Schema.Types.ObjectId
  },
  // user, model, etc...
  source: {
    type: String
  },
  sourceId: {
    type: Schema.Types.ObjectId,
    index: true
  },
  // subscription, store, etc...
  type: {
    type: String,
    index: true
  },
  totalPrice: {
    type: Number,
    default: 0
  },
  paymentResponseInfo: {
    type: Schema.Types.Mixed
  },
  // hold token for future use in some case eg Paypal, BTCpay
  paymentToken: {
    type: String,
    index: true
  },
  // pending, success, etc...
  status: {
    type: String,
    index: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

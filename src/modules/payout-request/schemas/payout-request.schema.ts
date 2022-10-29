import { Schema } from 'mongoose';
import { ObjectId } from 'mongodb';
import { SOURCE_TYPE } from '../constants';

export const payoutRequestSchema = new Schema({
  source: {
    index: true,
    type: String,
    default: SOURCE_TYPE.PERFORMER
  },
  sourceId: {
    index: true,
    type: ObjectId
  },
  paymentAccountType: {
    type: String,
    index: true,
    default: 'banking'
  },
  paymentAccountInfo: {
    type: Schema.Types.Mixed
  },
  requestNote: {
    type: String
  },
  adminNote: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'rejected', 'done'],
    default: 'pending',
    index: true
  },
  requestedPrice: {
    type: Number,
    default: 0
  },
  fromDate: {
    type: Date
  },
  toDate: {
    type: Date
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

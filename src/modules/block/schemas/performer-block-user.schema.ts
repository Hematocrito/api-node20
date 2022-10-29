import { Schema } from 'mongoose';

export const PerformerBlockUserSchema = new Schema({
  source: {
    type: String,
    index: true,
    default: 'performer'
  },
  sourceId: {
    type: Schema.Types.ObjectId,
    index: true
  },
  target: {
    type: String,
    index: true,
    default: 'user'
  },
  targetId: {
    type: Schema.Types.ObjectId,
    index: true
  },
  reason: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

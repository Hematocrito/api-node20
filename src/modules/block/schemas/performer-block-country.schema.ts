import { Schema } from 'mongoose';

export const PerformerBlockCountrySchema = new Schema({
  source: {
    type: String,
    index: true
  },
  sourceId: {
    type: Schema.Types.ObjectId,
    index: true
  },
  countryCodes: [{
    _id: false, type: String, index: true
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

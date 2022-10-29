import * as mongoose from 'mongoose';

export const BlockCountrySchema = new mongoose.Schema({
  countryCode: {
    _id: false, type: String, index: true, unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

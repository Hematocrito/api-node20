import { Schema } from 'mongoose';
import { ObjectId } from 'mongodb';

export const BannerSchema = new Schema({
  fileId: ObjectId,
  title: {
    type: String
  },
  link: String,
  description: { type: String },
  status: {
    type: String,
    default: 'active'
  },
  position: { type: String, default: 'top' },
  createdBy: ObjectId,
  updatedBy: ObjectId,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

import { Schema } from 'mongoose';
import { ObjectId } from 'mongodb';

export const CategorySchema = new Schema({
  group: {
    type: String,
    index: true,
    default: 'product'
  },
  name: {
    type: String
    // TODO - text index?
  },
  slug: {
    type: String,
    index: true
  },
  description: String,
  status: {
    type: String,
    default: 'active'
  },
  ordering: {
    type: Number,
    default: 0
  },
  createdBy: ObjectId,
  updatedBy: ObjectId,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: 'categories'
});

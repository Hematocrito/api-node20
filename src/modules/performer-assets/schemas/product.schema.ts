import { Schema } from 'mongoose';
import { ObjectId } from 'mongodb';

export const ProductSchema = new Schema({
  performerId: {
    type: ObjectId,
    index: true
  },
  // original file
  digitalFileId: ObjectId,
  imageIds: [{
    _id: false,
    type: Schema.Types.ObjectId
  }],
  categoryIds: [{
    _id: false,
    type: Schema.Types.ObjectId
  }],
  name: {
    type: String
    // TODO - text index?
  },
  slug: {
    type: String,
    index: true,
    unique: true,
    lowercase: true,
    trim: true,
    sparse: true
  },
  description: String,
  type: {
    type: String,
    default: 'physical'
  },
  status: {
    type: String,
    default: 'active'
  },
  price: {
    type: Number,
    default: 0
  },
  stock: {
    type: Number,
    default: 0
  },
  stats: {
    likes: {
      type: Number,
      default: 0
    },
    favourites: {
      type: Number,
      default: 0
    },
    comments: {
      type: Number,
      default: 0
    },
    views: {
      type: Number,
      default: 0
    }
  },
  createdBy: ObjectId,
  updatedBy: ObjectId,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

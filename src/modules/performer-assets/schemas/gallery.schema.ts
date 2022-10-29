import { Schema } from 'mongoose';
import { ObjectId } from 'mongodb';

export const GallerySchema = new Schema({
  performerId: { type: ObjectId, index: true },
  type: {
    type: String,
    index: true
  },
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
  status: {
    type: String,
    // draft, active
    default: 'active'
  },
  price: {
    type: Number,
    default: 0
  },
  isSale: {
    type: Boolean,
    default: false
  },
  numOfItems: {
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
  tags: [{ type: String, index: true }],
  coverPhotoId: ObjectId,
  createdBy: ObjectId,
  updatedBy: ObjectId,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

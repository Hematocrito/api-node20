import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class VideoModel extends Document {
  performerId: ObjectId;

  fileId: ObjectId;

  type: string;

  title: string;

  slug: string;

  description: string;

  status: string;

  processing: boolean;

  thumbnailId: ObjectId;

  teaserId: ObjectId;

  teaserProcessing: boolean;

  isSaleVideo: boolean;

  isSchedule: boolean;

  price: number;

  tags: string[];

  stats: {
    likes: number;
    favourites: number;
    wishlists: number;
    views: number,
    comments: number
  };

  createdBy: ObjectId;

  updatedBy: ObjectId;

  scheduledAt: Date;

  createdAt: Date;

  updatedAt: Date;

  participantIds?: string[];

  tagline: string;
}

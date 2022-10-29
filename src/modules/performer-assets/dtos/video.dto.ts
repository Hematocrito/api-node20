import { ObjectId } from 'mongodb';
import { pick } from 'lodash';

export class VideoDto {
  _id: ObjectId;

  performerId: ObjectId;

  fileId: ObjectId;

  type: string;

  title: string;

  slug: string;

  description: string;

  status: string;

  tags: string[];

  processing: boolean;

  thumbnailId: ObjectId;

  thumbnail: any;

  isSaleVideo: boolean;

  price: number;

  teaserId: ObjectId;

  teaser: any;

  teaserProcessing: boolean;

  video: any;

  performer: any;

  stats: {
    views: number;
    likes: number;
    comments: number;
    favourites: number;
    wishlists: number;
  };

  createdBy: ObjectId;

  updatedBy: ObjectId;

  createdAt: Date;

  updatedAt: Date;

  participantIds: string[];

  participants: any[];

  tagline: string;

  isSubscribed: boolean;

  isBought: boolean;

  isLiked: boolean;

  isFavourited: boolean;

  isWishlist: boolean;

  constructor(init: Partial<VideoDto>) {
    Object.assign(
      this,
      pick(init, [
        '_id',
        'performerId',
        'fileId',
        'type',
        'title',
        'slug',
        'description',
        'status',
        'processing',
        'thumbnailId',
        'teaserId',
        'teaser',
        'teaserProcessing',
        'isSchedule',
        'isSaleVideo',
        'price',
        'video',
        'thumbnail',
        'performer',
        'tags',
        'stats',
        'createdBy',
        'updatedBy',
        'scheduledAt',
        'createdAt',
        'updatedAt',
        'participantIds',
        'participants',
        'tagline',
        'isBought',
        'isSubscribed',
        'isLiked',
        'isFavourited',
        'isWishlist'
      ])
    );
  }
}

export class IVideoResponse {
  _id: ObjectId;

  performerId: ObjectId;

  fileId: ObjectId;

  type: string;

  title: string;

  slug: string;

  description: string;

  status: string;

  tags: string[];

  processing: boolean;

  thumbnailId: ObjectId;

  thumbnail: any;

  teaserId: ObjectId;

  teaser: any;

  teaserProcessing: boolean;

  isSaleVideo: boolean;

  price: number;

  video: any;

  performer: any;

  stats: {
    views: number;
    likes: number;
    comments: number;
    favourites: number;
    wishlists: number;
  };

  isLiked: boolean;

  isFavourited: boolean;

  isWishlist: boolean;

  isBought: boolean;

  isSubscribed: boolean;

  createdBy: ObjectId;

  updatedBy: ObjectId;

  createdAt: Date;

  updatedAt: Date;

  participantIds: string[];

  participants: any[];

  tagline: string;

  constructor(init: Partial<IVideoResponse>) {
    Object.assign(
      this,
      pick(init, [
        '_id',
        'performerId',
        'fileId',
        'type',
        'title',
        'description',
        'status',
        'processing',
        'thumbnailId',
        'teaserId',
        'teaser',
        'teaserProcessing',
        'isSchedule',
        'isSaleVideo',
        'price',
        'video',
        'thumbnail',
        'performer',
        'tags',
        'stats',
        'isBought',
        'isSubscribed',
        'isLiked',
        'isFavourited',
        'isWishlist',
        'createdBy',
        'updatedBy',
        'scheduledAt',
        'createdAt',
        'updatedAt',
        'participantIds',
        'participants'
      ])
    );
  }
}

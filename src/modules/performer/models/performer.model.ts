import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class PerformerModel extends Document {
  name: string;

  firstName: string;

  lastName: string;

  username: string;

  email: string;

  phone: string;

  phoneCode: string; // international code prefix

  avatarId: ObjectId;

  avatarPath: string;

  coverId: ObjectId;

  coverPath: string;

  idVerificationId: ObjectId;

  documentVerificationId: ObjectId;

  verifiedEmail: boolean;

  verifiedAccount: boolean;

  verifiedDocument: boolean;

  gender: string;

  country: string;

  city: string;

  state: string;

  zipcode: string;

  address: string;

  languages: string[];

  height: string;

  weight: string;

  bio: string;

  eyes: string;

  sexualPreference: string;

  monthlyPrice: number;

  yearlyPrice: number;

  biannualPrice?: number;

  stats: {
    likes: number;
    subscribers: number;
    views: number;
    totalVideos: number;
    totalPhotos: number;
    totalGalleries: number;
    totalProducts: number;
    totalStreamTime: number;
    totalTokenEarned: number;
    totalTokenSpent: number;
    totalFeeds: number;
    totalStories: number
  };

  score: number;

  createdBy: ObjectId;

  createdAt: Date;

  updatedAt: Date;

  isOnline: boolean;

  onlineAt: Date;

  offlineAt: Date;

  welcomeVideoId: ObjectId;

  welcomeVideoPath: string;

  activateWelcomeVideo: boolean;

  status: string;

  hair: string;

  lastStreamingTime?: Date;

  maxParticipantsAllowed?: number;

  live?: boolean;

  streamingStatus?: string;

  balance?: number;

  privateChatPrice?: number;

  groupChatPrice?: number;

  butt: string;

  pubicHair: string;

  ethnicity: string;

  bodyType: string;

  dateOfBirth: Date;

}

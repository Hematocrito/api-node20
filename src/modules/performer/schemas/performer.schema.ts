import * as mongoose from 'mongoose';
import {
  GROUP_CHAT, OFFLINE, PRIVATE_CHAT, PUBLIC_CHAT
} from 'src/modules/stream/constant';

const performerSchema = new mongoose.Schema({
  name: String,
  firstName: String,
  lastName: String,
  username: {
    type: String,
    index: true,
    lowercase: true,
    unique: true,
    trim: true,
    // uniq if not null
    sparse: true
  },
  email: {
    type: String,
    index: true,
    unique: true,
    lowercase: true,
    trim: true,
    // uniq if not null
    sparse: true
  },
  status: {
    type: String,
    index: true
  },
  phone: {
    type: String
  },
  phoneCode: String, // international code prefix
  avatarId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  avatarPath: String,
  coverId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  coverPath: String,
  idVerificationId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  documentVerificationId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  welcomeVideoId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  welcomeVideoPath: {
    type: String
  },
  activateWelcomeVideo: {
    type: Boolean,
    default: false
  },
  verifiedEmail: {
    type: Boolean,
    default: false
  },
  verifiedAccount: {
    type: Boolean,
    default: false
  },
  verifiedDocument: {
    type: Boolean,
    default: false
  },
  gender: {
    type: String
  },
  country: {
    type: String
  },
  city: String,
  state: String,
  zipcode: String,
  address: String,
  languages: [
    {
      type: String
    }
  ],
  categoryIds: [
    {
      type: mongoose.Schema.Types.ObjectId
    }
  ],
  height: String,
  weight: String,
  bio: String,
  eyes: String,
  sexualPreference: String,
  butt: String,
  hair: String,
  pubicHair: String,
  ethnicity: String,
  bodyType: String,
  dateOfBirth: Date,
  monthlyPrice: {
    type: Number,
    default: 1
  },
  yearlyPrice: {
    type: Number,
    default: 1
  },
  stats: {
    likes: {
      type: Number,
      default: 0
    },
    subscribers: {
      type: Number,
      default: 0
    },
    views: {
      type: Number,
      default: 0
    },
    totalFeeds: {
      type: Number,
      default: 0
    },
    totalVideos: {
      type: Number,
      default: 0
    },
    totalPhotos: {
      type: Number,
      default: 0
    },
    totalGalleries: {
      type: Number,
      default: 0
    },
    totalProducts: {
      type: Number,
      default: 0
    },
    totalStreamTime: {
      type: Number,
      default: 0
    },
    totalTokenEarned: {
      type: Number,
      default: 0
    },
    totalTokenSpent: {
      type: Number,
      default: 0
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  score: {
    type: Number,
    default: 0
  },
  isOnline: {
    type: Number,
    default: 0
  },
  onlineAt: {
    type: Date
  },
  offlineAt: {
    type: Date
  },
  groupChatPrice: {
    type: Number,
    default: 30
  },
  privateChatPrice: {
    type: Number,
    default: 20
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastStreamingTime: Date,
  maxParticipantsAllowed: Number,
  live: {
    type: Boolean,
    index: true,
    default: false
  },
  streamingStatus: {
    type: String,
    enum: [PUBLIC_CHAT, PRIVATE_CHAT, GROUP_CHAT, OFFLINE],
    default: OFFLINE,
    index: true
  },
  // wallet balance
  balance: {
    type: Number,
    default: 0
  }
});

performerSchema.pre<any>('updateOne', async function preUpdateOne(next) {
  const model = await this.model.findOne(this.getQuery());
  if (!model) return next(null);
  const { stats } = model;
  if (!stats) {
    return next(null);
  }
  const score = (stats.subscribers || 0) * 3 + (stats.likes || 0) * 2 + (stats.views || 0);
  model.score = score || 0;
  await model.save();
  return next(null);
});

export const PerformerSchema = performerSchema;

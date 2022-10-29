import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { FileDto } from 'src/modules/file';
import { UserDto } from 'src/modules/user/dtos';

export interface IPerformerResponse {
  _id?: ObjectId;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  phoneCode?: string; // international code prefix
  status?: string;
  avatar?: string;
  cover?: string;
  idVerificationId?: ObjectId;
  documentVerificationId?: ObjectId;
  gender?: string;
  country?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  address?: string;
  languages?: string[];
  categoryIds?: ObjectId[];
  height?: string;
  weight?: string;
  bio?: string;
  eyes?: string;
  sexualPreference?: string;
  monthlyPrice?: number;
  yearlyPrice?: number;
  stats?: {
    likes?: number;
    subscribers?: number;
    views?: number;
    totalVideos: number;
    totalPhotos: number;
    totalGalleries: number;
    totalProducts: number;
    totalStreamTime: number;
    totalTokenEarned: number;
    totalTokenSpent: number;
  };
  verifiedEmail?: boolean;
  verifiedAccount?: boolean;
  verifiedDocument?: boolean;
  score?: number;
  isPerformer: boolean;
  bankingInformation?: any;
  ccbillSetting?: any;
  paypalSetting?: any;
  commissionSetting?: any;
  blockCountries?: any;
  createdBy?: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  isOnline?: boolean;
  activateWelcomeVideo?: boolean;
  lastStreamingTime?: Date;
  maxParticipantsAllowed?: number;
  live?: boolean;
  streamingStatus?: string;
  balance?: number;
  isSubscribed?: boolean;
  groupChatPrice?: number;
  privateChatPrice?: number;
  pubicHair?: string;
  ethnicity?: string;
  bodyType?: string;
  dateOfBirth?: Date;
  butt?: string;
  hair?: string;
}

export interface IBlockedUsersResponse {
  _id?: string | ObjectId;
  userId?: string | ObjectId;
  userInfo?: UserDto;
}

export class PerformerDto {
  _id: ObjectId;

  name?: string;

  firstName?: string;

  lastName?: string;

  username?: string;

  email?: string;

  phone?: string;

  phoneCode?: string; // international code prefix

  status?: string;

  avatarId?: ObjectId;

  avatarPath?: string;

  coverId?: ObjectId;

  coverPath?: string;

  idVerificationId?: ObjectId;

  documentVerificationId?: ObjectId;

  idVerification?: any;

  verifiedEmail?: boolean;

  verifiedAccount?: boolean;

  verifiedDocument?: boolean;

  documentVerification?: any;

  avatar?: any;

  cover?: any;

  gender?: string;

  country?: string;

  city?: string;

  state?: string;

  zipcode?: string;

  address?: string;

  languages?: string[];

  categoryIds?: ObjectId[];

  height?: string;

  weight?: string;

  bio?: string;

  eyes?: string;

  sexualPreference?: string;

  monthlyPrice?: number;

  yearlyPrice?: number;

  stats?: {
    likes?: number;
    subscribers?: number;
    views?: number;
    totalVideos: number;
    totalPhotos: number;
    totalGalleries: number;
    totalProducts: number;
    totalStreamTime: number;
    totalTokenEarned: number;
    totalTokenSpent: number;
  };

  score?: number;

  isPerformer: boolean;

  bankingInformation?: any;

  ccbillSetting?: any;

  paypalSetting?: any;

  commissionSetting?: any;

  blockCountries?: any;

  createdBy?: ObjectId;

  createdAt?: Date;

  updatedAt?: Date;

  isOnline?: boolean;

  welcomeVideoId?: ObjectId;

  welcomeVideoPath?: string;

  activateWelcomeVideo?: boolean;

  lastStreamingTime?: Date;

  maxParticipantsAllowed?: number;

  live?: boolean;

  streamingStatus?: string;

  isSubscribed?: boolean;

  balance?: number;

  privateChatPrice?: number;

  groupChatPrice?: number;

  pubicHair?: string;

  ethnicity?: string;

  bodyType?: string;

  dateOfBirth?: Date;

  butt?: string;

  hair?: string;

  constructor(data?: Partial<IPerformerResponse>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'name',
        'firstName',
        'lastName',
        'name',
        'username',
        'email',
        'phone',
        'phoneCode',
        'status',
        'avatarId',
        'avatarPath',
        'coverId',
        'coverPath',
        'idVerificationId',
        'documentVerificationId',
        'idVerification',
        'documentVerification',
        'gender',
        'country',
        'city',
        'state',
        'zipcode',
        'address',
        'languages',
        'categoryIds',
        'height',
        'weight',
        'bio',
        'eyes',
        'sexualPreference',
        'monthlyPrice',
        'yearlyPrice',
        'stats',
        'score',
        'isPerformer',
        'bankingInformation',
        'ccbillSetting',
        'paypalSetting',
        'commissionSetting',
        'blockCountries',
        'createdBy',
        'createdAt',
        'updatedAt',
        'verifiedEmail',
        'verifiedAccount',
        'verifiedDocument',
        'isOnline',
        'welcomeVideoId',
        'welcomeVideoPath',
        'activateWelcomeVideo',
        'lastStreamingTime',
        'maxParticipantsAllowed',
        'live',
        'streamingStatus',
        'isSubscribed',
        'balance',
        'groupChatPrice',
        'privateChatPrice',
        'pubicHair',
        'bodyType',
        'ethnicity',
        'dateOfBirth',
        'butt',
        'hair'
      ])
    );
  }

  toResponse(includePrivateInfo = false, isAdmin?: boolean) {
    const publicInfo = {
      _id: this._id,
      name: this.getName(),
      avatar: FileDto.getPublicUrl(this.avatarPath),
      cover: FileDto.getPublicUrl(this.coverPath),
      username: this.username,
      gender: this.gender,
      country: this.country,
      stats: this.stats,
      score: this.score,
      isPerformer: true,
      isOnline: this.isOnline,
      isSubscribed: this.isSubscribed,
      verifiedAccount: this.verifiedAccount,
      lastStreamingTime: this.lastStreamingTime,
      live: this.live,
      streamingStatus: this.streamingStatus,
      groupChatPrice: this.groupChatPrice,
      privateChatPrice: this.privateChatPrice
    };
    const privateInfo = {
      verifiedEmail: this.verifiedEmail,
      verifiedDocument: this.verifiedDocument,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      phone: this.phone,
      phoneCode: this.phoneCode,
      status: this.status,
      city: this.city,
      state: this.state,
      zipcode: this.zipcode,
      address: this.address,
      languages: this.languages,
      categoryIds: this.categoryIds,
      idVerificationId: this.idVerificationId,
      documentVerificationId: this.documentVerificationId,
      documentVerification: this.documentVerification,
      idVerification: this.idVerification,
      welcomeVideoId: this.welcomeVideoId,
      welcomeVideoPath: FileDto.getPublicUrl(this.welcomeVideoPath),
      activateWelcomeVideo: this.activateWelcomeVideo,
      height: this.height,
      weight: this.weight,
      bio: this.bio,
      eyes: this.eyes,
      hair: this.hair,
      pubicHair: this.pubicHair,
      ethnicity: this.ethnicity,
      bodyType: this.bodyType,
      dateOfBirth: this.dateOfBirth,
      butt: this.butt,
      sexualPreference: this.sexualPreference,
      monthlyPrice: this.monthlyPrice,
      yearlyPrice: this.yearlyPrice,
      bankingInformation: this.bankingInformation,
      blockCountries: this.blockCountries,
      paypalSetting: this.paypalSetting,
      maxParticipantsAllowed: this.maxParticipantsAllowed,
      balance: this.balance,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };

    if (isAdmin) {
      return {
        ...publicInfo,
        ...privateInfo,
        ccbillSetting: this.ccbillSetting,
        commissionSetting: this.commissionSetting
      };
    }

    if (!includePrivateInfo) {
      return publicInfo;
    }

    return {
      ...publicInfo,
      ...privateInfo
    };
  }

  getName() {
    if (this.name) return this.name;
    return [this.firstName || '', this.lastName || ''].join(' ');
  }

  toSearchResponse() {
    return {
      _id: this._id,
      name: this.getName(),
      avatar: FileDto.getPublicUrl(this.avatarPath),
      username: this.username,
      gender: this.gender,
      country: this.country,
      stats: this.stats,
      score: this.score,
      isPerformer: true,
      verifiedAccount: this.verifiedAccount,
      lastStreamingTime: this.lastStreamingTime,
      live: this.live,
      streamingStatus: this.streamingStatus,
      isOnline: this.isOnline
    };
  }

  toPublicDetailsResponse() {
    return {
      _id: this._id,
      name: this.getName(),
      avatar: FileDto.getPublicUrl(this.avatarPath),
      cover: FileDto.getPublicUrl(this.coverPath),
      username: this.username,
      status: this.status,
      gender: this.gender,
      country: this.country,
      city: this.city,
      state: this.state,
      zipcode: this.zipcode,
      address: this.address,
      languages: this.languages,
      categoryIds: this.categoryIds,
      height: this.height,
      weight: this.weight,
      bio: this.bio,
      eyes: this.eyes,
      hair: this.hair,
      pubicHair: this.pubicHair,
      ethnicity: this.ethnicity,
      bodyType: this.bodyType,
      dateOfBirth: this.dateOfBirth,
      butt: this.butt,
      sexualPreference: this.sexualPreference,
      monthlyPrice: this.monthlyPrice,
      yearlyPrice: this.yearlyPrice,
      stats: this.stats,
      isPerformer: true,
      score: this.score,
      balance: this.balance,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isOnline: this.isOnline,
      welcomeVideoId: this.welcomeVideoId,
      welcomeVideoPath: FileDto.getPublicUrl(this.welcomeVideoPath),
      activateWelcomeVideo: this.activateWelcomeVideo,
      isSubscribed: this.isSubscribed,
      verifiedAccount: this.verifiedAccount,
      live: this.live,
      streamingStatus: this.streamingStatus,
      groupChatPrice: this.groupChatPrice,
      privateChatPrice: this.privateChatPrice
    };
  }
}

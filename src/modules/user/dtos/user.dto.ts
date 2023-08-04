import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { FileDto } from 'src/modules/file';

export interface IUserResponse {
  _id?: ObjectId;
  name?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  roles?: string[];
  avatar?: string;
  status?: string;
  gender?: string;
  country?: string;
  verifiedEmail?: boolean;
  isOnline?: boolean;
  stats?: any
  balance?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserDto {
  _id: ObjectId;

  name?: string;

  firstName?: string;

  lastName?: string;

  email?: string;

  phone?: string;

  roles: string[] = ['user'];

  avatarId?: string | ObjectId;

  avatarPath?: string;

  avatar?: string;

  status?: string;

  username?: string;

  gender?: string;

  country?: string; // iso code

  verifiedEmail?: boolean;

  isOnline?: boolean;

  isPerformer?: boolean;

  stats: {
    totalViewTime: number;
    totalTokenEarned: number;
    totalTokenSpent: number;
  };

  balance?: number;

  createdAt?: Date;

  updatedAt?: Date;

  deviceToken?: string;

  constructor(data?: Partial<UserDto>) {
    data
      && Object.assign(
        this,
        pick(data, [
          '_id',
          'name',
          'firstName',
          'lastName',
          'email',
          'phone',
          'roles',
          'avatarId',
          'avatarPath',
          'avatar',
          'status',
          'username',
          'gender',
          'country',
          'deviceToken',
          'verifiedEmail',
          'isOnline',
          'isPerformer',
          'stats',
          'balance',
          'createdAt',
          'updatedAt'
        ])
      );
  }

  getName() {
    if (this.name) return this.name;
    return [this.firstName || '', this.lastName || ''].join(' ');
  }

  toResponse(includePrivateInfo = false, isAdmin?: boolean): IUserResponse {
    const publicInfo = {
      _id: this._id,
      firstName: this.firstName,
      lastName: this.lastName,
      name: this.getName(),
      avatar: FileDto.getPublicUrl(this.avatarPath),
      username: this.username,
      email: this.email,
      stats: this.stats,
      isOnline: this.isOnline,
      isPerformer: this.isPerformer,
      gender: this.gender,
      country: this.country,
      deviceToken: this.deviceToken,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };

    const privateInfo = {
      email: this.email,
      phone: this.phone,
      status: this.status,
      roles: this.roles,
      verifiedEmail: this.verifiedEmail,
      balance: this.balance
    };

    if (isAdmin) {
      return {
        ...publicInfo,
        ...privateInfo
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
}

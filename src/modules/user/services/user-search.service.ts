import { Injectable, Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import { PageableData } from 'src/kernel/common';
import { UserModel } from '../models';
import { USER_MODEL_PROVIDER } from '../providers';
import { IUserResponse, UserDto } from '../dtos';
import { UserSearchRequestPayload } from '../payloads';
import { ROLE_ADMIN, STATUS_ACTIVE } from '../constants';

@Injectable()
export class UserSearchService {
  constructor(
    @Inject(USER_MODEL_PROVIDER)
    private readonly userModel: Model<UserModel>
  ) {}

  // TODO - should create new search service?
  public async search(
    req: UserSearchRequestPayload
  ): Promise<PageableData<IUserResponse>> {
    const query = {} as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, ''),
        'i'
      );
      query.$or = [
        {
          name: { $regex: regexp }
        },
        {
          username: { $regex: regexp }
        },
        {
          email: { $regex: regexp }
        }
      ];
    }
    if (req.role) {
      query.roles = { $in: [req.role] };
    }
    if (req.status) {
      query.status = req.status;
    }
    let sort = {
      createdAt: -1
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.userModel
        .find(query)
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.userModel.countDocuments(query)
    ]);
    return {
      data: data.map((item) => new UserDto(item).toResponse(true)),
      total
    };
  }

  public async performerSearch(
    req: UserSearchRequestPayload
  ): Promise<PageableData<IUserResponse>> {
    const query = {
      status: STATUS_ACTIVE,
      roles: { $ne: ROLE_ADMIN }
    } as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, ''),
        'i'
      );
      query.$or = [
        {
          name: { $regex: regexp }
        },
        {
          username: { $regex: regexp }
        }
      ];
    }
    let sort = {
      createdAt: -1
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.userModel
        .find(query)
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.userModel.countDocuments(query)
    ]);

    return {
      data: data.map((d) => new UserDto(d).toResponse()),
      total
    };
  }

  public async searchByKeyword(
    req: UserSearchRequestPayload
  ): Promise<any> {
    const query = {} as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, ''),
        'i'
      );
      query.$or = [
        {
          name: { $regex: regexp }
        },
        {
          email: { $regex: regexp }
        },
        {
          username: { $regex: regexp }
        }
      ];
    }

    const [data] = await Promise.all([
      this.userModel
        .find(query)
    ]);
    return data;
  }
}

import { Injectable, Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import { PageableData } from 'src/kernel';
import { POST_MODEL_PROVIDER } from '../providers';
import { PostModel } from '../models';
import { AdminSearch, UserSearch } from '../payloads';

@Injectable()
export class PostSearchService {
  constructor(
    @Inject(POST_MODEL_PROVIDER)
    private readonly postModel: Model<PostModel>
  ) {}

  // TODO - define post DTO
  public async adminSearch(req: AdminSearch): Promise<PageableData<PostModel>> {
    const query = {} as any;
    if (req.q) {
      query.$or = [
        {
          title: { $regex: req.q }
        }
      ];
    }
    if (req.status) {
      query.status = req.status;
    }
    if (req.type) {
      query.type = req.type;
    }
    const sort = {
      [req.sortBy || 'updatedAt']: req.sort
    };
    const [data, total] = await Promise.all([
      this.postModel
        .find(query)
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.postModel.countDocuments(query)
    ]);
    return {
      data,
      total
    };
  }

  public async userSearch(req: UserSearch): Promise<PageableData<PostModel>> {
    const query = {} as any;
    query.status = 'published';
    if (req.type) {
      query.type = req.type;
    }
    const sort = {
      [req.sortBy || 'updatedAt']: req.sort
    };
    const [data, total] = await Promise.all([
      this.postModel
        .find(query)
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.postModel.countDocuments(query)
    ]);
    return {
      data,
      total
    };
  }
}

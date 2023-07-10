import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import { PageableData } from 'src/kernel/common';
import * as moment from 'moment';
import { PerformerBlockService } from 'src/modules/block/services';
import { UserDto } from 'src/modules/user/dtos';
import { OFFLINE } from 'src/modules/stream/constant';
import { PerformerModel } from '../models';
import { PERFORMER_MODEL_PROVIDER } from '../providers';
import { IPerformerResponse, PerformerDto } from '../dtos';
import { PerformerSearchPayload } from '../payloads';
import { PERFORMER_STATUSES } from '../constants';
import { PerformerCacheService } from './performer-cache.service';

@Injectable()
export class PerformerSearchService {
  constructor(
    @Inject(forwardRef(() => PerformerBlockService))
    private readonly performerBlockService: PerformerBlockService,
    @Inject(PERFORMER_MODEL_PROVIDER)
    private readonly performerModel: Model<PerformerModel>,
    private readonly performerCacheService: PerformerCacheService
  ) { }

  // TODO - should create new search service?
  public async adminSearch(
    req: PerformerSearchPayload
  ): Promise<PageableData<PerformerDto>> {
    const query = {} as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, ''),
        'i'
      );
      query.$or = [
        {
          firstName: { $regex: regexp }
        },
        {
          lastName: { $regex: regexp }
        },
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
    if (req.performerIds) {
      query._id = Array.isArray(req.performerIds) ? { $in: req.performerIds } : { $in: [req.performerIds] };
    }
    if (req.status) {
      query.status = req.status;
    }
    if (req.gender) {
      query.gender = req.gender;
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
      this.performerModel
        .find(query)
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.performerModel.countDocuments(query)
    ]);
    return {
      data: data.map((item) => new PerformerDto(item)),
      total
    };
  }

  public async search(
    req: PerformerSearchPayload, user: UserDto, countryCode: string
  ): Promise<PageableData<IPerformerResponse>> {
    const query = {
      status: PERFORMER_STATUSES.ACTIVE
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
    [
      'hair',
      'pubicHair',
      'ethnicity',
      'country',
      'bodyType',
      'gender',
      'height',
      'weight',
      'eyes',
      'butt',
      'agentId',
      'sexualPreference'
    ].forEach((f) => {
      if (req[f]) {
        query[f] = req[f];
      }
    });

    // Si hay usuario logueado entra aquí
    if (user) {
      // no equal: mostrar performers diferentes al usuario loqueado
      query._id = { $ne: user._id };
    }

    // Si hay performersIds entra acá
    if (req.performerIds) {
      query._id = Array.isArray(req.performerIds) ? { $in: req.performerIds } : { $in: [req.performerIds] };
    }
    if (req.age) {
      const fromAge = req.age.split('_')[0];
      const toAge = req.age.split('_')[1];
      const fromDate = moment().subtract(toAge, 'years').startOf('day').toDate();
      const toDate = moment().subtract(fromAge, 'years').startOf('day').toDate();
      query.dateOfBirth = {
        $gte: fromDate,
        $lte: toDate
      };
    }
    if (req.gender) {
      query.gender = req.gender;
    }
    if (countryCode) {
      const blockCountries = await this.performerBlockService.findBlockCountriesByQuery({ countryCodes: { $in: [countryCode] } });
      const performerIds = blockCountries.map((b) => b.sourceId);
      if (performerIds.length > 0) {
        query._id = { $nin: performerIds };
      }
    }
    if (req.isStreaming) {
      query.streamingStatus = {
        $ne: OFFLINE
      };
    }
    const activePerformers = await this.performerCacheService.getActivePerformers();
    if (query.performerId || query.performerIds) {
      // check if exist in the active list
      const hasItem = activePerformers.includes(
        query.performerId || query.performerIds
      );
      if (!hasItem) {
        return {
          data: [],
          total: 0
        };
      }
    } else {
      query._id = {
        $in: activePerformers
      };
    }
    let sort = {
      createdAt: -1
    } as any;
    if (req.sortBy === 'latest') {
      sort = '-createdAt';
    }
    if (req.sortBy === 'oldest') {
      sort = 'createdAt';
    }
    if (req.sortBy === 'popular') {
      sort = '-score';
    }
    if (req.sortBy === 'subscriber') {
      sort = '-stats.subscribers';
    }

    const [data, total] = await Promise.all([
      this.performerModel
        .find(query)
        .sort('isOnline')
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.performerModel.countDocuments(query)
    ]);
    return {
      data: data.map((item) => new PerformerDto(item).toResponse(false)),
      total
    };
  }

  public async searchForPerformer(req: PerformerSearchPayload, user: UserDto) {
    let sort = {
      createdAt: -1
    } as any;
    if (req.sortBy === 'latest') {
      sort = '-createdAt';
    }
    if (req.sortBy === 'oldest') {
      sort = 'createdAt';
    }
    if (req.sortBy === 'popular') {
      sort = '-score';
    }
    if (req.sortBy === 'subscriber') {
      sort = '-stats.subscribers';
    }

    const performers = await this.performerModel
      .find({
        status: PERFORMER_STATUSES.ACTIVE
      })
      .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
      .sort(sort);

    return {
      data: performers.map((item) => new PerformerDto(item).toResponse(false)),
      total: performers.length
    };
  }

  public async searchForOnline(req: PerformerSearchPayload, user: UserDto) {
    const sort = { isOnline: -1 };
    const performers = await this.performerModel
      .find({
        status: PERFORMER_STATUSES.ACTIVE
      })
      .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
      .sort(sort);

    return {
      data: performers.map((item) => new PerformerDto(item).toResponse(false)),
      total: performers.length
    };
  }

  public async searchByKeyword(
    req: PerformerSearchPayload
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
      this.performerModel
        .find(query)
    ]);
    return data;
  }

  public async topPerformers(
    req: PerformerSearchPayload
  ): Promise<PageableData<PerformerDto>> {
    const query = {} as any;
    query.status = 'active';
    if (req.gender) {
      query.gender = req.gender;
    }
    const sort = {
      score: -1,
      'stats.subscribers': -1,
      'stats.views': -1
    };
    const [data, total] = await Promise.all([
      this.performerModel
        .find(query)
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.performerModel.countDocuments(query)
    ]);
    return {
      data: data.map((item) => new PerformerDto(item)),
      total
    };
  }

  // public async advancedSearch(
  //   req: PerformerSearchPayload,
  //   user?: UserDto
  // ): Promise<PageableData<PerformerDto>> {
  //   const query = {} as any;
  //   if (req.q) {
  //     query.$or = [
  //       {
  //         name: { $regex: req.q }
  //       },
  //       {
  //         email: { $regex: req.q }
  //       },
  //       {
  //         username: { $regex: req.q }
  //       }
  //     ];
  //   }
  //   if (req.status) {
  //     query.status = req.status;
  //   }
  //   if (req.gender) {
  //     query.gender = req.gender;
  //   }
  //   if (req.category) {
  //     query.categoryIds = new ObjectId(req.category);
  //   }
  //   if (req.country) {
  //     query.country = req.country;
  //   }
  //   if (req.tags) {
  //     query.tags = req.tags;
  //   }
  //   // online status on top priority
  //   let sort = {
  //     isOnline: -1,
  //     onlineAt: -1,
  //     createdAt: -1
  //   } as any;
  //   if (req.sort && req.sortBy) {
  //     sort = {
  //       [req.sortBy]: req.sort,
  //       isOnline: -1,
  //       onlineAt: -1
  //     };
  //   }
  //   const [data, total] = await Promise.all([
  //     this.performerModel
  //       .find(query)
  //       .sort(sort)
  //       .limit(parseInt(req.limit as string))
  //       .skip(parseInt(req.offset as string)),
  //     this.performerModel.countDocuments(query)
  //   ]);

  //   const performers = data.map(item => new PerformerDto(item));
  //   if (user) {
  //     const performerIds = performers.map(p => p._id);
  //     if (performerIds.length) {
  //       const favorites = await this.favoriteService.find({
  //         favoriteId: { $in: performerIds },
  //         ownerId: user._id
  //       });

  //       favorites.length &&
  //         performers.forEach(p => {
  //           if (
  //             favorites.find(f => f.favoriteId.toString() === p._id.toString())
  //           ) {
  //             p.isFavorite = true;
  //           }
  //         });
  //     }
  //   }

  //   return {
  //     data: performers,
  //     total
  //   };
  // }
}

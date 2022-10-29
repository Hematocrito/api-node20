import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import { PageableData } from 'src/kernel';
import { PerformerService } from 'src/modules/performer/services';
import { FileService } from 'src/modules/file/services';
import { UserDto } from 'src/modules/user/dtos';
import { STATUS } from 'src/kernel/constants';
import { PerformerDto } from 'src/modules/performer/dtos';
import { OrderService } from 'src/modules/payment/services';
import { VideoDto } from '../dtos';
import { VideoSearchRequest } from '../payloads';
import { VideoModel } from '../models';
import { PERFORMER_VIDEO_MODEL_PROVIDER } from '../providers';

@Injectable()
export class VideoSearchService {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(PERFORMER_VIDEO_MODEL_PROVIDER)
    private readonly videoModel: Model<VideoModel>,
    private readonly fileService: FileService,
    @Inject(forwardRef(() => OrderService))
    private readonly orderService: OrderService
  ) {}

  public async adminSearch(
    req: VideoSearchRequest
  ): Promise<PageableData<VideoDto>> {
    const query = {} as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, ''),
        'i'
      );
      query.$or = [
        {
          title: { $regex: regexp }
        },
        {
          description: { $regex: regexp }
        },
        { tags: { $elemMatch: { $regex: regexp } } }
      ];
    }
    if (req.performerId) query.performerId = req.performerId;
    if (req.status) query.status = req.status;
    if (req.isSaleVideo) query.isSaleVideo = req.isSaleVideo === 'true';
    let sort = {
      createdAt: -1
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.videoModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.videoModel.countDocuments(query)
    ]);

    const performerIds = [];
    const fileIds = [];
    data.forEach((v) => {
      v.performerId && performerIds.push(v.performerId);
      v.thumbnailId && fileIds.push(v.thumbnailId);
      v.fileId && fileIds.push(v.fileId);
    });

    const [performers, files] = await Promise.all([
      performerIds.length ? this.performerService.findByIds(performerIds) : [],
      fileIds.length ? this.fileService.findByIds(fileIds) : []
    ]);

    const videos = data.map((v) => new VideoDto(v));
    videos.forEach((v) => {
      if (v.performerId) {
        const performer = performers.find(
          (p) => p._id.toString() === v.performerId.toString()
        );
        if (performer) {
          // eslint-disable-next-line no-param-reassign
          v.performer = new PerformerDto(performer).toSearchResponse();
        }
      }

      if (v.thumbnailId) {
        const thumbnail = files.find(
          (f) => f._id.toString() === v.thumbnailId.toString()
        );
        if (thumbnail) {
          // eslint-disable-next-line no-param-reassign
          v.thumbnail = {
            url: thumbnail.getUrl(),
            thumbnails: thumbnail.getThumbnails()
          };
        }
      }
      if (v.fileId) {
        const video = files.find((f) => f._id.toString() === v.fileId.toString());
        if (video) {
          // eslint-disable-next-line no-param-reassign
          v.video = {
            url: video.getUrl(),
            thumbnails: video.getThumbnails(),
            duration: video.duration
          };
        }
      }
    });

    return {
      data: videos,
      total
    };
  }

  public async performerSearch(
    req: VideoSearchRequest,
    performer?: UserDto
  ): Promise<PageableData<VideoDto>> {
    const query = {} as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, ''),
        'i'
      );
      query.$or = [
        {
          title: { $regex: regexp }
        },
        {
          description: { $regex: regexp }
        },
        { tags: { $elemMatch: { $regex: regexp } } }
      ];
    }
    query.performerId = performer._id;
    if (req.isSaleVideo) query.isSaleVideo = req.isSaleVideo === 'true';
    if (req.status) query.status = req.status;
    let sort = {
      createdAt: -1
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.videoModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.videoModel.countDocuments(query)
    ]);
    const fileIds = [];
    data.forEach((v) => {
      v.thumbnailId && fileIds.push(v.thumbnailId);
      v.fileId && fileIds.push(v.fileId);
      v.teaserId && fileIds.push(v.teaserId);
    });

    const [files] = await Promise.all([
      fileIds.length ? this.fileService.findByIds(fileIds) : []
    ]);

    const videos = data.map((v) => new VideoDto(v));
    videos.forEach((v) => {
      if (v.thumbnailId) {
        const thumbnail = files.find(
          (f) => f._id.toString() === v.thumbnailId.toString()
        );
        if (thumbnail) {
          // eslint-disable-next-line no-param-reassign
          v.thumbnail = {
            url: thumbnail.getUrl(),
            thumbnails: thumbnail.getThumbnails()
          };
        }
      }
      if (v.teaserId) {
        const teaser = files.find(
          (f) => f._id.toString() === v.teaserId.toString()
        );
        if (teaser) {
          // eslint-disable-next-line no-param-reassign
          v.teaser = {
            url: teaser.getUrl(),
            thumbnails: teaser.getThumbnails()
          };
        }
      }
      if (v.fileId) {
        const video = files.find((f) => f._id.toString() === v.fileId.toString());
        if (video) {
          // eslint-disable-next-line no-param-reassign
          v.video = {
            url: video.getUrl(),
            thumbnails: video.getThumbnails(),
            duration: video.duration
          };
        }
      }
    });

    return {
      data: videos,
      total
    };
  }

  public async userSearch(
    req: VideoSearchRequest
  ): Promise<PageableData<VideoDto>> {
    const query = {
      status: STATUS.ACTIVE
    } as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, ''),
        'i'
      );
      query.$or = [
        {
          title: { $regex: regexp }
        },
        {
          description: { $regex: regexp }
        },
        { tags: { $elemMatch: { $regex: regexp } } }
      ];
    }
    if (req.performerId) query.performerId = req.performerId;
    if (req.isSaleVideo) query.isSaleVideo = req.isSaleVideo === 'true';
    if (req.excludedId) query._id = { $ne: req.excludedId };
    if (req.ids && Array.isArray(req.ids)) {
      query._id = {
        $in: req.ids
      };
    }

    query.status = 'active';
    query.isSchedule = false;
    let sort = {
      createdAt: -1
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.videoModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.videoModel.countDocuments(query)
    ]);
    const fileIds = [];
    data.forEach((v) => {
      v.thumbnailId && fileIds.push(v.thumbnailId);
      v.fileId && fileIds.push(v.fileId);
      v.teaserId && fileIds.push(v.teaserId);
    });

    const [files] = await Promise.all([
      fileIds.length ? this.fileService.findByIds(fileIds) : []
    ]);

    const videos = data.map((v) => new VideoDto(v));
    videos.forEach((v) => {
      // check login & subscriber filter data
      if (v.thumbnailId) {
        const thumbnail = files.find(
          (f) => f._id.toString() === v.thumbnailId.toString()
        );
        if (thumbnail) {
          // eslint-disable-next-line no-param-reassign
          v.thumbnail = {
            url: thumbnail.getUrl(),
            thumbnails: thumbnail.getThumbnails()
          };
        }
      }
      if (v.teaserId) {
        const teaser = files.find(
          (f) => f._id.toString() === v.teaserId.toString()
        );
        if (teaser) {
          // eslint-disable-next-line no-param-reassign
          v.teaser = {
            url: null, // teaser.getUrl(),
            thumbnails: teaser.getThumbnails(),
            duration: teaser.duration
          };
        }
      }
      if (v.fileId) {
        const video = files.find((f) => f._id.toString() === v.fileId.toString());
        if (video) {
          // eslint-disable-next-line no-param-reassign
          v.video = {
            url: null, // video.getUrl(),
            thumbnails: video.getThumbnails(),
            duration: video.duration
          };
        }
      }
    });

    return {
      data: videos,
      total
    };
  }

  public async getPurchasedItems(userId, req: VideoSearchRequest) {
    const { data, total } = await this.orderService.getPurchasedVideos({
      userId,
      limit: req.limit,
      offset: req.offset
    });
    if (!data.length) {
      return {
        data,
        total
      };
    }
    const videoIds = data.map((d) => d.productId);
    const videosDb = await this.videoModel
      .find({
        _id: {
          $in: videoIds
        }
      })
      .lean();

    const fileIds = [];
    videosDb.forEach((v) => {
      v.thumbnailId && fileIds.push(v.thumbnailId);
      v.fileId && fileIds.push(v.fileId);
      v.teaserId && fileIds.push(v.teaserId);
    });

    const [files] = await Promise.all([
      fileIds.length ? this.fileService.findByIds(fileIds) : []
    ]);

    const videos = videosDb.map((v) => new VideoDto(v));
    videos.forEach((v) => {
      // check login & subscriber filter data
      if (v.thumbnailId) {
        const thumbnail = files.find(
          (f) => f._id.toString() === v.thumbnailId.toString()
        );
        if (thumbnail) {
          // eslint-disable-next-line no-param-reassign
          v.thumbnail = {
            url: thumbnail.getUrl(),
            thumbnails: thumbnail.getThumbnails()
          };
        }
      }
      if (v.teaserId) {
        const teaser = files.find(
          (f) => f._id.toString() === v.teaserId.toString()
        );
        if (teaser) {
          // eslint-disable-next-line no-param-reassign
          v.teaser = {
            url: null, // teaser.getUrl(),
            thumbnails: teaser.getThumbnails(),
            duration: teaser.duration
          };
        }
      }
      if (v.fileId) {
        const video = files.find((f) => f._id.toString() === v.fileId.toString());
        if (video) {
          // eslint-disable-next-line no-param-reassign
          v.video = {
            url: null, // video.getUrl(),
            thumbnails: video.getThumbnails(),
            duration: video.duration
          };
        }
      }
    });

    return {
      data: videos,
      total
    };
  }
}

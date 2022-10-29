/* eslint-disable no-param-reassign */
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import { PageableData, QueueEventService, QueueEvent } from 'src/kernel';
import { EVENT } from 'src/kernel/constants';
import { ObjectId } from 'mongodb';
import { VideoService } from 'src/modules/performer-assets/services';
import { uniq } from 'lodash';
import { SubscriptionService } from 'src/modules/subscription/services/subscription.service';
import { OrderService } from 'src/modules/payment/services';
import { VideoDto } from 'src/modules/performer-assets/dtos';
import { SUBSCRIPTION_STATUS } from 'src/modules/subscription/constants';
import { ORDER_STATUS, PRODUCT_TYPE } from 'src/modules/payment/constants';
import { FileService } from 'src/modules/file/services';
import { ReactionModel } from '../models/reaction.model';
import { REACT_MODEL_PROVIDER } from '../providers/reaction.provider';
import {
  ReactionCreatePayload, ReactionSearchRequestPayload
} from '../payloads';
import { UserDto } from '../../user/dtos';
import { ReactionDto } from '../dtos/reaction.dto';
import { UserService } from '../../user/services';
import { PerformerService } from '../../performer/services';
import { REACTION_CHANNEL, REACTION_TYPE } from '../constants';

@Injectable()
export class ReactionService {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => VideoService))
    private readonly videoService: VideoService,
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
    @Inject(forwardRef(() => OrderService))
    private readonly orderService: OrderService,
    @Inject(REACT_MODEL_PROVIDER)
    private readonly reactionModel: Model<ReactionModel>,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    private readonly queueEventService: QueueEventService,
    private readonly userService: UserService
  ) {}

  public async findByQuery(payload) {
    return this.reactionModel.find(payload);
  }

  public async create(
    data: ReactionCreatePayload,
    user: UserDto
  ): Promise<ReactionDto> {
    const reaction = { ...data } as any;
    const existReact = await this.reactionModel.findOne({
      objectType: reaction.objectType,
      objectId: reaction.objectId,
      createdBy: user._id,
      action: reaction.action
    });
    if (existReact) {
      return existReact;
    }
    reaction.createdBy = user._id;
    reaction.createdAt = new Date();
    reaction.updatedAt = new Date();
    const newreaction = await this.reactionModel.create(reaction);
    await this.queueEventService.publish(
      new QueueEvent({
        channel: REACTION_CHANNEL,
        eventName: EVENT.CREATED,
        data: new ReactionDto({ ...newreaction.toObject(), creator: user })
      })
    );
    return newreaction;
  }

  public async remove(payload: ReactionCreatePayload, user: UserDto) {
    const reaction = await this.reactionModel.findOne({
      objectType: payload.objectType || REACTION_TYPE.VIDEO,
      objectId: payload.objectId,
      createdBy: user._id,
      action: payload.action
    });
    if (!reaction) {
      return false;
    }
    await reaction.remove();
    await this.queueEventService.publish(
      new QueueEvent({
        channel: REACTION_CHANNEL,
        eventName: EVENT.DELETED,
        data: new ReactionDto(reaction)
      })
    );
    return true;
  }

  public async search(
    req: ReactionSearchRequestPayload
  ): Promise<PageableData<ReactionDto>> {
    const query = {} as any;
    if (req.objectId) {
      query.objectId = req.objectId;
    }
    const sort = {
      createdAt: -1
    };
    const [data, total] = await Promise.all([
      this.reactionModel
        .find(query)
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.reactionModel.countDocuments(query)
    ]);
    const reactions = data.map((d) => new ReactionDto(d));
    const UIds = data.map((d) => d.createdBy);
    const [users, performers] = await Promise.all([
      UIds.length ? this.userService.findByIds(UIds) : [],
      UIds.length ? this.performerService.findByIds(UIds) : []
    ]);
    reactions.forEach((reaction: ReactionDto) => {
      const performer = performers.find(
        (p) => p._id.toString() === reaction.createdBy.toString()
      );
      const user = users.find(
        (u) => u._id.toString() === reaction.createdBy.toString()
      );
      // eslint-disable-next-line no-param-reassign
      reaction.creator = performer || user;
    });
    return {
      data: reactions,
      total
    };
  }

  public async getListVideos(req: ReactionSearchRequestPayload, user: UserDto, jwToken: string) {
    const query = {} as any;
    if (req.createdBy) query.createdBy = req.createdBy;
    if (req.action) query.action = req.action;
    query.objectType = REACTION_TYPE.VIDEO;

    const sort = {
      [req.sortBy || 'createdAt']: req.sort === 'desc' ? -1 : 1
    };
    const [items, total] = await Promise.all([
      this.reactionModel
        .find(query)
        .sort(sort)
        .limit(parseInt(req.limit as string, 10))
        .skip(parseInt(req.offset as string, 10)),
      this.reactionModel.countDocuments(query)
    ]);
    const videoIds = uniq(items.map((i) => i.objectId));
    const videos = videoIds.length > 0 ? await this.videoService.findByIds(videoIds) : [];
    const fileIds = [];
    videos.forEach((v) => {
      v.thumbnailId && fileIds.push(v.thumbnailId);
      v.fileId && fileIds.push(v.fileId);
    });
    const performerIds = uniq(videos.map((v) => v.performerId));
    const [files, subscriptions, orders] = await Promise.all([
      fileIds.length ? this.fileService.findByIds(fileIds) : [],
      performerIds ? this.subscriptionService.findSubscriptionList({
        userId: user._id,
        performerIds: { $in: performerIds },
        expiredAt: { $gt: new Date() },
        status: SUBSCRIPTION_STATUS.ACTIVE
      }) : [],
      videoIds.length ? this.orderService.findDetailsByQuery({
        buyerId: user._id,
        productId: { $in: videoIds },
        status: ORDER_STATUS.PAID,
        productType: PRODUCT_TYPE.SALE_VIDEO
      }) : []
    ]);

    const reactions = items.map((v) => new ReactionDto(v));
    reactions.forEach((item) => {
      const video = videos.find((p) => `${p._id}` === `${item.objectId}`);
      const subscribed = video && subscriptions.find((s) => `${s.performerId}` === `${video.performerId}`);
      const bought = video && orders.find((o) => `${o.productId}` === `${video._id}`);
      if (video) {
        item.objectInfo = video ? new VideoDto(video) : null;
        item.objectInfo.isSubscribed = !!subscribed;
        item.objectInfo.isBought = !!bought;
        if (video && video.thumbnailId) {
          const thumbnail = files.find((f) => f._id.toString() === video.thumbnailId.toString());
          if (thumbnail) {
            item.objectInfo.thumbnail = thumbnail.getUrl();
          }
        }
        if (video && video.fileId) {
          const file = files.find((f) => f._id.toString() === video.fileId.toString());
          if (file) {
            item.objectInfo.video = this.videoService.getVideoForView(file, new VideoDto(video), jwToken);
          }
        }
      }
    });

    return {
      data: reactions,
      total
    };
  }

  public async checkExisting(objectId: string | ObjectId, userId: string | ObjectId, action: string, objectType: string) {
    return this.reactionModel.countDocuments({
      objectId, createdBy: userId, action, objectType
    });
  }
}

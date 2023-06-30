import {
  Injectable, Inject
} from '@nestjs/common';
import { Model } from 'mongoose';
import { RedisService } from 'nestjs-redis';
import { QueueEvent, QueueEventService } from 'src/kernel';
import {
  ACTIVE_PERFORMER_IDS_CACHE, INACTIVE_PERFORMER_IDS_CACHE, PENDING_PERFORMER_IDS_CACHE, PERFORMER_CHANNEL, PERFORMER_STATUSES
} from '../constants';
import { PerformerDto } from '../dtos';
import { PerformerModel } from '../models';
import { PERFORMER_MODEL_PROVIDER } from '../providers';

const PERFORMER_CACHE_TOPIC = 'PERFORMER_CACHE_TOPIC';

@Injectable()
export class PerformerCacheService {
  constructor(
    private readonly redisService: RedisService,
    private readonly queueEventService: QueueEventService,
    @Inject(PERFORMER_MODEL_PROVIDER)
    private readonly Performer: Model<PerformerModel>
  ) {
    this.initialCache();
    this.queueEventService.subscribe(
      PERFORMER_CHANNEL,
      PERFORMER_CACHE_TOPIC,
      this.handleUpdateStatus.bind(this)
    );
  }

  private async initialCache() {
    const performers = await this.Performer.find({}).select(
      '_id status verifiedDocument'
    );
    const activePerformers = [];
    const pendingPerformers = [];
    const inactivePerformers = [];
    performers.forEach((p) => {
      if (p.status === PERFORMER_STATUSES.ACTIVE && p.verifiedDocument) activePerformers.push(p._id.toString());
      else if (p.status === PERFORMER_STATUSES.INACTIVE) inactivePerformers.push(p._id.toString());
      // else pendingPerformers.push(p._id.toString());
    });

    const redisClient = this.redisService.getClient();
    await Promise.all([
      redisClient.del(ACTIVE_PERFORMER_IDS_CACHE),
      redisClient.del(INACTIVE_PERFORMER_IDS_CACHE),
      redisClient.del(PENDING_PERFORMER_IDS_CACHE)
    ]);
    // old redis client doesn't allow to add multiple via array, need to add manually!
    await activePerformers.reduce(async (pv, id) => {
      await pv;
      return redisClient.sadd(ACTIVE_PERFORMER_IDS_CACHE, id);
    }, Promise.resolve());
    await inactivePerformers.reduce(async (pv, id) => {
      await pv;
      return redisClient.sadd(INACTIVE_PERFORMER_IDS_CACHE, id);
    }, Promise.resolve());
    await pendingPerformers.reduce(async (pv, id) => {
      await pv;
      return redisClient.sadd(PENDING_PERFORMER_IDS_CACHE, id);
    }, Promise.resolve());
  }

  public async handleUpdateStatus(event: QueueEvent) {
    const data = event.data as PerformerDto;
    const {
      status, verifiedDocument, _id
    } = data;

    // remove in the existing list and replace with new status
    const redisClient = this.redisService.getClient();
    await Promise.all([
      redisClient.srem(ACTIVE_PERFORMER_IDS_CACHE, _id.toString()),
      redisClient.srem(INACTIVE_PERFORMER_IDS_CACHE, _id.toString()),
      redisClient.srem(PENDING_PERFORMER_IDS_CACHE, _id.toString())
    ]);
    switch (status) {
      case PERFORMER_STATUSES.ACTIVE:
        if (verifiedDocument) await redisClient.sadd(ACTIVE_PERFORMER_IDS_CACHE, _id.toString());
        else await redisClient.sadd(INACTIVE_PERFORMER_IDS_CACHE, _id.toString());
        break;
      case PERFORMER_STATUSES.INACTIVE:
        await redisClient.sadd(INACTIVE_PERFORMER_IDS_CACHE, _id.toString());
        break;
      case PERFORMER_STATUSES.PENDING:
        await redisClient.sadd(PENDING_PERFORMER_IDS_CACHE, _id.toString());
        break;
      default: break;
    }
  }

  public async getActivePerformers() {
    const redisClient = this.redisService.getClient();
    return redisClient.smembers(ACTIVE_PERFORMER_IDS_CACHE);
  }

  public async isActivePerformer(performerId) {
    const redisClient = this.redisService.getClient();
    const members = await redisClient.smembers(ACTIVE_PERFORMER_IDS_CACHE);
    return members.includes(performerId.toString());
  }
}

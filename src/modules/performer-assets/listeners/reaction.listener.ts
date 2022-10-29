import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { QueueEventService, QueueEvent } from 'src/kernel';
import { REACTION_CHANNEL, REACTION_TYPE, REACTION } from 'src/modules/reaction/constants';
import { EVENT } from 'src/kernel/constants';
import { PerformerService } from 'src/modules/performer/services';
import { GalleryService, ProductService, VideoService } from '../services';

const REACTION_ASSETS_TOPIC = 'REACTION_ASSETS_TOPIC';

@Injectable()
export class ReactionAssetsListener {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    private readonly queueEventService: QueueEventService,
    private readonly videoService: VideoService,
    private readonly galleryService: GalleryService,
    private readonly productService: ProductService
  ) {
    this.queueEventService.subscribe(
      REACTION_CHANNEL,
      REACTION_ASSETS_TOPIC,
      this.handleReaction.bind(this)
    );
  }

  public async handleReaction(event: QueueEvent) {
    if (![EVENT.CREATED, EVENT.DELETED].includes(event.eventName)) {
      return;
    }
    const {
      objectId, objectType, action
    } = event.data;
    const num = event.eventName === EVENT.CREATED ? 1 : -1;
    if (objectType === REACTION_TYPE.VIDEO) {
      const video = await this.videoService.findById(objectId);
      switch (action) {
        case REACTION.LIKE:
          await Promise.all([
            this.videoService.increaseLike(
              objectId,
              num
            ),
            video && this.performerService.updateLikeStat(video.performerId, num)
          ]);
          break;
        case REACTION.FAVOURITE:
          await this.videoService.increaseFavourite(
            objectId,
            num
          );
          break;
        case REACTION.WATCH_LATER:
          await this.videoService.increaseWishlist(
            objectId,
            num
          );
          break;
        default: break;
      }
    }
    if (objectType === REACTION_TYPE.GALLERY) {
      const gallery = await this.galleryService.findById(objectId);
      switch (action) {
        case REACTION.LIKE:
          await Promise.all([
            this.galleryService.updateLikeStats(
              objectId,
              num
            ),
            gallery && this.performerService.updateLikeStat(gallery.performerId, num)
          ]);
          break;
        default: break;
      }
    }
    if (objectType === REACTION_TYPE.PRODUCT) {
      const product = await this.productService.findById(objectId);
      switch (action) {
        case REACTION.LIKE:
          await Promise.all([
            this.productService.updateLikeStats(
              objectId,
              num
            ),
            product && this.performerService.updateLikeStat(product.performerId, num)
          ]);
          break;
        default: break;
      }
    }
  }
}

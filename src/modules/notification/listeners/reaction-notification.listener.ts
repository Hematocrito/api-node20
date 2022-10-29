import { Injectable, Logger } from '@nestjs/common';
import { QueueEvent, QueueEventService } from 'src/kernel';
import { EVENT } from 'src/kernel/constants';
import { VideoService } from 'src/modules/performer-assets/services';
import { REACTION, REACTION_CHANNEL, REACTION_TYPE } from 'src/modules/reaction/constants';
import { ReactionDto } from 'src/modules/reaction/dtos/reaction.dto';
import { NOTIFICATION_CHANNEL } from '../notification.constant';
import { NotificationService } from '../services';

const HANDLE_REACTION_NOTIFICATION = 'HANDLE_REACTION_NOTIFICATION';

@Injectable()
export class ReactionNotificationListener {
  private logger = new Logger(ReactionNotificationListener.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly queueEventService: QueueEventService,
    private readonly videoService: VideoService
  ) {
    this.queueEventService.subscribe(
      REACTION_CHANNEL,
      HANDLE_REACTION_NOTIFICATION,
      this.handler.bind(this)
    );
  }

  async handler(event: QueueEvent) {
    try {
      const { eventName } = event;
      const reaction = event.data as ReactionDto;
      if (eventName !== EVENT.CREATED || reaction.action !== REACTION.LIKE) return;

      let title = `${reaction.creator.username} liked your profile`;
      let userId = reaction.objectId;
      switch (reaction.objectType) {
        case 'video': {
          const video = await this.videoService.findById(reaction.objectId);
          title = `${reaction.creator.username} liked your video "${video.title}"`;
          userId = video.performerId;
          break;
        }
        default:
          break;
      }

      const notification = await this.notificationService.create({
        type: reaction.objectType,
        action: reaction.action,
        userId,
        refId: reaction.objectId,
        createdBy: reaction.createdBy,
        title,
        message: '',
        thumbnail: reaction.creator.avatar || ''
      });

      await this.queueEventService.publish({
        eventName: EVENT.CREATED,
        channel: NOTIFICATION_CHANNEL,
        data: notification
      });
    } catch (e) {
      this.logger.error(e);
    }
  }
}

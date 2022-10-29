import { Injectable, Logger } from '@nestjs/common';
import { QueueEvent, QueueEventService } from 'src/kernel';
import { EVENT } from 'src/kernel/constants';
import { VideoDto } from 'src/modules/performer-assets/dtos';
import { PERFORMER_VIDEO_CHANNEL } from 'src/modules/performer-assets/services';
import { PerformerService } from 'src/modules/performer/services';
import { SubscriptionService } from 'src/modules/subscription/services/subscription.service';
import { NOTIFICATION_CHANNEL } from '../notification.constant';
import { NotificationService } from '../services';

const HANDLE_VIDEO_NOTIFICATION = 'HANDLE_VIDEO_NOTIFICATION';

@Injectable()
export class VideoNotificationListener {
  private logger = new Logger(VideoNotificationListener.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly queueEventService: QueueEventService,
    private readonly subscriptionService: SubscriptionService,
    private readonly performerService: PerformerService
  ) {
    this.queueEventService.subscribe(
      PERFORMER_VIDEO_CHANNEL,
      HANDLE_VIDEO_NOTIFICATION,
      this.handler.bind(this)
    );
  }

  async handler(event: QueueEvent) {
    try {
      const { eventName } = event;
      const video = event.data as VideoDto;
      if (eventName !== EVENT.CREATED) return;
      if (video.status !== 'active') return;
      const performer = await this.performerService.findById(video.performerId);
      // notify to all subscribers
      const subscriberIds = await this.subscriptionService.getAllSubscribers(video.performerId);
      if (!subscriberIds.length) return;

      await subscriberIds.reduce(async (lp, subscriber) => {
        await lp;
        const notification = await this.notificationService.create({
          type: 'video',
          action: 'created',
          userId: subscriber.userId,
          refId: video._id,
          createdBy: video.performerId,
          title: `${performer.username} uploaded a new video "${video.title}"`, // like
          message: ''
        });

        await this.queueEventService.publish({
          eventName: EVENT.CREATED,
          channel: NOTIFICATION_CHANNEL,
          data: notification
        });
        return Promise.resolve();
      }, Promise.resolve());
    } catch (e) {
      this.logger.error(e);
    }
  }
}

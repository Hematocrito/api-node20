import { Injectable, Logger } from '@nestjs/common';
import { QueueEvent, QueueEventService } from 'src/kernel';
import { EVENT } from 'src/kernel/constants';
import { LIVE_STREAM_EVENT_NAME, MODEL_LIVE_STREAM_CHANNEL } from 'src/modules/stream/constant';
import { SubscriptionService } from 'src/modules/subscription/services/subscription.service';
import { UserDto } from 'src/modules/user/dtos';
import { NOTIFICATION_CHANNEL } from '../notification.constant';
import { NotificationService } from '../services';

const HANDLE_PUBLIC_STREAM_NOTIFICATION = 'HANDLE_PUBLIC_STREAM_NOTIFICATION';

@Injectable()
export class PublicStreamNotificationListener {
  private logger = new Logger(PublicStreamNotificationListener.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly queueEventService: QueueEventService,
    private readonly subscriptionService: SubscriptionService
  ) {
    this.queueEventService.subscribe(
      MODEL_LIVE_STREAM_CHANNEL,
      HANDLE_PUBLIC_STREAM_NOTIFICATION,
      this.handler.bind(this)
    );
  }

  async handler(event: QueueEvent) {
    try {
      const { eventName } = event;
      if (eventName !== LIVE_STREAM_EVENT_NAME.PUBLIC_STREAM_STARTED) return;
      const performer = event.data.performer as UserDto;
      // notify to all subscribers
      const subscriberIds = await this.subscriptionService.getAllSubscribers(
        performer._id
      );
      if (!subscriberIds.length) return;

      await subscriberIds.reduce(async (lp, subscriber) => {
        await lp;
        const notification = await this.notificationService.create({
          type: 'public-stream',
          action: 'created',
          userId: subscriber.userId,
          refId: performer._id,
          createdBy: performer._id,
          title: `${performer.username} is live now`, // like
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

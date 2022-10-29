import { Injectable, Logger } from '@nestjs/common';
import { QueueEvent, QueueEventService } from 'src/kernel';
import { EVENT } from 'src/kernel/constants';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import { NOTIFICATION_CHANNEL } from '../notification.constant';

const HANDLE_NOTFICATION_CREATED = 'HANDLE_NOTFICATION_CREATED';
const SEND_NOTIFICATION = 'send_notification';

@Injectable()
export class NotificationListener {
  private logger = new Logger(NotificationListener.name);

  constructor(
    private readonly socketUserService: SocketUserService,
    private readonly queueEventService: QueueEventService
  ) {
    this.queueEventService.subscribe(
      NOTIFICATION_CHANNEL,
      HANDLE_NOTFICATION_CREATED,
      this.handler.bind(this)
    );
  }

  async handler(event: QueueEvent) {
    try {
      const { eventName, data } = event;
      if (eventName !== EVENT.CREATED) return;

      await this.socketUserService.emitToUsers(event.data.userId, SEND_NOTIFICATION, data);
    } catch (e) {
      this.logger.error(e);
    }
  }
}

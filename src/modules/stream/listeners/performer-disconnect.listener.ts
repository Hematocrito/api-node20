import { Injectable } from '@nestjs/common';
import { QueueEvent, QueueEventService } from 'src/kernel';
import { PERFORMER_SOCKET_CONNECTED_CHANNEL, USER_SOCKET_EVENT } from 'src/modules/socket/constants';
import { StreamService } from '../services';

const PERFORMER_DISCONNECT_STREAM_HANDLER = 'PERFORMER_DISCONNECT_STREAM_HANDLER';

@Injectable()
export class PerformerDisconnectListener {
  constructor(
    private readonly queueEventService: QueueEventService,
    private readonly streamService: StreamService
  ) {
    this.queueEventService.subscribe(
      PERFORMER_SOCKET_CONNECTED_CHANNEL,
      PERFORMER_DISCONNECT_STREAM_HANDLER,
      this.handler.bind(this)
    );
  }

  private async handler(event: QueueEvent): Promise<void> {
    if (![USER_SOCKET_EVENT.DISCONNECTED].includes(event.eventName)) {
      return;
    }
    const { data } = event;
    await this.streamService.removePerformerLivestreamList(data.sourceId);
  }
}

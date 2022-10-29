import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { QueueEventService, QueueEvent } from 'src/kernel';
import { PerformerService } from 'src/modules/performer/services';
import { MailerService } from 'src/modules/mailer';
import { EVENT } from 'src/kernel/constants';
import { EarningService } from 'src/modules/earning/services/earning.service';
import { PayoutRequestDto } from '../dtos/payout-request.dto';
import {
  PAYOUT_REQUEST_CHANEL,
  SOURCE_TYPE,
  STATUSES
} from '../constants';

const PAYOUT_REQUEST_UPDATE = 'PAYOUT_REQUEST_UPDATE';

@Injectable()
export class UpdatePayoutRequestListener {
  constructor(
    @Inject(forwardRef(() => QueueEventService))
    private readonly queueEventService: QueueEventService,
    @Inject(forwardRef(() => MailerService))
    private readonly mailService: MailerService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => EarningService))
    private readonly earningService: EarningService
  ) {
    this.queueEventService.subscribe(
      PAYOUT_REQUEST_CHANEL,
      PAYOUT_REQUEST_UPDATE,
      this.handler.bind(this)
    );
  }

  async handler(event: QueueEvent) {
    const request = event.data.request as PayoutRequestDto;
    const { source } = request;
    if (event.eventName === EVENT.UPDATED) {
      if (source === SOURCE_TYPE.PERFORMER) {
        await this.handlePerformer(request, event.data.oldStatus);
      }
    }
  }

  private async handlePerformer(request, oldStatus) {
    const {
      status, sourceId, fromDate, toDate
    } = request;
    const sourceInfo = await this.performerService.findById(sourceId);
    if (!sourceInfo) {
      return;
    }
    if (status === STATUSES.DONE && oldStatus !== STATUSES.DONE) {
      await this.earningService.updatePaidStatus({ performerId: sourceId, fromDate, toDate });
      const balance = await this.earningService.getPerformerBalance(sourceId);
      await this.performerService.setBalance(sourceId, balance);
    } else {
      await this.earningService.updatePayoutStatus({
        performerId: sourceId, fromDate, toDate, payoutStatus: status
      });
    }

    if (sourceInfo.email) {
      await this.mailService.send({
        subject: 'Update payout request',
        to: sourceInfo.email,
        data: { request },
        template: 'payout-request-status'
      });
    }
  }
}

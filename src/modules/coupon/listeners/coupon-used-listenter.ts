import { Injectable } from '@nestjs/common';
import { QueueEventService, QueueEvent } from 'src/kernel';
import { ORDER_PAID_SUCCESS_CHANNEL, ORDER_STATUS } from 'src/modules/payment/constants';
import { EVENT } from 'src/kernel/constants';
import { CouponService } from '../services/coupon.service';

const UPDATE_COUPON_USED_TOPIC = 'UPDATE_COUPON_USED_TOPIC';

@Injectable()
export class UpdateCouponUsesListener {
  constructor(
    private readonly queueEventService: QueueEventService,
    private readonly couponService: CouponService
  ) {
    this.queueEventService.subscribe(
      ORDER_PAID_SUCCESS_CHANNEL,
      UPDATE_COUPON_USED_TOPIC,
      this.handleUpdateCoupon.bind(this)
    );
  }

  public async handleUpdateCoupon(event: QueueEvent) {
    try {
      if (![EVENT.CREATED].includes(event.eventName)) {
        return;
      }
      const { order } = event.data;
      // TOTO handle more event transaction
      if (order.status !== ORDER_STATUS.PAID) {
        return;
      }
      if (!order.couponInfo || !order.couponInfo._id) {
        return;
      }
      await this.couponService.updateNumberOfUses(order.couponInfo._id);
    } catch (e) {
      // TODO - log me
      // eslint-disable-next-line no-console
      console.log('error_coupon_used', e);
    }
  }
}

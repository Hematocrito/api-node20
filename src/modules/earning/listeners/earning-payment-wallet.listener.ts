import { EntityNotFoundException, QueueEvent, QueueEventService } from 'src/kernel';
import { Injectable, Inject } from '@nestjs/common';
import { UserService } from 'src/modules/user/services';
import { Model } from 'mongoose';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import { PerformerService } from 'src/modules/performer/services';
import { EVENT } from 'src/kernel/constants';
import { ConversationService } from 'src/modules/message/services';
import { MESSAGE_TYPE } from 'src/modules/message/constants';
import { UserDto } from 'src/modules/user/dtos';
import { v4 as uuidv4 } from 'uuid';
import {
  PAYMENT_GATEWAY,
  PAYMENT_STATUS, PAYMENT_TYPE, PAYMENT_WALLET_CHANNEL, PRODUCT_TYPE
} from 'src/modules/payment/constants';
import { STATUSES } from 'src/modules/payout-request/constants';
import { EARNING_MODEL_PROVIDER } from '../providers/earning.provider';
import { EarningModel } from '../models/earning.model';
import { RECEIVED_PAID_TOKEN_EVENT } from '../constants';

const TIPPED = 'TIPPED';
const EARNING_WALLET_ORDER_TOPIC = 'EARNING_WALLET_ORDER_TOPIC';

@Injectable()
export class EarningPaymentWalletListener {
  constructor(
    private readonly userService: UserService,
    private readonly performerService: PerformerService,
    private readonly queueEventService: QueueEventService,
    private readonly socketUserService: SocketUserService,
    private readonly conversationService: ConversationService,

    @Inject(EARNING_MODEL_PROVIDER)
    private readonly Earning: Model<EarningModel>
  ) {
    this.queueEventService.subscribe(
      PAYMENT_WALLET_CHANNEL,
      EARNING_WALLET_ORDER_TOPIC,
      this.handler.bind(this)
    );
  }

  async handler(event: QueueEvent) {
    const { eventName } = event;
    const {
      order, orderDetail, conversationId, transactionId
    } = event.data;
    try {
      if (eventName !== EVENT.CREATED) {
        return;
      }

      const performerId = order.sellerId;
      const userId = order.buyerId;
      const { type } = order;
      const [user, performer] = await Promise.all([
        this.userService.findById(userId),
        this.performerService.findById(performerId)
      ]);

      if (!user || !performer) return;

      let commission = 0.2;
      let sourceType = 'n/a';
      const defaultCommission = 0.2;
      const performerCommission = await this.performerService.getMyCommissions(performerId);

      switch (type) {
        case PRODUCT_TYPE.PRIVATE_CHAT:
          commission = performerCommission.privateChatCommission || defaultCommission;
          sourceType = 'stream_private';
          break;
        case PRODUCT_TYPE.TIP:
          commission = performerCommission.tokenTipCommission || defaultCommission;
          sourceType = 'tip';
          break;
        default:
          break;
      }

      await this.createEarning({
        orderDetail,
        commission,
        transactionId,
        sourceType
      });

      if (type === PAYMENT_TYPE.TIP) {
        await this.notifyTip({
          order,
          user,
          performer,
          conversationId
        });
      }

      if (conversationId && ['stream_private', 'stream_group'].includes(type)) {
        const netPrice = ((orderDetail.totalPrice - (orderDetail.totalPrice * commission)) * 100) / 100;
        await this.notifyStreamChat({
          conversationId,
          performerId,
          netPrice
        });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }
  }

  private async createEarning({
    orderDetail,
    commission,
    transactionId,
    sourceType
  }) {
    const netPrice = ((orderDetail.totalPrice - (orderDetail.totalPrice * commission)) * 100) / 100;
    // eslint-disable-next-line new-cap
    const newEarning = new this.Earning();
    newEarning.set('commission', commission);
    newEarning.set('grossPrice', orderDetail.totalPrice);
    newEarning.set('netPrice', netPrice);
    newEarning.set('performerId', orderDetail.sellerId);
    newEarning.set('userId', orderDetail.buyerId);
    newEarning.set('transactionId', transactionId);
    newEarning.set('orderId', orderDetail._id);
    newEarning.set('type', orderDetail.productType);
    newEarning.set('sourceType', sourceType);
    newEarning.set('createdAt', orderDetail.createdAt);
    newEarning.set('isPaid', false);
    newEarning.set('transactionStatus', PAYMENT_STATUS.SUCCESS);
    newEarning.set('paymentMethod', PAYMENT_GATEWAY.WALLET);
    newEarning.set('paymentStatus', orderDetail.paymentStatus);
    newEarning.set('payoutStatus', STATUSES.PENDING);
    // eslint-disable-next-line no-await-in-loop
    await newEarning.save();
    await this.performerService.increaseBalance(orderDetail.sellerId, netPrice);
  }

  private async notifyTip({
    order,
    user,
    performer,
    conversationId
  }) {
    try {
      const senderInfo = new UserDto(user).toResponse();
      await this.socketUserService.emitToUsers(performer._id, TIPPED, {
        _id: order._id,
        senderInfo,
        sourceId: user._id,
        targetId: performer._id,
        createdAt: new Date(),
        totalPrice: order.totalPrice.toFixed(2)
      });
      if (conversationId) {
        const conversation = await this.conversationService.findById(
          conversationId
        );
        if (!conversationId) {
          return;
        }

        const message = {
          _id: uuidv4(),
          senderInfo,
          conversationId,
          text: `has tipped $${order.totalPrice.toFixed(2)}`,
          type: MESSAGE_TYPE.TIP
        };
        const roomName = conversation.getRoomName();
        await this.socketUserService.emitToRoom(
          roomName,
          `message_created_conversation_${conversation._id}`,
          message
        );
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }
  }

  private async notifyStreamChat({
    conversationId,
    performerId,
    netPrice
  }) {
    await this.socketUserService.emitToUsers(
      performerId,
      RECEIVED_PAID_TOKEN_EVENT,
      { token: netPrice, conversationId }
    );
  }
}

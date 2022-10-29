import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { UserDto } from 'src/modules/user/dtos';
import {
  EntityNotFoundException,
  QueueEventService,
  QueueEvent
} from 'src/kernel';
import { EVENT } from 'src/kernel/constants';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { SettingService } from 'src/modules/settings';
import { ConversationService } from 'src/modules/message/services';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { PerformerService } from 'src/modules/performer/services';
import { UserService } from 'src/modules/user/services';
import { SendTipsPayload } from '../payloads';
import { NotEnoughWalletException } from '../exceptions';
import { OrderModel, PaymentTransactionModel } from '../models';
import { PAYMENT_TRANSACTION_MODEL_PROVIDER } from '../providers';
import {
  PAYMENT_WALLET_CHANNEL,
  PAYMENT_STATUS,
  PAYMENT_GATEWAY,
  TRANSACTION_SUCCESS_CHANNEL
} from '../constants';
import { OrderService } from './order.service';

@Injectable()
export class PaymentWalletService {
  constructor(
    @Inject(PAYMENT_TRANSACTION_MODEL_PROVIDER)
    private readonly PaymentTransaction: Model<PaymentTransactionModel>,
    @Inject(forwardRef(() => QueueEventService))
    private readonly queueEventService: QueueEventService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => SettingService))
    private readonly settingService: SettingService,
    @Inject(forwardRef(() => ConversationService))
    private readonly conversationService: ConversationService,
    @Inject(forwardRef(() => OrderService))
    private readonly orderService: OrderService
  ) {}

  async sendTips(user: UserDto, performerId: string | ObjectId, payload: SendTipsPayload) {
    const performer = await this.performerService.findById(performerId);
    if (!performer) {
      throw new EntityNotFoundException();
    }

    const { amount, conversationId } = payload;
    if (user.balance < amount) {
      throw new NotEnoughWalletException();
    }

    const { order, orderDetail } = await this.orderService.createOrderForTip(amount, user._id, performerId);
    const transaction = await this.PaymentTransaction.create({
      paymentGateway: PAYMENT_GATEWAY.WALLET,
      orderId: order._id,
      source: order.buyerSource,
      sourceId: order.buyerId,
      type: order.type,
      totalPrice: order.totalPrice,
      status: PAYMENT_STATUS.SUCCESS,
      paymentResponseInfo: null,
      products: []
    });

    // deduce user balance of user
    await this.userService.increaseBalance(user._id, -1 * amount);

    await this.queueEventService.publish(
      new QueueEvent({
        channel: PAYMENT_WALLET_CHANNEL,
        eventName: EVENT.CREATED,
        data: {
          transactionId: transaction._id,
          order: order.toObject(),
          orderDetail: orderDetail.toObject(),
          conversationId
        }
      })
    );
    return true;
  }

  public async payPrivateChat(user: UserDto, conversationId) {
    const conversation = await this.conversationService.findById(
      conversationId
    );
    if (!conversation) {
      throw new EntityNotFoundException();
    }

    const performer = await this.performerService.findById(conversation.performerId);
    if (!performer) throw new EntityNotFoundException();
    let amount: number;
    let key: string;
    switch (conversation.type) {
      case 'stream_group':
        break;
      case 'stream_private':
        amount = performer.privateChatPrice;
        key = SETTING_KEYS.PRIVATE_C2C_DEFAULT_PRICE;
        break;
      default:
        key = SETTING_KEYS.PRIVATE_C2C_DEFAULT_PRICE;
        break;
    }

    if (typeof amount === 'undefined') {
      const defaultPriceSetting = await this.settingService.getKeyValue(key);
      amount = defaultPriceSetting || 0;
    }

    if (user.balance < amount) {
      throw new NotEnoughWalletException();
    }
    // if have conversation, group order?
    let order;
    let orderDetail;
    let transaction = await this.PaymentTransaction.findOne({ paymentToken: conversationId });
    if (transaction) {
      const result = await this.orderService.appendOrderDetailForPrivateChat(
        transaction.orderId,
        amount
      );
      order = result.order;
      orderDetail = result.orderDetail;
    } else {
      const result = await this.orderService.createOrderForPrivateChat(
        amount,
        user._id,
        conversation.performerId,
        conversation._id
      );
      order = result.order;
      orderDetail = result.orderDetail;

      transaction = await this.PaymentTransaction.create({
        paymentGateway: PAYMENT_GATEWAY.WALLET,
        orderId: order._id,
        source: order.buyerSource,
        sourceId: order.buyerId,
        type: order.type,
        totalPrice: order.totalPrice,
        status: PAYMENT_STATUS.SUCCESS,
        paymentResponseInfo: null,
        paymentToken: conversationId,
        products: []
      });
    }

    // deduce user balance of user
    await this.userService.increaseBalance(user._id, -1 * amount);

    await this.queueEventService.publish(
      new QueueEvent({
        channel: PAYMENT_WALLET_CHANNEL,
        eventName: EVENT.CREATED,
        data: {
          transactionId: transaction._id,
          order: order.toObject(),
          orderDetail: orderDetail.toObject(),
          conversationId
        }
      })
    );
  }

  public async purchaseWalletFromOrder(
    order: OrderModel
  ) {
    const user = await this.userService.findById(order.buyerId);
    if (user.balance < order.totalPrice) {
      // remove order
      await this.orderService.delete(order._id);

      throw new NotEnoughWalletException();
    }

    const transaction = await this.PaymentTransaction.create({
      paymentGateway: PAYMENT_GATEWAY.WALLET,
      orderId: order._id,
      source: order.buyerSource,
      sourceId: order.buyerId,
      type: order.type,
      totalPrice: order.totalPrice,
      status: PAYMENT_STATUS.SUCCESS,
      paymentResponseInfo: null,
      products: []
    });
    await transaction.save();

    // deduce user balance
    await this.userService.increaseBalance(user._id, -1 * order.totalPrice);

    // update order status
    await this.orderService.updatePaidStatus(order._id);

    await this.queueEventService.publish(
      new QueueEvent({
        channel: TRANSACTION_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: transaction
      })
    );
    return { ok: true };
  }
}

import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import { QueueEventService, QueueEvent } from 'src/kernel';
import {
  PAYMENT_TYPE,
  ORDER_PAID_SUCCESS_CHANNEL
} from 'src/modules/payment/constants';
import { EVENT, STATUS } from 'src/kernel/constants';
import * as moment from 'moment';
import { OrderModel, PaymentTransactionModel } from 'src/modules/payment/models';
import { PerformerService } from 'src/modules/performer/services';
import { UserService } from 'src/modules/user/services';
import { MailerService } from 'src/modules/mailer';
import { SubscriptionModel } from '../models/subscription.model';
import { SUBSCRIPTION_MODEL_PROVIDER } from '../providers/subscription.provider';
import { SubscriptionDto } from '../dtos/subscription.dto';
import {
  SUBSCRIPTION_TYPE, SUBSCRIPTION_STATUS
} from '../constants';

const UPDATE_SUBSCRIPTION_CHANNEL = 'UPDATE_SUBSCRIPTION_CHANNEL';

@Injectable()
export class OrderSubscriptionListener {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(SUBSCRIPTION_MODEL_PROVIDER)
    private readonly subscriptionModel: Model<SubscriptionModel>,
    private readonly queueEventService: QueueEventService,
    private readonly mailService: MailerService
  ) {
    this.queueEventService.subscribe(
      ORDER_PAID_SUCCESS_CHANNEL,
      UPDATE_SUBSCRIPTION_CHANNEL,
      this.handleListenSubscription.bind(this)
    );
  }

  public async handleListenSubscription(
    event: QueueEvent
  ): Promise<any> {
    if (![EVENT.CREATED, EVENT.DELETED].includes(event.eventName)) {
      return;
    }
    const { transaction, order } = event.data;
    if (![PAYMENT_TYPE.YEARLY_SUBSCRIPTION, PAYMENT_TYPE.MONTHLY_SUBSCRIPTION].includes(order.type)) {
      return;
    }
    // not support for other gateway
    if (transaction.paymentGateway === 'ccbill') {
      await this.handleCCBillSubscription(order, transaction, event.eventName);
    } else if (transaction.paymentGateway === 'verotel') {
      await this.handleVerotelSubscription(order, transaction, event.eventName);
    }
  }

  private async handleCCBillSubscription(order: OrderModel, transaction: PaymentTransactionModel, eventName) {
    const existSubscription = await this.subscriptionModel.findOne({
      userId: order.buyerId,
      performerId: order.sellerId
    });
    let days = 30;
    switch (transaction.type) {
      case PAYMENT_TYPE.MONTHLY_SUBSCRIPTION:
        days = 30;
        break;
      case PAYMENT_TYPE.YEARLY_SUBSCRIPTION:
        days = 365;
        break;
      default: break;
    }
    // ccbill rules, today is the first day
    const expiredAt = moment().add(days, 'days').toDate();
    const subscriptionType = transaction.type === PAYMENT_TYPE.MONTHLY_SUBSCRIPTION
      ? SUBSCRIPTION_TYPE.MONTHLY
      : SUBSCRIPTION_TYPE.YEARLY;
    const subscriptionId = transaction?.paymentResponseInfo?.subscriptionId
    || transaction?.paymentResponseInfo?.subscription_id || null;
    const paymentResponseInfo = transaction?.paymentResponseInfo || {} as any;
    const { paymentGateway } = transaction;
    const startRecurringDate = new Date();
    const nextRecurringDate = expiredAt;
    if (existSubscription) {
      existSubscription.expiredAt = new Date(expiredAt);
      existSubscription.updatedAt = new Date();
      existSubscription.subscriptionType = subscriptionType;
      existSubscription.transactionId = transaction._id;
      existSubscription.meta = paymentResponseInfo;
      existSubscription.subscriptionId = subscriptionId;
      existSubscription.paymentGateway = paymentGateway;
      existSubscription.startRecurringDate = startRecurringDate;
      existSubscription.nextRecurringDate = nextRecurringDate;
      existSubscription.status = STATUS.ACTIVE;
      if (existSubscription.status === SUBSCRIPTION_STATUS.DEACTIVATED) {
        await this.performerService.updateSubscriptionStat(
          existSubscription.performerId,
          1
        );
      }
      await existSubscription.save();
      await this.handleMailerSubscription(new SubscriptionDto(existSubscription));
      return new SubscriptionDto(existSubscription);
    }

    const newSubscription = await this.subscriptionModel.create({
      performerId: order.sellerId,
      userId: order.buyerId,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiredAt: new Date(expiredAt),
      subscriptionType,
      subscriptionId,
      meta: paymentResponseInfo,
      paymentGateway,
      startRecurringDate,
      nextRecurringDate,
      transactionId: transaction._id,
      status: STATUS.ACTIVE
    });
    await this.handleMailerSubscription(new SubscriptionDto(newSubscription));
    await this.performerService.updateSubscriptionStat(
      newSubscription.performerId,
      1
    );
    return new SubscriptionDto(newSubscription);
  }

  private async handleVerotelSubscription(order: OrderModel, transaction: PaymentTransactionModel, eventName) {
    const existSubscription = await this.subscriptionModel.findOne({
      userId: order.buyerId,
      performerId: order.sellerId
    });
    const expiredAt = transaction.type === PAYMENT_TYPE.MONTHLY_SUBSCRIPTION
      ? moment()
        .add(30, 'days')
        .toDate()
      : moment()
        .add(365, 'days')
        .toDate();
    const subscriptionType = transaction.type === PAYMENT_TYPE.MONTHLY_SUBSCRIPTION
      ? SUBSCRIPTION_TYPE.MONTHLY
      : SUBSCRIPTION_TYPE.YEARLY;
    const subscriptionId = transaction?.paymentResponseInfo?.referenceID;
    const paymentResponseInfo = transaction?.paymentResponseInfo || {} as any;
    const { paymentGateway } = transaction;
    if (existSubscription) {
      existSubscription.expiredAt = new Date(expiredAt);
      existSubscription.updatedAt = new Date();
      existSubscription.subscriptionType = subscriptionType;
      existSubscription.transactionId = transaction._id;
      existSubscription.meta = paymentResponseInfo;
      existSubscription.subscriptionId = subscriptionId;
      existSubscription.paymentGateway = paymentGateway;
      existSubscription.startRecurringDate = new Date();
      existSubscription.nextRecurringDate = moment(new Date(expiredAt)).add(1, 'day').toDate();
      existSubscription.status = STATUS.ACTIVE;
      if (existSubscription.status === SUBSCRIPTION_STATUS.DEACTIVATED) {
        await this.performerService.updateSubscriptionStat(
          existSubscription.performerId,
          1
        );
      }
      await existSubscription.save();
      await this.handleMailerSubscription(new SubscriptionDto(existSubscription));
      return new SubscriptionDto(existSubscription);
    }

    const newSubscription = await this.subscriptionModel.create({
      performerId: order.sellerId,
      userId: order.buyerId,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiredAt: new Date(expiredAt),
      subscriptionType,
      subscriptionId,
      meta: paymentResponseInfo,
      paymentGateway,
      startRecurringDate: new Date(),
      nextRecurringDate: moment(new Date(expiredAt)).add(1, 'day').toDate(),
      transactionId: transaction._id,
      status: STATUS.ACTIVE
    });
    await this.handleMailerSubscription(new SubscriptionDto(newSubscription));
    await this.performerService.updateSubscriptionStat(
      newSubscription.performerId,
      1
    );
    return new SubscriptionDto(newSubscription);
  }

  public async handleMailerSubscription(subscription: SubscriptionDto) {
    const [user, performer] = await Promise.all([
      this.userService.findById(subscription.userId),
      this.performerService.findById(subscription.performerId)
    ]);
    if (!user || !performer) return;
    if (performer.email) {
      await this.mailService.send({
        subject: 'New Subscription',
        to: performer.email,
        data: {
          performer,
          user
        },
        template: 'performer-new-subscription'
      });
    }
  }
}

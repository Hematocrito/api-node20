/* eslint-disable no-await-in-loop */
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import { QueueEventService, QueueEvent } from 'src/kernel';
import {
  TRANSACTION_SUCCESS_CHANNEL,
  PAYMENT_TYPE,
  ORDER_PAID_SUCCESS_CHANNEL,
  DELIVERY_STATUS
} from 'src/modules/payment/constants';
import { EVENT } from 'src/kernel/constants';
import { SettingService } from 'src/modules/settings/services';
import { PerformerService } from 'src/modules/performer/services';
import { UserService } from 'src/modules/user/services';
import { MailerService } from 'src/modules/mailer';
import { WalletPackageService } from 'src/modules/wallet-packages/services/wallet-package.service';
import { OrderDto, PaymentDto } from '../dtos';
import { ORDER_DETAIL_MODEL_PROVIDER, ORDER_MODEL_PROVIDER } from '../providers';
import { OrderDetailsModel, OrderModel } from '../models';
import { ORDER_STATUS, PAYMENT_STATUS } from '../constants';

const ORDER_CHANNEL = 'ORDER_CHANNEL';

@Injectable()
export class OrderListener {
  constructor(
    @Inject(forwardRef(() => WalletPackageService))
    private readonly walletPackageService: WalletPackageService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly mailService: MailerService,
    @Inject(ORDER_MODEL_PROVIDER)
    private readonly orderModel: Model<OrderModel>,
    @Inject(ORDER_DETAIL_MODEL_PROVIDER)
    private readonly orderDetailsModel: Model<OrderDetailsModel>,
    private readonly queueEventService: QueueEventService
  ) {
    this.queueEventService.subscribe(
      TRANSACTION_SUCCESS_CHANNEL,
      ORDER_CHANNEL,
      this.handleListen.bind(this)
    );
  }

  private async handleEmailProducts(order: OrderModel, orderDetails: OrderDetailsModel[]): Promise<any> {
    const adminEmail = SettingService.getByKey('adminEmail').value || process.env.ADMIN_EMAIL;
    const performer = await this.performerService.findById(order.sellerId);
    const user = await this.userService.findById(order.buyerId);
    if (!user || !performer) {
      return false;
    }
    const data = {
      performer,
      user,
      order,
      orderDetails
    };
    // mail to performer
    if (performer.email) {
      await this.mailService.send({
        subject: 'New payment success',
        to: performer.email,
        data,
        template: 'performer-payment-success'
      });
    }
    // mail to admin
    if (adminEmail) {
      await this.mailService.send({
        subject: 'New payment success',
        to: adminEmail,
        data,
        template: 'admin-payment-success'
      });
    }
    // mail to user
    if (user.email) {
      await this.mailService.send({
        subject: 'New payment success',
        to: user.email,
        data,
        template: 'user-payment-success'
      });
    }

    return true;
  }

  private async handleEmailSubscription(order: OrderModel, orderDetails: OrderDetailsModel[]): Promise<any> {
    // TODO - define new emails templates
    const adminEmail = SettingService.getByKey('adminEmail').value || process.env.ADMIN_EMAIL;
    const performer = await this.performerService.findById(order.sellerId);
    const user = await this.userService.findById(order.buyerId);
    if (!user || !performer) {
      return false;
    }
    const data = {
      performer,
      user,
      order,
      orderDetails
    };
    // mail to admin
    if (adminEmail) {
      await this.mailService.send({
        subject: 'New payment success',
        to: adminEmail,
        data,
        template: 'admin-payment-success'
      });
    }
    // mail to user
    if (user.email) {
      await this.mailService.send({
        subject: 'New payment success',
        to: user.email,
        data,
        template: 'user-payment-success'
      });
    }

    return true;
  }

  private async handleWalletEmail(order: OrderModel, orderDetails: OrderDetailsModel[]): Promise<any> {
    // TODO - define new emails templates
    const adminEmail = SettingService.getByKey('adminEmail').value || process.env.ADMIN_EMAIL;
    const user = await this.userService.findById(order.buyerId);
    if (!user) {
      return false;
    }
    const data = {
      user,
      order,
      orderDetails
    };
    // mail to admin
    if (adminEmail) {
      await this.mailService.send({
        subject: 'New payment token package success',
        to: adminEmail,
        data,
        template: 'admin-payment-wallet-package-success.html'
      });
    }
    // mail to user
    if (user.email) {
      await this.mailService.send({
        subject: 'New payment token package success',
        to: user.email,
        data,
        template: 'user-payment-success.html'
      });
    }

    return true;
  }

  private async handleBalanceFromWallet(orderDetails: OrderDetailsModel[]) {
    // eslint-disable-next-line no-restricted-syntax
    for (const orderDetail of orderDetails) {
      let amount = orderDetail.totalPrice;
      if (orderDetail.productId) {
        // eslint-disable-next-line no-await-in-loop
        const tokenPackage = await this.walletPackageService.findById(orderDetail.productId);
        if (tokenPackage) amount = tokenPackage.token;
      }
      // eslint-disable-next-line no-await-in-loop
      await this.userService.increaseBalance(orderDetail.buyerId, amount, false);
    }
  }

  public async handleListen(
    event: QueueEvent
  ): Promise<OrderDto> {
    if (event.eventName !== EVENT.CREATED) {
      return;
    }
    const transaction = event.data as PaymentDto;
    if (transaction?.status !== PAYMENT_STATUS.SUCCESS) {
      return;
    }

    const order = await this.orderModel.findById(transaction.orderId);
    if (!order) {
      // TODO - log me
      return;
    }
    order.status = ORDER_STATUS.PAID;
    order.paymentStatus = PAYMENT_STATUS.SUCCESS;
    await order.save();
    // update for sub order payment status
    const orderDetails = await this.orderDetailsModel.find({ orderId: order._id });
    // eslint-disable-next-line no-restricted-syntax
    for (const detail of orderDetails) {
      detail.paymentStatus = PAYMENT_STATUS.SUCCESS;
      detail.status = ORDER_STATUS.PAID;
      detail.transactionId = transaction._id;
      if (detail.productType !== 'physical') {
        detail.deliveryStatus = DELIVERY_STATUS.DELIVERED;
      }
      await detail.save();
    }

    await this.queueEventService.publish(
      new QueueEvent({
        channel: ORDER_PAID_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: {
          order,
          orderDetails,
          transaction
        }
      })
    );
    // TODO - send digital download link to user
    switch (order.type) {
      case PAYMENT_TYPE.PERFORMER_PRODUCT:
        await this.handleEmailProducts(order, orderDetails);
        break;
      case PAYMENT_TYPE.SALE_VIDEO:
        await this.handleEmailProducts(order, orderDetails);
        break;
      case PAYMENT_TYPE.YEARLY_SUBSCRIPTION:
        await this.handleEmailSubscription(order, orderDetails);
        break;
      case PAYMENT_TYPE.MONTHLY_SUBSCRIPTION:
        await this.handleEmailSubscription(order, orderDetails);
        break;
      case PAYMENT_TYPE.WALLET: {
        await this.handleBalanceFromWallet(orderDetails);
        await this.handleWalletEmail(order, orderDetails);
        break;
      }
      default: break;
    }
  }
}

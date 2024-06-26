/* eslint-disable camelcase */
import {
  Injectable,
  Inject,
  forwardRef,
  BadRequestException
} from '@nestjs/common';
import { PerformerService } from 'src/modules/performer/services';
import {
  QueueEventService,
  QueueEvent
} from 'src/kernel';
import { EVENT } from 'src/kernel/constants';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { SettingService } from 'src/modules/settings';
import { ORDER_DETAIL_MODEL_PROVIDER, PAYMENT_TRANSACTION_MODEL_PROVIDER } from '../providers';
import { OrderDetailsModel, OrderModel, PaymentTransactionModel } from '../models';
import {
  PAYMENT_STATUS, TRANSACTION_SUCCESS_CHANNEL, PAYMENT_TYPE, ORDER_STATUS
} from '../constants';
import { SubscriptionService } from '../../subscription/services/subscription.service';
import { CCBillService } from './ccbill.service';
import { OrderService } from './order.service';
import { MissingConfigPaymentException } from '../exceptions';
import { VerotelService } from './verotel.service';
import { AstropayPaymentsService } from './astropay-payments.service';
import { AstropayDepositDto } from '../dtos/astropay.dto';
import {
  PurchaseFeedPayload,
  PurchaseProductsPayload, PurchaseSinglePhotoPayload, PurchaseTokenCustomAmountPayload, PurchaseTokenPayload, PurchaseVideoPayload, SubscribePerformerPayload
} from '../payloads';

@Injectable()
export class PaymentService {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(PAYMENT_TRANSACTION_MODEL_PROVIDER)
    private readonly paymentTransactionModel: Model<PaymentTransactionModel>,
    @Inject(ORDER_DETAIL_MODEL_PROVIDER)
    private readonly orderDetailModel: Model<OrderDetailsModel>,
    private readonly ccbillService: CCBillService,
    private readonly queueEventService: QueueEventService,
    private readonly subscriptionService: SubscriptionService,
    private readonly orderService: OrderService,
    private readonly settingService: SettingService,
    private readonly verotelService: VerotelService,
    private readonly astropayPaymentsService: AstropayPaymentsService
  ) { }

  public async findById(id: string | ObjectId) {
    return this.paymentTransactionModel.findById(id);
  }

  public async create(transaction) {
    return this.paymentTransactionModel.create(transaction);
  }

  private async getPerformerSinglePaymentGatewaySetting(
    performerId,
    paymentGateway = 'ccbill'
  ) {
    const performerPaymentSetting = await this.performerService.getPaymentSetting(
      performerId,
      paymentGateway
    );
    const flexformId = performerPaymentSetting?.value?.flexformId;
    const subAccountNumber = performerPaymentSetting?.value?.singlePurchaseSubAccountNumber;
    const salt = performerPaymentSetting?.value?.salt;
    /*
    if (!performerPaymentSetting || !flexformId || !subAccountNumber || !salt) {
      throw new MissingConfigPaymentException();
    } */

    return {
      flexformId,
      subAccountNumber,
      salt
    };
  }

  private async getPerformerSubscroptionPaymentGatewaySetting(
    performerId,
    paymentGateway
  ) {
    const performerPaymentSetting = await this.performerService.getPaymentSetting(
      performerId,
      paymentGateway
    );
    const flexformId = performerPaymentSetting?.value?.flexformId;
    const subAccountNumber = performerPaymentSetting?.value?.subscriptionSubAccountNumber;
    const salt = performerPaymentSetting?.value?.salt;
    /* if (!performerPaymentSetting || !flexformId || !subAccountNumber || !salt) {
      throw new MissingConfigPaymentException();
    } */
    return {
      flexformId,
      subAccountNumber,
      salt
    };
  }

  public async subscribePerformer(
    order: OrderModel,
    {
      paymentGateway, performerId, countryCode, currency
    } : SubscribePerformerPayload
  ) {
    if (paymentGateway === 'astropay') {
      const performer = await this.performerService.findById(performerId);
      await this.paymentTransactionModel.create({
        paymentGateway,
        orderId: order._id,
        source: order.buyerSource,
        sourceId: order.buyerId,
        type: order.type,
        totalPrice: order.totalPrice,
        status: PAYMENT_STATUS.PENDING
      });
      const astroBody : AstropayDepositDto = {
        amount: order.totalPrice,
        currency,
        country: countryCode,
        merchantDepositId: order._id,
        callbackUrl: '',
        user: {
          merchantUserId: order.buyerId.toString()
        },
        product: {
          mcc: '7995',
          merchantCode: '0001',
          description: 'model'
        },
        visualInfo: {
          merchantName: performer.name
        }
      };
      const astropay = await this.astropayPaymentsService.requestDeposit(astroBody);
      // const orderDetails = await this.orderService.getDetails(order._id);
      // const description = orderDetails?.map((o) => o.name).join('; ');
      // const data = await this.verotelService.createRecurringRequestFromTransaction(transaction, {
      //   description,
      //   userId: order.buyerId,
      //   performerId: order.sellerId
      // });
      // await this.paymentTransactionModel.updateOne({ _id: transaction._id }, {
      //   $set: {
      //     paymentToken: data.signature
      //   }
      // });
      return astropay;
    }
    if (paymentGateway === 'ccbill') {
      const {
        flexformId,
        subAccountNumber,
        salt
      } = await this.getPerformerSubscroptionPaymentGatewaySetting(order.sellerId, paymentGateway);
      const transaction = await this.paymentTransactionModel.create({
        paymentGateway,
        orderId: order._id,
        source: order.buyerSource,
        sourceId: order.buyerId,
        type: order.type,
        totalPrice: order.totalPrice,
        products: [],
        status: PAYMENT_STATUS.PENDING
      });

      return this.ccbillService.subscription({
        salt,
        flexformId,
        subAccountNumber,
        price: parseFloat(order.totalPrice.toFixed(2)),
        transactionId: transaction._id,
        subscriptionType: order.type
      });
    }
    throw new MissingConfigPaymentException();
  }

  public async updtateAstroPaymentStatus(payload: any) {
    const {
      deposit_external_id, merchant_deposit_id, deposit_user_id, status, end_status_date
    } = payload;
    const transaction = await this.paymentTransactionModel.findOne({
      orderId: merchant_deposit_id
    }).exec();

    const order = await this.orderService.findById(merchant_deposit_id);
    const orderDetail = await this.orderDetailModel.findOne({
      orderId: merchant_deposit_id
    });

    if (transaction && order && orderDetail) {
      if (status === 'APPROVED') {
        transaction.status = PAYMENT_STATUS.SUCCESS;
        order.paymentStatus = PAYMENT_STATUS.SUCCESS;
        order.status = ORDER_STATUS.PAID;
        orderDetail.paymentStatus = PAYMENT_STATUS.SUCCESS;
        orderDetail.status = ORDER_STATUS.PAID;
        transaction.save();
        order.save();
        orderDetail.save();
      }

      if (status === 'PENDING') {
        transaction.status = PAYMENT_STATUS.PENDING;
        order.paymentStatus = PAYMENT_STATUS.PENDING;
        order.status = ORDER_STATUS.PENDING;
        orderDetail.paymentStatus = PAYMENT_STATUS.PENDING;
        orderDetail.status = ORDER_STATUS.PENDING;
        transaction.save();
        order.save();
        orderDetail.save();
      }

      if (status === 'CANCELLED') {
        transaction.status = PAYMENT_STATUS.CANCELLED;
        order.paymentStatus = PAYMENT_STATUS.CANCELLED;
        // order.status = ORDER_STATUS.REFUNDED;
        orderDetail.paymentStatus = PAYMENT_STATUS.CANCELLED;
        // orderDetail.status = ORDER_STATUS.REFUNDED;
        transaction.save();
        order.save();
      }
    }

    return { transaction, order };
  }

  public async purchasePerformerProducts(
    order: OrderModel,
    { paymentGateway, countryCode, currency } : PurchaseProductsPayload
  ) {
    if (paymentGateway === 'astropay') {
      const transaction = await this.paymentTransactionModel.create({
        paymentGateway,
        orderId: order._id,
        source: order.buyerSource,
        sourceId: order.buyerId,
        type: order.type,
        totalPrice: order.totalPrice,
        products: [],
        status: PAYMENT_STATUS.PENDING
      });
      const astroBody : AstropayDepositDto = {
        amount: order.totalPrice,
        currency,
        country: countryCode,
        merchantDepositId: order._id,
        callbackUrl: '',
        user: {
          merchantUserId: order.buyerId.toString()
        },
        product: {
          mcc: '7995',
          merchantCode: '0001',
          description: 'model'
        },
        visualInfo: {
          merchantName: 'Product'
        }
      };
      const astropay = await this.astropayPaymentsService.requestDeposit(astroBody);
      return astropay;
    }
    if (paymentGateway === 'ccbill') {
      const {
        flexformId,
        subAccountNumber,
        salt
      } = await this.getPerformerSinglePaymentGatewaySetting(order.sellerId);
      const currencyCode = await this.settingService.getKeyValue(SETTING_KEYS.CCBILL_CURRENCY_CODE);

      const transaction = await this.paymentTransactionModel.create({
        paymentGateway,
        orderId: order._id,
        source: order.buyerSource,
        sourceId: order.buyerId,
        type: order.type,
        totalPrice: order.totalPrice,
        status: PAYMENT_STATUS.PENDING,
        products: []
      });

      return this.ccbillService.singlePurchase({
        salt,
        flexformId,
        subAccountNumber,
        price: order.totalPrice,
        transactionId: transaction._id,
        currencyCode: currencyCode || '840'
      });
    }
    throw new MissingConfigPaymentException();
  }

  public async purchasePerformerFeed(order: OrderModel, { paymentGateway, currency, countryCode } : PurchaseFeedPayload) {
    if (paymentGateway === 'astropay') {
      const transaction = await this.paymentTransactionModel.create({
        paymentGateway,
        orderId: order._id,
        source: order.buyerSource,
        sourceId: order.buyerId,
        type: PAYMENT_TYPE.FEED,
        totalPrice: order.totalPrice,
        status: PAYMENT_STATUS.PENDING,
        products: []
      });

      await this.paymentTransactionModel.create({
        paymentGateway,
        orderId: order._id,
        source: order.buyerSource,
        sourceId: order.buyerId,
        type: order.type,
        totalPrice: order.totalPrice,
        status: PAYMENT_STATUS.PENDING
      });
      const astroBody : AstropayDepositDto = {
        amount: order.totalPrice,
        currency,
        country: countryCode,
        merchantDepositId: order._id,
        callbackUrl: '',
        user: {
          merchantUserId: order.buyerId.toString()
        },
        product: {
          mcc: '7995',
          merchantCode: '0001',
          description: 'model'
        },
        visualInfo: {
          merchantName: 'Feed'
        }
      };
      const astropay = await this.astropayPaymentsService.requestDeposit(astroBody);
      return astropay;
    }
    if (paymentGateway === 'ccbill') {
      const {
        flexformId,
        subAccountNumber,
        salt
      } = await this.getPerformerSinglePaymentGatewaySetting(order.sellerId);

      const transaction = await this.paymentTransactionModel.create({
        paymentGateway,
        orderId: order._id,
        source: order.buyerSource,
        sourceId: order.buyerId,
        type: PAYMENT_TYPE.FEED,
        totalPrice: order.totalPrice,
        status: PAYMENT_STATUS.PENDING,
        products: []
      });
      return this.ccbillService.singlePurchase({
        salt,
        flexformId,
        subAccountNumber,
        price: order.totalPrice,
        transactionId: transaction._id
      });
    }
    throw new MissingConfigPaymentException();
  }

  public async purchasePerformerVOD(
    order: OrderModel,
    {
      paymentGateway, performerId, countryCode, currency
    } : PurchaseVideoPayload
  ) {
    const performer = await this.performerService.findById(performerId);
    if (paymentGateway === 'astropay') {
      await this.paymentTransactionModel.create({
        paymentGateway,
        orderId: order._id,
        source: order.buyerSource,
        sourceId: order.buyerId,
        type: order.type,
        totalPrice: order.totalPrice,
        products: [],
        status: PAYMENT_STATUS.PENDING
      });
      const astroBody : AstropayDepositDto = {
        amount: order.totalPrice,
        currency,
        country: countryCode,
        merchantDepositId: order._id,
        callbackUrl: '',
        user: {
          merchantUserId: order.buyerId.toString()
        },
        product: {
          mcc: '7995',
          merchantCode: '0001',
          description: 'model'
        },
        visualInfo: {
          merchantName: performer.name
        }
      };
      const astropay = await this.astropayPaymentsService.requestDeposit(astroBody);
      return astropay;
    }
    if (paymentGateway === 'ccbill') {
      const {
        flexformId,
        subAccountNumber,
        salt
      } = await this.getPerformerSinglePaymentGatewaySetting(order.sellerId);
      const currencyCode = await this.settingService.getKeyValue(SETTING_KEYS.CCBILL_CURRENCY_CODE);

      const transaction = await this.paymentTransactionModel.create({
        paymentGateway,
        orderId: order._id,
        source: order.buyerSource,
        sourceId: order.buyerId,
        type: order.type,
        totalPrice: order.totalPrice,
        status: PAYMENT_STATUS.PENDING,
        products: []
      });

      return this.ccbillService.singlePurchase({
        salt,
        flexformId,
        subAccountNumber,
        price: order.totalPrice,
        transactionId: transaction._id,
        currencyCode: currencyCode || '840'
      });
    }
    throw new MissingConfigPaymentException();
  }

  public async purchaseWalletPackage(order: OrderModel, { paymentGateway, currency, countryCode } : PurchaseTokenPayload | PurchaseTokenCustomAmountPayload) {
    if (paymentGateway === 'astropay') {
      const transaction = await this.paymentTransactionModel.create({
        paymentGateway,
        orderId: order._id,
        source: order.buyerSource,
        sourceId: order.buyerId,
        type: order.type,
        totalPrice: order.totalPrice,
        products: [],
        status: PAYMENT_STATUS.PENDING
      });
      const astroBody : AstropayDepositDto = {
        amount: order.totalPrice,
        currency,
        country: countryCode,
        merchantDepositId: order._id,
        callbackUrl: '',
        user: {
          merchantUserId: order.buyerId.toString()
        },
        product: {
          mcc: '7995',
          merchantCode: '0001',
          description: 'model'
        },
        visualInfo: {
          merchantName: 'Wallet'
        }
      };
      const astropay = await this.astropayPaymentsService.requestDeposit(astroBody);
      return astropay;
    }
    if (paymentGateway === 'ccbill') {
      const [
        flexformId,
        subAccountNumber,
        salt,
        currencyCode
      ] = await Promise.all([
        this.settingService.getKeyValue(SETTING_KEYS.CCBILL_FLEXFORM_ID),
        this.settingService.getKeyValue(SETTING_KEYS.CCBILL_SUB_ACCOUNT_NUMBER),
        this.settingService.getKeyValue(SETTING_KEYS.CCBILL_SALT),
        this.settingService.getKeyValue(SETTING_KEYS.CCBILL_CURRENCY_CODE)
      ]);
      /* if (!flexformId || !subAccountNumber || !salt) {
        throw new MissingConfigPaymentException();
      } */

      const transaction = await this.paymentTransactionModel.create({
        paymentGateway,
        orderId: order._id,
        source: order.buyerSource,
        sourceId: order.buyerId,
        type: order.type,
        totalPrice: order.totalPrice,
        status: PAYMENT_STATUS.PENDING,
        products: []
      });

      return this.ccbillService.singlePurchase({
        salt,
        flexformId,
        subAccountNumber,
        price: order.totalPrice,
        transactionId: transaction._id,
        currencyCode: currencyCode || '840'
      });
    }
    throw new MissingConfigPaymentException();
  }

  public async ccbillSinglePaymentSuccessWebhook(payload: Record<string, any>) {
    const transactionId = payload['X-transactionId'] || payload.transactionId;
    if (!transactionId) {
      throw new BadRequestException();
    }
    const checkForHexRegExp = new RegExp('^[0-9a-fA-F]{24}$');
    if (!checkForHexRegExp.test(transactionId)) {
      return { ok: false };
    }
    const transaction = await this.paymentTransactionModel.findById(
      transactionId
    );
    if (!transaction || transaction.status !== PAYMENT_STATUS.PENDING) {
      return { ok: false };
    }
    transaction.status = PAYMENT_STATUS.SUCCESS;
    transaction.paymentResponseInfo = payload;
    transaction.updatedAt = new Date();
    await transaction.save();
    await this.queueEventService.publish(
      new QueueEvent({
        channel: TRANSACTION_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: transaction
      })
    );
    return { ok: true };
  }

  public async ccbillRenewalSuccessWebhook(payload: any) {
    const subscriptionId = payload.subscriptionId || payload.subscription_id;
    if (!subscriptionId) {
      throw new BadRequestException();
    }

    const subscription = await this.subscriptionService.findBySubscriptionId(
      subscriptionId
    );
    if (!subscription) {
      // TODO - should check in case admin delete subscription??
      // TODO - log me
      return { ok: false };
    }

    // create user order and transaction for this order
    const price = payload.billedAmount || payload.accountingAmount;
    const { userId, performerId } = subscription;
    const order = await this.orderService.createForPerformerSubscriptionRenewal(
      {
        userId,
        performerId,
        price,
        type: subscription.subscriptionType
      }
    );

    const transaction = await this.paymentTransactionModel.create({
      paymentGateway: 'ccbill',
      orderId: order._id,
      source: order.buyerSource,
      sourceId: order.buyerId,
      type: order.type,
      totalPrice: order.totalPrice,
      status: PAYMENT_STATUS.SUCCESS,
      paymentResponseInfo: payload,
      products: []
    });

    await this.queueEventService.publish(
      new QueueEvent({
        channel: TRANSACTION_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: transaction
      })
    );
    return { ok: true };
  }

  public async verotelSuccessWebhook(payload: any) {
    const isValid = await this.verotelService.isValidSignatureFromQuery(payload);
    if (!isValid) throw new Error('Invalid signature');
    // TODO - in order we have to recalculate signature
    const transaction = await this.paymentTransactionModel.findOne({
      _id: payload.referenceID
    });
    if (!transaction) throw new Error('Transaction not found!');
    // single payment success or first time for recurring request
    if (['purchase'].includes(payload.type) || (payload.subscriptionType === 'recurring' && payload.event === 'initial')) {
      if (transaction.status !== PAYMENT_STATUS.PENDING) throw new Error('Invalid transaction status');

      transaction.status = PAYMENT_STATUS.SUCCESS;
      transaction.paymentResponseInfo = payload;
      transaction.updatedAt = new Date();
      await transaction.save();
      await this.queueEventService.publish(
        new QueueEvent({
          channel: TRANSACTION_SUCCESS_CHANNEL,
          eventName: EVENT.CREATED,
          data: transaction
        })
      );
      return true;
    }

    if (payload.type === 'rebill') {
      // https://webhook.site/590a0cb6-5c4b-4973-b0c5-9b961af514b1?amount=12.31&currency=EUR&custom1=user&custom2=model&custom3=type&event=rebill&nextChargeOn=2021-07-11&paymentMethod=CC&referenceID=asdadad&saleID=456789&shopID=122468&subscriptionPhase=normal&subscriptionType=recurring&type=subscription&signature=1b5b8406f4f7a8067d198fad70c49ba377b09361
      const subscription = await this.subscriptionService.findBySubscriptionId(payload.referenceID);
      if (!subscription) {
        // TODO - check if need to create subscription from custom field in this case
        return false;
      }

      // create user order and transaction for this order
      const price = payload.amount;
      const { userId, performerId } = subscription;
      const order = await this.orderService.createForPerformerSubscriptionRenewal({
        userId,
        performerId,
        price,
        type: subscription.subscriptionType
      });

      const newTransaction = await this.paymentTransactionModel.create({
        paymentGateway: 'verotel',
        orderId: order._id,
        source: order.buyerSource,
        sourceId: order.buyerId,
        type: order.type,
        totalPrice: order.totalPrice,
        status: PAYMENT_STATUS.SUCCESS,
        paymentResponseInfo: payload,
        products: []
      });

      await this.queueEventService.publish(
        new QueueEvent({
          channel: TRANSACTION_SUCCESS_CHANNEL,
          eventName: EVENT.CREATED,
          data: newTransaction
        })
      );
    }

    return true;
  }

  public async purchasePerformerSinglePhoto(
    order: OrderModel,
    { paymentGateway, currency, countryCode } : PurchaseSinglePhotoPayload
  ) {
    if (paymentGateway === 'astropay') {
      await this.paymentTransactionModel.create({
        paymentGateway,
        orderId: order._id,
        source: order.buyerSource,
        sourceId: order.buyerId,
        type: order.type,
        totalPrice: order.totalPrice,
        products: [],
        status: PAYMENT_STATUS.PENDING
      });
      const astroBody : AstropayDepositDto = {
        amount: order.totalPrice,
        currency,
        country: countryCode,
        merchantDepositId: order._id,
        callbackUrl: '',
        user: {
          merchantUserId: order.buyerId.toString()
        },
        product: {
          mcc: '7995',
          merchantCode: '0001',
          description: 'model'
        },
        visualInfo: {
          merchantName: 'Photo'
        }
      };
      const astropay = await this.astropayPaymentsService.requestDeposit(astroBody);
      return astropay;
    }
    if (paymentGateway === 'ccbill') {
      const {
        flexformId,
        subAccountNumber,
        salt
      } = await this.getPerformerSinglePaymentGatewaySetting(order.sellerId);

      const transaction = await this.paymentTransactionModel.create({
        paymentGateway,
        orderId: order._id,
        source: order.buyerSource,
        sourceId: order.buyerId,
        type: order.type,
        totalPrice: order.totalPrice,
        status: PAYMENT_STATUS.PENDING,
        products: []
      });

      return this.ccbillService.singlePurchase({
        salt,
        flexformId,
        subAccountNumber,
        price: order.totalPrice,
        transactionId: transaction._id
      });
    }
    throw new MissingConfigPaymentException();
  }
}

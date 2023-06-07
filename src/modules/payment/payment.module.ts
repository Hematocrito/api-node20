import { MongoDBModule, QueueModule } from 'src/kernel';
import {
  Module, forwardRef, NestModule, MiddlewareConsumer, HttpModule
} from '@nestjs/common';
import { CouponModule } from 'src/modules/coupon/coupon.module';
import { RequestLoggerMiddleware } from 'src/kernel/logger/request-log.middleware';
import { WalletPackageModule } from 'src/modules/wallet-packages/wallet-package.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { PerformerModule } from '../performer/performer.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { PerformerAssetsModule } from '../performer-assets/performer-assets.module';
import { paymentProviders, orderProviders } from './providers';
import { SettingModule } from '../settings/setting.module';
import { MailerModule } from '../mailer/mailer.module';
import { MessageModule } from '../message/message.module';
import {
  CCBillService,
  PaymentService,
  PaymentWalletService,
  CheckPaymentService,
  OrderService
} from './services';
import {
  PaymentController,
  OrderController,
  PaymentWebhookController,
  PaymentWalletController,
  AdminOrderController
} from './controllers';
import { OrderListener } from './listeners';
import { VerotelService } from './services/verotel.service';
import { AstropayPaymentsController } from './controllers/astropay-payments.controller';
import { AstropayPaymentsService } from './services/astropay-payments.service';
import { FeedModule } from '../feed/feed.module';

@Module({
  imports: [
  MongoDBModule,
  QueueModule.forRoot(),
  HttpModule.register({
    timeout: 10000,
    maxRedirects: 5
    }),
// inject user module because we request guard from auth, need to check and fix dependencies if not needed later
  forwardRef(() => UserModule),
  forwardRef(() => AuthModule),
  forwardRef(() => PerformerModule),
  forwardRef(() => SettingModule),
  forwardRef(() => SubscriptionModule),
  forwardRef(() => PerformerAssetsModule),
  forwardRef(() => CouponModule),
  forwardRef(() => MailerModule),
  forwardRef(() => WalletPackageModule),
  forwardRef(() => MessageModule),
  forwardRef(() => FeedModule)
  ],
  providers: [
  ...paymentProviders,
  ...orderProviders,
  PaymentService,
  PaymentWalletService,
  CCBillService,
  CheckPaymentService,
  OrderService,
  OrderListener,
  VerotelService,
  AstropayPaymentsService
  ],
  controllers: [
  PaymentController,
  PaymentWalletController,
  OrderController,
  PaymentWebhookController,
  AdminOrderController,
  AstropayPaymentsController
  ],
  exports: [
  ...paymentProviders,
  ...orderProviders,
  PaymentService,
  CCBillService,
  CheckPaymentService,
  OrderService
  ]
  })
export class PaymentModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggerMiddleware)
      .forRoutes('/payment/*/callhook');
  }
}

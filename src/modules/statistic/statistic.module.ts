import { Module, HttpModule, forwardRef } from '@nestjs/common';
import {
  StatisticService
} from './services';
import {
  StatisticController
} from './controllers';
import { AuthModule } from '../auth/auth.module';
import { PerformerAssetsModule } from '../performer-assets/performer-assets.module';
import { PerformerModule } from '../performer/performer.module';
import { UserModule } from '../user/user.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { PaymentModule } from '../payment/payment.module';
import { EarningModule } from '../earning/earning.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5
    }),
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => PerformerAssetsModule),
    forwardRef(() => SubscriptionModule),
    forwardRef(() => PaymentModule),
    forwardRef(() => EarningModule)
  ],
  providers: [StatisticService],
  controllers: [StatisticController],
  exports: [StatisticService]
})
export class StatisticModule {}

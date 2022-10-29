import { Module, forwardRef } from '@nestjs/common';
import { MongoDBModule } from 'src/kernel';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { PerformerModule } from '../performer/performer.module';
import { PaymentModule } from '../payment/payment.module';
import { SettingModule } from '../settings/setting.module';
import { EarningController } from './controllers/earning.controller';
import { EarningService } from './services/earning.service';
import { earningProviders } from './providers/earning.provider';
import { TransactionEarningListener } from './listeners/earning.listener';
import { EarningPaymentWalletListener } from './listeners/earning-payment-wallet.listener';
import { SocketModule } from '../socket/socket.module';
import { MessageModule } from '../message/message.module';
import { AdminEarningController } from './controllers/admin-earning.controller';

@Module({
  imports: [
    MongoDBModule,
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => PaymentModule),
    forwardRef(() => SettingModule),
    forwardRef(() => SocketModule),
    forwardRef(() => MessageModule)
  ],
  providers: [
    ...earningProviders,
    EarningService,
    TransactionEarningListener,
    EarningPaymentWalletListener
  ],
  controllers: [
    EarningController,
    AdminEarningController
  ],
  exports: [...earningProviders, EarningService, TransactionEarningListener]
})
export class EarningModule {}

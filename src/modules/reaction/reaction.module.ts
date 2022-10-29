import { Module, forwardRef } from '@nestjs/common';
import { MongoDBModule, QueueModule } from 'src/kernel';
import { ReactionController } from './controllers/reaction.controller';
import { ReactionService } from './services/reaction.service';
import { reactionProviders } from './providers/reaction.provider';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { PerformerModule } from '../performer/performer.module';
import { PerformerAssetsModule } from '../performer-assets/performer-assets.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { PaymentModule } from '../payment/payment.module';
import { FileModule } from '../file/file.module';

@Module({
  imports: [
    QueueModule.forRoot(),
    MongoDBModule,
    FileModule,
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => PerformerAssetsModule),
    forwardRef(() => SubscriptionModule),
    forwardRef(() => PaymentModule)
  ],
  providers: [...reactionProviders, ReactionService],
  controllers: [ReactionController],
  exports: [ReactionService]
})
export class ReactionModule {}

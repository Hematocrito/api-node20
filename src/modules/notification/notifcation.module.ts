import { forwardRef, Module } from '@nestjs/common';
import { Connection } from 'mongoose';
import { MongoDBModule, MONGO_DB_PROVIDER, QueueModule } from 'src/kernel';
import { AuthModule } from '../auth/auth.module';
import { PerformerAssetsModule } from '../performer-assets/performer-assets.module';
import { PerformerModule } from '../performer/performer.module';
import { SocketModule } from '../socket/socket.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { UserModule } from '../user/user.module';
import { NotificationSearchController } from './controllers';
import { NotificationController } from './controllers/notification.controller';
import { NotificationListener, ReactionNotificationListener } from './listeners';
import { PublicStreamNotificationListener } from './listeners/public-stream-notification.listener';
import { VideoNotificationListener } from './listeners/video-create-notification.listener';
import { NOTIFICATION_MODEL_PROVIDER } from './notification.constant';
import { NotificationSchema } from './schemas';
import { NotificationService, NotificationSearchService } from './services';

@Module({
  imports: [
  AuthModule,
  MongoDBModule,
  QueueModule.forRoot(),
  SocketModule,
  forwardRef(() => UserModule),
  forwardRef(() => SubscriptionModule),
  forwardRef(() => PerformerModule),
  forwardRef(() => PerformerAssetsModule)
  ],
  providers: [
  {
  inject: [MONGO_DB_PROVIDER],
  useFactory: (connection: Connection) => connection.model('Notitcation', NotificationSchema),
  provide: NOTIFICATION_MODEL_PROVIDER
  },
  NotificationService,
  NotificationSearchService,
  NotificationListener,
  ReactionNotificationListener,
  VideoNotificationListener,
  PublicStreamNotificationListener
  ],
  controllers: [NotificationSearchController, NotificationController],
  exports: [NotificationService]
  })
export class NotifcationModule {}

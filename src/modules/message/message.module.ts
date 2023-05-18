import { Module, forwardRef } from '@nestjs/common';
import { MongoDBModule, QueueModule } from 'src/kernel';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { FileModule } from '../file/file.module';
import { PerformerModule } from '../performer/performer.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { conversationProviders, messageProviders, notificationMessageProviders } from './providers';
import { SocketModule } from '../socket/socket.module';
import { MessageListener } from './listeners';
import { ConversationService, MessageService, NotificationMessageService } from './services';
import { ConversationController } from './controllers/conversation.controller';
import { MessageController } from './controllers/message.controller';
import { BlockModule } from '../block/block.module';
import { UtilsModule } from '../utils/utils.module';

@Module({
  imports: [
  MongoDBModule,
  QueueModule.forRoot(),
  SocketModule,
  forwardRef(() => UserModule),
  forwardRef(() => PerformerModule),
  forwardRef(() => AuthModule),
  forwardRef(() => FileModule),
  forwardRef(() => SubscriptionModule),
  forwardRef(() => BlockModule),
  forwardRef(() => UtilsModule)
  ],
  providers: [
  ...messageProviders,
  ...conversationProviders,
  ...notificationMessageProviders,
  ConversationService,
  MessageService,
  NotificationMessageService,
  MessageListener
  ],
  controllers: [ConversationController, MessageController],
  exports: [ConversationService, MessageService]
  })
export class MessageModule { }

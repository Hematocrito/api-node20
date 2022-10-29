import { Module, forwardRef } from '@nestjs/common';
import { MongoDBModule, AgendaModule } from 'src/kernel';
import { UtilsModule } from 'src/modules/utils/utils.module';
import { RedisModule } from 'nestjs-redis';
import { ConfigService } from 'nestjs-config';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { performerProviders } from './providers';
import {
  PerformerService,
  PerformerSearchService,
  PerformerBankingService
} from './services';
import {
  AdminPerformerController,
  PerformerController
} from './controllers';
import { UserModule } from '../user/user.module';
import { FileModule } from '../file/file.module';
import { PerformerAssetsModule } from '../performer-assets/performer-assets.module';
import {
  PerformerAssetsListener, PerformerConnectedListener, UpdatePerformerStatusListener
} from './listeners';
import { MailerModule } from '../mailer/mailer.module';
import { BlockModule } from '../block/block.module';
import { PerformerCacheService } from './services/performer-cache.service';
import { SettingModule } from '../settings/setting.module';
import { rankingPerformerProviders } from './providers/ranking-performer.provider';
import { RankingPerformerService } from './services/ranking-performer.service';
import { AdminRankingPerformerController } from './controllers/admin-ranking-performer.controller';
import { RankingPerformerController } from './controllers/ranking-performer.controller';
import { SocketModule } from '../socket/socket.module';

@Module({
  imports: [
    MongoDBModule,
    AgendaModule.register(),
    // https://github.com/kyknow/nestjs-redis
    RedisModule.forRootAsync({
      // TODO - load config for redis socket
      useFactory: (configService: ConfigService) => configService.get('redis'),
      // useFactory: async (configService: ConfigService) => configService.get('redis'),
      inject: [ConfigService]
    }),
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
    forwardRef(() => FileModule),
    forwardRef(() => SubscriptionModule),
    forwardRef(() => PerformerAssetsModule),
    forwardRef(() => UtilsModule),
    forwardRef(() => MailerModule),
    forwardRef(() => BlockModule),
    forwardRef(() => SettingModule),
    forwardRef(() => SocketModule)
  ],
  providers: [
    ...performerProviders,
    ...rankingPerformerProviders,
    PerformerService,
    PerformerSearchService,
    PerformerBankingService,
    PerformerAssetsListener,
    PerformerConnectedListener,
    UpdatePerformerStatusListener,
    PerformerCacheService,
    RankingPerformerService
  ],
  controllers: [
    AdminPerformerController,
    PerformerController,
    AdminRankingPerformerController,
    RankingPerformerController
  ],
  exports: [
    ...performerProviders,
    PerformerService,
    PerformerSearchService,
    PerformerCacheService
  ]
})
export class PerformerModule {}

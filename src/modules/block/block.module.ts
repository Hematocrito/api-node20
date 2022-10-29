import { Module, forwardRef } from '@nestjs/common';
import { MongoDBModule, AgendaModule } from 'src/kernel';
import { AuthModule } from '../auth/auth.module';
import { blockProviders } from './providers';
import { PerformerBlockService, SiteBlockCountryService } from './services';
import {
  PerformerBlockController, SiteBlockCountryController
} from './controllers';
import { UserModule } from '../user/user.module';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [
    MongoDBModule,
    AgendaModule.register(),
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
    forwardRef(() => MailerModule)
  ],
  providers: [
    ...blockProviders,
    PerformerBlockService,
    SiteBlockCountryService
  ],
  controllers: [
    PerformerBlockController,
    SiteBlockCountryController
  ],
  exports: [
    ...blockProviders,
    PerformerBlockService,
    SiteBlockCountryService
  ]
})

export class BlockModule {}

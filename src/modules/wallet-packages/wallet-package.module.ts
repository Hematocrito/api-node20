import { forwardRef, Module } from '@nestjs/common';
import { MongoDBModule } from 'src/kernel';
import { AuthModule } from '../auth/auth.module';
import { AdminWalletPackageController, WalletPackageSearchController } from './controllers';
import { walletPackageProviders } from './providers';
import { WalletPackageSearchService } from './services/wallet-package-search.service';
import { WalletPackageService } from './services/wallet-package.service';

@Module({
  controllers: [AdminWalletPackageController, WalletPackageSearchController],
  exports: [WalletPackageService],
  imports: [MongoDBModule, forwardRef(() => AuthModule)],
  providers: [...walletPackageProviders, WalletPackageSearchService, WalletPackageService]
})
export class WalletPackageModule {}

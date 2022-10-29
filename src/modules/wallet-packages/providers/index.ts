import { Connection } from 'mongoose';
import { MONGO_DB_PROVIDER } from 'src/kernel';
import { walletPackageSchema } from '../schemas';

export const TOKEN_PACKAGE_PROVIDER = 'TOKEN_PACKAGE_PROVIDER';

export const walletPackageProviders = [
  {
    provide: TOKEN_PACKAGE_PROVIDER,
    useFactory: (connection: Connection) => connection.model('WalletPackage', walletPackageSchema),
    inject: [MONGO_DB_PROVIDER]
  }
];

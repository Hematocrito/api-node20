import { Connection } from 'mongoose';
import { MONGO_DB_PROVIDER } from 'src/kernel';
import {
  CategorySchema
} from '../schemas';

export const CATEGORY_PROVIDER = 'CATEGORY_PROVIDER';

export const categoryProviders = [
  {
    provide: CATEGORY_PROVIDER,
    useFactory: (connection: Connection) => connection.model('AssetCategory', CategorySchema),
    inject: [MONGO_DB_PROVIDER]
  }
];

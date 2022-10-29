import { Connection } from 'mongoose';
import { MONGO_DB_PROVIDER } from 'src/kernel';
import { PostSchema } from '../schemas';

export const POST_MODEL_PROVIDER = 'POST_MODEL';

export const postProviders = [
  {
    provide: POST_MODEL_PROVIDER,
    useFactory: (connection: Connection) => connection.model('Post', PostSchema),
    inject: [MONGO_DB_PROVIDER]
  }
];

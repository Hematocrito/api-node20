import { Connection } from 'mongoose';
import { MONGO_DB_PROVIDER } from 'src/kernel';
import { MessageSchema } from '../schemas';

export const MESSAGE_MODEL_PROVIDER = 'MESSAGE_MODEL_PROVIDER';
export const USER_MESSAGE_MODEL_PROVIDER = 'USER_MESSAGE_MODEL_PROVIDER';
export const PERFORMER_MESSAGE_MODEL_PROVIDER = 'PERFORMER_MESSAGE_MODEL_PROVIDER';

export const messageProviders = [
  {
    provide: MESSAGE_MODEL_PROVIDER,
    useFactory: (connection: Connection) => connection.model('Message', MessageSchema),
    inject: [MONGO_DB_PROVIDER]
  },
  {
    provide: USER_MESSAGE_MODEL_PROVIDER,
    useFactory: (connection: Connection) => connection.model('Message', MessageSchema),
    inject: [MONGO_DB_PROVIDER]
  },
  {
    provide: PERFORMER_MESSAGE_MODEL_PROVIDER,
    useFactory: (connection: Connection) => connection.model('Message', MessageSchema),
    inject: [MONGO_DB_PROVIDER]
  }
];

import { Connection } from 'mongoose';
import { MONGO_DB_PROVIDER } from 'src/kernel';
import { ConversationSchema, ConversationSchemaPerformers, ConversationSchemaUsers } from '../schemas';

export const CONVERSATION_MODEL_PROVIDER = 'CONVERSATION_MODEL_PROVIDER';
export const CONVERSATION_USERS_MODEL_PROVIDER = 'CONVERSATION_USERS_MODEL_PROVIDER';
export const CONVERSATION_PERFORMERS_MODEL_PROVIDER = 'CONVERSATION_PERFORMERS_MODEL_PROVIDER';

export const conversationProviders = [
  {
    provide: CONVERSATION_MODEL_PROVIDER,
    useFactory: (connection: Connection) => connection.model('Conversation', ConversationSchema),
    inject: [MONGO_DB_PROVIDER]
  },
  {
    provide: CONVERSATION_USERS_MODEL_PROVIDER,
    useFactory: (connection: Connection) => connection.model('ConversationUsers', ConversationSchemaUsers),
    inject: [MONGO_DB_PROVIDER]
  },
  {
    provide: CONVERSATION_PERFORMERS_MODEL_PROVIDER,
    useFactory: (connection: Connection) => connection.model('ConversationPerformers', ConversationSchemaPerformers),
    inject: [MONGO_DB_PROVIDER]
  }
];

import { Connection } from 'mongoose';
import { MONGO_DB_PROVIDER } from 'src/kernel';
import {
  RankingPerformerSchema
} from '../schemas';

export const RANKING_PERFORMER_MODEL_PROVIDER = 'RANKING_PERFORMER_MODEL_PROVIDER';

export const rankingPerformerProviders = [
  {
    provide: RANKING_PERFORMER_MODEL_PROVIDER,
    useFactory: (connection: Connection) => connection.model('RankingPerformer', RankingPerformerSchema),
    inject: [MONGO_DB_PROVIDER]
  }
];

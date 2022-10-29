import { Connection } from 'mongoose';
import { MONGO_DB_PROVIDER } from 'src/kernel';
import { ReportSchema } from '../schemas/report.schema';

export const REPORT_MODEL_PROVIDER = 'REPORT_MODEL_PROVIDER';

export const reportProviders = [
  {
    provide: REPORT_MODEL_PROVIDER,
    useFactory: (connection: Connection) => connection.model('Reports', ReportSchema),
    inject: [MONGO_DB_PROVIDER]
  }
];

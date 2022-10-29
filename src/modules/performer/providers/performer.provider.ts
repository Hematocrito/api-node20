import { Connection } from 'mongoose';
import { MONGO_DB_PROVIDER } from 'src/kernel';
import {
  PerformerSchema,
  CommissionSettingSchema,
  BankingSettingSchema
} from '../schemas';
import { PaymentGatewaySettingSchema } from '../schemas/payment-gateway-setting.schema';

export const PERFORMER_MODEL_PROVIDER = 'PERFORMER_MODEL';
export const PERFORMER_PAYMENT_GATEWAY_SETTING_MODEL_PROVIDER = 'PERFORMER_PAYMENT_GATEWAY_SETTING_MODEL_PROVIDER';
export const PERFORMER_COMMISSION_SETTING_MODEL_PROVIDER = 'PERFORMER_COMMISSION_SETTING_MODEL_PROVIDER';
export const PERFORMER_BANKING_SETTING_MODEL_PROVIDER = 'PERFORMER_BANKING_SETTING_MODEL_PROVIDER';

export const performerProviders = [
  {
    provide: PERFORMER_MODEL_PROVIDER,
    useFactory: (connection: Connection) => connection.model('Performer', PerformerSchema),
    inject: [MONGO_DB_PROVIDER]
  },
  {
    provide: PERFORMER_PAYMENT_GATEWAY_SETTING_MODEL_PROVIDER,
    useFactory: (connection: Connection) => connection.model(
      'PerformerPaymentGatewaySetting',
      PaymentGatewaySettingSchema
    ),
    inject: [MONGO_DB_PROVIDER]
  },
  {
    provide: PERFORMER_COMMISSION_SETTING_MODEL_PROVIDER,
    useFactory: (connection: Connection) => connection.model('PerformerCommissionSetting', CommissionSettingSchema),
    inject: [MONGO_DB_PROVIDER]
  },
  {
    provide: PERFORMER_BANKING_SETTING_MODEL_PROVIDER,
    useFactory: (connection: Connection) => connection.model('PerformerBankingSetting', BankingSettingSchema),
    inject: [MONGO_DB_PROVIDER]
  }
];

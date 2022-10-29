import {
  IsString,
  IsNotEmpty,
  ValidateNested,
  IsOptional
} from 'class-validator';

export class CCBillPaymentGateway {
  @IsNotEmpty()
  subscriptionSubAccountNumber: string;

  @IsNotEmpty()
  singlePurchaseSubAccountNumber: string;

  @IsNotEmpty()
  flexformId: string;

  @IsOptional()
  salt?: string;
}

export class PaymentGatewaySettingPayload {
  @IsString()
  performerId: string;

  @IsString()
  key = 'ccbill';

  @IsString()
  status = 'active';

  @IsNotEmpty()
  @ValidateNested()
  value: CCBillPaymentGateway;
}

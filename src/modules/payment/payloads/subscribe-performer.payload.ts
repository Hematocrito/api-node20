import {
  IsNotEmpty, IsIn, IsOptional, IsString
} from 'class-validator';

export class SubscribePerformerPayload {
  @IsNotEmpty()
  performerId: string;

  @IsNotEmpty()
  @IsIn(['monthly', 'yearly'])
  type: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['ccbill', 'astropay'])
  paymentGateway: string;

  @IsNotEmpty()
  @IsString()
  countryCode: string;

  @IsNotEmpty()
  @IsString()
  currency: string;
}

import {
  IsISIN, IsIn, IsNotEmpty, IsOptional, IsString
} from 'class-validator';

export class PurchaseVideoPayload {
  @IsOptional()
  @IsString()
  couponCode: string;

  @IsNotEmpty()
  @IsString()
  videoId: string;

  @IsNotEmpty()
  performerId: string;

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

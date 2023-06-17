import {
  IsIn, IsNotEmpty, IsOptional, IsString
} from 'class-validator';

export class PurchaseFeedPayload {
  @IsOptional()
  @IsString()
  couponCode: string;

  @IsOptional()
  @IsString()
  feedId: string;

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

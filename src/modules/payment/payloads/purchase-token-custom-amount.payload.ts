import {
  IsNotEmpty, IsOptional, IsString, Min, Max, IsNumber, IsIn
} from 'class-validator';

export class PurchaseTokenCustomAmountPayload {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

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

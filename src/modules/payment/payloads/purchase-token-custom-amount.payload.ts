import {
  IsNotEmpty, IsOptional, IsString, Min, Max, IsNumber
} from 'class-validator';

export class PurchaseTokenCustomAmountPayload {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsString()
  paymentGateway: string;
}

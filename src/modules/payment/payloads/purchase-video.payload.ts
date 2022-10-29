import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PurchaseVideoPayload {
  @IsOptional()
  @IsString()
  couponCode: string;

  @IsNotEmpty()
  @IsString()
  videoId: string;

  @IsOptional()
  @IsString()
  paymentGateway: string;
}

import { IsOptional, IsString } from 'class-validator';

export class PurchaseFeedPayload {
  @IsOptional()
  @IsString()
  couponCode: string;

  @IsOptional()
  @IsString()
  feedId: string;
}

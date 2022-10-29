import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PurchaseSinglePhotoPayload {
  @IsNotEmpty()
  @IsString()
  photoId: string;

  @IsOptional()
  @IsString()
  paymentGateway: string;
}

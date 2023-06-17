import {
  IsIn, IsNotEmpty, IsOptional, IsString
} from 'class-validator';

export class PurchaseSinglePhotoPayload {
  @IsNotEmpty()
  @IsString()
  photoId: string;

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

import {
  IsNotEmpty, IsOptional, IsString, IsArray, IsIn
} from 'class-validator';

export class PurchaseProductsPayload {
  @IsNotEmpty()
  @IsArray()
  products: [{
    quantity: number;
    _id: string;
  }];

  @IsOptional()
  @IsString()
  couponCode: string;

  @IsOptional()
  @IsString()
  deliveryAddress: string;

  @IsOptional()
  @IsString()
  postalCode: string;

  @IsOptional()
  @IsString()
  phoneNumber: string;

  @IsOptional()
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

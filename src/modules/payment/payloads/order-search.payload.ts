import {
  IsString, IsOptional, IsArray, IsBoolean
} from 'class-validator';
import { SearchRequest } from 'src/kernel/common';
import { ApiProperty } from '@nestjs/swagger';

export class OrderSearchPayload extends SearchRequest {
  @ApiProperty()
  @IsString()
  @IsOptional()
  userId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  buyerId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  sellerId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  deliveryStatus: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  paymentStatus: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  paymentGateway: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  status: string;

  @ApiProperty()
  @IsOptional()
  fromDate: Date;

  @ApiProperty()
  @IsOptional()
  toDate: Date;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productTypes: string[];

  @IsOptional()
  @IsString()
  productType: string;

  @IsOptional()
  @IsBoolean()
  withoutWallet: boolean;

  @IsOptional()
  @IsString()
  includingCreated: string;
}

export class OrderUpdatePayload {
  @ApiProperty()
  @IsString()
  @IsOptional()
  deliveryStatus: string;

  @ApiProperty()
  @IsOptional()
  shippingCode: string;
}

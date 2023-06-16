import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUrl
} from 'class-validator';

export class UserPayload {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    merchantUserId: string;
}

export class ProductPayload {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    mcc: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    merchantCode: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    category: string;
}

export class VisualInfoPayload {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    merchantName: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    merchantLogo: string;
}

export class AstropayDepositPayload {
    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    amount: number;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    currency: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    country: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    merchantDepositId: string;

    @ApiProperty()
    @IsUrl()
    @IsNotEmpty()
    callbackUrl: string;

    @ApiProperty()
    @IsObject()
    @IsNotEmpty()
    user: UserPayload;

    @ApiProperty()
    @IsObject()
    @IsNotEmpty()
    product: ProductPayload;

    @ApiProperty()
    @IsObject()
    @IsNotEmpty()
    visualInfo: VisualInfoPayload;
}

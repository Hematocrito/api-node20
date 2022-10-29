import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty, IsNumber, IsOptional, IsString
} from 'class-validator';
import { WalletPackageStatus } from '../contants';

export class WalletPackageUpdatePayload {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  desscription: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  ordering: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  token: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsIn([WalletPackageStatus.Active, WalletPackageStatus.Inactive])
  status: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  url: string
}

import {
  IsString,
  IsOptional,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsBoolean
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GalleryCreatePayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  price: number;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isSale: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  performerId: string;
}

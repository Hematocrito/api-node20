import {
  IsString,
  IsOptional,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsBoolean
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GalleryUpdatePayload {
  @ApiProperty()
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
}

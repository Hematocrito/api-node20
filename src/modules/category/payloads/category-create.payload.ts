import {
  IsString,
  IsOptional,
  IsIn,
  IsNumber,
  IsNotEmpty
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CategoryCreatePayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  group: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  slug: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  ordering: number;
}

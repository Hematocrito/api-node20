import {
  IsString,
  IsOptional,
  IsIn,
  IsNumber
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CategoryUpdatePayload {
  @ApiProperty()
  @IsString()
  @IsOptional()
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

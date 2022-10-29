import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsBoolean,
  IsNumber
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MenuUpdatePayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  path: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  section: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  internal: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  parentId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  help: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  ordering: number;

  @ApiProperty()
  @IsBoolean()
  isNewTab: boolean;
}

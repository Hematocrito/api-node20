import { IsString, IsOptional } from 'class-validator';
import { SearchRequest } from 'src/kernel/common';
import { ApiProperty } from '@nestjs/swagger';

export class CategorySearchRequest extends SearchRequest {
  @ApiProperty()
  @IsString()
  @IsOptional()
  status: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  group: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  slug: string;

  @ApiProperty()
  @IsOptional()
  includedIds: string[];
}

import { IsString, IsOptional } from 'class-validator';
import { SearchRequest } from 'src/kernel/common';
import { ApiProperty } from '@nestjs/swagger';

export class ProductSearchRequest extends SearchRequest {
  @ApiProperty()
  @IsString()
  @IsOptional()
  performerId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  status: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  type: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  excludedId: string;

  @ApiProperty()
  @IsOptional()
  includedIds: string[];

  @ApiProperty()
  @IsOptional()
  categoryId: string;
}

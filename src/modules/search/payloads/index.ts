import { IsString, IsOptional } from 'class-validator';
import { SearchRequest } from 'src/kernel/common';
import { ApiProperty } from '@nestjs/swagger';

export class SearchPayload extends SearchRequest {
  @ApiProperty()
  @IsString()
  @IsOptional()
  categoryId: string;

  @ApiProperty()
  @IsOptional()
  categoryIds: string[];
}

import { IsString, IsOptional } from 'class-validator';
import { SearchRequest } from 'src/kernel/common';
import { ApiProperty } from '@nestjs/swagger';

export class PerformerSearchPayload extends SearchRequest {
  @ApiProperty()
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  q: string;

  @ApiProperty()
  @IsOptional()
  performerIds: string[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  gender: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  status: string;

  @IsOptional()
  verifiedEmail: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  country: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  age: string;

  @IsString()
  @IsOptional()
  isStreaming: string | boolean;

  @IsString()
  @IsOptional()
  isOnline: string | boolean;
}

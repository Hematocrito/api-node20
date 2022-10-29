import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { SearchRequest } from 'src/kernel';

export class SearchNotificationPayload extends SearchRequest {
  @ApiProperty()
  @IsOptional()
  @IsString()
  @IsIn(['all', 'read'])
  status: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  type: string;
}

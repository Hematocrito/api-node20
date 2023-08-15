import {
  IsString,
  IsOptional
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PerformerStreamingPayload {
  @ApiProperty()
  @IsString()
  @IsOptional()
  streamingStatus: string;
}

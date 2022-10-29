import {
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsString
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendTipsPayload {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  amount: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  conversationId: string;
}

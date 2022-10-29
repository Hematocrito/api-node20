import { ApiProperty } from '@nestjs/swagger';
import {
  IsString, IsEmail, IsNotEmpty, IsOptional
} from 'class-validator';

export class ForgotPayload {
  @ApiProperty()
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  type: string;
}

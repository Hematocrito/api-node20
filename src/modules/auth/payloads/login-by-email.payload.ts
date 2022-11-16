import {
  IsString, IsEmail, MinLength, IsNotEmpty, IsBoolean, IsOptional
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginByEmailPayload {
  @ApiProperty()
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  remember: boolean;
}

import {
  IsString, MinLength, IsNotEmpty, IsBoolean, IsOptional
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @IsString()
  @MinLength(6, { message: 'Please recheck the password entered' })
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  remember: boolean;
}

import {
  IsString,
  IsEmail,
  MinLength,
  IsNotEmpty,
  Validate,
  IsIn
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Username } from 'src/modules/user/validators/username.validator';
import { GENDERS } from 'src/modules/user/constants';

export class UserRegisterPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

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
  @IsString()
  @Validate(Username)
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsIn(GENDERS)
  gender: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  country: string;
}

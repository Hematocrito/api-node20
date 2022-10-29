import {
  IsString,
  IsOptional,
  Validate,
  IsEmail,
  IsNotEmpty,
  IsIn,
  IsArray,
  MinLength,
  Min,
  IsNumber
} from 'class-validator';
import { Username } from 'src/modules/user/validators/username.validator';
import { GENDERS } from 'src/modules/user/constants';
import { ApiProperty } from '@nestjs/swagger';
import { PERFORMER_STATUSES } from '../constants';

export class PerformerUpdatePayload {
  @ApiProperty()
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  lastName: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Validate(Username)
  @IsOptional()
  username: string;

  @ApiProperty()
  @IsString()
  // @IsNotEmpty()
  @MinLength(6)
  @IsOptional()
  password: string;

  @ApiProperty()
  @IsString()
  @IsIn([PERFORMER_STATUSES.ACTIVE, PERFORMER_STATUSES.INACTIVE])
  @IsOptional()
  status = PERFORMER_STATUSES.ACTIVE;

  @ApiProperty()
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  phone: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  phoneCode: string; // international code prefix

  @ApiProperty()
  @IsString()
  @IsOptional()
  avatarId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  coverId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  idVerificationId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  documentVerificationId: string;

  @ApiProperty()
  @IsString()
  @IsIn(GENDERS)
  @IsOptional()
  gender: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  country: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  city: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  state: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  zipcode: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  address: string;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  languages: string[];

  @ApiProperty()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds: string[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  height: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  weight: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  bio: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  eyes: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  sexualPreference: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @IsOptional()
  monthlyPrice: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @IsOptional()
  yearlyPrice: number;

  @ApiProperty()
  @IsOptional()
  bankingInfomation?: any;
}

export class SelfUpdatePayload {
  @ApiProperty()
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  lastName: string;

  @ApiProperty()
  @IsString()
  // @IsNotEmpty()
  @MinLength(6)
  @IsOptional()
  password: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  phone: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  phoneCode: string; // international code prefix

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsIn(GENDERS)
  gender: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  country: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  city: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  state: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  zipcode: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  address: string;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  languages: string[];

  @ApiProperty()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds: string[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  height: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  weight: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  bio: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  eyes: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  sexualPreference: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @IsOptional()
  monthlyPrice: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @IsOptional()
  yearlyPrice: number;

  @ApiProperty()
  @IsOptional()
  bankingInfomation?: any;

  @ApiProperty()
  @IsOptional()
  activateWelcomeVideo?: boolean;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsOptional()
  privateChatPrice?: boolean;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsOptional()
  groupChatPrice?: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  idVerificationId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  documentVerificationId: string;
}

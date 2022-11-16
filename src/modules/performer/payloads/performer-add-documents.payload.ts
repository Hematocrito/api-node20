import {
  IsString,
  IsOptional,
  Validate,
  IsEmail,
  IsNotEmpty,
  IsIn,
  IsArray,
  MinLength,
  IsNumber,
  Min,
  IsBoolean
} from 'class-validator';
import { Username } from 'src/modules/user/validators/username.validator';
import { GENDERS } from 'src/modules/user/constants';
import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';
import { PERFORMER_STATUSES } from '../constants';

export class PerformerAddDocumentsPayload {
  @ApiProperty()
  @IsString()
  @IsOptional()
  idVerificationId?: ObjectId;

  @ApiProperty()
  @IsString()
  @IsOptional()
  documentVerificationId?: ObjectId;

}
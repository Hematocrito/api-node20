import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsIn
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SearchRequest } from 'src/kernel/common';
import { ObjectId } from 'mongodb';
import { STATUSES } from '../constants';

export class PayoutRequestCreatePayload {
  @ApiProperty()
  @IsNotEmpty()
  fromDate: Date;

  @ApiProperty()
  @IsNotEmpty()
  toDate: Date;

  @ApiProperty()
  @IsString()
  @IsOptional()
  requestNote: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  paymentAccountType: string;
}

export class PayoutRequestPerformerUpdatePayload {
  @ApiProperty()
  @IsString()
  @IsOptional()
  requestNote: string;

  @ApiProperty()
  @IsNotEmpty()
  fromDate: Date;

  @ApiProperty()
  @IsNotEmpty()
  toDate: Date;

  @ApiProperty()
  @IsOptional()
  @IsString()
  paymentAccountType: string;
}

export class PayoutRequestUpdatePayload {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsIn([STATUSES.PENDING, STATUSES.REJECTED, STATUSES.DONE])
  status: string;

  @ApiProperty()
  @IsOptional()
  adminNote: string;
}

export class PayoutRequestSearchPayload extends SearchRequest {
  @ApiProperty()
  @IsOptional()
  @IsString()
  sourceId: ObjectId;

  @ApiProperty()
  @IsOptional()
  @IsString()
  paymentAccountType?: string;

  @ApiProperty()
  @IsOptional()
  fromDate: Date;

  @ApiProperty()
  @IsOptional()
  toDate: Date;

  @ApiProperty()
  @IsOptional()
  @IsString()
  status: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  source: string;
}

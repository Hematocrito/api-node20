import { SearchRequest } from 'src/kernel/common';
import { ObjectId } from 'mongodb';
import {
  IsString,
  IsOptional,
  IsNotEmpty
} from 'class-validator';

export class EarningSearchRequest extends SearchRequest {
  userId?: string | ObjectId;

  performerId?: string | ObjectId;

  transactionId?: string | ObjectId;

  sourceType?: string;

  type?: string;

  payoutStatus?: string;

  fromDate?: string | Date;

  toDate?: Date;

  paidAt?: Date;

  isPaid?: boolean;

  paymentStatus?: string;
}

export class UpdateEarningStatusPayload {
  @IsString()
  @IsOptional()
  performerId: string;

  @IsString()
  @IsNotEmpty()
  fromDate: string | Date;

  @IsString()
  @IsNotEmpty()
  toDate: string | Date;

  @IsString()
  @IsOptional()
  payoutStatus?: string;

  @IsString()
  @IsOptional()
  paymentStatus?: string;
}

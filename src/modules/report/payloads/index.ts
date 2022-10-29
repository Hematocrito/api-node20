import { SearchRequest } from 'src/kernel/common';
import {
  IsString, IsOptional, IsNotEmpty, IsIn
} from 'class-validator';
import { REPORT_TARGET } from '../constants';

export class ReportSearchRequestPayload extends SearchRequest {
  targetId?: string;

  target?: string;

  source?: string;

  sourceId?: string;

  performerId?: string;
}

export class ReportCreatePayload {
  @IsString()
  @IsOptional()
  @IsIn([
    REPORT_TARGET.GALLERY,
    REPORT_TARGET.VIDEO,
    REPORT_TARGET.PERFORMER,
    REPORT_TARGET.PRODUCT
  ])
  target = REPORT_TARGET.VIDEO;

  @IsString()
  @IsNotEmpty()
  targetId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description: string;
}

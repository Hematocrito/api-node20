import {
  Body,
  Controller, HttpCode, HttpStatus, Post, UsePipes, ValidationPipe
} from '@nestjs/common';
import { AstropayPaymentsService } from '../services/astropay-payments.service';
import { AstropayDepositPayload } from '../payloads/astropay.payload';

@Controller('astropay-payments')
export class AstropayPaymentsController {
  constructor(
        private readonly astropayPaymentsService: AstropayPaymentsService
  ) {}

  @Post('/deposit')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true}))
  async requestDeposit(@Body() payload: AstropayDepositPayload) {
    return this.astropayPaymentsService.requestDeposit(payload);
  }

  @Post('/cashoutv1')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true}))
  async requestCashV1() {
    return 'deposit success';
  }

  @Post('/cashoutv2')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true}))
  async requestCashV2() {
    return 'deposit success';
  }
}

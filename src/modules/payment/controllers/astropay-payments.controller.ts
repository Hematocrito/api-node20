import {
  Controller, HttpCode, HttpStatus, Post, UsePipes, ValidationPipe
} from '@nestjs/common';
import { AstropayPaymentsService } from '../services/astropay-payments.service';

@Controller('astropay-payments')
export class AstropayPaymentsController {
  constructor(
        private readonly astropayPaymentsService: AstropayPaymentsService
  ) {}

  @Post('/deposit')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true}))
  async requestDeposit() {
    return this.astropayPaymentsService.requestDeposit();
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

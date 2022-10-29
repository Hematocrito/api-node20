import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Post,
  Body,
  Query,
  Response,
  Get
} from '@nestjs/common';
import { DataResponse } from 'src/kernel';
import { PaymentService } from '../services/payment.service';

@Injectable()
@Controller('payment')
export class PaymentWebhookController {
  constructor(
    private readonly paymentService: PaymentService
  ) {}

  @Post('/ccbill/callhook')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async ccbillCallhook(
    @Body() payload: Record<string, string>,
    @Query() req: Record<string, string>
  ): Promise<DataResponse<any>> {
    // TODO - update for ccbill whitelist here
    if (!['NewSaleSuccess', 'RenewalSuccess'].includes(req.eventType)) {
      return DataResponse.ok(false);
    }

    let info;
    const data = {
      ...payload,
      ...req
    };
    switch (req.eventType) {
      case 'RenewalSuccess':
        info = await this.paymentService.ccbillRenewalSuccessWebhook(data);
        break;
      default:
        info = await this.paymentService.ccbillSinglePaymentSuccessWebhook(
          data
        );
        break;
    }
    return DataResponse.ok(info);
  }

  @Post('/verotel/callhook')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async verotelCallhook(
    @Query() query: Record<string, string>,
    @Response() res: any
  ): Promise<any> {
    await this.paymentService.verotelSuccessWebhook(query);

    res.setHeader('content-type', 'text/plain');
    res.send('OK');
  }

  @Get('/verotel/callhook')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async verotelCallhookGet(
    @Query() query: Record<string, string>,
    @Response() res: any
  ): Promise<any> {
    await this.paymentService.verotelSuccessWebhook(query);

    res.setHeader('content-type', 'text/plain');
    res.send('OK');
  }
}

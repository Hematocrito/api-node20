import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Get,
  Query,
  Param,
  Put,
  Body
} from '@nestjs/common';
import { AuthGuard, RoleGuard } from 'src/modules/auth/guards';
import { DataResponse, PageableData } from 'src/kernel';
import { Roles, CurrentUser } from 'src/modules/auth';
import { OrderService } from '../services';
import { OrderDto } from '../dtos';
import { OrderSearchPayload, OrderUpdatePayload } from '../payloads';
import { PRODUCT_TYPE } from '../constants';

@Injectable()
@Controller('admin/orders')
export class AdminOrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('/details/search')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async ordersDetailsSearch(
    @Query() req: OrderSearchPayload,
    @CurrentUser() user: any
  ): Promise<DataResponse<PageableData<any>>> {
    if (user.isPerformer) req.sellerId = user._id;

    const data = await this.orderService.orderDetailsSearch(req);
    return DataResponse.ok(data);
  }

  /**
   * payment history search
   * @param req
   * @param user
   */
  @Get('/search')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async orders(
    @Query() req: OrderSearchPayload,
    @CurrentUser() user: any
  ): Promise<DataResponse<PageableData<OrderDto>>> {
    if (user.isPerformer) req.sellerId = user._id;

    const data = await this.orderService.search(req);
    return DataResponse.ok(data);
  }

  @Get('/products/search')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async userDetailsProductOrders(
    @Query() req: OrderSearchPayload
  ): Promise<DataResponse<PageableData<OrderDto>>> {
    req.productTypes = [
      PRODUCT_TYPE.DIGITAL_PRODUCT,
      PRODUCT_TYPE.PHYSICAL_PRODUCT
    ];
    const data = await this.orderService.orderDetailsSearch(req) as any;
    return DataResponse.ok(data);
  }

  @Get('/details/use-payment-gateway/search')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async usePaymentGatewayOnly(
    @Query() req: OrderSearchPayload
  ): Promise<DataResponse<PageableData<OrderDto>>> {
    req.withoutWallet = true;
    const data = await this.orderService.orderDetailsSearch(req) as any;
    return DataResponse.ok(data);
  }

  @Put('/:id/update')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Param('id') id: string,
    @Body() payload: OrderUpdatePayload,
    @CurrentUser() user: any
  ): Promise<DataResponse<any>> {
    const data = await this.orderService.updateDetails(id, payload, user);
    return DataResponse.ok(data);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async details(
    @Param('id') id: string
  ): Promise<DataResponse<any>> {
    const data = await this.orderService.getOrderDetails(id);
    return DataResponse.ok(data);
  }

  @Get('/details/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async details2(
    @Param('id') id: string
  ): Promise<DataResponse<any>> {
    const data = await this.orderService.getOrderDetails(id);
    return DataResponse.ok(data);
  }
}

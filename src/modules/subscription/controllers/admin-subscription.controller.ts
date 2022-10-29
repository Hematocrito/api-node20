import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Get,
  UseGuards,
  Query,
  Post,
  Body,
  Delete,
  Param
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse, PageableData } from 'src/kernel';
import { Roles } from 'src/modules/auth';
import {
  SubscriptionCreatePayload,
  SubscriptionSearchRequestPayload
} from '../payloads';
import {
  SubscriptionDto
} from '../dtos/subscription.dto';
import { SubscriptionService } from '../services/subscription.service';
import { CancelSubscriptionService } from '../services/cancel-subscription.service';

@Injectable()
@Controller('admin/subscriptions')
export class AdminSubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly cancelSubscriptionService: CancelSubscriptionService
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Body() payload: SubscriptionCreatePayload
  ): Promise<DataResponse<SubscriptionDto>> {
    const data = await this.subscriptionService.adminCreate(payload);
    return DataResponse.ok(data);
  }

  @Get('/search')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async adminSearch(
    @Query() req: SubscriptionSearchRequestPayload
  ): Promise<DataResponse<PageableData<SubscriptionDto>>> {
    const data = await this.subscriptionService.adminSearch(req);
    return DataResponse.ok(data);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  async delete(@Param('id') id: string): Promise<any> {
    const resp = await this.subscriptionService.delete(id);
    return DataResponse.ok(resp);
  }

  @Post('/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async adminCancel(
    @Param('id') id: string
  ): Promise<DataResponse<any>> {
    const data = await this.cancelSubscriptionService.cancelSubscription(id);
    return DataResponse.ok(data);
  }
}

import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Get,
  UseGuards,
  Query
} from '@nestjs/common';
import { RoleGuard, AuthGuard } from 'src/modules/auth/guards';
import { DataResponse, PageableData } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth';
import { UserDto } from 'src/modules/user/dtos';
import {
  SubscriptionSearchRequestPayload
} from '../payloads';
import {
  SubscriptionDto,
  ISubscriptionResponse
} from '../dtos/subscription.dto';
import { SubscriptionService } from '../services/subscription.service';

@Injectable()
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('/performer/search')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async performerSearch(
    @Query() req: SubscriptionSearchRequestPayload,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<PageableData<SubscriptionDto>>> {
    const data = await this.subscriptionService.performerSearch(req, user);
    return DataResponse.ok(data);
  }

  @Get('/user/search')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async userSearch(
    @Query() req: SubscriptionSearchRequestPayload,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<PageableData<ISubscriptionResponse>>> {
    const data = await this.subscriptionService.userSearch(req, user);
    return DataResponse.ok({
      total: data.total,
      data: data.data.map((s) => s.toResponse(false))
    });
  }
}

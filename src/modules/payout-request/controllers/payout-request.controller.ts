import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Param,
  Get,
  Post,
  UseGuards,
  Body,
  Put
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth';
import { PerformerDto } from 'src/modules/performer/dtos';
import { UserDto } from 'src/modules/user/dtos';
import { PayoutRequestCreatePayload, PayoutRequestPerformerUpdatePayload, PayoutRequestSearchPayload } from '../payloads/payout-request.payload';
import { PayoutRequestService } from '../services/payout-request.service';

@Injectable()
@Controller('payout-requests/performer')
export class PayoutRequestController {
  constructor(private readonly payoutRequestService: PayoutRequestService) {}

  @Post('/')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Body() payload: PayoutRequestCreatePayload,
    @CurrentUser() user: PerformerDto
  ): Promise<DataResponse<any>> {
    const data = await this.payoutRequestService.performerCreate(payload, user);
    return DataResponse.ok(data);
  }

  @Post('/calculate')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async calculate(
    @Body() payload: PayoutRequestSearchPayload,
    @CurrentUser() user: PerformerDto
  ): Promise<DataResponse<any>> {
    const data = await this.payoutRequestService.calculateByDate(user, payload);
    return DataResponse.ok(data);
  }

  @Post('/stats')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async stats(
    @Body() payload: PayoutRequestSearchPayload,
    @CurrentUser() user: PerformerDto & UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.payoutRequestService.calculateStats(user, payload);
    return DataResponse.ok(data);
  }

  @Post('/check-pending')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  async checkPending(
    @CurrentUser() user: PerformerDto
  ): Promise<DataResponse<any>> {
    const hasPending = await this.payoutRequestService.checkHasPending(user._id);
    return DataResponse.ok({
      hasPending
    });
  }

  @Put('/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Param('id') id: string,
    @Body() payload: PayoutRequestPerformerUpdatePayload,
    @CurrentUser() performer: PerformerDto
  ): Promise<DataResponse<any>> {
    const data = await this.payoutRequestService.performerUpdate(id, payload, performer);
    return DataResponse.ok(data);
  }

  @Get('/:id/view')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async details(
    @Param('id') id: string,
    @CurrentUser() user: PerformerDto
  ): Promise<DataResponse<any>> {
    const data = await this.payoutRequestService.details(id, user);
    return DataResponse.ok(data);
  }
}

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { DataResponse } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth';
import { AuthGuard, RoleGuard } from 'src/modules/auth/guards';
import { UserDto } from 'src/modules/user/dtos';
import { NotificationService } from '../services';
import { CreateNotificationOptions } from '../notification.interface';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @Put('/:id/read')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async read(
    @Param('id') id: String
  ): Promise<DataResponse<any>> {
    const data = await this.notificationService.read(id as any);
    return DataResponse.ok(data);
  }

  @Put('/read-all')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async readAll(
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.notificationService.readAll(user._id);
    return DataResponse.ok(data);
  }

  @Get('/create')
  @HttpCode(HttpStatus.OK)
  @Roles('user, performer')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async createNotification(@Body() payload: CreateNotificationOptions, @CurrentUser() creator: UserDto): Promise<any> {
    const resp = await this.notificationService.create(payload);
    return DataResponse.ok(resp);
  }
}

import {
  Controller,
  Get,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { DataResponse, PageableData } from 'src/kernel';
import { CurrentUser } from 'src/modules/auth';
import { AuthGuard } from 'src/modules/auth/guards';
import { UserDto } from 'src/modules/user/dtos';
import { NotificationDto } from '../notification.dto';
import { SearchNotificationPayload } from '../payloads';
import { NotificationSearchService } from '../services';

@Controller('notification')
export class NotificationSearchController {
  constructor(
    private readonly notificationSearchService: NotificationSearchService
  ) {}

  @Get('/')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async search(
    @CurrentUser() currentUser: UserDto,
    @Query() payload: SearchNotificationPayload
  ): Promise<DataResponse<PageableData<NotificationDto>>> {
    const data = await this.notificationSearchService.search(
      payload,
      currentUser
    );
    return DataResponse.ok(data);
  }

  @Get('/total-unread')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async getNumOfUnread(
    @CurrentUser() currentUser: UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.notificationSearchService.getTotalUnread(currentUser._id);
    return DataResponse.ok(data);
  }
}

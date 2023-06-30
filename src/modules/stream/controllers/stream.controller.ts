import {
  Controller,
  UseGuards,
  Post,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Get,
  Param,
  UseInterceptors,
  HttpException
} from '@nestjs/common';
import { AuthGuard, RoleGuard } from 'src/modules/auth/guards';
import { DataResponse } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth';
import { PerformerDto } from 'src/modules/performer/dtos';
import { UserInterceptor } from 'src/modules/auth/interceptors';
import { UserDto } from 'src/modules/user/dtos';
import { PerformerCacheService } from 'src/modules/performer/services/performer-cache.service';
import { StreamService } from '../services/stream.service';

@Controller('streaming')
export class StreamController {
  constructor(
    private readonly streamService: StreamService,
    private readonly performerCacheService: PerformerCacheService
  ) {}

  @Post('/live')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async goLive(@CurrentUser() performer: PerformerDto) {
    // if it is not active, throw error
    console.log('Go Live');
    const isActive = await this.performerCacheService.isActivePerformer(performer._id);
    if (!isActive) {
      throw new HttpException('You can Go Live only when your account is approved by admin.', 400);
    }

    const data = await this.streamService.goLive(performer._id);
    return DataResponse.ok(data);
  }

  @Post('/join/:id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(UserInterceptor)
  @UsePipes(new ValidationPipe({ transform: true }))
  async join(@Param('id') performerId: string) {
    const data = await this.streamService.joinPublicChat(performerId);
    return DataResponse.ok(data);
  }

  @Post('/private-chat/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('user')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async requestPrivateChat(
    @Param('id') performerId: string,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.streamService.requestPrivateChat(user, performerId);

    return DataResponse.ok(data);
  }

  @Get('/private-chat/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async accpetPrivateChat(
    @Param('id') id: string,
    @CurrentUser() performer: PerformerDto
  ): Promise<DataResponse<any>> {
    const data = await this.streamService.accpetPrivateChat(id, performer._id);
    return DataResponse.ok(data);
  }

  @Post('/token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async getToken(): Promise<DataResponse<any>> {
    const result = await this.streamService.getToken();
    return DataResponse.ok(result);
  }
}

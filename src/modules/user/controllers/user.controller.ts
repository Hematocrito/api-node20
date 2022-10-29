import {
  HttpCode,
  HttpStatus,
  Controller,
  Get,
  Injectable,
  UseGuards,
  Request,
  Body,
  Put,
  Query,
  Param
} from '@nestjs/common';
import { AuthGuard, RoleGuard } from 'src/modules/auth/guards';
import { CurrentUser, Roles } from 'src/modules/auth/decorators';
import { omit } from 'lodash';
import { EXCLUSIVE_FIELDS } from 'src/modules/auth/constants';
import { DataResponse, PageableData } from 'src/kernel';
import { UserService, UserSearchService } from '../services';
import { UserDto, IUserResponse } from '../dtos';
import { UserUpdatePayload, UserSearchRequestPayload } from '../payloads';

@Injectable()
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userSearchService: UserSearchService
  ) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async me(@Request() req: any): Promise<DataResponse<IUserResponse>> {
    const { authUser, jwToken } = req;
    const user = await this.userService.getMe(authUser.sourceId, jwToken);
    return DataResponse.ok(user);
  }

  @Put()
  @UseGuards(AuthGuard)
  async updateMe(
    @CurrentUser() currentUser: UserDto,
    @Body() payload: UserUpdatePayload
  ): Promise<DataResponse<IUserResponse>> {
    const data = omit(payload, EXCLUSIVE_FIELDS) as any;
    await this.userService.update(currentUser._id, data, currentUser);
    const user = await this.userService.findById(currentUser._id);
    return DataResponse.ok(new UserDto(user).toResponse(true));
  }

  @Get('/search')
  @Roles('performer')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  async search(
    @Query() req: UserSearchRequestPayload
  ): Promise<DataResponse<PageableData<IUserResponse>>> {
    return DataResponse.ok(await this.userSearchService.performerSearch(req));
  }

  @Get('/:id/balance')
  @Roles('performer')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  async getUserbalance(
    @Param(':id') id: string
  ): Promise<DataResponse<any>> {
    return DataResponse.ok(
      await this.userService.getUserBalance(id)
    );
  }
}

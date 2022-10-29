import {
  Post,
  HttpCode,
  HttpStatus,
  Body,
  Controller,
  Put,
  UseGuards,
  Get,
  Res,
  Query,
  HttpException
} from '@nestjs/common';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Response } from 'express';
import * as moment from 'moment';
import { UserService } from 'src/modules/user/services';
import { PerformerService } from 'src/modules/performer/services';
import { UserDto } from 'src/modules/user/dtos';
import { DataResponse } from 'src/kernel';
import { AuthService } from '../services';
import { AuthGuard, RoleGuard } from '../guards';
import { CurrentUser, Roles } from '../decorators';
import { PasswordChangePayload, PasswordAdminChangePayload, ForgotPayload } from '../payloads';
import { AuthUpdateDto } from '../dtos';
import { AccountNotFoundxception } from '../exceptions';

@Controller('auth')
export class PasswordController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly performerService: PerformerService
  ) {}

  @Put('users/me/password')
  @UseGuards(AuthGuard)
  public async updatePassword(
    @CurrentUser() user: UserDto,
    @Body() payload: PasswordChangePayload
  ): Promise<DataResponse<boolean>> {
    await this.authService.update(
      new AuthUpdateDto({
        source: payload.source || 'user',
        sourceId: user._id,
        value: payload.password
      })
    );
    return DataResponse.ok(true);
  }

  @Put('users/password')
  @Roles('admin')
  @UseGuards(RoleGuard)
  public async updateUserPassword(
    @CurrentUser() user: UserDto,
    @Body() payload: PasswordAdminChangePayload
  ): Promise<DataResponse<boolean>> {
    await this.authService.update(
      new AuthUpdateDto({
        source: payload.source || 'user',
        sourceId: payload.userId || user._id as any,
        value: payload.password
      })
    );
    return DataResponse.ok(true);
  }

  @Post('users/forgot')
  @HttpCode(HttpStatus.OK)
  public async forgotPassword(
    @Body() req: ForgotPayload
  ): Promise<DataResponse<{ success: boolean }>> {
    const [user, performer] = await Promise.all([
      this.userService.findByEmail(req.email.toLowerCase()),
      this.performerService.findByEmail(req.email.toLowerCase())
    ]);
    if (!user && !performer) {
      throw new HttpException('Sorry, we couldn\'t find your account. Please recheck the email entered', 404);
    }
    const [authUser, authPerformer] = await Promise.all([
      user && this.authService.findBySource({
        source: 'user',
        sourceId: user._id,
        type: 'email'
      }),
      performer && this.authService.findBySource({
        source: 'performer',
        sourceId: performer._id,
        type: 'email'
      })
    ]);

    if (!authUser && !authPerformer) {
      throw new AccountNotFoundxception();
    }

    authUser && user?.email && await this.authService.forgot(authUser, {
      _id: user._id,
      email: user.email
    });

    authPerformer && performer?.email && await this.authService.forgot(authPerformer, {
      _id: performer._id,
      email: performer.email
    });

    return DataResponse.ok({
      success: true
    });
  }

  @Get('password-change')
  public async renderUpdatePassword(
    @Res() res: Response,
    @Query('token') token: string
  ) {
    if (!token) {
      return res.render('404.html');
    }

    const forgot = await this.authService.getForgot(token);
    if (!forgot) {
      return res.render('404.html');
    }
    if (moment(forgot.createdAt).isAfter(moment().add(1, 'day'))) {
      await forgot.remove();
      return res.render('404.html');
    }

    return res.render('password-change.html');
  }

  @Post('password-change')
  public async updatePasswordForm(
    @Res() res: Response,
    @Query('token') token: string,
    @Body('password') password: string
  ) {
    if (!token || !password || password.length < 6) {
      return res.render('404.html');
    }

    const forgot = await this.authService.getForgot(token);
    if (!forgot) {
      return res.render('404.html');
    }
    // TODO - check forgot table
    await this.authService.update(
      new AuthUpdateDto({
        source: forgot.source,
        sourceId: forgot.sourceId,
        value: password
      })
    );
    await forgot.remove();
    // TODO - should remove other forgot link?
    return res.render('password-change.html', {
      done: true
    });
  }
}

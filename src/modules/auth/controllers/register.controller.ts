import {
  Post,
  HttpCode,
  HttpStatus,
  Body,
  Controller,
  Get,
  Res,
  Query
} from '@nestjs/common';
import { UserService } from 'src/modules/user/services';
import { DataResponse } from 'src/kernel';
import { UserCreatePayload } from 'src/modules/user/payloads';
import { SettingService } from 'src/modules/settings';
import { STATUS_ACTIVE, ROLE_USER } from 'src/modules/user/constants';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Response } from 'express';
import { omit } from 'lodash';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { REGISTER_EXCLUSIVE_FIELDS } from '../constants';
import { AuthCreateDto } from '../dtos';
import { UserRegisterPayload } from '../payloads';
import { AuthService } from '../services';

@Controller('auth')
export class RegisterController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService
  ) { }

  @Post('users/register')
  @HttpCode(HttpStatus.OK)
  async userRegister(
    @Body() req: UserRegisterPayload
  ): Promise<DataResponse<{ message: string }>> {
    const data = omit(req, REGISTER_EXCLUSIVE_FIELDS) as any;
    const user = await this.userService.create(new UserCreatePayload(data), {
      status: STATUS_ACTIVE,
      roles: ROLE_USER
    });

    await Promise.all([
      req.email && this.authService.create(new AuthCreateDto({
        source: 'user',
        sourceId: user._id,
        type: 'email',
        value: req.password,
        key: req.email
      })),
      req.username && this.authService.create(new AuthCreateDto({
        source: 'user',
        sourceId: user._id,
        type: 'username',
        value: req.password,
        key: req.username
      }))
    ]);
    // always send email verification
    user.email && await this.authService.sendVerificationEmail({
      _id: user._id,
      email: user.email
    });
    const requireEmailVerification = SettingService.getValueByKey(
      SETTING_KEYS.REQUIRE_EMAIL_VERIFICATION_USER
    );
    return DataResponse.ok({
      message: requireEmailVerification ? 'Please verify your account using the verification email sent to you.' : 'Your account is active, please login !'
    });
  }

  @Get('email-verification')
  public async verifyEmail(
    @Res() res: Response,
    @Query('token') token: string
  ) {
    if (!token) {
      return res.render('404.html');
    }
    await this.authService.verifyEmail(token);
    if (process.env.EMAIL_VERIFIED_SUCCESS_URL) {
      return res.redirect(process.env.EMAIL_VERIFIED_SUCCESS_URL);
    }

    return res.redirect(`${process.env.BASE_URL}/auth/login`);
  }
}

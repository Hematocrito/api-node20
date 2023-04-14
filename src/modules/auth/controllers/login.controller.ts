import {
  Post,
  HttpCode,
  HttpStatus,
  Body,
  Controller,
  HttpException,
  forwardRef,
  Inject,
  Get,
  UseGuards,
  Req,
  Res
} from '@nestjs/common';
import { UserService } from 'src/modules/user/services';
import { DataResponse } from 'src/kernel';
import { SettingService } from 'src/modules/settings';
import {
  STATUS_INACTIVE, STATUS_PENDING_EMAIL_CONFIRMATION
} from 'src/modules/user/constants';
import { PerformerService } from 'src/modules/performer/services';
import { PERFORMER_STATUSES } from 'src/modules/performer/constants';
import { isEmail } from 'src/kernel/helpers/string.helper';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { AuthGuard } from '@nestjs/passport';
import { LoginPayload } from '../payloads';
import { AuthService } from '../services';
import {
  PasswordIncorrectException,
  EmailNotVerifiedException,
  AccountInactiveException
} from '../exceptions';
import { EmailOrPasswordIncorrectException } from '../exceptions/email-password-incorrect.exception';
import { LoginByEmailPayload } from '../payloads/login-by-email.payload';

@Controller('auth')
export class LoginController {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly authService: AuthService
  ) { }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  public async login(
    @Body() req: LoginPayload
  ): Promise<DataResponse<{ token: string }>> {
    const query = isEmail(req.username) ? { email: req.username.toLowerCase() } : { username: req.username };
    const [user, performer] = await Promise.all([
      this.userService.findOne(query),
      this.performerService.findOne(query)
    ]);
    if (!user && !performer) {
      throw new HttpException('This account is not found. Please sign up', 404);
    }
    const [authUser, authPerformer] = await Promise.all([
      user && this.authService.findBySource({
        source: 'user',
        sourceId: user._id
      }),
      performer && this.authService.findBySource({
        source: 'performer',
        sourceId: performer._id
      })
    ]);
    if (!authUser && !authPerformer) {
      throw new HttpException('This account is not found. Please sign up', 404);
    }

    if (authUser) {
      const requireEmailVerification = SettingService.getValueByKey(SETTING_KEYS.REQUIRE_EMAIL_VERIFICATION_USER);
      if (requireEmailVerification && !user.verifiedEmail) {
        throw new EmailNotVerifiedException();
      }
    } else if (authPerformer) {
      const requireEmailVerification = await SettingService.getValueByKey(SETTING_KEYS.REQUIRE_EMAIL_VERIFICATION_PERFORMER);
      if (requireEmailVerification && !performer.verifiedEmail) {
        throw new EmailNotVerifiedException();
      }
    }

    // allow model to login
    // if (performer && !performer.verifiedDocument) {
    //   throw new HttpException('Please wait for admin to verify your account, or you can contact admin by send message in contact page', 403);
    // }
    if ((user && user.status === STATUS_INACTIVE) || (performer && performer.status === PERFORMER_STATUSES.INACTIVE)) {
      throw new AccountInactiveException();
    }
    if (authUser && !this.authService.verifyPassword(req.password, authUser)) {
      throw new PasswordIncorrectException();
    }
    if (authPerformer && !this.authService.verifyPassword(req.password, authPerformer)) {
      throw new PasswordIncorrectException();
    }

    let token = null;
    if (authUser) {
      token = req.remember ? this.authService.generateJWT(authUser, { expiresIn: 60 * 60 * 24 * 365 }) : this.authService.generateJWT(authUser, { expiresIn: 60 * 60 * 24 * 1 });
    }
    if (!authUser && authPerformer) {
      token = req.remember ? this.authService.generateJWT(authPerformer, { expiresIn: 60 * 60 * 24 * 365 }) : this.authService.generateJWT(authPerformer, { expiresIn: 60 * 60 * 24 * 1 });
    }

    return DataResponse.ok({ token });
  }

  @Post('login/email')
  @HttpCode(HttpStatus.OK)
  public async loginByEmail(
    @Body() req: LoginByEmailPayload
  ): Promise<DataResponse<{ token: string }>> {
    const email = req.email.toLowerCase();
    const [user, performer] = await Promise.all([
      this.userService.findOne({ email }),
      this.performerService.findOne({ email })
    ]);
    if (!user && !performer) {
      throw new HttpException('This account is not found. Please sign up', 404);
    }
    const requireEmailVerification = SettingService.getValueByKey('requireEmailVerification');
    if (
      (requireEmailVerification && user && user.status === STATUS_PENDING_EMAIL_CONFIRMATION)
      || (requireEmailVerification && user && !user.verifiedEmail)
      || (requireEmailVerification && performer && performer.status === PERFORMER_STATUSES.PENDING)
      || (requireEmailVerification && performer && !performer.verifiedEmail)) {
      throw new EmailNotVerifiedException();
    }
    if ((user && user.status === STATUS_INACTIVE) || (performer && performer.status === PERFORMER_STATUSES.INACTIVE)) {
      throw new AccountInactiveException();
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
      throw new HttpException('This account is not found. Please Sign up', 404);
    }
    if (authUser && !this.authService.verifyPassword(req.password, authUser)) {
      throw new EmailOrPasswordIncorrectException();
    }
    if (authPerformer && !this.authService.verifyPassword(req.password, authPerformer)) {
      throw new EmailOrPasswordIncorrectException();
    }
    // TODO - check for user status here

    let token = null;
    if (authUser) {
      token = req.remember ? this.authService.generateJWT(authUser, { expiresIn: 60 * 60 * 24 * 365 }) : this.authService.generateJWT(authUser, { expiresIn: 60 * 60 * 24 * 1 });
    }
    if (!authUser && authPerformer) {
      token = req.remember ? this.authService.generateJWT(authPerformer, { expiresIn: 60 * 60 * 24 * 365 }) : this.authService.generateJWT(authPerformer, { expiresIn: 60 * 60 * 24 * 1 });
    }

    return DataResponse.ok({ token });
  }

  @Get('login/twitter')
  @UseGuards(AuthGuard('twitter'))
  async twitterAuth(@Req() req) {}

  @Get('login/twitter/redirect')
  @UseGuards(AuthGuard('twitter'))
  async twitterAuthRedirect(@Req() req, @Res() res) {
    const [user, performer] = await Promise.all([
      this.userService.findOne({ email: req.user?.emails[0]?.value }),
      this.performerService.findOne({ email: req.user?.emails[0]?.value })
    ]);
    if (!user && !performer) {
      return res.redirect(`${process.env.USER_URL}/oauth/login?error=account_not_found`);
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
      return res.redirect(`${process.env.USER_URL}/oauth/login?error=account_not_found`);
    }

    const token = this.authService.generateJWT(authUser || authPerformer, { expiresIn: 60 * 60 * 24 * 1 });

    return res.redirect(`${process.env.USER_URL}/oauth/login?token=${token}&source=${authUser ? 'user' : 'performer'}`);
  }

  @Get('login/google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @Get('login/google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    const [user, performer] = await Promise.all([
      this.userService.findOne({ email: req.user.email }),
      this.performerService.findOne({ email: req.user.email })
    ]);
    if (!user && !performer) {
      return res.redirect(`${process.env.USER_URL}/oauth/login?error=account_not_found`);
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
      return res.redirect(`${process.env.USER_URL}/oauth/login?error=account_not_found`);
    }

    const token = this.authService.generateJWT(authUser || authPerformer, { expiresIn: 60 * 60 * 24 * 1 });

    return res.redirect(`${process.env.USER_URL}/oauth/login?token=${token}&source=${authUser ? 'user' : 'performer'}`);
  }
}

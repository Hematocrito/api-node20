import {
  Post,
  HttpCode,
  HttpStatus,
  Body,
  Controller,
  HttpException,
  forwardRef,
  Inject
} from '@nestjs/common';
import { UserService } from 'src/modules/user/services';
import { DataResponse } from 'src/kernel';
import { SettingService } from 'src/modules/settings';
import {
  STATUS_INACTIVE
} from 'src/modules/user/constants';
import { PerformerService } from 'src/modules/performer/services';
import { PERFORMER_STATUSES } from 'src/modules/performer/constants';
import { isEmail } from 'src/kernel/helpers/string.helper';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { LoginPayload } from '../payloads';
import { AuthService } from '../services';
import {
  PasswordIncorrectException,
  EmailNotVerifiedException,
  AccountInactiveException
} from '../exceptions';

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
}

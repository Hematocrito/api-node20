import { AuthService } from 'src/modules/auth/services/auth.service';
import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Post
} from '@nestjs/common';
import { DataResponse } from 'src/kernel';
import { UserService } from 'src/modules/user/services';
import { PerformerService } from 'src/modules/performer/services';

@Controller('verification')
export class VerificationController {
  constructor(
    private readonly userService: UserService,
    private readonly performerService: PerformerService,
    private readonly authService: AuthService
  ) {}

  @Post('/resend')
  @HttpCode(HttpStatus.OK)
  async resendVerificationEmail(
    @Body('email') email: string
  ) {
    let user = await this.userService.findByEmail(email) as any;
    if (!user) {
      user = await this.performerService.findByEmail(email);
    }
    if (!user) throw new HttpException('No account was found, please try again', 404);
    await this.authService.sendVerificationEmail({ email, _id: user._id });
    return DataResponse.ok({ success: true });
  }
}

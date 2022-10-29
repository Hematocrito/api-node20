import {
  Post,
  HttpCode,
  HttpStatus,
  Body,
  Controller,
  UseInterceptors,
  HttpException
} from '@nestjs/common';
import { DataResponse, getConfig } from 'src/kernel';
import { MailerService } from 'src/modules/mailer/services';
import { MultiFileUploadInterceptor, FilesUploaded, FileDto } from 'src/modules/file';
import { FileService } from 'src/modules/file/services';
import { PerformerService } from 'src/modules/performer/services';
import { omit } from 'lodash';
import { PERFORMER_STATUSES } from 'src/modules/performer/constants';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { SettingService } from 'src/modules/settings';
import { REGISTER_EXCLUSIVE_FIELDS } from '../constants';
import { PerformerRegisterPayload } from '../payloads';
import { AuthService } from '../services';

@Controller('auth/performers')
export class PerformerRegisterController {
  constructor(
    private readonly performerService: PerformerService,
    private readonly authService: AuthService,
    private readonly fileService: FileService,
    private readonly mailService: MailerService
  ) { }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    // TODO - check and support multiple files!!!
    MultiFileUploadInterceptor(
      [
        {
          type: 'performer-document',
          fieldName: 'idVerification',
          options: {
            destination: getConfig('file').documentDir
          }
        },
        {
          type: 'performer-document',
          fieldName: 'documentVerification',
          options: {
            destination: getConfig('file').documentDir
          }
        }
      ],
      {}
    )
  )
  async performerRegister(
    @Body() payload: PerformerRegisterPayload,
    @FilesUploaded() files: Record<string, FileDto>
  ): Promise<DataResponse<{ message: string }>> {
    try {
      if (!files.idVerification || !files.documentVerification) {
        throw new HttpException('Missing document!', 400);
      }

      // TODO - define key for performer separately
      const requireEmailVerification = SettingService.getValueByKey(
        SETTING_KEYS.REQUIRE_EMAIL_VERIFICATION_PERFORMER
      );
      const data = omit(payload, REGISTER_EXCLUSIVE_FIELDS) as any;

      const performer = await this.performerService.register({
        ...data,
        avatarId: null,
        status: PERFORMER_STATUSES.PENDING,
        idVerificationId: files.idVerification._id as any,
        documentVerificationId: files.documentVerification._id as any
      } as any);

      // create auth, email notification, etc...
      if (payload.password) {
        await Promise.all([
          performer.email && this.authService.create({
            source: 'performer',
            sourceId: performer._id,
            type: 'email',
            key: performer.email,
            value: payload.password
          }),
          performer.username && this.authService.create({
            source: 'performer',
            sourceId: performer._id,
            type: 'username',
            key: performer.username,
            value: payload.password
          })
        ]);
      }

      // notify to verify email address
      if (performer.email) {
        const {
          email, name, username
        } = performer;
        await this.authService.sendVerificationEmail({
          _id: performer._id,
          email
        }, 'email-verification-performer');

        const sendInstruction = SettingService.getValueByKey(
          SETTING_KEYS.SEND_MODEL_ONBOARD_INSTRUCTION
        );
        if (sendInstruction) {
          await this.mailService.send({
            subject: 'Model Onboarding Instructions',
            to: email,
            data: {
              name: name || username
            },
            template: 'model-onboard-instructions'
          });
        }
      }

      return DataResponse.ok({
        message: requireEmailVerification ? 'Please verify your account using the verification email sent to you.' : 'Your account is active, please login !'
      });
    } catch (e) {
      files.idVerification && await this.fileService.remove(files.idVerification._id);
      files.documentVerification && await this.fileService.remove(files.documentVerification._id);

      throw e;
    }
  }
}

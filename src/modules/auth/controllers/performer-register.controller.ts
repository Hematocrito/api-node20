import {
  Post,
  HttpCode,
  HttpStatus,
  Body,
  Controller,
  UseInterceptors,
  HttpException,
  Get,
  UseGuards,
  Req,
  Res
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
import { UsernameExistedException } from 'src/modules/performer/exceptions';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser, Roles } from '../decorators';
import { UserDto } from 'src/modules/user/dtos';
import { RoleGuard } from '../guards';

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
            destination: 'private'
          }
        },
        {
          type: 'performer-document',
          fieldName: 'documentVerification',
          options: {
            destination: 'private'
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

      let awsRecognize;
      try{
        awsRecognize = await this.authService.validateDocumentsRekognition(files.idVerification._id+"", files.documentVerification._id+"")
      }
      catch(err){
        throw new HttpException('Invalid Images', 400);
      }

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

      if(awsRecognize.FaceMatches){
        if(awsRecognize.FaceMatches[0].Similarity > 70){
          await this.performerService.update(performer._id.toString(), {
            verifiedAccount: true,
            verifiedDocument: true,
            verifiedEmail: true,
            status: 'active'
          })
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

  @Get('register/twitter')
  @UseGuards(AuthGuard('twitter-register-performer'))
  async userRegisterTwitter(@Req() req){ }

  @Get('register/twitter/redirect')
  @UseGuards(AuthGuard('twitter-register-performer'))
  async userRegisterTwitterRedirect(@Req() req, @Res() res) {
    try{
      const twitterProfile = req.user;

      const performerCreatePayload = {
        name: twitterProfile._json.name,
        firstName: twitterProfile._json.name,
        lastName: twitterProfile._json.name,
        email: twitterProfile.emails[0]?.value,
        verifiedEmail: true,
        username: twitterProfile.username
      };

      const dataPayload: any = {
        ...performerCreatePayload,
        avatarId: null,
        // need admin to check and active
        status: PERFORMER_STATUSES.ACTIVE,
        idVerificationId: null,
        documentVerificationId: null
      }

      const performer = await this.performerService.register(dataPayload);

      // create auth, email notification, etc...
      await Promise.all([
        this.authService.create({
          source: 'performer',
          sourceId: performer._id,
          type: 'email',
          key: performer.email,
          value: Math.random().toString(36),
        }),
        this.authService.create({
          source: 'performer',
          sourceId: performer._id,
          type: 'username',
          key: performer.username,
          value: Math.random().toString(36),
        })
      ]);
      
      const [authUser] = await Promise.all([
        performer && this.authService.findBySource({
          source: 'performer',
          sourceId: performer._id,
          type: 'email'
        })
      ]);

      let token = this.authService.generateJWT(authUser, { expiresIn: 60 * 60 * 24 * 1 });

      return res.redirect(`${process.env.USER_URL}/oauth/login?token=${token}&source=performer`)
    }
    catch(err){
      if(err instanceof UsernameExistedException){
        return res.redirect(`${process.env.USER_URL}/oauth/login?error=user_has_been_taken`);
      }
      return res.redirect(`${process.env.USER_URL}/oauth/login?error=server_error`);
    } 
  }

  @Get('register/google')
  @UseGuards(AuthGuard('google-register-performer'))
  async userRegisterGoogle(@Req() req){ }

  @Get('register/google/redirect')
  @UseGuards(AuthGuard('google-register-performed'))
  async userRegisterGoogleRedirect(@Req() req, @Res() res) {
    try{
      const googleProfile = req.user;

      const performerCreatePayload = {
        name: googleProfile.name,
        firstName: googleProfile.given_name,
        lastName: googleProfile.family_name,
        email: googleProfile.email,
        verifiedEmail: true,
        username: googleProfile.email.split("@")[0]
      };

      const dataPayload: any = {
        ...performerCreatePayload,
        avatarId: null,
        // need admin to check and active
        status: PERFORMER_STATUSES.ACTIVE,
        idVerificationId: null,
        documentVerificationId: null
      }

      const performer = await this.performerService.register(dataPayload);

      // create auth, email notification, etc...
      await Promise.all([
        this.authService.create({
          source: 'performer',
          sourceId: performer._id,
          type: 'email',
          key: performer.email,
          value: Math.random().toString(36),
        }),
        this.authService.create({
          source: 'performer',
          sourceId: performer._id,
          type: 'username',
          key: performer.username,
          value: Math.random().toString(36),
        })
      ]);
      
      const [authUser] = await Promise.all([
        performer && this.authService.findBySource({
          source: 'performer',
          sourceId: performer._id,
          type: 'email'
        })
      ]);

      let token = this.authService.generateJWT(authUser, { expiresIn: 60 * 60 * 24 * 1 });

      return res.redirect(`${process.env.USER_URL}/oauth/login?token=${token}&source=performer`)
    }
    catch(err){
      if(err instanceof UsernameExistedException){
        return res.redirect(`${process.env.USER_URL}/oauth/login?error=user_has_been_taken`);
      }
      return res.redirect(`${process.env.USER_URL}/oauth/login?error=server_error`);
    } 
  }

  @Roles('performer')
  @UseGuards(RoleGuard)
  @Post('register/finish')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    // TODO - check and support multiple files!!!
    MultiFileUploadInterceptor(
      [
        {
          type: 'performer-document',
          fieldName: 'idVerification',
          options: {
            destination: 'private'
          }
        },
        {
          type: 'performer-document',
          fieldName: 'documentVerification',
          options: {
            destination: 'private'
          }
        }
      ],
      {}
    )
  )
  async performerFinishRegister(
    @Body() payload: any,
    @FilesUploaded() files: Record<string, FileDto>,
    @CurrentUser() performer: UserDto
  ): Promise<DataResponse<{ message: string }>> {
    try {
      if (!files.idVerification || !files.documentVerification) {
        throw new HttpException('Missing document!', 400);
      }

      const requireEmailVerification = SettingService.getValueByKey(
        'requireEmailVerification'
      );
      
      const performerResDTO = await this.performerService.addDocuments(performer._id, {
        idVerificationId: files.idVerification._id as any,
        documentVerificationId: files.documentVerification._id as any
      });

      // notify to verify email address
      // TODO - check and verify me!
      // requireEmailVerification && performer.email && await this.authService.sendVerificationEmail({
      //   _id: performer._id,
      //   email: performer.email
      // });

      return DataResponse.ok({
        message: requireEmailVerification ? 'We have sent an email to verify your email, please check your inbox.' : 'You have successfully registered.'
      });
    } catch (e) {
      console.error(e)

      files.idVerification && await this.fileService.remove(files.idVerification._id);
      files.documentVerification && await this.fileService.remove(files.documentVerification._id);

      throw e;
    }
  }
}

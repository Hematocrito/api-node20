import {
  Injectable, Inject, forwardRef
} from '@nestjs/common';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { UserDto } from 'src/modules/user/dtos';
import { PerformerDto } from 'src/modules/performer/dtos';
import { UserService } from 'src/modules/user/services';
import { PerformerService } from 'src/modules/performer/services';
import { SettingService } from 'src/modules/settings';
import { StringHelper, EntityNotFoundException, getConfig } from 'src/kernel';
import { MailerService } from 'src/modules/mailer';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { FileService } from 'src/modules/file/services';
import * as path from 'path';
import { AUTH_MODEL_PROVIDER, FORGOT_MODEL_PROVIDER, VERIFICATION_MODEL_PROVIDER } from '../providers/auth.provider';
import { AuthModel, ForgotModel, VerificationModel } from '../models';
import { AuthCreateDto, AuthUpdateDto } from '../dtos';

const AWS = require('aws-sdk');

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(AUTH_MODEL_PROVIDER)
    private readonly authModel: Model<AuthModel>,
    @Inject(VERIFICATION_MODEL_PROVIDER)
    private readonly verificationModel: Model<VerificationModel>,
    @Inject(FORGOT_MODEL_PROVIDER)
    private readonly forgotModel: Model<ForgotModel>,
    private readonly mailService: MailerService,
    private readonly fileService: FileService
  ) { }

  /**
   * generate password salt
   * @param byteSize integer
   */
  public generateSalt(byteSize = 16): string {
    return crypto.randomBytes(byteSize).toString('base64');
  }

  public encryptPassword(pw: string, salt: string): string {
    const defaultIterations = 10000;
    const defaultKeyLength = 64;

    return crypto.pbkdf2Sync(pw, salt, defaultIterations, defaultKeyLength, 'sha1').toString('base64');
  }

  public async findOne(query: any) {
    const data = await this.authModel.findOne(query);
    return data;
  }

  public async find(query: any) {
    const data = await this.authModel.find(query);
    return data;
  }

  public async create(data: AuthCreateDto): Promise<AuthModel> {
    const salt = this.generateSalt();
    let newVal = data.value;
    if (['email', 'username'].includes(data.type) && newVal) {
      newVal = this.encryptPassword(newVal, salt);
    }

    // avoid admin update
    // TODO - should listen via user event?
    let auth = await this.authModel.findOne({
      type: data.type,
      source: data.source,
      sourceId: data.sourceId
    });
    if (!auth) {
      // eslint-disable-next-line new-cap
      auth = new this.authModel({
        type: data.type,
        source: data.source,
        sourceId: data.sourceId
      });
    }

    auth.salt = salt;
    auth.value = newVal;
    auth.key = data.key;

    return auth.save();
  }

  public async update(data: AuthUpdateDto) {
    const user = data.source === 'user'
      ? await this.userService.findById(data.sourceId)
      : await this.performerService.findById(data.sourceId);
    if (!user) {
      throw new EntityNotFoundException();
    }
    await Promise.all([
      user.email && this.create({
        source: data.source,
        sourceId: data.sourceId,
        type: 'email',
        key: user.email,
        value: data.value
      }),
      user.username && this.create({
        source: data.source,
        sourceId: user._id,
        type: 'username',
        key: user.username,
        value: data.value
      })
    ]);
  }

  public async updateKey(data: AuthUpdateDto) {
    const auths = await this.authModel.find({
      source: data.source,
      sourceId: data.sourceId
    });

    const user = data.source === 'user'
      ? await this.userService.findById(data.sourceId)
      : await this.performerService.findById(data.sourceId);
    if (!user) return;

    await Promise.all(
      auths.map((auth) => {
        // eslint-disable-next-line no-param-reassign
        auth.key = auth.type === 'email' ? user.email : user.username;
        return auth.save();
      })
    );
  }

  public async findBySource(options: {
    source?: string;
    sourceId?: ObjectId;
    type?: string;
    key?: string;
  }): Promise<AuthModel | null> {
    return this.authModel.findOne(options);
  }

  public verifyPassword(pw: string, auth: AuthModel): boolean {
    if (!pw || !auth || !auth.salt) {
      return false;
    }
    return this.encryptPassword(pw, auth.salt) === auth.value;
  }

  public generateJWT(auth: any, options: any = {}): string {
    const newOptions = {
      // 30d, in miliseconds
      expiresIn: 60 * 60 * 24 * 7,
      ...(options || {})
    };
    return jwt.sign(
      {
        authId: auth._id,
        source: auth.source,
        sourceId: auth.sourceId
      },
      process.env.TOKEN_SECRET,
      {
        expiresIn: newOptions.expiresIn
      }
    );
  }

  public verifyJWT(token: string) {
    try {
      return jwt.verify(token, process.env.TOKEN_SECRET);
    } catch (e) {
      return false;
    }
  }

  public async getSourceFromJWT(jwtToken: string): Promise<any> {
    const decodded = this.verifyJWT(jwtToken);
    if (!decodded) {
      return null;
    }
    if (decodded.source === 'user') {
      const user = await this.userService.findById(decodded.sourceId);
      // TODO - check activated status here
      return user ? new UserDto(user).toResponse(true) : null;
    }
    if (decodded.source === 'performer') {
      const user = await this.performerService.findById(decodded.sourceId);
      return user ? new PerformerDto(user).toPublicDetailsResponse() : null;
    }

    return null;
  }

  public async forgot(
    auth: AuthModel,
    source: {
      _id: ObjectId;
      email: string;
    }
  ) {
    const token = StringHelper.randomString(14);
    await this.forgotModel.create({
      token,
      source: auth.source,
      sourceId: source._id,
      authId: auth._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const forgotLink = `${process.env.BASE_URL_PROD}/auth/password-change?token=${token}`;
    // const forgotLink = new URL(`auth/password-change?token=${token}`, getConfig('app').baseUrl).href;
    await this.mailService.sendEmail({
      subject: 'Recover password',
      to: source.email,
      data: {
        forgotLink
      },
      template: `<!DOCTYPE html>
      <html>
      <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
      * {
        box-sizing: border-box;
      }
      html{
        margin-left: 0;
        margin-right: 0;
      }
      a {
        padding:15px;
        text-decoration: none;
        text-align: center;
        color: #00B2FF;
        display: block;
        margin: 0 auto;
        width: 140px;
        border-radius: 30px;
        }
      @media only screen and (max-width:800px) {
        /* For tablets: */
        html {
          margin-left:0;
        margin-right:0;
        }
        a {
        padding:10px;
        text-decoration: none;
        text-align: center;
        color: #00B2FF;
        display: block;
        margin: 0 auto;
        width: 140px;
        border-radius: 30px;
        }
      }
      @media only screen and (max-width:500px) {
        /* For mobile phones: */
        html {
          width: 100%;
        margin-left:0;
        margin-right:0;
        }
        a {
        padding:10px;
        text-decoration: none;
        text-align: center;
        color: #00B2FF;
        display: block;
        margin: 0 auto;
        width: 140px;
        border-radius: 30px;
        }
      }
      </style>
      </head>
      <body style="font-family: Arial, Helvetica, sans-serif;">
        <img src="https://myadultfan.com/logo.png" width="35%" height="auto" style="margin-bottom: -15px; margin-top: -15px;">
        
        <img src="https://myadultfan.com/img-email.jpg" width="100%" height="auto" >    
        
        <p style="font-size: 14px; margin-left: 45px; margin-right: 40px; margin-top: 30px;">Hi,</p>
        <p style="font-size: 14px; margin-left: 45px; margin-right: 40px; margin-top: 30px;">
          Please click <a href="${forgotLink}">here</a> or copy link below to your browser to recover your password.</p>
        <p style="color: #00B2FF; margin-top: 30px; margin-bottom: 20px; text-align: center;">${forgotLink}</p>
        <span></span>
        <p style="font-size: 14px; margin-left: 45px; margin-right: 40px; margin-top: 30px;">
          Note: The link will be expried within 24hrs.</p>
      </body>
      </html>`
    });
    return true;
  }

  public async getForgot(token: string): Promise<ForgotModel> {
    return this.forgotModel.findOne({ token });
  }

  async sendVerificationEmail(source: { email: string, _id: ObjectId }, template = 'email-verification-performer'): Promise<void> {
    const verifications = await this.verificationModel.find({
      value: source.email.toLowerCase()
    });
    const token = StringHelper.randomString(15);
    if (!verifications.length) {
      await this.verificationModel.create({
        sourceId: source._id,
        sourceType: 'user',
        value: source.email,
        token
      });
      await this.verificationModel.create({
        sourceId: source._id,
        sourceType: 'performer',
        value: source.email,
        token
      });
    }
    if (verifications.length) {
      await Promise.all(verifications.map((verification) => {
        // eslint-disable-next-line no-param-reassign
        verification.token = token;
        // eslint-disable-next-line no-param-reassign
        verification.sourceId = source._id;
        // eslint-disable-next-line no-param-reassign
        verification.value = source.email;
        return verification.save();
      }));
    }

    // const verificationLink = new URL(`auth/email-verification?token=${token}`, getConfig('app').baseUrl).href;
    const verificationLink = `${process.env.BASE_URL_PROD}/auth/email-verification?token=${token}`;

    const siteName = await SettingService.getValueByKey(SETTING_KEYS.SITE_NAME) || process.env.DOMAIN;
    // await this.mailService.send({
    //   to: source.email,
    //   subject: 'Verify your email address',
    //   data: {
    //     source,
    //     verificationLink,
    //     siteName
    //   },
    //   template
    // });
    await this.mailService.sendEmail({
      from: process.env.SENDER_EMAIL,
      to: source.email,
      subject: 'Verify your email address',
      data: {
        source,
        verificationLink,
        siteName
      },
      template: `<!DOCTYPE html>
      <html>
      <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
      * {
        box-sizing: border-box;
      }
      html{
        margin-left: 0;
        margin-right: 0;
      }
      a {
        background: #00B2FF;
        padding:15px;
        text-decoration: none;
        text-align: center;
        color: white;
        display: block;
        margin: 0 auto;
        width: 140px;
        border-radius: 30px;
        }
      @media only screen and (max-width:800px) {
        /* For tablets: */
        html {
          margin-left:0;
        margin-right:0;
        }
        a {
        background: #00B2FF;
        padding:10px;
        text-decoration: none;
        text-align: center;
        color: white;
        display: block;
        margin: 0 auto;
        width: 140px;
        border-radius: 30px;
        }
      }
      @media only screen and (max-width:500px) {
        /* For mobile phones: */
        html {
          width: 100%;
        margin-left:0;
        margin-right:0;
        }
        a {
        background: #00B2FF;
        padding:10px;
        text-decoration: none;
        text-align: center;
        color: white;
        display: block;
        margin: 0 auto;
        width: 140px;
        border-radius: 30px;
        }
      }
      </style>
      </head>
      <body style="font-family: Arial, Helvetica, sans-serif;">
        <img src="https://myadultfan.com/logo.png" width="35%" height="auto" style="margin-bottom: -15px; margin-top: -15px;">
        
        <img src="https://myadultfan.com/img-email.jpg" width="100%" height="auto" >    
        <div style="background-color: #00B2FF; width: 100%; height: 42px;">
          <p style="color:white; text-align: center; margin: 0; padding-top: 14px; font-size: small;">
            Please Confirm Your Account To Get Started
          </p>
        </div>
        <h1 style="font-size: 18px; font-weight: 900; margin-left: 45px; margin-top: 30px;">Welcome to MyAdultFan</h1>
        <p style="font-size: 14px; margin-left: 45px; font-weight: 900">Hi there,</p>
        <p style="font-size: 14px; margin-left: 45px; margin-right: 40px; margin-bottom: 25px;">
          You are almost ready to start interacting with other users and another influencers. Please confirm your email address by clicking
          the link below.
        </p>
        <a href="${verificationLink}" target="_blank">Yes, it's me</a>
        <span></span>
        
        <p style="color: #00B2FF; margin-top: 30px; margin-bottom: 20px; text-align: center;">${verificationLink}</p>
      </body>
      </html>`
    });
  }

  async verifyEmail(token: string): Promise<void> {
    const verifications = await this.verificationModel.find({
      token
    });
    if (!verifications || !verifications.length) {
      throw new EntityNotFoundException();
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const verification of verifications) {
      if (verification.sourceType === 'user') {
        // eslint-disable-next-line no-await-in-loop
        const user = await this.userService.updateVerificationStatus(verification.sourceId);
      }
      if (verification.sourceType === 'performer') {
        // eslint-disable-next-line no-await-in-loop
        await this.performerService.updateVerificationStatus(verification.sourceId);
      }
      // eslint-disable-next-line no-param-reassign
      verification.verified = true;
      // eslint-disable-next-line no-await-in-loop
      const save = await verification.save();
    }
  }

  validateDocumentsRekognition(idVerification: string, idDocumentVerification: string) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      const IDDocument = await this.fileService.findById(idVerification);
      const verificationDocument = await this.fileService.findById(idDocumentVerification);
      // eslint-disable-next-line no-new
      const bucket = process.env.AWS_S3_BUCKET; // the bucketname without s3://
      const photoSource = IDDocument.absolutePath; // the name of file
      const photoTarget = verificationDocument.absolutePath;
      /* new AWS.Config({
        accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_S3_SECRET,
        region: process.env.AWS_REGION
      }); */
      const credentials = new AWS.SharedIniFileCredentials({ filename: path.join(process.cwd(), 'credentials'), profile: 'project1' });
      // const credentials = new AWS.SharedIniFileCredentials({ profile: 'project1' });
      AWS.config.credentials = credentials;
      AWS.config.update({ region: process.env.AWS_REGION });

      const client = new AWS.Rekognition();
      const params = {
        SourceImage: {
          S3Object: {
            Bucket: bucket,
            Name: photoSource
          }
        },
        TargetImage: {
          S3Object: {
            Bucket: bucket,
            Name: photoTarget
          }
        },
        SimilarityThreshold: 0
      };
      client.compareFaces(params, (err, response) => {
        if (err) {
          console.log(err, err.stack); // an error occurred
        } else {
          response.FaceMatches.forEach((data) => {
            const position = data.Face.BoundingBox;
            const similarity = data.Similarity;
            console.log(`The face at: ${position.Left}, ${position.Top} matches with ${similarity} % confidence`);
            resolve(response);
          }); // for response.faceDetails
        } // if
      });
      /* client.compareFaces(params, (err, response) => {
        console.log('ERR ', err);
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      }); */
    });
  }
}

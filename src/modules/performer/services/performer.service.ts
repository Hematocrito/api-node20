import {
  Injectable, Inject, NotAcceptableException, forwardRef, HttpException, BadRequestException
} from '@nestjs/common';
import { Model } from 'mongoose';
import {
  EntityNotFoundException, ForbiddenException, QueueEventService, QueueEvent, StringHelper
} from 'src/kernel';
import { ObjectId } from 'mongodb';
import { FileService } from 'src/modules/file/services';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { SubscriptionService } from 'src/modules/subscription/services/subscription.service';
import { FileDto } from 'src/modules/file';
import { UserDto } from 'src/modules/user/dtos';
import { AuthService } from 'src/modules/auth/services';
import { EVENT } from 'src/kernel/constants';
import { REF_TYPE } from 'src/modules/file/constants';
import { EmailHasBeenTakenException } from 'src/modules/user/exceptions';
import { MailerService } from 'src/modules/mailer';
import { UserService } from 'src/modules/user/services';
import { OFFLINE } from 'src/modules/stream/constant';
import { merge } from 'lodash';
import { isObjectId } from 'src/kernel/helpers/string.helper';
import { PerformerBlockService } from 'src/modules/block/services';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import {
  PERFORMER_UPDATE_STATUS_CHANNEL, DELETE_PERFORMER_CHANNEL, PERFORMER_CHANNEL, PERFORMER_STATUSES
} from '../constants';
import { PerformerDto } from '../dtos';
import {
  UsernameExistedException, EmailExistedException
} from '../exceptions';
import {
  PerformerModel, PaymentGatewaySettingModel, CommissionSettingModel, BankingModel
} from '../models';
import {
  PerformerCreatePayload,
  PerformerUpdatePayload,
  PerformerRegisterPayload,
  SelfUpdatePayload,
  PaymentGatewaySettingPayload,
  CommissionSettingPayload,
  BankingSettingPayload,
  PerformerStreamingPayload
} from '../payloads';
import {
  PERFORMER_BANKING_SETTING_MODEL_PROVIDER,
  PERFORMER_COMMISSION_SETTING_MODEL_PROVIDER,
  PERFORMER_MODEL_PROVIDER,
  PERFORMER_PAYMENT_GATEWAY_SETTING_MODEL_PROVIDER
} from '../providers';
import { PerformerAddDocumentsPayload } from '../payloads/performer-add-documents.payload';

@Injectable()
export class PerformerService {
  constructor(
    @Inject(forwardRef(() => PerformerBlockService))
    private readonly performerBlockService: PerformerBlockService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
    @Inject(PERFORMER_MODEL_PROVIDER)
    private readonly performerModel: Model<PerformerModel>,
    private readonly queueEventService: QueueEventService,
    private readonly mailService: MailerService,
    @Inject(PERFORMER_PAYMENT_GATEWAY_SETTING_MODEL_PROVIDER)
    private readonly paymentGatewaySettingModel: Model<PaymentGatewaySettingModel>,
    @Inject(PERFORMER_BANKING_SETTING_MODEL_PROVIDER)
    private readonly bankingSettingModel: Model<BankingModel>,
    @Inject(PERFORMER_COMMISSION_SETTING_MODEL_PROVIDER)
    private readonly commissionSettingModel: Model<CommissionSettingModel>,
    @Inject(forwardRef(() => SocketUserService))
    private readonly socketService: SocketUserService
  ) { }

  public async findById(
    id: string | ObjectId
  ): Promise<PerformerModel> {
    const model = await this.performerModel.findById(id);
    if (!model) return null;
    return model;
  }

  public async findOne(query) {
    const data = await this.performerModel.findOne(query).lean();
    return data;
  }

  public async update(id: string, data: any): Promise<void> {
    await this.performerModel.updateOne({ _id: id }, data);
  }

  public async getBankingSettings(performerId: ObjectId) {
    return this.bankingSettingModel.findOne({
      performerId
    });
  }

  public async checkExistedEmailorUsername(payload) {
    const data = payload.username ? await this.performerModel.countDocuments({ username: payload.username.trim().toLowerCase() })
      : await this.performerModel.countDocuments({ email: payload.email.toLowerCase() });
    return data;
  }

  public async findByUsername(
    username: string,
    countryCode?: string,
    currentUser?: UserDto
  ): Promise<PerformerDto> {
    const query = isObjectId(username) ? { _id: username } : { username: username.trim() };
    const model = await this.performerModel.findOne(query);
    if (!model) throw new EntityNotFoundException();
    const dto = new PerformerDto(model);
    if (countryCode && `${currentUser?._id}` !== `${model._id}`) {
      const isBlockedCountry = await this.performerBlockService.checkBlockedCountryByIp(model._id, countryCode);
      if (isBlockedCountry) throw new HttpException('Your country has been blocked by this model', 403);
    }
    if (currentUser && `${currentUser._id}` !== `${model._id}`) {
      const isBlocked = await this.performerBlockService.checkBlockedByPerformer(
        model._id,
        currentUser._id
      );
      if (isBlocked) throw new HttpException('You have been blocked by this model', 403);
    }
    if (currentUser?._id) {
      const checkSubscribe = await this.subscriptionService.checkSubscribed(model._id, currentUser._id);
      dto.isSubscribed = !!checkSubscribe;
    }
    if (model.avatarId) {
      const avatar = await this.fileService.findById(model.avatarId);
      dto.avatarPath = avatar ? avatar.path : null;
    }
    if (model.welcomeVideoId) {
      const welcomeVideo = await this.fileService.findById(
        model.welcomeVideoId
      );
      dto.welcomeVideoPath = welcomeVideo ? welcomeVideo.getUrl() : null;
    }
    await this.viewProfile(model._id);
    return dto;
  }

  public async findByEmail(email: string): Promise<PerformerDto> {
    if (!email) {
      return null;
    }
    const model = await this.performerModel.findOne({
      email: email.toLowerCase()
    });
    if (!model) return null;
    return new PerformerDto(model);
  }

  public async findByIds(ids: any[]) {
    const performers = await this.performerModel
      .find({
        _id: {
          $in: ids
        }
      })
      .lean()
      .exec();
    return performers.map((p) => new PerformerDto(p));
  }

  public async getDetails(id: string | ObjectId, jwtToken: string): Promise<PerformerDto> {
    const performer = await this.performerModel.findById(id);
    if (!performer) {
      throw new EntityNotFoundException();
    }
    const [
      avatar,
      documentVerification,
      idVerification,
      cover,
      welcomeVideo
    ] = await Promise.all([
      performer.avatarId ? this.fileService.findById(performer.avatarId) : null,
      performer.documentVerificationId
        ? this.fileService.findById(performer.documentVerificationId)
        : null,
      performer.idVerificationId
        ? this.fileService.findById(performer.idVerificationId)
        : null,
      performer.coverId ? this.fileService.findById(performer.coverId) : null,
      performer.welcomeVideoId
        ? this.fileService.findById(performer.welcomeVideoId)
        : null
    ]);

    // TODO - update kernel for file dto
    const dto = new PerformerDto(performer);
    dto.avatar = avatar ? FileDto.getPublicUrl(avatar.path) : null; // TODO - get default avatar
    dto.cover = cover ? FileDto.getPublicUrl(cover.path) : null;
    dto.welcomeVideoPath = welcomeVideo && welcomeVideo.getUrl();
    dto.idVerification = idVerification
      ? {
        _id: idVerification._id,
        url: jwtToken ? `${FileDto.getPublicUrl(idVerification.path)}?documentId=${idVerification._id}&token=${jwtToken}` : FileDto.getPublicUrl(idVerification.path),
        mimeType: idVerification.mimeType
      }
      : null;
    dto.documentVerification = documentVerification
      ? {
        _id: documentVerification._id,
        url: jwtToken ? `${FileDto.getPublicUrl(documentVerification.path)}?documentId=${documentVerification._id}&token=${jwtToken}` : FileDto.getPublicUrl(documentVerification.path),
        mimeType: documentVerification.mimeType
      }
      : null;

    dto.ccbillSetting = await this.paymentGatewaySettingModel.findOne({
      performerId: id,
      key: 'ccbill'
    });
    dto.paypalSetting = await this.paymentGatewaySettingModel.findOne({
      performerId: id,
      key: 'paypal'
    });
    dto.commissionSetting = await this.commissionSettingModel.findOne({
      performerId: id
    });
    dto.bankingInformation = await this.bankingSettingModel.findOne({
      performerId: id
    });
    dto.blockCountries = await this.performerBlockService.findOneBlockCountriesByQuery({
      sourceId: id
    });
    return dto;
  }

  public async userGetDetails(id: string | ObjectId, jwtToken: string): Promise<PerformerDto> {
    const performer = await this.performerModel.findById(id);
    if (!performer) {
      throw new EntityNotFoundException();
    }
    const [
      avatar,
      documentVerification,
      idVerification,
      cover,
      welcomeVideo
    ] = await Promise.all([
      performer.avatarId ? this.fileService.findById(performer.avatarId) : null,
      performer.documentVerificationId
        ? this.fileService.findById(performer.documentVerificationId)
        : null,
      performer.idVerificationId
        ? this.fileService.findById(performer.idVerificationId)
        : null,
      performer.coverId ? this.fileService.findById(performer.coverId) : null,
      performer.welcomeVideoId
        ? this.fileService.findById(performer.welcomeVideoId)
        : null
    ]);

    // TODO - update kernel for file dto
    const dto = new PerformerDto(performer);
    dto.avatar = avatar ? FileDto.getPublicUrl(avatar.path) : null; // TODO - get default avatar
    dto.cover = cover ? FileDto.getPublicUrl(cover.path) : null;
    dto.welcomeVideoPath = welcomeVideo && welcomeVideo.getUrl();
    dto.idVerification = idVerification
      ? {
        _id: idVerification._id,
        url: jwtToken ? `${FileDto.getPublicUrl(idVerification.path)}?documentId=${idVerification._id}&token=${jwtToken}` : FileDto.getPublicUrl(idVerification.path),
        mimeType: idVerification.mimeType
      }
      : null;
    dto.documentVerification = documentVerification
      ? {
        _id: documentVerification._id,
        url: jwtToken ? `${FileDto.getPublicUrl(documentVerification.path)}?documentId=${documentVerification._id}&token=${jwtToken}` : FileDto.getPublicUrl(documentVerification.path),
        mimeType: documentVerification.mimeType
      }
      : null;

    dto.paypalSetting = await this.paymentGatewaySettingModel.findOne({
      performerId: id,
      key: 'paypal'
    });
    dto.bankingInformation = await this.bankingSettingModel.findOne({
      performerId: id
    });
    dto.blockCountries = await this.performerBlockService.findOneBlockCountriesByQuery({
      sourceId: id
    });
    return dto;
  }

  public async delete(id: string) {
    if (!StringHelper.isObjectId(id)) throw new ForbiddenException();
    const performer = await this.performerModel.findById(id);
    if (!performer) throw new EntityNotFoundException();
    await this.performerModel.deleteOne({ _id: id });
    await this.queueEventService.publish(new QueueEvent({
      channel: DELETE_PERFORMER_CHANNEL,
      eventName: EVENT.DELETED,
      data: new PerformerDto(performer).toResponse()
    }));
    return { deleted: true };
  }

  public async create(
    payload: PerformerCreatePayload,
    user?: UserDto
  ): Promise<PerformerDto> {
    const data = {
      ...payload,
      updatedAt: new Date(),
      createdAt: new Date()
    } as any;
    const countPerformerUsername = await this.performerModel.countDocuments({
      username: payload.username.trim().toLowerCase()
    });
    const countUserUsername = await this.userService.checkExistedEmailorUsername({ username: payload.username });
    if (countPerformerUsername || countUserUsername) {
      throw new UsernameExistedException();
    }

    const countPerformerEmail = await this.performerModel.countDocuments({
      email: payload.email.toLowerCase()
    });
    const countUserEmail = await this.userService.checkExistedEmailorUsername({ email: payload.email });
    if (countPerformerEmail || countUserEmail) {
      throw new EmailExistedException();
    }

    if (payload.avatarId) {
      const avatar = await this.fileService.findById(payload.avatarId);
      if (!avatar) {
        throw new EntityNotFoundException('Avatar not found!');
      }
      // TODO - check for other storaged
      data.avatarPath = avatar.path;
    }

    if (payload.coverId) {
      const cover = await this.fileService.findById(payload.coverId);
      if (!cover) {
        throw new EntityNotFoundException('Cover not found!');
      }
      // TODO - check for other storaged
      data.coverPath = cover.path;
    }

    // TODO - check for category Id, studio
    if (user) {
      data.createdBy = user._id;
    }
    data.username = data.username.trim().toLowerCase();
    data.email = data.email.toLowerCase();
    if (data.dateOfBirth) {
      data.dateOfBirth = new Date(data.dateOfBirth);
    }
    if (!data.name) {
      data.name = data.firstName && data.lastName ? [data.firstName, data.lastName].join(' ') : 'No_display_name';
    }
    const performer = await this.performerModel.create(data);

    await Promise.all([
      payload.idVerificationId
      && this.fileService.addRef(payload.idVerificationId, {
        itemId: performer._id as any,
        itemType: REF_TYPE.PERFORMER
      }),
      payload.documentVerificationId
      && this.fileService.addRef(payload.documentVerificationId, {
        itemId: performer._id as any,
        itemType: REF_TYPE.PERFORMER
      }),
      payload.avatarId
      && this.fileService.addRef(payload.avatarId, {
        itemId: performer._id as any,
        itemType: REF_TYPE.PERFORMER
      })
    ]);

    // TODO - fire event?
    const dto = new PerformerDto(performer);
    await this.queueEventService.publish(
      new QueueEvent({
        channel: PERFORMER_CHANNEL,
        eventName: EVENT.CREATED,
        data: dto
      })
    );
    return dto;
  }

  public async register(
    payload: PerformerRegisterPayload
  ): Promise<PerformerDto> {
    const data = {
      ...payload,
      updatedAt: new Date(),
      createdAt: new Date()
    } as any;
    const countPerformerUsername = await this.performerModel.countDocuments({
      username: payload.username.trim().toLowerCase()
    });
    const countUserUsername = await this.userService.checkExistedEmailorUsername({ username: payload.username });
    if (countPerformerUsername || countUserUsername) {
      throw new UsernameExistedException();
    }

    const countPerformerEmail = await this.performerModel.countDocuments({
      email: payload.email.toLowerCase()
    });
    const countUserEmail = await this.userService.checkExistedEmailorUsername({ email: payload.email });
    if (countPerformerEmail || countUserEmail) {
      throw new EmailExistedException();
    }

    if (payload.avatarId) {
      const avatar = await this.fileService.findById(payload.avatarId);
      if (!avatar) {
        throw new EntityNotFoundException('Avatar not found!');
      }
      // TODO - check for other storaged
      data.avatarPath = avatar.path;
    }
    data.username = data.username.trim().toLowerCase();
    data.email = data.email.toLowerCase();
    if (!data.name) {
      data.name = data.firstName && data.lastName ? [data.firstName, data.lastName].join(' ') : 'No_display_name';
    }
    if (data.dateOfBirth) {
      data.dateOfBirth = new Date(data.dateOfBirth);
    }
    const performer = await this.performerModel.create(data);

    await Promise.all([
      payload.idVerificationId
      && this.fileService.addRef(payload.idVerificationId, {
        itemId: performer._id as any,
        itemType: REF_TYPE.PERFORMER
      }),
      payload.documentVerificationId
      && this.fileService.addRef(payload.documentVerificationId, {
        itemId: performer._id as any,
        itemType: REF_TYPE.PERFORMER
      }),
      payload.avatarId && this.fileService.addRef(payload.avatarId, {
        itemId: performer._id as any,
        itemType: REF_TYPE.PERFORMER
      })
    ]);
    const adminEmail = await SettingService.getValueByKey(SETTING_KEYS.ADMIN_EMAIL);
    adminEmail && await this.mailService.send({
      subject: 'New model sign up',
      to: adminEmail,
      data: performer,
      template: 'new-performer-notify-admin'
    });

    const dto = new PerformerDto(performer);
    await this.queueEventService.publish(
      new QueueEvent({
        channel: PERFORMER_CHANNEL,
        eventName: EVENT.CREATED,
        data: dto
      })
    );

    return dto;
  }

  public async adminUpdate(
    id: string | ObjectId,
    payload: PerformerUpdatePayload
  ): Promise<any> {
    const performer = await this.performerModel.findById(id);
    if (!performer) {
      throw new EntityNotFoundException();
    }

    const data = { ...payload } as any;
    if (!data.name) {
      data.name = [data.firstName || '', data.lastName || ''].join(' ');
    }

    if (data.email && data.email.toLowerCase() !== performer.email) {
      const emailCheck = await this.performerModel.countDocuments({
        email: data.email.toLowerCase(),
        _id: { $ne: performer._id }
      });
      const countUserEmail = await this.userService.checkExistedEmailorUsername({ email: data.email });
      if (emailCheck || countUserEmail) {
        throw new EmailExistedException();
      }
      data.email = data.email.toLowerCase();
    }

    if (data.username && data.username.trim() !== performer.username) {
      const usernameCheck = await this.performerModel.countDocuments({
        username: data.username.trim().toLowerCase(),
        _id: { $ne: performer._id }
      });
      const countUserUsername = await this.userService.checkExistedEmailorUsername({ username: data.username });
      if (usernameCheck || countUserUsername) {
        throw new UsernameExistedException();
      }
      data.username = data.username.trim().toLowerCase();
    }

    if (
      (payload.avatarId && !performer.avatarId)
      || (performer.avatarId
        && payload.avatarId
        && payload.avatarId !== performer.avatarId.toString())
    ) {
      const avatar = await this.fileService.findById(payload.avatarId);
      if (!avatar) {
        throw new EntityNotFoundException('Avatar not found!');
      }
      // TODO - check for other storaged
      data.avatarPath = avatar.path;
    }

    if (
      (payload.coverId && !performer.coverId)
      || (performer.coverId
        && payload.coverId
        && payload.coverId !== performer.coverId.toString())
    ) {
      const cover = await this.fileService.findById(payload.coverId);
      if (!cover) {
        throw new EntityNotFoundException('Cover not found!');
      }
      // TODO - check for other storaged
      data.coverPath = cover.path;
    }
    if (data.dateOfBirth) {
      data.dateOfBirth = new Date(data.dateOfBirth);
    }
    await this.performerModel.updateOne({ _id: id }, data);
    const newPerformer = await this.performerModel.findById(performer._id);
    const oldStatus = performer.status;
    // fire event that updated performer status
    if (data.status !== performer.status) {
      await this.queueEventService.publish(
        new QueueEvent({
          channel: PERFORMER_UPDATE_STATUS_CHANNEL,
          eventName: EVENT.UPDATED,
          data: {
            ...new PerformerDto(newPerformer),
            oldStatus
          }
        })
      );
    }
    // update auth key if email has changed
    if (data.email && data.email.toLowerCase() !== performer.email) {
      await this.authService.sendVerificationEmail({ email: newPerformer.email, _id: newPerformer._id });
      await this.authService.updateKey({
        source: 'performer',
        sourceId: newPerformer._id,
        type: 'email'
      });
    }
    // update auth key if username has changed
    if ((data.username && data.username.trim() !== performer.username)) {
      await this.authService.updateKey({
        source: 'performer',
        sourceId: newPerformer._id,
        type: 'username'
      });
    }
    await this.queueEventService.publish(
      new QueueEvent({
        channel: PERFORMER_CHANNEL,
        eventName: EVENT.UPDATED,
        data: new PerformerDto(newPerformer)
      })
    );
    return true;
  }

  public async selfUpdate(
    id: string | ObjectId,
    payload: SelfUpdatePayload
  ): Promise<boolean> {
    const performer = await this.performerModel.findById(id);
    if (!performer) {
      throw new EntityNotFoundException();
    }
    const data = { ...payload } as any;
    if (!data.name) {
      data.name = [data.firstName || '', data.lastName || ''].join(' ');
    }
    if (data.email && data.email.toLowerCase() !== performer.email) {
      const emailCheck = await this.performerModel.countDocuments({
        email: data.email.toLowerCase(),
        _id: { $ne: performer._id }
      });
      const countUserEmail = await this.userService.checkExistedEmailorUsername({ email: data.email });
      if (emailCheck || countUserEmail) {
        throw new EmailHasBeenTakenException();
      }
      data.email = data.email.toLowerCase();
    }

    if (data.username && data.username.trim() !== performer.username) {
      const usernameCheck = await this.performerModel.countDocuments({
        username: data.username.trim().toLowerCase(),
        _id: { $ne: performer._id }
      });
      const countUserUsername = await this.userService.checkExistedEmailorUsername({ username: data.username });
      if (usernameCheck || countUserUsername) {
        throw new UsernameExistedException();
      }
      data.username = data.username.trim().toLowerCase();
    }
    if (data.dateOfBirth) {
      data.dateOfBirth = new Date(data.dateOfBirth);
    }
    if (data.welcomeVideoId) {
      delete data.welcomeVideoId;
    }
    if (data.welcomeVideoPath) {
      delete data.welcomeVideoPath;
    }
    await this.performerModel.updateOne({ _id: id }, data);
    const newPerformer = await this.performerModel.findById(id);
    // update auth key if email has changed
    if (data.email && data.email.toLowerCase() !== performer.email) {
      await this.authService.sendVerificationEmail({ email: newPerformer.email, _id: newPerformer._id });
      await this.authService.updateKey({
        source: 'performer',
        sourceId: newPerformer._id,
        type: 'email'
      });
    }
    // update auth key if username has changed
    if (data.username && data.username.trim() !== performer.username) {
      await this.authService.updateKey({
        source: 'performer',
        sourceId: newPerformer._id,
        type: 'username'
      });
    }
    return true;
  }

  public async updateStatus(
    id: string | ObjectId,
    payload: PerformerStreamingPayload
  ): Promise<boolean> {
    const performer = await this.performerModel.findById(id);
    if (!performer) {
      throw new EntityNotFoundException();
    }
    const data = { ...payload } as any;

    await this.performerModel.updateOne({ _id: id }, data);
    const newPerformer = await this.performerModel.findById(id);

    return true;
  }

  public async userSwitchAccount(data): Promise<PerformerModel> {
    return this.performerModel.create(data);
  }

  public async updateAvatar(user: PerformerDto, file: FileDto) {
    await this.performerModel.updateOne(
      { _id: user._id },
      {
        avatarId: file._id,
        avatarPath: file.path
      }
    );
    await this.fileService.addRef(file._id, {
      itemId: user._id,
      itemType: REF_TYPE.PERFORMER
    });

    // resend user info?
    // TODO - check others config for other storage
    return file;
  }

  public async updateCover(user: PerformerDto, file: FileDto) {
    await this.performerModel.updateOne(
      { _id: user._id },
      {
        coverId: file._id,
        coverPath: file.path
      }
    );
    await this.fileService.addRef(file._id, {
      itemId: user._id,
      itemType: REF_TYPE.PERFORMER
    });

    return file;
  }

  public async updateWelcomeVideo(user: PerformerDto, file: FileDto) {
    await this.performerModel.updateOne(
      { _id: user._id },
      {
        $set: {
          welcomeVideoId: file._id,
          welcomeVideoPath: file.path
        }
      }
    );
    await this.fileService.addRef(file._id, {
      itemId: user._id,
      itemType: REF_TYPE.PERFORMER
    });
    await this.fileService.queueProcessVideo(file._id);
    if (user.welcomeVideoId) {
      await this.fileService.remove(user.welcomeVideoId);
    }
    return file;
  }

  public async checkSubscribed(performerId: string | ObjectId, user: UserDto) {
    const count = performerId && user ? await this.subscriptionService.checkSubscribed(
      performerId,
      user._id
    ) : 0;
    return { subscribed: count > 0 };
  }

  public async viewProfile(id: string | ObjectId) {
    return this.performerModel.updateOne(
      { _id: id },
      {
        $inc: { 'stats.views': 1 }
      }
    );
  }

  public async updateLastStreamingTime(
    id: string | ObjectId,
    streamTime: number
  ) {
    return this.performerModel.updateOne(
      { _id: id },
      {
        $set: { lastStreamingTime: new Date(), live: false, streamingStatus: OFFLINE },
        $inc: { 'stats.totalStreamTime': streamTime }
      }
    );
  }

  public async updateStats(
    id: string | ObjectId,
    payload: Record<string, number>
  ) {
    return this.performerModel.updateOne({ _id: id }, { $inc: payload });
  }

  public async goLive(id: string | ObjectId) {
    return this.performerModel.updateOne({ _id: id }, { $set: { live: true } });
  }

  public async setStreamingStatus(id: string | ObjectId, streamingStatus: string) {
    return this.performerModel.updateOne({ _id: id }, { $set: { streamingStatus } });
  }

  public async updatePaymentGateway(payload: PaymentGatewaySettingPayload) {
    let item = await this.paymentGatewaySettingModel.findOne({
      key: payload.key,
      performerId: payload.performerId
    });
    if (!item) {
      // eslint-disable-next-line new-cap
      item = new this.paymentGatewaySettingModel();
    }
    item.key = payload.key;
    item.performerId = payload.performerId as any;
    item.status = 'active';
    item.value = payload.value;
    return item.save();
  }

  public async getPaymentSetting(
    performerId: string | ObjectId,
    service
  ) {
    return this.paymentGatewaySettingModel.findOne({
      key: service,
      performerId
    });
  }

  public async updateSubscriptionStat(performerId: string | ObjectId, num = 1) {
    const performer = await this.performerModel.findById(performerId);
    if (!performer) return false;
    return this.performerModel.updateOne(
      { _id: performerId },
      {
        $inc: { 'stats.subscribers': num }
      }
    );
  }

  public async updateLikeStat(performerId: string | ObjectId, num = 1) {
    return this.performerModel.updateOne(
      { _id: performerId },
      {
        $inc: { 'stats.likes': num }
      }
    );
  }

  public async updateCommissionSetting(
    performerId: string,
    payload: CommissionSettingPayload
  ) {
    let item = await this.commissionSettingModel.findOne({
      performerId
    });
    if (!item) {
      // eslint-disable-next-line new-cap
      item = new this.commissionSettingModel();
    }

    merge(item, payload);
    return item.save();
  }

  public async updateBankingSetting(
    performerId: string,
    payload: BankingSettingPayload,
    currentUser: UserDto
  ) {
    if (
      (currentUser.roles
        && currentUser.roles.indexOf('admin') === -1
        && currentUser._id.toString() !== performerId)
      || (!currentUser.roles
        && currentUser
        && currentUser._id.toString() !== performerId)
    ) {
      throw new NotAcceptableException('Permission denied');
    }
    let item = await this.bankingSettingModel.findOne({
      performerId
    });
    if (!item) {
      // eslint-disable-next-line new-cap
      item = new this.bankingSettingModel(payload);
    }
    item.performerId = performerId as any;
    item.firstName = payload.firstName;
    item.lastName = payload.lastName;
    item.SSN = payload.SSN;
    item.bankName = payload.bankName;
    item.bankAccount = payload.bankAccount;
    item.bankRouting = payload.bankRouting;
    item.bankSwiftCode = payload.bankSwiftCode;
    item.address = payload.address;
    item.city = payload.city;
    item.state = payload.state;
    item.country = payload.country;
    return item.save();
  }

  public async updateVerificationStatus(
    userId: string | ObjectId
  ): Promise<any> {
    const user = await this.performerModel.findById(userId);
    if (!user) return true;
    const variable = this.performerModel.updateOne(
      {
        _id: userId
      },
      { verifiedEmail: true }
    );
    return variable;
  }

  public async getCommissions(performerId: string | ObjectId) {
    return this.commissionSettingModel.findOne({ performerId });
  }

  public async getMyCommissions(performerId: string | ObjectId) {
    const commission = await this.commissionSettingModel.findOne({ performerId });
    const settingMonthlyCommission = SettingService.getValueByKey(SETTING_KEYS.MONTHLY_SUBSCRIPTION_COMMISSION);
    const settingYearlyCommission = SettingService.getValueByKey(SETTING_KEYS.YEARLY_SUBSCRIPTION_COMMISSION);
    const settingProductCommission = SettingService.getValueByKey(SETTING_KEYS.PRODUCT_SALE_COMMISSION);
    const settingVideoCommission = SettingService.getValueByKey(SETTING_KEYS.VIDEO_SALE_COMMISSION);
    const settingPrivateChatCommission = SettingService.getValueByKey(SETTING_KEYS.PRIVATE_CHAT_COMMISSION);
    const settingTipCommission = SettingService.getValueByKey(SETTING_KEYS.TOKEN_TIP_COMMISSION);
    return {
      productSaleCommission: commission?.productSaleCommission || settingProductCommission,
      videoSaleCommission: commission?.videoSaleCommission || settingVideoCommission,
      yearlySubscriptionCommission: commission?.yearlySubscriptionCommission || settingYearlyCommission,
      monthlySubscriptionCommission: commission?.monthlySubscriptionCommission || settingMonthlyCommission,
      privateChatCommission: commission?.privateChatCommission || settingPrivateChatCommission,
      tokenTipCommission: commission?.tokenTipCommission || settingTipCommission
    };
  }

  public async checkAuthDocument(req: any, user: UserDto) {
    const { query } = req;
    if (!query.documentId) {
      throw new ForbiddenException();
    }
    if (user.roles && user.roles.indexOf('admin') > -1) {
      return true;
    }
    // check type video
    const file = await this.fileService.findById(query.documentId);
    if (!file || !file.refItems || (file.refItems[0] && file.refItems[0].itemType !== REF_TYPE.PERFORMER)) return false;
    if (file.refItems && file.refItems[0].itemId && user._id.toString() === file.refItems[0].itemId.toString()) {
      return true;
    }
    throw new ForbiddenException();
  }

  public async updatePreApprovalCode(performerId: string | ObjectId, data: Partial<Record<'monthlyPreApprovalRequestCode' | 'yearlyPreApprovalRequestCode', string>>) {
    return this.performerModel.updateOne({ _id: performerId }, { $set: data });
  }

  public async findByPreApprovalCode(performerId: string | ObjectId, data: Partial<Record<'monthlyPreApprovalRequestCode' | 'yearlyPreApprovalRequestCode', string>>) {
    return this.performerModel.findOne({ _id: performerId, ...data });
  }

  public async increaseBalance(id: string | ObjectId, amount: number, withStats = true) {
    const $inc = withStats ? {
      balance: amount,
      'stats.totalTokenEarned': amount > 0 ? Math.abs(amount) : 0,
      'stats.totalTokenSpent': amount <= 0 ? Math.abs(amount) : 0
    } : { balance: amount };
    await this.performerModel.updateOne(
      { _id: id },
      {
        $inc
      }
    );

    const newBalance = await this.performerModel.findOne({ _id: id }).select('balance');
    if (newBalance) {
      await this.socketService.emitToUsers(id, 'balance_update', {
        balance: newBalance.balance
      });
    }

    return true;
  }

  public async setBalance(id: string | ObjectId, balance: number) {
    await this.performerModel.updateOne(
      { _id: id },
      {
        balance
      }
    );

    await this.socketService.emitToUsers(id, 'balance_update', {
      balance
    });

    return true;
  }

  public async addDocuments(
    id: string | ObjectId,
    payload: PerformerAddDocumentsPayload | any
  ): Promise<any> {
    const performer = await this.performerModel.findById(id);
    if (!performer) {
      throw new EntityNotFoundException();
    }

    await Promise.all([
      payload.idVerificationId
      && this.fileService.addRef(payload.idVerificationId, {
        itemId: performer._id as any,
        itemType: REF_TYPE.PERFORMER
      }),
      payload.documentVerificationId
      && this.fileService.addRef(payload.documentVerificationId, {
        itemId: performer._id as any,
        itemType: REF_TYPE.PERFORMER
      }),
      payload.avatarId && this.fileService.addRef(payload.avatarId, {
        itemId: performer._id as any,
        itemType: REF_TYPE.PERFORMER
      })
    ]);

    return new PerformerDto(performer);
  }
}

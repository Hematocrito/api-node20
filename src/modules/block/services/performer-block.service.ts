import {
  Injectable,
  Inject,
  forwardRef
} from '@nestjs/common';
import { Model } from 'mongoose';
import {
  EntityNotFoundException
} from 'src/kernel';
import { ObjectId } from 'mongodb';
import { UserDto } from 'src/modules/user/dtos';
import { UserService } from 'src/modules/user/services';
import { uniq } from 'lodash';
import { MailerService } from 'src/modules/mailer';
import { PerformerBlockUserDto } from '../dtos';
import {
  PerformerBlockCountryModel,
  PerformerBlockUserModel
} from '../models';
import {
  PerformerBlockCountriesPayload,
  PerformerBlockUserPayload,
  GetBlockListUserPayload
} from '../payloads';
import {
  PERFORMER_BLOCK_COUNTRY_PROVIDER,
  PERFORMER_BLOCK_USER_PROVIDER
} from '../providers';

@Injectable()
export class PerformerBlockService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(PERFORMER_BLOCK_COUNTRY_PROVIDER)
    private readonly performerBlockCountryModel: Model<PerformerBlockCountryModel>,
    @Inject(PERFORMER_BLOCK_USER_PROVIDER)
    private readonly blockedByPerformerModel: Model<PerformerBlockUserModel>,
    private readonly mailService: MailerService
  ) { }

  public findBlockCountriesByQuery(query) {
    return this.performerBlockCountryModel.find(query);
  }

  public findOneBlockCountriesByQuery(query) {
    return this.performerBlockCountryModel.findOne(query);
  }

  public listByQuery(query) {
    return this.blockedByPerformerModel.find(query);
  }

  public async checkBlockedCountryByIp(
    performerId: string | ObjectId,
    countryCode: string
  ): Promise<boolean> {
    const blockCountries = await this.performerBlockCountryModel.findOne({
      sourceId: performerId
    });
    if (
      blockCountries
      && blockCountries.countryCodes
      && blockCountries.countryCodes.length
    ) {
      return blockCountries.countryCodes.indexOf(countryCode) > -1;
    }

    return false;
  }

  public async checkBlockedByPerformer(
    performerId: string | ObjectId,
    userId: string | ObjectId
  ): Promise<boolean> {
    const blocked = await this.blockedByPerformerModel.countDocuments({
      sourceId: performerId,
      targetId: userId
    });

    return blocked > 0;
  }

  public async performerBlockCountries(
    payload: PerformerBlockCountriesPayload,
    user: UserDto
  ) {
    const { countryCodes } = payload;
    const item = await this.performerBlockCountryModel.findOne({
      sourceId: user._id
    });
    if (item) {
      return this.performerBlockCountryModel.updateOne({ sourceId: user._id }, { countryCodes });
    }
    return this.performerBlockCountryModel.create({
      source: 'performer',
      sourceId: user._id,
      countryCodes
    });
  }

  public async blockUser(
    user: UserDto,
    payload: PerformerBlockUserPayload
  ) {
    const blocked = await this.blockedByPerformerModel.findOne({
      sourceId: user._id,
      targetId: payload.targetId
    });
    if (blocked) {
      return blocked;
    }
    const newBlock = await this.blockedByPerformerModel.create({
      ...payload,
      source: 'performer',
      sourceId: user._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    const target = await this.userService.findById(payload.targetId);
    // mailer
    target?.email && await this.mailService.send({
      subject: 'Model block',
      to: target.email,
      data: {
        userName: target.name || target.username || `${target.firstName} ${target.lastName}` || 'there',
        message: `${user.name || user.username || 'Model'} has blocked you`
      },
      template: 'block-user-notification'
    });
    return newBlock;
  }

  public async unblockUser(user: UserDto, targetId: string) {
    const blocked = await this.blockedByPerformerModel.findOne({
      sourceId: user._id,
      targetId
    });
    if (!blocked) {
      throw new EntityNotFoundException();
    }
    await blocked.remove();
    const target = await this.userService.findById(targetId);
    // mailer
    target?.email && await this.mailService.send({
      subject: 'Model unblock',
      to: target.email,
      data: {
        userName: target.name || target.username || `${target.firstName} ${target.lastName}` || 'there',
        message: `${user.name || user.username || 'Model'} has unblocked you`
      },
      template: 'block-user-notification'
    });
    return { unlocked: true };
  }

  public async getBlockedUsers(
    user: UserDto,
    req: GetBlockListUserPayload
  ) {
    const query = {
      sourceId: user._id
    } as any;
    let sort = {
      createdAt: -1
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy || 'updatedAt']: req.sort || -1
      };
    }
    const [data, total] = await Promise.all([
      this.blockedByPerformerModel
        .find(query)
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.blockedByPerformerModel.countDocuments(query)
    ]);
    const list = data.map((d) => new PerformerBlockUserDto(d));
    const targetIds = uniq(data.map((d) => d.targetId));
    const users = await this.userService.findByIds(targetIds);
    list.forEach((u) => {
      const info = users.find((s) => `${s._id}` === `${u.targetId}`);
      // eslint-disable-next-line no-param-reassign
      u.targetInfo = info ? new UserDto(info).toResponse() : null;
    });
    return {
      data: list,
      total
    };
  }
}

import {
  Controller,
  Injectable,
  UseGuards,
  Body,
  Post,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Put,
  Get,
  Param,
  Query,
  UseInterceptors,
  Request
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse, PageableData, getConfig } from 'src/kernel';
import { CurrentUser, Roles, AuthService } from 'src/modules/auth';
import { UserDto } from 'src/modules/user/dtos';
import { AuthCreateDto } from 'src/modules/auth/dtos';
import { FileUploadInterceptor, FileUploaded, FileDto } from 'src/modules/file';
import { REF_TYPE } from 'src/modules/file/constants';
import { FileService } from 'src/modules/file/services';
import {
  PerformerCreatePayload,
  PerformerUpdatePayload,
  PerformerSearchPayload,
  PaymentGatewaySettingPayload,
  CommissionSettingPayload,
  BankingSettingPayload
} from '../payloads';
import { PerformerDto, IPerformerResponse } from '../dtos';
import { PerformerService, PerformerSearchService } from '../services';

@Injectable()
@Controller('admin/performers')
export class AdminPerformerController {
  constructor(
    private readonly performerService: PerformerService,
    private readonly performerSearchService: PerformerSearchService,
    private readonly authService: AuthService,
    private readonly fileService: FileService
  ) {}

  @Get('/search')
  @UseGuards(RoleGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async search(
    @Query() req: PerformerSearchPayload
  ): Promise<DataResponse<PageableData<IPerformerResponse>>> {
    const data = await this.performerSearchService.adminSearch(req);
    return DataResponse.ok(data);
  }

  @Post()
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @CurrentUser() currentUser: UserDto,
    @Body() payload: PerformerCreatePayload
  ): Promise<DataResponse<PerformerDto>> {
    // password should be created in auth module only
    const { password } = payload;
    // eslint-disable-next-line no-param-reassign
    delete payload.password;
    const performer = await this.performerService.create(payload, currentUser);

    if (password) {
      performer.email && await this.authService.create(
        new AuthCreateDto({
          source: 'performer',
          sourceId: performer._id,
          type: 'email',
          key: performer.email.toLowerCase(),
          value: password
        })
      );
      performer.username && await this.authService.create(
        new AuthCreateDto({
          source: 'performer',
          sourceId: performer._id,
          type: 'username',
          key: performer.username.toLowerCase().trim(),
          value: password
        })
      );
    }

    return DataResponse.ok(performer);
  }

  @Put('/:id')
  @Roles('admin')
  @UseGuards(RoleGuard)
  async updateUser(
    @Body() payload: PerformerUpdatePayload,
    @Param('id') performerId: string,
    @Request() req: any
  ): Promise<DataResponse<PerformerDto>> {
    await this.performerService.adminUpdate(performerId, payload);
    const performer = await this.performerService.getDetails(performerId, req.jwToken);
    return DataResponse.ok(performer);
  }

  @Get('/:id/view')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  async getDetails(
    @Param('id') performerId: string,
    @Request() req: any
  ): Promise<DataResponse<IPerformerResponse>> {
    const performer = await this.performerService.getDetails(performerId, req.jwToken);
    // TODO - check roles or other to response info
    const data = performer.toResponse(true, true);
    return DataResponse.ok(data);
  }

  @Post('/documents/upload/:performerId')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UseInterceptors(
    FileUploadInterceptor('performer-document', 'file', {
      destination: getConfig('file').documentDir
    })
  )
  async uploadPerformerDocument(
    @FileUploaded() file: FileDto,
    @Param('performerId') id: any,
    @Request() req: any
  ): Promise<any> {
    await this.fileService.addRef(file._id, {
      itemId: id,
      itemType: REF_TYPE.PERFORMER
    });
    return DataResponse.ok({
      ...file,
      url: `${file.getUrl()}?documentId=${file._id}&token=${req.jwToken}`
    });
  }

  @Post('/avatar/upload')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UseInterceptors(
    FileUploadInterceptor('avatar', 'avatar', {
      destination: getConfig('file').avatarDir,
      generateThumbnail: true,
      replaceByThumbnail: true,
      thumbnailSize: getConfig('image').avatar
    })
  )
  async uploadPerformerAvatar(@FileUploaded() file: FileDto): Promise<any> {
    // TODO - define url for perfomer id if have?
    return DataResponse.ok({
      ...file,
      url: file.getUrl()
    });
  }

  @Post('/cover/upload')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UseInterceptors(
    FileUploadInterceptor('cover', 'cover', {
      destination: getConfig('file').coverDir
    })
  )
  async uploadPerformerCover(@FileUploaded() file: FileDto): Promise<any> {
    // TODO - define url for perfomer id if have?
    return DataResponse.ok({
      ...file,
      url: file.getUrl()
    });
  }

  @Put('/:id/payment-gateway-settings')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  async updatePaymentGatewaySetting(
    @Body() payload: PaymentGatewaySettingPayload
  ) {
    const data = await this.performerService.updatePaymentGateway(payload);
    return DataResponse.ok(data);
  }

  @Put('/:id/commission-settings')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  async updateCommissionSetting(
    @Param('id') performerId: string,
    @Body() payload: CommissionSettingPayload
  ) {
    const data = await this.performerService.updateCommissionSetting(
      performerId,
      payload
    );
    return DataResponse.ok(data);
  }

  @Put('/:id/banking-settings')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  async updateBankingSetting(
    @Param('id') performerId: string,
    @Body() payload: BankingSettingPayload,
    @CurrentUser() user: UserDto
  ) {
    const data = await this.performerService.updateBankingSetting(
      performerId,
      payload,
      user
    );
    return DataResponse.ok(data);
  }
}

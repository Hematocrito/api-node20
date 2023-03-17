import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  UseGuards,
  Body,
  Put,
  Param,
  Post
} from '@nestjs/common';
import { DataResponse } from 'src/kernel';
import { SettingService } from '../services';
import { SettingDto } from '../dtos';
import { RoleGuard } from '../../auth/guards';
import { Roles } from '../../auth';
import { SettingCreatePayload, SettingUpdatePayload } from '../payloads';
import { SettingModel } from '../models';

@Injectable()
@Controller('admin/settings')
export class AdminSettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get('')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  async getAdminSettings(
    @Query('group') group: string
  ): Promise<DataResponse<SettingDto[]>> {
    const settings = await this.settingService.getEditableSettings(group);
    return DataResponse.ok(settings);
  }

  @Post('create')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  async createSetting(
    @Body() value: SettingCreatePayload
  ) {
    const data = await this.settingService.create(value);
    return DataResponse.ok(data);
  }

  @Put('/:key')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  async update(
    @Param('key') key: string,
    @Body() value: SettingUpdatePayload
  ): Promise<DataResponse<SettingDto>> {
    const data = await this.settingService.update(key, value);
    return DataResponse.ok(data);
  }
}

import {
  Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, UsePipes, ValidationPipe
} from '@nestjs/common';
import { DataResponse, PageableData } from 'src/kernel';
import { Roles } from 'src/modules/auth';
import { RoleGuard } from 'src/modules/auth/guards';
import { WalletPackageDto } from '../dtos';
import { WalletPackageCreatePayload, WalletPackageSearchRequest, WalletPackageUpdatePayload } from '../payloads';
import { WalletPackageSearchService } from '../services/wallet-package-search.service';
import { WalletPackageService } from '../services/wallet-package.service';

@Controller('/admin/wallet-package')
export class AdminWalletPackageController {
  constructor(
    private readonly walletPackageService: WalletPackageService,
    private readonly walletPackageSearchService: WalletPackageSearchService
  ) {}

  @Get('/admin')
  @UseGuards(RoleGuard)
  @Roles('admin')
  @UsePipes(new ValidationPipe({ transform: true }))
  async adminSearch(
    @Query() payload: WalletPackageSearchRequest
  ): Promise<DataResponse<PageableData<WalletPackageDto>>> {
    const result = await this.walletPackageSearchService.search(payload);
    return DataResponse.ok(result);
  }

  @Post('/')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() payload: WalletPackageCreatePayload): Promise<DataResponse<WalletPackageDto>> {
    const result = await this.walletPackageService.create(payload);
    return DataResponse.ok(new WalletPackageDto(result));
  }

  @Get('/:id/view')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async detail(@Param('id') id: string): Promise<DataResponse<WalletPackageDto>> {
    const result = await this.walletPackageService.findById(id);
    return DataResponse.ok(new WalletPackageDto(result));
  }

  @Delete('/:id')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async del(@Param('id') id: string): Promise<DataResponse<WalletPackageDto>> {
    const result = await this.walletPackageService.delete(id);
    return DataResponse.ok(new WalletPackageDto(result));
  }

  @Put('/:id')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(@Param('id') id: string, @Body() payload: WalletPackageUpdatePayload): Promise<DataResponse<WalletPackageDto>> {
    await this.walletPackageService.update(id, payload);
    const result = await this.walletPackageService.findById(id);
    return DataResponse.ok(new WalletPackageDto(result));
  }
}

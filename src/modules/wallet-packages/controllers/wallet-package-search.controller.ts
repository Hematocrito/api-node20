import {
  Controller,
  Get,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { DataResponse, PageableData } from 'src/kernel';
import { WalletPackageDto } from '../dtos';
import { WalletPackageSearchRequest } from '../payloads';
import { WalletPackageSearchService } from '../services/wallet-package-search.service';

@Controller('/wallet-package')
export class WalletPackageSearchController {
  constructor(private readonly walletPackageSearchService: WalletPackageSearchService) {}

  @Get('/')
  @UsePipes(new ValidationPipe({ transform: true }))
  async search(
    @Query() payload: WalletPackageSearchRequest
  ): Promise<DataResponse<PageableData<WalletPackageDto>>> {
    const result = await this.walletPackageSearchService.search(payload);
    return DataResponse.ok(result);
  }
}

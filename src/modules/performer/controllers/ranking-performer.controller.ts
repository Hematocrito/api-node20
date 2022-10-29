import {
  Controller,
  Injectable,
  UseGuards,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Get,
  Request
} from '@nestjs/common';
import { LoadUser } from 'src/modules/auth/guards';
import { DataResponse } from 'src/kernel';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS, WHITELIST_IPS } from 'src/modules/settings/constants';
import { UserDto } from 'src/modules/user/dtos';
import { CurrentUser } from 'src/modules/auth';
import { CountryService } from 'src/modules/utils/services';
import { RankingPerformerService } from '../services/ranking-performer.service';
import { PerformerSearchService } from '../services';

@Injectable()
@Controller('ranking-performers')
export class RankingPerformerController {
  constructor(
    private readonly performerSearchService: PerformerSearchService,
    private readonly rankingPerformerService: RankingPerformerService,
    private readonly settingService: SettingService,
    private readonly countryService: CountryService
  ) {}

  @Get('/')
  @UseGuards(LoadUser)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async getAll(
    @Request() req: any,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const enableRanking = await this.settingService.getKeyValue(SETTING_KEYS.ENABLE_MODEL_RANKING_HOME_PAGE);

    if (enableRanking) {
      const data = await this.rankingPerformerService.getAll();
      return DataResponse.ok(data.map((d) => ({
        ...d,
        _id: d.performerId
      })));
    }

    const ipClient = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    let countryCode = null;
    if (WHITELIST_IPS.indexOf(ipClient) === -1) {
      const userCountry = await this.countryService.findCountryByIP(ipClient) as any;
      if (userCountry?.status === 'success' && userCountry?.countryCode) {
        countryCode = userCountry.countryCode;
      }
    }
    const data = await this.performerSearchService.search({
      limit: 16,
      sortBy: 'subscriber'
    } as any, user, countryCode);
    return DataResponse.ok(data.data);
  }
}

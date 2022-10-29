import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Get,
  UseGuards,
  Query
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse, PageableData } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth';
import { EarningService } from '../services/earning.service';
import {
  EarningSearchRequest
} from '../payloads';
import { EarningDto, IEarningStatResponse } from '../dtos/earning.dto';
import { UserDto } from '../../user/dtos';

@Injectable()
@Controller('earning')
export class EarningController {
  constructor(private readonly earningService: EarningService) {}

  @Get('/performer/search')
  @Roles('performer')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async search(
    @Query() req: EarningSearchRequest,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<PageableData<EarningDto>>> {
    req.performerId = user._id;
    const data = await this.earningService.search(req);
    return DataResponse.ok(data);
  }

  @Get('/performer/stats')
  @Roles('performer')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async performerStats(
    @Query() req: EarningSearchRequest,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<IEarningStatResponse>> {
    req.performerId = user._id;
    const data = await this.earningService.stats(req);
    return DataResponse.ok(data);
  }
}

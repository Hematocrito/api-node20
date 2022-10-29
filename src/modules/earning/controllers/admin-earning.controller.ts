import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Get,
  UseGuards,
  Query,
  Param,
  Post,
  Body
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse, PageableData } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth';
import { EarningService } from '../services/earning.service';
import {
  EarningSearchRequest,
  UpdateEarningStatusPayload
} from '../payloads';
import { EarningDto, IEarningStatResponse } from '../dtos/earning.dto';
import { UserDto } from '../../user/dtos';

@Injectable()
@Controller('admin/earning')
export class AdminEarningController {
  constructor(private readonly earningService: EarningService) {}

  @Get('/search')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async adminSearch(
    @Query() req: EarningSearchRequest,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<PageableData<EarningDto>>> {
    const data = await this.earningService.search(req, true);
    return DataResponse.ok(data);
  }

  @Get('/stats')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async adminStats(
    @Query() req: EarningSearchRequest
  ): Promise<DataResponse<IEarningStatResponse>> {
    const data = await this.earningService.stats(req);
    return DataResponse.ok(data);
  }

  @Post('/update-status')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateStats(
    @Body() payload: UpdateEarningStatusPayload
  ): Promise<DataResponse<IEarningStatResponse>> {
    const data = await this.earningService.updatePaidStatus(payload);
    return DataResponse.ok(data);
  }

  @Get('/:id')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async details(@Param('id') id: string): Promise<DataResponse<EarningDto>> {
    const data = await this.earningService.details(id);
    return DataResponse.ok(data);
  }
}

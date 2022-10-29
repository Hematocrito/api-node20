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
import { UserDto } from 'src/modules/user/dtos';
import { PayoutRequestService } from '../services/payout-request.service';
import { PayoutRequestDto } from '../dtos/payout-request.dto';
import { PayoutRequestSearchPayload } from '../payloads/payout-request.payload';
import { SOURCE_TYPE } from '../constants';

@Injectable()
@Controller('payout-requests')
export class PayoutRequestSearchController {
  constructor(
    private readonly payoutRequestService: PayoutRequestService
  ) {}

  @Get('/performer/search')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async performerSearch(
    @Query() req: PayoutRequestSearchPayload,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<PageableData<PayoutRequestDto>>> {
    req.sourceId = user._id;
    req.source = SOURCE_TYPE.PERFORMER;
    const data = await this.payoutRequestService.search(req);
    return DataResponse.ok(data);
  }
}

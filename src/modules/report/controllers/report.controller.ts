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
  Post,
  Body,
  Delete,
  Param,
  Put
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse, PageableData } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth';
import { ReportService } from '../services/report.service';
import { ReportCreatePayload, ReportSearchRequestPayload } from '../payloads';
import { ReportDto } from '../dtos/report.dto';
import { UserDto } from '../../user/dtos';

@Injectable()
@Controller('reports')
export class ReportController {
  constructor(
    private readonly reportService: ReportService
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('user')
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @CurrentUser() user: UserDto,
    @Body() payload: ReportCreatePayload
  ): Promise<DataResponse<ReportDto>> {
    const data = await this.reportService.create(payload, user);
    return DataResponse.ok(data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('admin')
  @UsePipes(new ValidationPipe({ transform: true }))
  async remove(
    @Param('id') id: string
  ): Promise<DataResponse<any>> {
    const data = await this.reportService.remove(id);
    return DataResponse.ok(data);
  }

  @Put('/:id/reject')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('admin')
  @UsePipes(new ValidationPipe({ transform: true }))
  async rejectReport(
    @Param('id') id: string
  ): Promise<DataResponse<any>> {
    const data = await this.reportService.rejectReport(id);
    return DataResponse.ok(data);
  }

  @Get('')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('admin')
  @UsePipes(new ValidationPipe({ transform: true }))
  async adminList(
    @Query() query: ReportSearchRequestPayload
  ): Promise<DataResponse<PageableData<ReportDto>>> {
    const data = await this.reportService.adminSearch(query);
    return DataResponse.ok(data);
  }

  @Get('/performers')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  @UsePipes(new ValidationPipe({ transform: true }))
  async performerList(
    @Query() query: ReportSearchRequestPayload,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<PageableData<ReportDto>>> {
    const data = await this.reportService.performerSearch(query, user);
    return DataResponse.ok(data);
  }
}

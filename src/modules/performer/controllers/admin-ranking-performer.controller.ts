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
  Delete
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse } from 'src/kernel';
import { Roles } from 'src/modules/auth';
import { RankingPerformerService } from '../services/ranking-performer.service';

@Injectable()
@Controller('admin/ranking-performers')
export class AdminRankingPerformerController {
  constructor(
    private readonly rankingPerformerService: RankingPerformerService
  ) {}

  @Get('/')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async getAll(): Promise<DataResponse<any>> {
    const data = await this.rankingPerformerService.getAll();
    return DataResponse.ok(data);
  }

  @Post()
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() payload: any): Promise<DataResponse<any>> {
    const data = await this.rankingPerformerService.create(payload);

    return DataResponse.ok(data);
  }

  @Put('/:id')
  @Roles('admin')
  @UseGuards(RoleGuard)
  async update(
    @Body() payload: any,
    @Param('id') id: string
  ): Promise<DataResponse<any>> {
    const data = await this.rankingPerformerService.update(id, payload);
    return DataResponse.ok(data);
  }

  @Delete('/:id')
  @Roles('admin')
  @UseGuards(RoleGuard)
  async delete(
    @Param('id') id: string
  ): Promise<DataResponse<any>> {
    const data = await this.rankingPerformerService.delete(id);
    return DataResponse.ok(data);
  }
}

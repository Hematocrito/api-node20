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
  Param,
  Get,
  Query,
  Delete
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth';
import { UserDto } from 'src/modules/user/dtos';
import { CategoryService } from '../services';
import { CategoryUpdatePayload } from '../payloads/category-update.payload';
import { CategoryCreatePayload } from '../payloads/category-create.payload';
import { CategorySearchRequest } from '../payloads/category-search.request';

@Injectable()
@Controller('admin/categories')
export class AdminCategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post('')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async createProductCategory(
    @Body() payload: CategoryCreatePayload,
    @CurrentUser() creator: UserDto
  ): Promise<any> {
    const resp = await this.categoryService.create(payload, creator);
    return DataResponse.ok(resp);
  }

  @Put('/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateGallery(
    @Param('id') id: string,
    @Body() payload: CategoryUpdatePayload,
    @CurrentUser() creator: UserDto
  ): Promise<any> {
    const resp = await this.categoryService.update(id, payload, creator);
    return DataResponse.ok(resp);
  }

  @Get('/search')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async searchCategory(@Query() req: CategorySearchRequest): Promise<any> {
    const resp = await this.categoryService.search(req);
    return DataResponse.ok(resp);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async view(@Param('id') id: string): Promise<any> {
    const resp = await this.categoryService.findByIdOrAlias(id);
    return DataResponse.ok(resp);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  async delete(@Param('id') id: string) {
    const details = await this.categoryService.delete(id);
    return DataResponse.ok(details);
  }
}

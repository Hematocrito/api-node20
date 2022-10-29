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
  Query,
  UseInterceptors,
  Delete
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse, getConfig } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth';
import {
  MultiFileUploadInterceptor, FilesUploaded, FileUploadInterceptor, FileUploaded, FileDto
} from 'src/modules/file';
import { UserDto } from 'src/modules/user/dtos';
import { ProductService } from '../services/product.service';
import { ProductCreatePayload, ProductSearchRequest, ProductUpdatePayload } from '../payloads';
import { ProductSearchService } from '../services/product-search.service';

@Injectable()
@Controller('performer/performer-assets/products')
export class PerformerProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly productSearchService: ProductSearchService
  ) {}

  @Post('/image')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UseInterceptors(
    FileUploadInterceptor('performer-product-image', 'image', {
      destination: getConfig('file').imageDir
    })
  )
  @UsePipes(new ValidationPipe({ transform: true }))
  async uploadImage(
    @FileUploaded() file: FileDto
  ): Promise<any> {
    await this.productService.validatePhoto(file);
    return DataResponse.ok({
      success: true,
      ...file.toResponse(),
      url: file.getUrl()
    });
  }

  @Post('/')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UseInterceptors(
    MultiFileUploadInterceptor([
      {
        type: 'performer-product-digital',
        fieldName: 'digitalFile',
        options: {
          destination: getConfig('file').digitalProductDir
        }
      }

    ])
  )
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @FilesUploaded() files: Record<string, any>,
    @Body() payload: ProductCreatePayload,
    @CurrentUser() creator: UserDto
  ): Promise<any> {
    // eslint-disable-next-line no-param-reassign
    payload.performerId = creator._id;
    const resp = await this.productService.create(
      payload,
      files.digitalFile,
      creator
    );
    return DataResponse.ok(resp);
  }

  @Put('/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UseInterceptors(
    MultiFileUploadInterceptor([
      {
        type: 'performer-product-digital',
        fieldName: 'digitalFile',
        options: {
          destination: getConfig('file').digitalProductDir
        }
      }

    ])
  )
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Param('id') id: string,
    @FilesUploaded() files: Record<string, any>,
    @Body() payload: ProductUpdatePayload,
    @CurrentUser() updater: UserDto
  ): Promise<any> {
    // eslint-disable-next-line no-param-reassign
    payload.performerId = updater._id;
    const resp = await this.productService.update(
      id,
      payload,
      files.digitalFile,
      updater
    );
    return DataResponse.ok(resp);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  async delete(@Param('id') id: string): Promise<any> {
    const resp = await this.productService.delete(id);
    return DataResponse.ok(resp);
  }

  @Get('/search')
  @UseGuards(RoleGuard)
  @Roles('performer')
  @HttpCode(HttpStatus.OK)
  async search(
    @Query() req: ProductSearchRequest,
    @CurrentUser() user: UserDto
  ): Promise<any> {
    const resp = await this.productSearchService.performerSearch(req, user);
    return DataResponse.ok(resp);
  }

  @Get('/:id/view')
  @UseGuards(RoleGuard)
  @Roles('performer')
  @HttpCode(HttpStatus.OK)
  async details(
    @Param('id') id: string
  ): Promise<any> {
    const resp = await this.productService.getDetails(id);
    return DataResponse.ok(resp);
  }
}

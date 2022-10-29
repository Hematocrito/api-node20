import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  Query,
  UseGuards,
  HttpException,
  Request,
  Inject,
  forwardRef
} from '@nestjs/common';
import { DataResponse } from 'src/kernel';
import { AuthGuard, LoadUser } from 'src/modules/auth/guards';
import { CurrentUser } from 'src/modules/auth';
import { AuthService } from 'src/modules/auth/services';
import { UserDto } from 'src/modules/user/dtos';
import { ProductService } from '../services/product.service';
import { ProductSearchService } from '../services/product-search.service';
import { ProductSearchRequest } from '../payloads';

@Injectable()
@Controller('user/performer-assets/products')
export class UserProductsController {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    private readonly productService: ProductService,
    private readonly productSearchService: ProductSearchService
  ) {}

  @Get('/search')
  @UseGuards(LoadUser)
  @HttpCode(HttpStatus.OK)
  async search(
    @Query() req: ProductSearchRequest,
    @CurrentUser() user: UserDto
  ) {
    const resp = await this.productSearchService.userSearch(req, user);
    const data = resp.data.map((d) => d.toPublic());
    return DataResponse.ok({
      total: resp.total,
      data
    });
  }

  @Get('/:id')
  @UseGuards(LoadUser)
  @HttpCode(HttpStatus.OK)
  async details(
    @Param('id') id: string
  ) {
    const details = await this.productService.userGetDetails(id);
    // TODO - filter here
    return DataResponse.ok(details.toPublic());
  }

  @Get('/:id/download-link')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async getDownloadLink(
    @Param('id') id: string,
    @CurrentUser() user: UserDto
  ) {
    const downloadLink = await this.productService.generateDownloadLink(id, user._id);
    return DataResponse.ok({
      downloadLink
    });
  }

  @Get('/auth/check')
  @HttpCode(HttpStatus.OK)
  async checkAuth(
    @Request() request: any
  ) {
    if (!request.query.token) throw new HttpException('Forbiden', 403);
    const user = await this.authService.getSourceFromJWT(request.query.token as string);
    if (!user) {
      throw new HttpException('Forbiden', 403);
    }
    const valid = await this.productService.checkAuth(request, user);
    return DataResponse.ok(valid);
  }
}

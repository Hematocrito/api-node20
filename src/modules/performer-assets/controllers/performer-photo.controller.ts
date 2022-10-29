import {
  Controller,
  Injectable,
  UseGuards,
  Body,
  Post,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  Put,
  Param,
  Delete,
  Get,
  Query,
  Request
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse, getConfig, ForbiddenException } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth';
import { MultiFileUploadInterceptor, FilesUploaded } from 'src/modules/file';
import { UserDto } from 'src/modules/user/dtos';
import { PhotoCreatePayload, PhotoUpdatePayload, PhotoSearchRequest } from '../payloads';
import { PhotoService } from '../services/photo.service';
import { PhotoSearchService } from '../services/photo-search.service';
import { AuthService } from '../../auth/services';

@Injectable()
@Controller('performer/performer-assets/photos')
export class PerformerPhotoController {
  constructor(
    private readonly photoService: PhotoService,
    private readonly photoSearchService: PhotoSearchService,
    private readonly authService: AuthService
  ) {}

  @Post('/upload')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  @UseInterceptors(
    // TODO - check and support multiple files!!!
    MultiFileUploadInterceptor([
      {
        type: 'performer-photo',
        fieldName: 'photo',
        options: {
          destination: getConfig('file').photoProtectedDir,
          thumbnailSize: {
            width: 10,
            height: 10
          },
          generateThumbnail: true
        }
      }
    ])
  )
  async upload(
    @FilesUploaded() files: Record<string, any>,
    @Body() payload: PhotoCreatePayload,
    @CurrentUser() creator: UserDto
  ): Promise<any> {
    const resp = await this.photoService.create(
      files.photo,
      payload,
      creator
    );
    return DataResponse.ok(resp);
  }

  @Put('/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  async update(
    @Param('id') id: string,
    @Body() payload: PhotoUpdatePayload,
    @CurrentUser() updater: UserDto
  ) {
    const details = await this.photoService.updateInfo(id, payload, updater);
    return DataResponse.ok(details);
  }

  @Post('/set-cover/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  async setCoverGallery(
    @Param('id') id: string,
    @CurrentUser() updater: UserDto
  ) {
    const data = await this.photoService.setCoverGallery(id, updater);
    return DataResponse.ok(data);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  async delete(@Param('id') id: string) {
    const details = await this.photoService.delete(id);
    return DataResponse.ok(details);
  }

  @Get('/search')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  async search(
    @Query() query: PhotoSearchRequest,
    @CurrentUser() user: UserDto,
    @Request() req: any
  ) {
    const details = await this.photoSearchService.performerSearch(query, user, req.jwToken);
    return DataResponse.ok(details);
  }

  @Get('/:id/view')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  async details(@Param('id') id: string) {
    const details = await this.photoService.details(id);
    return DataResponse.ok(details);
  }

  @Get('/auth/check')
  @HttpCode(HttpStatus.OK)
  async checkAuth(
    @Request() req: any
  ) {
    if (!req.query.token) throw new ForbiddenException();
    const user = await this.authService.getSourceFromJWT(req.query.token);
    if (!user) {
      throw new ForbiddenException();
    }
    const valid = await this.photoService.checkAuth(req, user);
    return DataResponse.ok(valid);
  }
}

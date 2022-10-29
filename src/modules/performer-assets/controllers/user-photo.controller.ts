import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  UseGuards,
  Query,
  Request
} from '@nestjs/common';
import { DataResponse } from 'src/kernel';
import { STATUS } from 'src/kernel/constants';
import { CurrentUser } from 'src/modules/auth';
import { LoadUser } from 'src/modules/auth/guards';
import { UserDto } from 'src/modules/user/dtos';
import { PhotoService } from '../services/photo.service';
import { PhotoSearchService } from '../services/photo-search.service';
import { PhotoSearchRequest } from '../payloads';
import { AuthService } from '../../auth/services';

@Injectable()
@Controller('user/performer-assets/photos')
export class UserPhotosController {
  constructor(
    private readonly photoService: PhotoService,
    private readonly photoSearchService: PhotoSearchService,
    private readonly authService: AuthService
  ) {}

  @Get('/')
  @UseGuards(LoadUser)
  @HttpCode(HttpStatus.OK)
  async search(
    @Query() query: PhotoSearchRequest,
    @Request() req: any
  ) {
    // eslint-disable-next-line no-param-reassign
    query.status = STATUS.ACTIVE;
    const auth = req.authUser && { _id: req.authUser.authId, source: req.authUser.source, sourceId: req.authUser.sourceId };
    const jwToken = auth && this.authService.generateJWT(auth, { expiresIn: 4 * 60 * 60 });
    const data = await this.photoSearchService.searchPhotos(req.authUser.sourceId, query, jwToken);
    return DataResponse.ok(data);
  }

  @Get()
  @UseGuards(LoadUser)
  @HttpCode(HttpStatus.OK)
  async list(
    @Query() query: PhotoSearchRequest,
    @Request() req: any
  ) {
    const auth = req.authUser && { _id: req.authUser.authId, source: req.authUser.source, sourceId: req.authUser.sourceId };
    const jwToken = auth && this.authService.generateJWT(auth, { expiresIn: 1 * 60 * 60 });
    const data = await this.photoSearchService.getModelPhotosWithGalleryCheck(query, jwToken);
    return DataResponse.ok(data);
  }

  @Get('/:id/view')
  @UseGuards(LoadUser)
  @HttpCode(HttpStatus.OK)
  async details(@Param('id') id: string, @CurrentUser() user: UserDto) {
    // TODO - filter for subscriber
    const details = await this.photoService.details(id, user);
    return DataResponse.ok(details);
  }
}

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
  Request
} from '@nestjs/common';
import { AuthGuard } from 'src/modules/auth/guards';
import { DataResponse, PageableData } from 'src/kernel';
import { CurrentUser } from 'src/modules/auth';
import { AuthService } from 'src/modules/auth/services';
import { ReactionService } from '../services/reaction.service';
import { ReactionCreatePayload, ReactionSearchRequestPayload } from '../payloads';
import { ReactionDto } from '../dtos/reaction.dto';
import { UserDto } from '../../user/dtos';
import { REACTION } from '../constants';

@Injectable()
@Controller('reactions')
export class ReactionController {
  constructor(
    private readonly authService: AuthService,
    private readonly reactionService: ReactionService
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @CurrentUser() user: UserDto,
    @Body() payload: ReactionCreatePayload
  ): Promise<DataResponse<ReactionDto>> {
    const data = await this.reactionService.create(payload, user);
    return DataResponse.ok(data);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async remove(
    @CurrentUser() user: UserDto,
    @Body() payload: ReactionCreatePayload
  ): Promise<DataResponse<boolean>> {
    console.log('Entrando...');
    const data = await this.reactionService.remove(payload, user);
    return DataResponse.ok(data);
  }

  @Get('/videos/favourites')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async favouriteVideos(
    @Query() req: ReactionSearchRequestPayload,
    @Request() request: any
  ): Promise<DataResponse<PageableData<ReactionDto>>> {
    const auth = request.authUser && { _id: request.authUser.authId, source: request.authUser.source, sourceId: request.authUser.sourceId };
    const jwToken = request.authUser && this.authService.generateJWT(auth, { expiresIn: 1 * 60 * 60 });
    req.action = REACTION.FAVOURITE;
    req.createdBy = request.user._id;
    const data = await this.reactionService.getListVideos(req, request.user, jwToken);
    return DataResponse.ok(data);
  }

  @Get('/videos/watch-later')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async watchLaterVideos(
    @Query() req: ReactionSearchRequestPayload,
    @Request() request: any
  ): Promise<DataResponse<PageableData<ReactionDto>>> {
    const auth = request.authUser && { _id: request.authUser.authId, source: request.authUser.source, sourceId: request.authUser.sourceId };
    const jwToken = request.authUser && this.authService.generateJWT(auth, { expiresIn: 1 * 60 * 60 });
    req.action = REACTION.WATCH_LATER;
    req.createdBy = request.user._id;
    const data = await this.reactionService.getListVideos(req, request.user, jwToken);
    return DataResponse.ok(data);
  }
}

import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Request,
  Body,
  ForbiddenException,
  Post,
  Param,
  Query
} from '@nestjs/common';
import { DataResponse } from 'src/kernel';
import { AuthGuard } from 'src/modules/auth/guards';
import { toObjectId } from 'src/kernel/helpers/string.helper';
import { CurrentUser } from 'src/modules/auth';
import { CountryService } from 'src/modules/utils/services';
import { UserDto } from 'src/modules/user/dtos';
import { ConversationDto } from '../dtos';
import { ConversationService } from '../services/conversation.service';
import { ConversationCreatePayload, ConversationSearchPayload } from '../payloads';

@Injectable()
@Controller('conversations')
export class ConversationController {
  constructor(
    private readonly countryService: CountryService,
    private readonly conversationService: ConversationService
  ) {}

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async getListOfCurrentUser(
    @Query() query: ConversationSearchPayload,
    @Request() req: any
  ): Promise<DataResponse<ConversationDto[]>> {
    let ipClient = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    if (ipClient.substr(0, 7) === '::ffff:') {
      ipClient = ipClient.substr(7);
    }
    // const ipClient = '115.75.211.252';
    const whiteListIps = ['127.0.0.1', '0.0.0.1'];
    let countryCode = null;
    if (whiteListIps.indexOf(ipClient) === -1) {
      const userCountry = await this.countryService.findCountryByIP(ipClient) as any;
      if (userCountry?.status === 'success' && userCountry?.countryCode) {
        countryCode = userCountry.countryCode;
      }
    }
    const items = await this.conversationService.getList(query, {
      source: req.authUser.source,
      sourceId: req.authUser.sourceId
    }, countryCode);
    return DataResponse.ok(items);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async getDetails(
    @Param('id') conversationId: string,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.conversationService.findById(conversationId, user);
    return DataResponse.ok(new ConversationDto(data));
  }

  @Post('/')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async create(
    @Body() payload: ConversationCreatePayload,
    @CurrentUser() user: any
  ) {
    if (payload.sourceId === user._id.toString()) {
      throw new ForbiddenException();
    }

    const sender = {
      source: user.isPerformer ? 'performer' : 'user',
      sourceId: user._id
    };
    const receiver = {
      source: payload.source,
      sourceId: toObjectId(payload.sourceId)
    };
    const conversation = await this.conversationService.createPrivateConversation(
      sender,
      receiver
    );

    return DataResponse.ok(conversation);
  }

  @Get('/stream/public/:performerId')
  @HttpCode(HttpStatus.OK)
  async findConversation(
    @Param('performerId') performerId: string
  ): Promise<DataResponse<any>> {
    const data = await this.conversationService.findPerformerPublicConversation(performerId);
    return DataResponse.ok(new ConversationDto(data));
  }

  @Get('/stream/:streamId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async getByStream(
    @Param('streamId') streamId: string
  ): Promise<DataResponse<any>> {
    const data = await this.conversationService.getPrivateConversationByStreamId(streamId);
    return DataResponse.ok(new ConversationDto(data));
  }
}

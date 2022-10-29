import {
  Injectable,
  Inject,
  forwardRef,
  ForbiddenException,
  HttpException
} from '@nestjs/common';
import { PerformerService } from 'src/modules/performer/services';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { EntityNotFoundException } from 'src/kernel';
import { v4 as uuidv4 } from 'uuid';
import { ConversationService } from 'src/modules/message/services';
import { SubscriptionService } from 'src/modules/subscription/services/subscription.service';
import { UserDto } from 'src/modules/user/dtos';
import { RedisService } from 'nestjs-redis';
import { RequestService } from './request.service';
import { SocketUserService } from '../../socket/services/socket-user.service';
import {
  PRIVATE_CHAT,
  PUBLIC_CHAT,
  defaultStreamValue,
  BroadcastType
} from '../constant';
import { IStream, StreamDto } from '../dtos';
import { StreamModel } from '../models';
import { STREAM_MODEL_PROVIDER } from '../providers/stream.provider';
import {
  StreamOfflineException,
  StreamServerErrorException
} from '../exceptions';
import { TokenNotEnoughtException } from '../exceptions/token-not-enought';

export const REDIS_PERFORMER_PUBLIC_STREAM = 'performer_public_streams';
export const REDIS_PERFORMER_PRIVATE_STREAM = 'performer_private_streams';

@Injectable()
export class StreamService {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(STREAM_MODEL_PROVIDER)
    private readonly streamModel: Model<StreamModel>,
    private readonly conversationService: ConversationService,
    private readonly socketUserService: SocketUserService,
    private readonly subscriptionService: SubscriptionService,
    private readonly requestService: RequestService,
    private readonly redisService: RedisService
  ) {
    this.resetPerformerLivestreamList();
  }

  public async findById(id: string | ObjectId): Promise<StreamModel> {
    const stream = await this.streamModel.findOne({ _id: id });
    if (!stream) {
      throw new EntityNotFoundException();
    }
    return stream;
  }

  public async findBySessionId(sessionId: string): Promise<StreamModel> {
    const stream = await this.streamModel.findOne({ sessionId });
    if (!stream) {
      throw new EntityNotFoundException();
    }

    return stream;
  }

  public async findByPerformerId(
    performerId: string | ObjectId,
    payload?: Partial<StreamDto>
  ): Promise<StreamModel> {
    const stream = await this.streamModel.findOne({ performerId, ...payload });
    return stream;
  }

  public async getSessionId(
    performerId: string | ObjectId,
    type: string
  ): Promise<string> {
    let stream = await this.streamModel.findOne({ performerId, type });
    if (!stream) {
      const data: IStream = {
        sessionId: uuidv4(),
        performerId,
        type
      };
      stream = await this.streamModel.create(data);
    }

    return stream.sessionId;
  }

  public async goLive(performerId: ObjectId) {
    let stream = await this.streamModel.findOne({
      performerId,
      type: PUBLIC_CHAT
    });
    if (!stream) {
      const data: IStream = {
        sessionId: uuidv4(),
        performerId,
        type: PUBLIC_CHAT
      };
      stream = await this.streamModel.create(data);
    }

    let conversation = await this.conversationService.findOne({
      type: 'stream_public',
      performerId
    });
    if (!conversation) {
      conversation = await this.conversationService.createStreamConversation(
        new StreamDto(stream)
      );
    }

    const data = {
      ...defaultStreamValue,
      streamId: stream._id,
      name: stream._id,
      description: '',
      type: BroadcastType.LiveStream,
      status: 'finished'
    };
    const result = await this.requestService.create(data);
    if (result.status) {
      throw new StreamServerErrorException({
        message: result.data?.data?.message,
        error: result.data,
        status: result.data?.status
      });
    }
    return { conversation, sessionId: stream._id };
  }

  public async joinPublicChat(performerId: string | ObjectId) {
    const stream = await this.streamModel.findOne({
      performerId,
      type: PUBLIC_CHAT
    });
    if (!stream) {
      throw new EntityNotFoundException();
    }

    if (!stream.isStreaming) {
      throw new StreamOfflineException();
    }

    return { sessionId: stream._id };
  }

  public async requestPrivateChat(
    user: UserDto,
    performerId: string | ObjectId
  ) {
    const performer = await this.performerService.findById(performerId);
    if (!performer) {
      throw new EntityNotFoundException();
    }

    const subscribed = await this.subscriptionService.checkSubscribed(
      performerId,
      user._id
    );
    if (!subscribed) {
      throw new HttpException('Please subscribe model to send private request', 403);
    }

    if (user.balance < performer.privateChatPrice) {
      throw new TokenNotEnoughtException();
    }

    const isOnline = await this.socketUserService.isOnline(performer._id);
    if (!isOnline) {
      throw new HttpException(`${performer.username} is offline`, 400);
    }

    const data: IStream = {
      sessionId: uuidv4(),
      performerId,
      userIds: [user._id],
      type: PRIVATE_CHAT,
      isStreaming: true
    };
    const stream = await this.streamModel.create(data);
    const recipients = [
      { source: 'performer', sourceId: new ObjectId(performerId) },
      { source: 'user', sourceId: user._id }
    ];
    const conversation = await this.conversationService.createStreamConversation(
      new StreamDto(stream),
      recipients
    );

    const {
      username, email, avatar, _id, balance
    } = user;
    await this.socketUserService.emitToUsers(
      performerId,
      'private-chat-request',
      {
        user: {
          username, email, avatar, _id, balance
        },
        streamId: stream._id,
        conversationId: conversation._id
      }
    );

    return { conversation, sessionId: stream.sessionId };
  }

  public async accpetPrivateChat(id: string, performerId: ObjectId) {
    const conversation = await this.conversationService.findById(id);
    if (!conversation) {
      throw new EntityNotFoundException();
    }

    const recipent = conversation.recipients.find(
      (r) => r.sourceId.toString() === performerId.toString()
        && r.source === 'performer'
    );
    if (!recipent) {
      throw new ForbiddenException();
    }

    const stream = await this.findById(conversation.streamId);
    if (!stream && stream.performerId !== performerId) {
      throw new EntityNotFoundException();
    }

    if (!stream.isStreaming) {
      throw new StreamOfflineException();
    }

    return { conversation, sessionId: stream.sessionId };
  }

  public async getToken() {
    return null;
  }

  public async addPerformerLivestreamList(performerId: string | ObjectId, publicOrPrivate = 'public') {
    const room = publicOrPrivate === 'public' ? REDIS_PERFORMER_PUBLIC_STREAM : REDIS_PERFORMER_PRIVATE_STREAM;
    const redisClient = this.redisService.getClient();
    await redisClient.sadd(room, performerId.toString());
  }

  public async removePerformerLivestreamList(performerId) {
    const redisClient = this.redisService.getClient();
    await Promise.all([
      redisClient.srem(REDIS_PERFORMER_PRIVATE_STREAM, performerId.toString()),
      redisClient.srem(REDIS_PERFORMER_PUBLIC_STREAM, performerId.toString())
    ]);
  }

  // apply single instance only!!
  public async resetPerformerLivestreamList() {
    const redisClient = this.redisService.getClient();
    await Promise.all([
      redisClient.del(REDIS_PERFORMER_PRIVATE_STREAM),
      redisClient.del(REDIS_PERFORMER_PUBLIC_STREAM)
    ]);
  }

  public async checkPerformerStreaming(performerId) {
    const redisClient = this.redisService.getClient();
    const [hasPublic, hasPrivate] = await Promise.all([
      redisClient.sismember(REDIS_PERFORMER_PUBLIC_STREAM, performerId.toString()),
      redisClient.sismember(REDIS_PERFORMER_PRIVATE_STREAM, performerId.toString())
    ]);

    if (hasPublic) return 'public';
    if (hasPrivate) return 'private';
    return null;
  }
}

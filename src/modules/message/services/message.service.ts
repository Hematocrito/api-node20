import {
  Injectable,
  Inject,
  ForbiddenException,
  HttpException
} from '@nestjs/common';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { QueueEventService, EntityNotFoundException } from 'src/kernel';
import { UserDto } from 'src/modules/user/dtos';
import { FileDto } from 'src/modules/file';
import { FileService } from 'src/modules/file/services';
import { REF_TYPE } from 'src/modules/file/constants';
import { PerformerDto } from 'src/modules/performer/dtos';
import { UserService } from 'src/modules/user/services';
import { PerformerService } from 'src/modules/performer/services';
import { uniq } from 'lodash';
import { MessageModel, IRecipient } from '../models';
import { MESSAGE_MODEL_PROVIDER } from '../providers/message.provider';
import { MessageCreatePayload } from '../payloads/message-create.payload';
import {
  MESSAGE_CHANNEL,
  MESSAGE_EVENT,
  MESSAGE_PRIVATE_STREAM_CHANNEL,
  MESSAGE_TYPE
} from '../constants';
import { MessageDto } from '../dtos';
import { ConversationService } from './conversation.service';
import { MessageListRequest } from '../payloads/message-list.payload';

@Injectable()
export class MessageService {
  constructor(
    @Inject(MESSAGE_MODEL_PROVIDER)
    private readonly messageModel: Model<MessageModel>,
    private readonly queueEventService: QueueEventService,
    private readonly fileService: FileService,
    private readonly conversationService: ConversationService,
    private readonly userService: UserService,
    private readonly performerService: PerformerService
  ) { }

  public async createPrivateMessage(
    conversationId: string | ObjectId,
    payload: MessageCreatePayload,
    sender: IRecipient
  ) {
    const conversation = await this.conversationService.findById(
      conversationId
    );
    if (!conversation) {
      throw new EntityNotFoundException();
    }
    const found = conversation.recipients.find(
      (recipient) => recipient.sourceId.toString() === sender.sourceId.toString()
    );
    if (!found) {
      throw new EntityNotFoundException();
    }
    const message = await this.messageModel.create({
      ...payload,
      senderId: sender.sourceId,
      senderSource: sender.source,
      conversationId: conversation._id
    });
    const dto = new MessageDto(message);
    await this.queueEventService.publish({
      channel: MESSAGE_CHANNEL,
      eventName: MESSAGE_EVENT.CREATED,
      data: dto
    });
    return dto;
  }

  public async createPrivateFileMessage(
    sender: IRecipient,
    recipient: IRecipient,
    file: FileDto,
    payload: MessageCreatePayload
  ): Promise<MessageDto> {
    const conversation = await this.conversationService.createPrivateConversation(
      sender,
      recipient
    );
    if (!file) throw new HttpException('File is valid!', 400);
    if (!file.isImage()) {
      await this.fileService.removeIfNotHaveRef(file._id);
      throw new HttpException('Invalid image!', 400);
    }
    const message = await this.messageModel.create({
      ...payload,
      type: MESSAGE_TYPE.PHOTO,
      senderId: sender.sourceId,
      fileId: file._id,
      senderSource: sender.source,
      conversationId: conversation._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await this.fileService.addRef(file._id, {
      itemType: REF_TYPE.MESSAGE,
      itemId: message._id
    });
    const dto = new MessageDto(message);
    dto.imageUrl = file.getUrl();
    await this.queueEventService.publish({
      channel: MESSAGE_CHANNEL,
      eventName: MESSAGE_EVENT.CREATED,
      data: dto
    });
    return dto;
  }

  public async loadMessages(req: MessageListRequest, user: UserDto) {
    const conversation = await this.conversationService.findById(
      req.conversationId
    );
    if (!conversation) {
      throw new EntityNotFoundException();
    }

    const found = conversation.recipients.find(
      (recipient) => recipient.sourceId.toString() === user._id.toString()
    );
    if (!found) {
      throw new EntityNotFoundException();
    }

    const query = { conversationId: conversation._id };
    const [data, total] = await Promise.all([
      this.messageModel
        .find(query)
        .sort({ createdAt: -1 })
        .lean()
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.messageModel.countDocuments(query)
    ]);

    const fileIds = data.map((d) => d.fileId);
    const senderIds = uniq(data.map((d) => d.senderId));
    const files = await this.fileService.findByIds(fileIds);
    const senders = await Promise.all([
      this.userService.findByIds(senderIds),
      this.performerService.findByIds(senderIds)
    ]);
    const messages = data.map((m) => new MessageDto(m));
    messages.forEach((message) => {
      if (message.fileId) {
        const file = files.find(
          (f) => f._id.toString() === message.fileId.toString()
        );
        // eslint-disable-next-line no-param-reassign
        message.imageUrl = file ? file.getUrl() : null;
      }
      const senderInfo = message.senderSource === 'user'
        ? senders[0].find((u) => u._id.equals(message.senderId))
        : senders[1].find((p) => p._id.equals(message.senderId));
      // eslint-disable-next-line no-param-reassign
      message.senderInfo = {
        username: senderInfo.username
      };
    });

    return {
      data: messages,
      total
    };
  }

  public async deleteMessage(messageId: string, user: UserDto) {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new EntityNotFoundException();
    }
    if (
      user.roles
      && !user.roles.includes('admin')
      && message.senderId.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException();
    }
    await message.remove();
    if (message.type === MESSAGE_TYPE.PHOTO) {
      message.fileId && (await this.fileService.remove(message.fileId));
    }

    await this.queueEventService.publish({
      channel: MESSAGE_CHANNEL,
      eventName: MESSAGE_EVENT.DELETED,
      data: new MessageDto(message)
    });
    // Emit event to user
    await this.queueEventService.publish({
      channel: MESSAGE_PRIVATE_STREAM_CHANNEL,
      eventName: MESSAGE_EVENT.DELETED,
      data: new MessageDto(message)
    });
    return message;
  }

  public async deleteAllMessageInConversation(
    conversationId: string,
    user: any
  ) {
    const conversation = await this.conversationService.findById(
      conversationId
    );
    if (!conversation) {
      throw new EntityNotFoundException();
    }
    if (
      user.isPerformer
      && conversation.performerId.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException();
    }

    await this.messageModel.deleteMany({ conversationId: conversation._id });
    return { success: true };
  }

  public async createPublicStreamMessageFromConversation(
    conversationId: string | ObjectId,
    payload: MessageCreatePayload,
    sender: IRecipient,
    user: UserDto
  ) {
    const conversation = await this.conversationService.findById(
      conversationId
    );
    if (!conversation) {
      throw new EntityNotFoundException();
    }

    const message = await this.messageModel.create({
      ...payload,
      senderId: sender.sourceId,
      senderSource: sender.source,
      conversationId: conversation._id
    });
    await message.save();

    const dto = new MessageDto(message);
    dto.senderInfo = user;
    await this.queueEventService.publish({
      channel: MESSAGE_PRIVATE_STREAM_CHANNEL,
      eventName: MESSAGE_EVENT.CREATED,
      data: dto
    });
    return dto;
  }

  public async createStreamMessageFromConversation(
    conversationId: string | ObjectId,
    payload: MessageCreatePayload,
    sender: IRecipient
  ) {
    const conversation = await this.conversationService.findById(
      conversationId
    );
    if (!conversation) {
      throw new EntityNotFoundException();
    }

    const found = conversation.recipients.find(
      (recipient) => recipient.sourceId.toString() === sender.sourceId.toString()
    );
    if (!found) {
      throw new EntityNotFoundException();
    }

    const message = await this.messageModel.create({
      ...payload,
      senderId: sender.sourceId,
      senderSource: sender.source,
      conversationId: conversation._id
    });
    await message.save();

    const dto = new MessageDto(message);
    await this.queueEventService.publish({
      channel: MESSAGE_PRIVATE_STREAM_CHANNEL,
      eventName: MESSAGE_EVENT.CREATED,
      data: dto
    });
    return dto;
  }

  public async loadPublicMessages(req: MessageListRequest) {
    const conversation = await this.conversationService.findById(
      req.conversationId
    );
    if (!conversation) {
      throw new EntityNotFoundException();
    }

    const sort = {
      [req.sortBy || 'updatedAt']: req.sort
    };

    const query = { conversationId: conversation._id };
    const [data, total] = await Promise.all([
      this.messageModel
        .find(query)
        .sort(sort)
        .lean()
        .limit(parseInt(req.limit as string, 10))
        .skip(parseInt(req.offset as string, 10)),
      this.messageModel.countDocuments(query)
    ]);

    const senderIds = uniq(data.map((d) => d.senderId));
    const [users, performers] = await Promise.all([
      senderIds.length ? this.userService.findByIds(senderIds) : [],
      senderIds.length ? this.performerService.findByIds(senderIds) : []
    ]);

    const messages = data.map((message) => {
      let user = null;
      user = users.find((u) => u._id.toString() === message.senderId.toString());
      if (!user) {
        user = performers.find(
          (p) => p._id.toString() === message.senderId.toString()
        );
      }

      return {
        ...message,
        senderInfo:
          user && user.roles && user.roles.includes('user')
            ? new UserDto(user).toResponse()
            : new PerformerDto(user).toResponse()
      };
    });

    return {
      data: messages.map((m) => new MessageDto(m)),
      total
    };
  }
}

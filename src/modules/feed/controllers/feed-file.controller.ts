import {
  Controller,
  Injectable,
  UseGuards,
  Post,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  Param,
  Query,
  Get,
  Body
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse, getConfig } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth';
import { UserDto } from 'src/modules/user/dtos';
import { FileDto, FileUploaded, FileUploadInterceptor, MultiFileUploadInterceptor } from 'src/modules/file';
import { FeedCreatePayload } from '../payloads';
import { FeedFileService, FeedService } from '../services';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from 'src/modules/file/services';

@Injectable()
@Controller('feeds/performers')
export class FeedFileController {
  constructor(
    private readonly feedFileService: FeedFileService,
    private readonly fileService: FileService,
    private readonly feedService: FeedService
  ) {}

  @Post('photo/upload')
  @HttpCode(HttpStatus.OK)
  @Roles('performer', 'admin')
  @UseGuards(RoleGuard)
  @UseInterceptors(
    FileUploadInterceptor('feed-photo', 'file', {
      destination: 'public/feeds',
      //replaceWithoutExif: true
    })
  )
  async uploadImage(
    @FileUploaded() file: FileDto
  ): Promise<any> {
    await this.feedFileService.validatePhoto(file);

    return DataResponse.ok({
      success: true,
      ...file.toResponse(),
      url: file.getUrl()
    });
  }

  @Post('video/upload')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UseInterceptors(
    FileUploadInterceptor('feed-video', 'file', {
      destination: 'public/feeds',
      //replaceWithoutExif: true
    })
  )
  async uploadVideo(
    @CurrentUser() user: UserDto,
    @FileUploaded() file: FileDto
  ): Promise<any> {
    await this.feedFileService.validateVideo(file);

    return DataResponse.ok({
      success: true,
      ...file.toResponse(),
      url: file.getUrl()
    });
  }

  @Post('thumbnail/upload')
  @HttpCode(HttpStatus.OK)
  @Roles('performer', 'admin')
  @UseGuards(RoleGuard)
  @UseInterceptors(
    FileUploadInterceptor('feed-photo', 'file', {
      destination: 'public/feeds',
      //replaceWithoutExif: true
    })
  )
  async uploadThumb(
    @FileUploaded() file: FileDto
  ): Promise<any> {
    await this.feedFileService.validatePhoto(file);

    return DataResponse.ok({
      success: true,
      ...file.toResponse(),
      url: file.getUrl()
    });
  }

  @Post('teaser/upload')
  @HttpCode(HttpStatus.OK)
  @Roles('performer', 'admin')
  @UseGuards(RoleGuard)
  @UseInterceptors(
    FileUploadInterceptor('feed-video', 'file', {
      destination: 'public/feeds',
      //replaceWithoutExif: true
    })
  )
  async uploadTeaser(
    @FileUploaded() file: FileDto
  ): Promise<any> {
    await this.feedFileService.validateVideo(file);
    return DataResponse.ok({
      success: true,
      ...file.toResponse(),
      url: file.getUrl()
    });
  }
}

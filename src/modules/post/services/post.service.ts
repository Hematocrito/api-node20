import {
  Injectable,
  Inject,
  NotFoundException
} from '@nestjs/common';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import {
  EntityNotFoundException
} from 'src/kernel';
import { UserDto } from 'src/modules/user/dtos';
import { createAlias, isObjectId } from 'src/kernel/helpers/string.helper';
import { FileService } from 'src/modules/file/services';
import { FileResponseDto, FileDto } from 'src/modules/file';
import { PostDto } from '../dtos';
import { PostCreatePayload } from '../payloads/post-create.payload';
import { PostModel } from '../models';
import { POST_MODEL_PROVIDER } from '../providers';

@Injectable()
export class PostService {
  constructor(
    @Inject(POST_MODEL_PROVIDER)
    private readonly postModel: Model<PostModel>,
    private readonly fileService: FileService
  ) { }

  public async find(params: any): Promise<PostModel[]> {
    return this.postModel.find(params);
  }

  public async findByIdOrSlug(id: string): Promise<PostModel> {
    const query = isObjectId(id) ? { _id: id } : { slug: id };
    return this.postModel.findOne(query);
  }

  public async generateSlug(title: string, id?: string | ObjectId) {
    // consider if need unique slug with post type
    const slug = createAlias(title);
    const query = { slug } as any;
    if (id) {
      query._id = { $ne: id };
    }
    const count = await this.postModel.countDocuments(query);
    if (!count) {
      return slug;
    }

    return this.generateSlug(`${slug}1`, id);
  }

  public async create(
    payload: PostCreatePayload,
    user?: UserDto
  ): Promise<PostModel> {
    const data = {
      ...payload,
      updatedAt: new Date(),
      createdAt: new Date()
    };
    if (user && !data.authorId) {
      data.authorId = user._id;
    }
    data.slug = await this.generateSlug(payload.slug || payload.title);
    const post = await this.postModel.create(data);

    return post;
  }

  public async update(
    id: string,
    payload: PostCreatePayload,
    user?: UserDto
  ): Promise<PostModel> {
    const post = await this.findByIdOrSlug(id);
    if (!post) {
      throw new NotFoundException();
    }

    post.title = payload.title;
    post.content = payload.content;
    post.shortDescription = payload.shortDescription;
    payload.slug
      && post.set('slug', await this.generateSlug(payload.slug, post._id));
    payload.status && post.set('status', payload.status);
    payload.image && post.set('image', payload.image);
    payload.ordering && post.set('ordering', payload.ordering);
    user && post.set('updatedBy', user._id);
    post.set('updatedAt', new Date());
    await post.save();
    return post;
  }

  public async delete(id: string): Promise<boolean> {
    const post = await this.findByIdOrSlug(id);
    if (!post) {
      throw new NotFoundException();
    }
    await post.remove();
    return true;
  }

  public async adminGetDetails(id: string): Promise<PostDto> {
    const [post] = await Promise.all([
      this.postModel.findById(id)
    ]);
    // TODO - populate data hook?
    if (!post) {
      throw new EntityNotFoundException();
    }
    const dto = new PostDto(post);
    return dto;
  }

  public async getPublic(id: string): Promise<PostDto> {
    const post = await this.findByIdOrSlug(id);
    // TODO - map details from meta data
    if (!post) {
      throw new EntityNotFoundException();
    }

    let image = post.image as any;
    if (isObjectId(post.image)) {
      const file = await this.fileService.findById(post.image);
      if (file) {
        image = FileResponseDto.fromFile(new FileDto(file));
      }
    }

    const dto = new PostDto(post);
    dto.image = image;
    return dto;
  }
}

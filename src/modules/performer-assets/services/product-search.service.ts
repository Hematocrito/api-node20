import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import { PageableData } from 'src/kernel';
import { PerformerService } from 'src/modules/performer/services';
import { FileService } from 'src/modules/file/services';
import { UserDto } from 'src/modules/user/dtos';
import { PerformerDto } from 'src/modules/performer/dtos';
import { flatMap } from 'lodash';
import { STATUS } from 'src/kernel/constants';
import { isObjectId } from 'src/kernel/helpers/string.helper';
import { OrderService } from 'src/modules/payment/services';
import { ORDER_STATUS } from 'src/modules/payment/constants';
import { CategoryService } from 'src/modules/category/services';
import { PerformerCacheService } from 'src/modules/performer/services/performer-cache.service';
import { PERFORMER_PRODUCT_MODEL_PROVIDER } from '../providers';
import { ProductModel } from '../models';
import { ProductDto } from '../dtos';
import { ProductSearchRequest } from '../payloads';

@Injectable()
export class ProductSearchService {
  constructor(
    @Inject(forwardRef(() => CategoryService))
    private readonly categoryService: CategoryService,
    @Inject(forwardRef(() => PerformerCacheService))
    private readonly performerCacheService: PerformerCacheService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => OrderService))
    private readonly orderService: OrderService,
    @Inject(PERFORMER_PRODUCT_MODEL_PROVIDER)
    private readonly productModel: Model<ProductModel>,
    private readonly fileService: FileService
  ) {}

  public async adminSearch(
    req: ProductSearchRequest
  ): Promise<PageableData<ProductDto>> {
    const query = {} as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, ''),
        'i'
      );
      query.$or = [
        {
          name: { $regex: regexp }
        },
        {
          description: { $regex: regexp }
        }
      ];
    }
    if (req.categoryId) query.categoryIds = { $in: [req.categoryId] };
    if (req.performerId) query.performerId = req.performerId;
    if (req.status) query.status = req.status;
    if (req.type) query.type = req.type;

    let sort = {
      createdAt: -1
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.productModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.productModel.countDocuments(query)
    ]);

    const performerIds = data.map((d) => d.performerId);
    const imageIds = flatMap(data, (d) => d.imageIds);
    const categoryIds = flatMap(data, (d) => d.categoryIds);
    const products = data.map((v) => new ProductDto(v));
    const [performers, images, categories] = await Promise.all([
      performerIds.length ? this.performerService.findByIds(performerIds) : [],
      imageIds.length ? this.fileService.findByIds(imageIds) : [],
      this.categoryService.findByIds(categoryIds)
    ]);
    products.forEach((v) => {
      const stringImageIds = v.imageIds?.map((p) => p.toString()) || [];
      const files = images.filter((file) => stringImageIds.includes(file._id.toString()));
      // TODO - get default image for dto?
      if (files) {
        // eslint-disable-next-line no-param-reassign
        v.images = files.length
          ? files.map((f) => ({
            ...f,
            url: f.getUrl(),
            thumbnails: f.getThumbnails()
          }))
          : [];
      }
      const performer = performers.find(
        (p) => p._id.toString() === v.performerId.toString()
      );
      if (performer) {
        // eslint-disable-next-line no-param-reassign
        v.performer = new PerformerDto(performer).toResponse();
      }
      const stringCategoryIds = v.categoryIds?.map((p) => p.toString()) || [];
      // eslint-disable-next-line no-param-reassign
      v.categories = categories.filter((c) => stringCategoryIds.includes(c._id.toString()));
    });

    return {
      data: products,
      total
    };
  }

  public async performerSearch(
    req: ProductSearchRequest,
    user: UserDto
  ): Promise<PageableData<ProductDto>> {
    const query = {} as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, ''),
        'i'
      );
      query.$or = [
        {
          name: { $regex: regexp }
        },
        {
          description: { $regex: regexp }
        }
      ];
    }
    query.performerId = user._id;
    if (req.categoryId) query.categoryIds = { $in: [req.categoryId] };
    if (req.status) query.status = req.status;
    if (req.type) query.type = req.type;
    let sort = {
      createdAt: -1
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.productModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.productModel.countDocuments(query)
    ]);

    const performerIds = data.map((d) => d.performerId);
    const imageIds = flatMap(data, (d) => d.imageIds);
    const categoryIds = flatMap(data, (d) => d.categoryIds);
    const products = data.map((v) => new ProductDto(v));
    const [performers, images, categories] = await Promise.all([
      performerIds.length ? this.performerService.findByIds(performerIds) : [],
      imageIds.length ? this.fileService.findByIds(imageIds) : [],
      this.categoryService.findByIds(categoryIds)
    ]);
    products.forEach((v) => {
      const stringImageIds = v.imageIds?.map((p) => p.toString()) || [];
      const files = images.filter((file) => stringImageIds.includes(file._id.toString()));
      // TODO - get default image for dto?
      if (files) {
        // eslint-disable-next-line no-param-reassign
        v.images = files.length
          ? files.map((f) => ({
            ...f,
            url: f.getUrl(),
            thumbnails: f.getThumbnails()
          }))
          : [];
      }
      const performer = performers.find(
        (p) => p._id.toString() === v.performerId.toString()
      );
      if (performer) {
        // eslint-disable-next-line no-param-reassign
        v.performer = new PerformerDto(performer).toResponse();
      }
      const stringCategoryIds = v.categoryIds?.map((p) => p.toString()) || [];
      // eslint-disable-next-line no-param-reassign
      v.categories = categories.filter((c) => stringCategoryIds.includes(c._id.toString()));
    });

    return {
      data: products,
      total
    };
  }

  public async userSearch(
    req: ProductSearchRequest,
    user: UserDto
  ): Promise<PageableData<ProductDto>> {
    const query = {
      status: STATUS.ACTIVE
    } as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, ''),
        'i'
      );
      query.$or = [
        {
          name: { $regex: regexp }
        },
        {
          description: { $regex: regexp }
        }
      ];
    }
    if (req.type) query.type = req.type;
    if (req.performerId) query.performerId = req.performerId;
    if (req.excludedId && isObjectId(req.excludedId)) { query._id = { $ne: req.excludedId }; }
    if (req.excludedId && !isObjectId(req.excludedId)) { query.slug = { $ne: req.excludedId }; }
    if (req.includedIds) query._id = { $in: req.includedIds };
    if (req.categoryId) query.categoryIds = { $in: [req.categoryId] };

    // query active model only
    const activePerformers = await this.performerCacheService.getActivePerformers();
    if (query.performerId) {
      // check if exist in the active list
      const hasItem = activePerformers.includes(query.performerId);
      if (!hasItem) {
        return {
          data: [],
          total: 0
        };
      }
    } else {
      query.performerId = {
        $in: activePerformers
      };
    }

    let sort = {
      createdAt: -1
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.productModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.productModel.countDocuments(query)
    ]);

    const performerIds = data.map((d) => d.performerId);
    const imageIds = flatMap(data, (d) => d.imageIds);
    const categoryIds = flatMap(data, (d) => d.categoryIds);
    const productIds = data.map((d) => d._id);
    const products = data.map((v) => new ProductDto(v));
    const [performers, images, transactions, categories] = await Promise.all([
      performerIds.length ? this.performerService.findByIds(performerIds) : [],
      imageIds.length ? this.fileService.findByIds(imageIds) : [],
      user && user._id
        ? this.orderService.findDetailsByQuery({
          buyerId: user._id,
          productId: { $in: productIds },
          status: ORDER_STATUS.PAID
        })
        : [],
      this.categoryService.findByIds(categoryIds)
    ]);
    products.forEach((v) => {
      const stringImageIds = v.imageIds?.map((p) => p.toString()) || [];
      const files = images.filter((file) => stringImageIds.includes(file._id.toString()));
      // TODO - get default image for dto?
      if (files) {
        // eslint-disable-next-line no-param-reassign
        v.images = files.length
          ? files.map((f) => ({
            ...f,
            url: f.getUrl(),
            thumbnails: f.getThumbnails()
          }))
          : [];
      }
      const performer = performers.find(
        (p) => p._id.toString() === v.performerId.toString()
      );
      if (performer) {
        // eslint-disable-next-line no-param-reassign
        v.performer = new PerformerDto(performer).toResponse();
      }
      const isBought = transactions.find((t) => `${t.productId}` === `${v._id}`);
      // eslint-disable-next-line no-param-reassign
      v.isBought = !!isBought;
      if (
        (user && `${user._id}` === `${v.performerId}`)
        || (user && user.roles && user.roles.includes('admin'))
      ) {
        // eslint-disable-next-line no-param-reassign
        v.isBought = true;
      }
      const stringCategoryIds = v.categoryIds?.map((p) => p.toString()) || [];
      // eslint-disable-next-line no-param-reassign
      v.categories = categories.filter((c) => stringCategoryIds.includes(c._id.toString()));
    });

    return {
      data: products,
      total
    };
  }
}

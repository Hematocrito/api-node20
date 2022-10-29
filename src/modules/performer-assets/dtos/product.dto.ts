import { ObjectId } from 'mongodb';
import { pick } from 'lodash';

export class ProductDto {
  _id?: ObjectId;

  performerId?: ObjectId;

  digitalFileId?: ObjectId;

  digitalFile?: any;

  imageIds?: ObjectId[];

  images?: any;

  categoryIds?: ObjectId[];

  categories?: any;

  type?: string;

  name?: string;

  slug?: string;

  description?: string;

  status?: string;

  price?: number;

  stock?: number;

  performer?: any;

  createdBy?: ObjectId;

  updatedBy?: ObjectId;

  createdAt?: Date;

  updatedAt?: Date;

  stats: {
    likes: number;
    comments: number;
    views: number;
  };

  isBought?: boolean;

  constructor(init?: Partial<ProductDto>) {
    Object.assign(
      this,
      pick(init, [
        '_id',
        'performerId',
        'digitalFileId',
        'digitalFile',
        'imageIds',
        'images',
        'categoryIds',
        'categories',
        'type',
        'name',
        'slug',
        'description',
        'status',
        'price',
        'stock',
        'performer',
        'createdBy',
        'updatedBy',
        'createdAt',
        'updatedAt',
        'stats',
        'isBought'
      ])
    );
  }

  toPublic() {
    return {
      _id: this._id,
      performerId: this.performerId,
      digitalFileId: this.digitalFileId,
      digitalFile: this.digitalFile,
      imageIds: this.imageIds,
      images: this.images,
      categoryIds: this.categoryIds,
      categories: this.categories,
      type: this.type,
      name: this.name,
      slug: this.slug,
      description: this.description,
      status: this.status,
      price: this.price,
      stock: this.stock,
      performer: this.performer,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      stats: this.stats,
      isBought: this.isBought
    };
  }
}

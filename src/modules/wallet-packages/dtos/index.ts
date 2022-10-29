import { pick } from 'lodash';
import { ObjectId } from 'mongodb';

export interface IPackages {
  _id: ObjectId;

  name: string;

  description: string;

  ordering: number;

  createdAt: Date;

  updatedAt: Date;

  price: number;

  token: number;

  status: string;

  url: string;
}

export class WalletPackageDto {
  _id: ObjectId;

  name: string;

  description: string;

  ordering: number;

  createdAt: Date;

  updatedAt: Date;

  price: number;

  token: number;

  status: string;

  url: string;

  constructor(data: any) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'name',
        'url',
        'description',
        'ordering',
        'createdAt',
        'updatedAt',
        'price',
        'token',
        'status'
      ])
    );
  }

  toResponse() {
    const publicInfo = {
      _id: this._id,
      name: this.name,
      description: this.description,
      ordering: this.ordering,
      createdAt: this.createdAt,
      updateAt: this.updatedAt,
      price: this.price,
      token: this.token,
      status: this.status,
      url: this.url
    };

    return {
      ...publicInfo
    };
  }
}

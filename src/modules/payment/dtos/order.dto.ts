import { ObjectId } from 'mongodb';
import { pick } from 'lodash';

export class OrderDto {
  _id: ObjectId;

  buyerId: ObjectId;

  buyerSource: string;

  sellerId: ObjectId;

  sellerSource: string;

  type: string;

  details: any[];

  status: string;

  quantity: number;

  totalPrice: number;

  originalPrice: number;

  deliveryAddress: string;

  postalCode: string;

  phoneNumber: string;

  paymentGateway: string;

  couponInfo: any;

  seller: any;

  buyer: any;

  orderNumber: string;

  description: string;

  createdAt: Date;

  updatedAt: Date;

  constructor(data: Partial<OrderDto>) {
    data
      && Object.assign(
        this,
        pick(data, [
          '_id',
          'buyerId',
          'buyerSource',
          'sellerId',
          'sellerSource',
          'type',
          'quantity',
          'totalPrice',
          'originalPrice',
          'deliveryAddress',
          'postalCode',
          'phoneNumber',
          'paymentGateway',
          'couponInfo',
          'buyer',
          'seller',
          'status',
          'details',
          'orderNumber',
          'description',
          'createdAt',
          'updatedAt'
        ])
      );
  }
}

import { ObjectId } from 'mongodb';
import { pick } from 'lodash';

export class OrderDetailsDto {
  _id: ObjectId;

  orderId: ObjectId;

  orderNumber: string;

  buyerId: ObjectId;

  buyerSource: string;

  sellerId: ObjectId;

  sellerSource: string;

  productType: string;

  productId: ObjectId;

  name: string;

  description: string;

  unitPrice: number;

  originalPrice: number;

  status: string;

  payBy: string;

  quantity: number;

  totalPrice: number;

  deliveryStatus: string;

  deliveryAddress: string;

  paymentStatus: string;

  postalCode: string;

  phoneNumber: string;

  paymentGateway: string;

  couponInfo: any;

  extraInfo: any

  seller: any;

  buyer: any;

  shippingCode: string;

  createdAt: Date;

  updatedAt: Date;

  constructor(data: Partial<OrderDetailsDto>) {
    data
    && Object.assign(
      this,
      pick(data, [
        '_id',
        'orderId',
        'orderNumber',
        'buyerId',
        'buyerSource',
        'sellerId',
        'sellerSource',
        'productType',
        'productId',
        'name',
        'description',
        'unitPrice',
        'originalPrice',
        'status',
        'payBy',
        'quantity',
        'totalPrice',
        'deliveryStatus',
        'deliveryAddress',
        'paymentStatus',
        'postalCode',
        'phoneNumber',
        'paymentGateway',
        'couponInfo',
        'shippingCode',
        'extraInfo',
        'seller',
        'buyer',
        'createdAt',
        'updatedAt'
      ])
    );
  }

  toResponse(isAdmin = false) {
    const publicInfo = {
      _id: this._id,
      orderId: this.orderId,
      orderNumber: this.orderNumber,
      buyerId: this.buyerId,
      buyerSource: this.buyerSource,
      sellerId: this.sellerId,
      sellerSource: this.sellerSource,
      productType: this.productType,
      productId: this.productId,
      name: this.name,
      description: this.description,
      unitPrice: this.unitPrice,
      originalPrice: this.originalPrice,
      status: this.status,
      payBy: this.payBy,
      quantity: this.quantity,
      totalPrice: this.totalPrice,
      deliveryStatus: this.deliveryStatus,
      deliveryAddress: this.deliveryAddress,
      paymentStatus: this.paymentStatus,
      postalCode: this.postalCode,
      phoneNumber: this.phoneNumber,
      paymentGateway: this.paymentGateway,
      couponInfo: this.couponInfo,
      shippingCode: this.shippingCode,
      seller: this.seller,
      buyer: this.buyer,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
    const privateInfo = {
      extraInfo: this.extraInfo
    };
    if (!isAdmin) {
      return publicInfo;
    }
    return { ...publicInfo, ...privateInfo };
  }
}

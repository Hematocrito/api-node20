import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class OrderDetailsModel extends Document {
  // ref order id
  orderId: ObjectId;

  // sub order number
  orderNumber: string;

  // buyer information, eg user
  buyerId: ObjectId;

  buyerSource: string;

  sellerId: ObjectId;

  sellerSource: string;

  productType: string;

  productId: ObjectId;

  name: string;

  description: string;

  unitPrice: number;

  quantity: number;

  originalPrice: number;

  totalPrice: number;

  // status of the sub order
  status: string;

  deliveryStatus: string;

  deliveryAddress: string;

  postalCode: string;

  phoneNumber: string;

  paymentStatus: string;

  paymentGateway: string;

  payBy: string;

  couponInfo: any;

  // code for physical product
  shippingCode: string

  extraInfo: any;

  transactionId: ObjectId;

  createdAt: Date;

  updatedAt: Date;
}

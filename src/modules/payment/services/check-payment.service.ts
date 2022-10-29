import { Injectable, Inject } from '@nestjs/common';
import { UserDto } from 'src/modules/user/dtos';
import { EntityNotFoundException } from 'src/kernel';
import { Model } from 'mongoose';
import {
  GalleryDto, PhotoDto, ProductDto, VideoDto
} from 'src/modules/performer-assets/dtos';
import { ORDER_DETAIL_MODEL_PROVIDER } from '../providers';
import { OrderDetailsModel } from '../models';
import {
  ORDER_STATUS
} from '../constants';

@Injectable()
export class CheckPaymentService {
  constructor(
    @Inject(ORDER_DETAIL_MODEL_PROVIDER)
    private readonly orderDetailsModel: Model<OrderDetailsModel>
  ) { }

  public checkBoughtVideo = async (video: VideoDto, user: UserDto) => {
    if (video.performerId.toString() === user._id.toString()) {
      return 1;
    }
    return this.orderDetailsModel.countDocuments({
      status: ORDER_STATUS.PAID,
      productId: video._id,
      buyerId: user._id
    });
  }

  public checkBoughtPhoto = async (photo: PhotoDto, user: UserDto) => {
    if (photo.performerId.toString() === user._id.toString()) {
      return 1;
    }
    return this.orderDetailsModel.countDocuments({
      status: ORDER_STATUS.PAID,
      productId: photo._id,
      buyerId: user._id
    });
  }

  public async checkBoughtProduct(product: ProductDto, user: UserDto) {
    if (!product || (product && !product.price)) {
      throw new EntityNotFoundException();
    }
    if (product.performerId.toString() === user._id.toString()) {
      return 1;
    }
    return this.orderDetailsModel.countDocuments({
      status: ORDER_STATUS.PAID,
      productId: product._id,
      buyerId: user._id
    });
  }

  public async checkBoughtGallery(gallery: GalleryDto, user: UserDto) {
    if (gallery.performerId.toString() === user._id.toString()) {
      return 1;
    }
    return this.orderDetailsModel.countDocuments({
      status: ORDER_STATUS.PAID,
      productId: gallery._id,
      buyerId: user._id
    });
  }
}

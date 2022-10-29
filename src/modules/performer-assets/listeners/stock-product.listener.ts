import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { QueueEventService, QueueEvent } from 'src/kernel';
import { ORDER_PAID_SUCCESS_CHANNEL } from 'src/modules/payment/constants';
import { FileService } from 'src/modules/file/services';
import { EVENT } from 'src/kernel/constants';
import { MailerService } from 'src/modules/mailer/services';
import { PerformerService } from 'src/modules/performer/services';
import { UserService } from 'src/modules/user/services';
import { ProductService } from '../services';
import { PRODUCT_TYPE } from '../constants';

const UPDATE_STOCK_CHANNEL = 'UPDATE_STOCK_CHANNEL';

@Injectable()
export class StockProductListener {
  constructor(
    private readonly queueEventService: QueueEventService,
    private readonly productService: ProductService,
    private readonly mailService: MailerService,
    private readonly fileService: FileService,
    private readonly userService: UserService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService
  ) {
    this.queueEventService.subscribe(
      ORDER_PAID_SUCCESS_CHANNEL,
      UPDATE_STOCK_CHANNEL,
      this.handleStockProducts.bind(this)
    );
  }

  public async handleStockProducts(event: QueueEvent) {
    if (![EVENT.CREATED].includes(event.eventName)) {
      return;
    }

    const { orderDetails } = event.data;
    const performerProductOrders = orderDetails.filter((o) => [PRODUCT_TYPE.DIGITAL, PRODUCT_TYPE.PHYSICAL].includes(o.productType));
    if (!performerProductOrders.length) {
      return;
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const orderDetail of performerProductOrders) {
      switch (orderDetail.productType) {
        case PRODUCT_TYPE.PHYSICAL:
          // eslint-disable-next-line no-await-in-loop
          await this.productService.updateStock(orderDetail.productId, -1 * (orderDetail.quantity || 1));
          break;
        case PRODUCT_TYPE.DIGITAL:
          // eslint-disable-next-line no-await-in-loop
          await this.sendDigitalProductLink(orderDetail);
          break;
        default: break;
      }
    }
  }

  public async sendDigitalProductLink(orderDetail) {
    const product = await this.productService.getDetails(orderDetail.productId);
    if (!product || product.type !== 'digital' || !product.digitalFileId) return;
    const digitalLink = await this.fileService.generateDownloadLink(product.digitalFileId);
    const performer = await this.performerService.findById(orderDetail.sellerId);
    const user = await this.userService.findById(orderDetail.buyerId);
    user.email && await this.mailService.send({
      subject: `Order #${orderDetail.orderNumber} - Digital file to download`,
      to: user.email,
      data: {
        performer,
        user,
        orderDetail,
        digitalLink,
        totalPrice: (orderDetail.totalPrice || 0).toFixed(2)
      },
      template: 'send-user-digital-product'
    });
  }
}

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  CANCELLED: 'cancelled'
};
// eslint-disable-next-line no-shadow
export enum PAYMENT_GATEWAY {
  CCBILL = 'ccbill',
  ASTROPAY = 'astropay',
  WALLET = 'wallet'
}
export const PAYMENT_TYPE = {
  MONTHLY_SUBSCRIPTION: 'monthly_subscription',
  YEARLY_SUBSCRIPTION: 'yearly_subscription',
  SALE_VIDEO: 'sale_video',
  FEED: 'feed',
  PRODUCT: 'product',
  PERFORMER_PRODUCT: 'performer_product',
  SALE_PHOTO: 'sale_photo',
  WALLET: 'wallet',
  TIP: 'tip',
  PRIVATE_CHAT: 'stream_private',
  GROUP_CHAT: 'stream_group'
};
export const PAYMENT_TARGET_TYPE = {
  PERFORMER: 'performer',
  PRODUCT: 'product',
  VIDEO: 'video',
  PERFORMER_PRODUCT: 'performer_product',
  WALLET: 'wallet',
  PRIVATE_CHAT: 'stream_private',
  GROUP_CHAT: 'stream_group'
};

export const PAYMENT_WALLET_CHANNEL = 'PAYMENT_WALLET_CHANNEL';

export const TRANSACTION_SUCCESS_CHANNEL = 'TRANSACTION_SUCCESS_CHANNEL';
export const ORDER_PAID_SUCCESS_CHANNEL = 'ORDER_PAID_SUCCESS_CHANNEL';

export const OVER_PRODUCT_STOCK = 'OVER_PRODUCT_STOCK';
export const DIFFERENT_PERFORMER_PRODUCT = 'DIFFERENT_PERFORMER_PRODUCT';
export const MISSING_CONFIG_PAYMENT_GATEWAY = 'Payment has not configured for this model yet';

export const ORDER_STATUS = {
  PROCESSING: 'processing',
  SHIPPING: 'shipping',
  DELIVERED: 'delivered',
  REFUNDED: 'refunded',
  PENDING: 'pending',
  CREATED: 'created',
  PAID: 'paid'
};

export const DELIVERY_STATUS = {
  PROCESSING: 'processing',
  SHIPPING: 'shipping',
  DELIVERED: 'delivered',
  CREATED: 'created',
  REFUNDED: 'refunded'
};

export const PRODUCT_TYPE = {
  MONTHLY_SUBSCRIPTION: 'monthly_subscription',
  YEARLY_SUBSCRIPTION: 'yearly_subscription',
  SALE_VIDEO: 'sale_video',
  PERFORMER_PRODUCT: 'performer_product',
  DIGITAL_PRODUCT: 'digital',
  PHYSICAL_PRODUCT: 'physical',
  SALE_PHOTO: 'sale_photo',
  WALLET: 'wallet',
  TIP: 'tip',
  PRIVATE_CHAT: 'stream_private',
  GROUP_CHAT: 'stream_group',
  FEED: 'feed'
};

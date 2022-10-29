/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
require('dotenv').config();

const mongoose = require('mongoose');
const moment = require('moment');

async function handleSubscription(transaction) {
  const { db } = mongoose.connection;
  const user = await db.collection('users').findOne({ _id: transaction.sourceId });
  const performer = await db.collection('performers').findOne({ _id: transaction.performerId });
  const orderNumber = `S-${user.username}-${moment(transaction.createdAt).format('YYYYMMDD')}`;
  const order = await db.collection('orders').insertOne({
    buyerSource: 'user',
    buyerId: user._id,
    sellerSource: 'performer',
    sellerId: performer._id,
    type: transaction.type,
    orderNumber,
    status: 'paid',
    quantity: 1,
    totalPrice: transaction.totalPrice,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt
  });
  await db.collection('orderdetails').insertOne({
    orderId: order.insertedId,
    orderNumber: `${orderNumber}-S1`,
    buyerSource: 'user',
    buyerId: user._id,
    sellerSource: 'performer',
    sellerId: performer._id,
    productType: transaction.type,
    productId: performer._id,
    name: `${transaction.type === 'monthly_subscription' ? 'Monthly' : 'Yearly'} for ${performer.username}`,
    description: `${transaction.type === 'monthly_subscription' ? 'Monthly' : 'Yearly'} for ${performer.username}`,
    status: 'paid',
    paymentStatus: 'success',
    payBy: 'money',
    quantity: 1,
    deliveryStatus: 'delivered',
    totalPrice: transaction.totalPrice,
    unitPrice: transaction.totalPrice,
    originalPrice: transaction.totalPrice,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt
  });
  await db.collection('paymenttransactions').updateOne({ _id: transaction._id }, {
    $set: {
      orderId: order.insertedId
    }
  });
  console.log(`Migrated for ${transaction.type} ${user.username} - ${performer.username} is Done`);
}

async function handlePerformerProduct(transaction) {
  const { db } = mongoose.connection;
  const user = await db.collection('users').findOne({ _id: transaction.sourceId });
  const performer = await db.collection('performers').findOne({ _id: transaction.performerId });
  const orderNumber = `P-${user.username}-${moment(transaction.createdAt).format('YYYYMMDD')}`;

  for (const productInfo of transaction.products) {
    const product = await db.collection('performerproducts').findOne({ _id: productInfo.productId });
    // check if this is physical -> have order
    const oldOrder = await db.collection('orders_bk').findOne({ transactionId: transaction._id });
    const order = await db.collection('orders').insertOne({
      buyerSource: 'user',
      buyerId: user._id,
      sellerSource: 'performer',
      sellerId: performer._id,
      type: 'performer_product',
      orderNumber,
      status: 'paid',
      quantity: 1,
      totalPrice: transaction.totalPrice,
      couponInfo: transaction.couponInfo,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt
    });
    if (oldOrder) {
      await db.collection('orderdetails').insertOne({
        orderId: order.insertedId,
        orderNumber: oldOrder.orderNumber,
        buyerSource: 'user',
        buyerId: user._id,
        sellerSource: 'performer',
        sellerId: performer._id,
        productType: product.type,
        productId: product._id,
        name: productInfo.name,
        description: product.description,
        status: 'paid',
        paymentStatus: 'success',
        payBy: 'money',
        quantity: oldOrder.quantity,
        deliveryStatus: oldOrder.deliveryStatus,
        deliveryAddress: oldOrder.deliveryAddress,
        portalCode: oldOrder.portalCode,
        shippingCode: oldOrder.shippingCode,
        totalPrice: oldOrder.totalPrice,
        unitPrice: (oldOrder.totalPrice / (oldOrder.quantity || 1)).toFixed(2),
        originalPrice: transaction.originalPrice,
        couponInfo: transaction.couponInfo,
        createdAt: oldOrder.createdAt,
        updatedAt: oldOrder.updatedAt
      });
    } else if (product.type === 'digital') {
      await db.collection('orderdetails').insertOne({
        orderId: order.insertedId,
        orderNumber: `${orderNumber}-D1`,
        buyerSource: 'user',
        buyerId: user._id,
        sellerSource: 'performer',
        sellerId: performer._id,
        productType: product.type,
        productId: product._id,
        name: productInfo.name,
        description: product.description,
        status: 'paid',
        paymentStatus: 'success',
        payBy: 'money',
        quantity: 1,
        deliveryStatus: 'delivered',
        deliveryAddress: '',
        portalCode: '',
        shippingCode: '',
        totalPrice: product.price,
        unitPrice: product.price,
        originalPrice: product.price,
        couponInfo: transaction.couponInfo,
        createdAt: oldOrder.createdAt,
        updatedAt: oldOrder.updatedAt
      });
      await db.collection('paymenttransactions').updateOne({ _id: transaction._id }, {
        $set: {
          orderId: order.insertedId
        }
      });
    }

    await db.collection('paymenttransactions').updateOne({ _id: transaction._id }, {
      $set: {
        orderId: order.insertedId
      }
    });
  }

  // otherwise with digital we will create later

  console.log(`Migrated for ${transaction.type} ${user.username} - ${performer.username} is Done`);
}

async function handleVod(transaction) {
  const { db } = mongoose.connection;
  const user = await db.collection('users').findOne({ _id: transaction.sourceId });
  const performer = await db.collection('performers').findOne({ _id: transaction.performerId });
  const orderNumber = `VOD-${performer.username}-${moment(transaction.createdAt).format('YYYYMMDD')}`;
  const order = await db.collection('orders').insertOne({
    buyerSource: 'user',
    buyerId: user._id,
    sellerSource: 'performer',
    sellerId: performer._id,
    type: 'sale_video',
    orderNumber,
    status: 'paid',
    quantity: 1,
    couponInfo: transaction.couponInfo,
    totalPrice: transaction.totalPrice,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt
  });
  let i = 1;
  for (const productInfo of transaction.products) {
    await db.collection('orderdetails').insertOne({
      orderId: order.insertedId,
      orderNumber: `${orderNumber}-S${i}`,
      buyerSource: 'user',
      buyerId: user._id,
      sellerSource: 'performer',
      sellerId: performer._id,
      productType: 'sale_video',
      productId: productInfo.productId,
      name: productInfo.name,
      description: productInfo.description,
      status: 'paid',
      paymentStatus: 'success',
      payBy: 'money',
      quantity: 1,
      deliveryStatus: 'delivered',
      deliveryAddress: '',
      portalCode: '',
      shippingCode: '',
      totalPrice: productInfo.price,
      unitPrice: productInfo.price,
      originalPrice: productInfo.price,
      couponInfo: transaction.couponInfo,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt
    });
    i += 1;
  }
  await db.collection('paymenttransactions').updateOne({ _id: transaction._id }, {
    $set: {
      orderId: order.insertedId
    }
  });
  console.log(`Migrated for ${transaction.type} ${user.username} - ${performer.username} is Done`);
}

async function start() {
  await mongoose.connect(process.env.MONGO_URI);
  const { db } = mongoose.connection;

  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map((c) => c.name);
  // rename , backup order collection before doing something
  if (collectionNames.includes('orders')) {
    await db.collection('orders').rename('orders_bk');
  }

  const transactions = await db.collection('paymenttransactions').find({
    status: 'success',
    orderId: { $exists: false }
  }).toArray();
  for (const transaction of transactions) {
    switch (transaction.type) {
      case 'monthly_subscription':
      case 'yearly_subscription':
        await handleSubscription(transaction);
        break;
      case 'product':
        await handlePerformerProduct(transaction);
        break;
      case 'sale_video':
        await handleVod(transaction);
        break;
      default: break;
    }
  }

  console.log('Migrate done');
  process.exit();
}

start();

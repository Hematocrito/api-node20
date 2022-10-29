const { DB, COLLECTION } = require('../migrations/lib');

module.exports = async () => {
  const orders = await DB.collection(COLLECTION.ORDER).find().toArray();
  await orders.reduce(async (lp, order) => {
    await lp;
    if (order.description) return Promise.resolve();

    const details = await DB.collection(COLLECTION.ORDER_DETAILS).findOne({ orderId: order._id });
    if (!details) return Promise.resolve();
    return DB.collection(COLLECTION.ORDER).updateOne({ _id: order._id }, {
      $set: {
        description: details.name || details.description
      }
    });
  }, Promise.resolve());
};

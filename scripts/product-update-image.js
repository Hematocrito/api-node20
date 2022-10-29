const {
  DB, COLLECTION
} = require('../migrations/lib');

module.exports = async () => {
  const products = await DB.collection(COLLECTION.PERFORMER_PRODUCT).find({ }).toArray();
  // eslint-disable-next-line no-restricted-syntax
  for (const product of products) {
    if (product.imageId) {
      // eslint-disable-next-line no-await-in-loop
      await DB.collection(COLLECTION.PERFORMER_PRODUCT).updateOne({ _id: product._id }, {
        $set: { imageIds: [product.imageId] }
      });
    }
  }
};

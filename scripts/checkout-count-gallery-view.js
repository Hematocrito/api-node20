/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const { DB, COLLECTION } = require('../migrations/lib');

module.exports = async () => {
  const performers = await DB.collection(COLLECTION.PERFORMER)
    .find({})
    .toArray();

  for (const performer of performers) {
    const { stats } = performer;

    stats.subscribers = await DB.collection(COLLECTION.USER_SUBSCRIPTION).count(
      {
        performerId: performer._id,
        status: 'active'
      }
    );
    stats.totalGalleries = await DB.collection(
      COLLECTION.PERFORMER_GALLERY
    ).count({
      performerId: performer._id,
      status: 'active'
    });

    stats.totalProducts = await DB.collection(
      COLLECTION.PERFORMER_PRODUCT
    ).count({
      performerId: performer._id,
      status: 'active'
    });

    stats.totalVideos = await DB.collection(COLLECTION.PERFORMER_VIDEO).count({
      performerId: performer._id
    });
    DB.collection(COLLECTION.PERFORMER).updateOne(
      { _id: performer._id },
      {
        $set: {
          stats
        }
      }
    );
  }
};

const { DB, COLLECTION } = require('../migrations/lib');

module.exports = async () => {
  const performers = await DB.collection(COLLECTION.PERFORMER).find().toArray();

  await performers.reduce(async (lastPromise, performer) => {
    await lastPromise;

    const [
      videoCount,
      photoCount,
      galleryCount,
      productCount,
      subscribersCount
    ] = await Promise.all([
      DB.collection(COLLECTION.PERFORMER_VIDEO).count({
        performerId: performer._id
      }),
      DB.collection(COLLECTION.PERFORMER_PHOTO).count({
        performerId: performer._id
      }),
      DB.collection(COLLECTION.PERFORMER_GALLERY).count({
        performerId: performer._id
      }),
      DB.collection(COLLECTION.PERFORMER_PRODUCT).count({
        performerId: performer._id
      }),
      DB.collection(COLLECTION.USER_SUBSCRIPTION).count({
        performerId: performer._id
      })
    ]);

    return DB.collection(COLLECTION.PERFORMER).updateOne(
      { _id: performer._id },
      {
        $set: {
          'stats.totalVideos': videoCount,
          'stats.totalPhotos': photoCount,
          'stats.totalGalleries': galleryCount,
          'stats.totalProducts': productCount,
          'stats.subscribers': subscribersCount
        }
      }
    );
  }, Promise.resolve());
};

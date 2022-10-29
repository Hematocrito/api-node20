const { DB, COLLECTION } = require('../migrations/lib');

module.exports = async () => {
  const performers = await DB.collection(COLLECTION.PERFORMER).find().toArray();

  await performers.reduce(async (lastPromise, performer) => {
    await lastPromise;

    const data = await DB.collection(COLLECTION.EARNING).aggregate([
      {
        $match: {
          performerId: performer._id,
          isPaid: false
        }
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: '$netPrice'
          }
        }
      }
    ]);
    const balance = data && data.length ? data[0].total : 0;

    return DB.collection(COLLECTION.PERFORMER).updateOne(
      { _id: performer._id },
      {
        $set: {
          balance
        }
      }
    );
  }, Promise.resolve());
};

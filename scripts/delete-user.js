const { tail } = require('lodash');
const {
  DB,
  COLLECTION
} = require('../migrations/lib');

module.exports = async () => {
  const args = process.argv.slice(2);
  const userIds = tail(args);
  if (!userIds.length) return;
  const users = await DB.collection(COLLECTION.USER).find({
    $or: [{
      username: {
        $in: userIds
      }
    }, {
      email: {
        $in: userIds
      }
    }]
  }).toArray();
  await users.reduce(async (lp, user) => {
    await lp;
    await DB.collection(COLLECTION.AUTH).deleteMany({ sourceId: user._id });
    await DB.collection(COLLECTION.AUTH).deleteMany({
      $or: [{
        createdBy: user._id
      }, {
        objectId: user._id
      }]
    });
    await DB.collection(COLLECTION.EARNING).deleteMany({
      $or: [
        {
          userId: user._id
        },
        {
          performerId: user._id
        }
      ]
    });
    await DB.collection(COLLECTION.EARNING).deleteMany({
      $or: [
        {
          userId: user._id
        },
        {
          performerId: user._id
        }
      ]
    });
    const conversations = await DB.collection(COLLECTION.CONVERSATION).find({
      recipients: {
        $elemMatch: {
          sourceId: user._id
        }
      }
    }).toArray();
    await conversations.reduce(async (cp, conversation) => {
      await cp;
      await DB.collection(COLLECTION.MESSAGE).deleteMany({
        conversationId: conversation._id
      });
      return Promise.resolve();
    }, Promise.resolve());
    await DB.collection(COLLECTION.CONVERSATION).deleteMany({
      _id: {
        $in: conversations.map((c) => c._id)
      }
    });
    await DB.collection(COLLECTION.PAYMENT_TRANSACTION).deleteMany({
      sourceId: user._id
    });

    await DB.collection(COLLECTION.PERFORMER_BLOCK_USER).deleteMany({
      userId: user._id
    });

    await DB.collection(COLLECTION.REACT).deleteMany({
      $or: [{
        createdBy: user._id
      }, {
        objectId: user._id
      }]
    });

    await DB.collection(COLLECTION.USER_SUBSCRIPTION).deleteMany({
      $or: [
        {
          userId: user._id
        },
        {
          performerId: user._id
        }
      ]
    });

    await DB.collection(COLLECTION.USER).deleteMany({
      _id: user._id
    });
    return Promise.resolve();
  }, Promise.resolve());
};

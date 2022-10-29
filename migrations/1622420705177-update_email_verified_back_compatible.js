/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const { DB, COLLECTION } = require('./lib');

module.exports.up = async function up(next) {
  await DB.collection(COLLECTION.USER).updateMany({
    emailVerified: false
  }, {
    $set: {
      verifiedEmail: false
    },
    $unset: {
      emailVerified: ''
    }
  });
  await DB.collection(COLLECTION.USER).updateMany({
    emailVerified: true
  }, {
    $set: {
      verifiedEmail: true
    },
    $unset: {
      emailVerified: ''
    }
  });
  await DB.collection(COLLECTION.PERFORMER).updateMany({
    emailVerified: false
  }, {
    $set: {
      verifiedEmail: false
    },
    $unset: {
      emailVerified: ''
    }
  });
  await DB.collection(COLLECTION.PERFORMER).updateMany({
    emailVerified: true
  }, {
    $set: {
      verifiedEmail: true
    },
    $unset: {
      emailVerified: ''
    }
  });
  next();
};

module.exports.down = function down(next) {
  next();
};

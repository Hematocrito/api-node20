/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const { DB, COLLECTION } = require('./lib');

module.exports.up = async function up(next) {
  await DB.collection(COLLECTION.SETTING).deleteOne({
    key: 'requireEmailVerification'
  });
  next();
};

module.exports.down = function down(next) {
  next();
};

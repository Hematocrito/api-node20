const { DB, COLLECTION } = require('./lib');

module.exports.up = async function up(next) {
  console.log('Update CCbill & Verotel settings');
  await DB.collection(COLLECTION.SETTING).updateOne({
    key: 'ccbillEnabled'
  }, {
    $set: {
      ordering: 0,
      group: 'ccbill',
      name: 'Enable/Disable CCbill',
      description: 'Enable/Disable CCbill payment gateway on FE'
    }
  });
  await DB.collection(COLLECTION.SETTING).updateOne({
    key: 'ccbillSubAccountNumber'
  }, {
    $set: {
      ordering: 1,
      group: 'ccbill'
    }
  });
  await DB.collection(COLLECTION.SETTING).updateOne({
    key: 'ccbillFlexformId'
  }, {
    $set: {
      ordering: 2,
      group: 'ccbill'
    }
  });
  await DB.collection(COLLECTION.SETTING).updateOne({
    key: 'ccbillSalt'
  }, {
    $set: {
      ordering: 3,
      group: 'ccbill'
    }
  });
  await DB.collection(COLLECTION.SETTING).updateOne({
    key: 'ccbillClientAccountNumber'
  }, {
    $set: {
      ordering: 4,
      group: 'ccbill'
    }
  });
  await DB.collection(COLLECTION.SETTING).updateOne({
    key: 'ccbillDatalinkUsername'
  }, {
    $set: {
      ordering: 5,
      group: 'ccbill'
    }
  });
  await DB.collection(COLLECTION.SETTING).updateOne({
    key: 'ccbillDatalinkPassword'
  }, {
    $set: {
      ordering: 6,
      group: 'ccbill'
    }
  });
  await DB.collection(COLLECTION.SETTING).updateOne({
    key: 'verotelEnabled'
  }, {
    $set: {
      ordering: 0,
      group: 'verotel',
      name: 'Enable/Disable Verotel',
      description: 'Enable/Disable Verotel payment gateway on FE'
    }
  });
  await DB.collection(COLLECTION.SETTING).updateOne({
    key: 'verotelTestMode'
  }, {
    $set: {
      ordering: 1,
      group: 'verotel'
    }
  });
  await DB.collection(COLLECTION.SETTING).updateOne({
    key: 'verotelShopId'
  }, {
    $set: {
      ordering: 2,
      group: 'verotel'
    }
  });
  await DB.collection(COLLECTION.SETTING).updateOne({
    key: 'verotelFlexpaySignatureKey'
  }, {
    $set: {
      ordering: 3,
      group: 'verotel'
    }
  });
  await DB.collection(COLLECTION.SETTING).updateOne({
    key: 'verotelCurrency'
  }, {
    $set: {
      ordering: 4,
      group: 'verotel'
    }
  });
  await DB.collection(COLLECTION.SETTING).updateOne({
    key: 'verotelApiVersion'
  }, {
    $set: {
      ordering: 5,
      group: 'verotel'
    }
  });

  console.log('Update CCbill & Verotel settings done');

  // eslint-disable-next-line no-plusplus
  next();
};

module.exports.down = function down(next) {
  next();
};

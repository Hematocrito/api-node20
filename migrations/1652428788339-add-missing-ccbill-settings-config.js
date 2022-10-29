const { DB, COLLECTION } = require('./lib');

const SETTING_KEYS = {
  ENABLE_CCBILL: 'ccbillEnabled'
};

const settings = [
  {
    key: SETTING_KEYS.ENABLE_CCBILL,
    value: true,
    name: 'Enable/Disable CCbill',
    description: 'Enable/Disable CCbill payment gateway on FE',
    public: true,
    group: 'ccbill',
    editable: true,
    type: 'boolean'
  }
];

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Migrate bitpay settings');

  // eslint-disable-next-line no-restricted-syntax
  for (const setting of settings) {
    // eslint-disable-next-line no-await-in-loop
    const checkKey = await DB.collection(COLLECTION.SETTING).findOne({
      key: setting.key
    });
    if (!checkKey) {
      // eslint-disable-next-line no-await-in-loop
      await DB.collection(COLLECTION.SETTING).insertOne({
        ...setting,
        type: setting.type || 'text',
        createdAt: new Date(),
        updatedAt: new Date(),
        ordering: 0
      });
      // eslint-disable-next-line no-console
      console.log(`Inserted setting: ${setting.key}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`Setting: ${setting.key} exists`);
    }
  }
  // eslint-disable-next-line no-console
  console.log('Migrate settings done');
  next();
};

module.exports.down = function down(next) {
  next();
};

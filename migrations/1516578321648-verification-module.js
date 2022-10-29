const { DB, COLLECTION } = require('./lib');

const SETTING_KEYS = {
  POPUP_18_ENABLED: 'popup18Enabled',
  POPUP_18_CONTENT_ID: 'popup18ContentId'
};

const settings = [
  {
    key: SETTING_KEYS.POPUP_18_ENABLED,
    value: false,
    name: 'Enable popup 18+',
    description: 'Enable if you want to show popup 18+',
    type: 'boolean',
    public: true,
    group: 'general',
    editable: true,
    visible: true
  },
  {
    key: SETTING_KEYS.POPUP_18_CONTENT_ID,
    value: '',
    name: 'Popup 18+ Content',
    description: '',
    type: 'post',
    public: true,
    group: 'general',
    editable: true,
    visible: true
  }
];

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Migrate verification module');

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
        updatedAt: new Date()
      });
      // eslint-disable-next-line no-console
      console.log(`Inserted setting: ${setting.key}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`Setting: ${setting.key} exists`);
    }
  }
  // eslint-disable-next-line no-console
  console.log('Migrate verification module done');
  next();
};

module.exports.down = function down(next) {
  next();
};

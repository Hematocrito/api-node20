const { DB, COLLECTION } = require('./lib');

const COOKIE_POLICY_ENABLED_KEY = 'cookiePolicyEnabled';
const COOKIE_POLICY_CONTENT_ID_KEY = 'cookiePolicyContentId';

const settings = [{
  key: COOKIE_POLICY_ENABLED_KEY,
  value: false,
  name: 'Enable cookie policy',
  description: 'Enable/Disable cookie policy popup',
  type: 'boolean',
  public: true,
  group: 'general',
  editable: true,
  visible: true
},
{
  key: COOKIE_POLICY_CONTENT_ID_KEY,
  value: '',
  name: 'Popup cookie policy content',
  description: 'The post which contains policy content',
  type: 'post',
  public: true,
  group: 'general',
  editable: true,
  visible: true
}
];

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Migrate cookie policy settings');

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
  console.log('Migrate cookie policy settings done');
  next();
};

module.exports.down = function down(next) {
  next();
};

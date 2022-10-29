const { DB, COLLECTION } = require('./lib');

const SETTING_KEYS = {
  ENABLE_MODEL_RANKING_HOME_PAGE: 'enableModelRankingHomePage'
};

const settings = [
  {
    key: SETTING_KEYS.ENABLE_MODEL_RANKING_HOME_PAGE,
    value: false,
    name: 'Enable/Disable Model Ranking Home page',
    description: 'If enable, admin has to manage model list in the home page via Model Ranking menu. Once disabled, system will show top active models by num of subscribers',
    public: false,
    group: 'general',
    editable: true,
    type: 'boolean'
  }
];

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Migrate model ranking settings');

  // eslint-disable-next-line no-restricted-syntax
  for (const setting of settings) {
    // eslint-disable-next-line no-await-in-loop
    const checkKey = await DB.collection(COLLECTION.SETTING).findOne({
      key: setting.key
    });
    if (!checkKey) {
      // eslint-disable-next-line no-await-in-loop
      const pos = await DB.collection(COLLECTION.SETTING).count({ group: setting.group });
      // eslint-disable-next-line no-await-in-loop
      await DB.collection(COLLECTION.SETTING).insertOne({
        ...setting,
        type: setting.type || 'text',
        createdAt: new Date(),
        updatedAt: new Date(),
        ordering: pos + 1
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

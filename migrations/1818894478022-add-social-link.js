const { DB, COLLECTION } = require('./lib');

const SETTING_KEYS = {
  TWITTER_LINK: 'twitterLink',
  INSTAGRAM_LINK: 'instagramLink'
};

const settings = [
  {
    key: SETTING_KEYS.TWITTER_LINK,
    value: '',
    name: 'Twitter link',
    description: 'Leave blank, in order to hide the social buttons from the website footer.',
    public: true,
    group: 'socialAddress',
    editable: true
  },
  {
    key: SETTING_KEYS.INSTAGRAM_LINK,
    value: '',
    name: 'Instagram link',
    description: 'Leave blank, in order to hide the social buttons from the website footer.',
    public: true,
    group: 'socialAddress',
    editable: true
  }
];

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Migrate social link');

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
      console.log(`Inserted social link: ${setting.key}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`Setting: ${setting.key} exists`);
    }
  }

  await DB.collection(COLLECTION.SETTING).updateMany({
    group: 'socialAddress'
  }, {
    $set: {
      description: 'Leave blank, in order to hide the social buttons from the website footer.'
    }
  });
  // eslint-disable-next-line no-console
  console.log('Migrate social link done');
  next();
};

module.exports.down = function down(next) {
  next();
};

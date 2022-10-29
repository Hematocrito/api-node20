const { DB, COLLECTION } = require('./lib');

const SETTING_KEYS = {
  FACEBOOK_LINK: 'facebookLink',
  YOUTUBE_LINK: 'youtubeLink'
};

const settings = [
  {
    key: SETTING_KEYS.FACEBOOK_LINK,
    value: '',
    name: 'Facebook link',
    description: 'Input your facebook link here. By click on facebook icon in footer will open new tab and redirect to this link.',
    public: true,
    group: 'socialAddress',
    editable: true
  },
  {
    key: SETTING_KEYS.YOUTUBE_LINK,
    value: '',
    name: 'Youtube link',
    description: 'Input your youtube link here. By click on youtube icon in footer will open new tab and redirect to this link.',
    public: true,
    group: 'socialAddress',
    editable: true
  }
];

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Migrate social media');

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
      console.log(`Inserted social media: ${setting.key}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`Setting: ${setting.key} exists`);
    }
  }
  // eslint-disable-next-line no-console
  console.log('Migrate social media done');
  next();
};

module.exports.down = function down(next) {
  next();
};

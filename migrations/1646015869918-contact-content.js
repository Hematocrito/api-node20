const { DB, COLLECTION } = require('./lib');

const SETTING_KEYS = {
  CONTACT_CONTENT_ID: 'contactContentId',
  CONTACT_CONTENT_SLUG: 'contact-content'
};
const postContact = {
  title: 'Contact Content',
  type: 'post',
  status: 'published',
  authorId: null,
  shortDescription:
    'Please fill out all the info beside and we will get back to you with-in 48hrs.',
  content:
    '<p><span style="color: rgb(32,33,36);background-color: rgb(255,255,255);font-size: 11px;font-family: dejavu sans mono", monospace;">Please fill out all the info beside and we will get back to you with-in 48hrs.</span></p>\n',
  slug: SETTING_KEYS.CONTACT_CONTENT_SLUG,
  createdAt: new Date(),
  updatedAt: new Date()
};

module.exports.up = async function up(next) {
  const checkContact = await DB.collection(COLLECTION.POST).findOne({
    slug: SETTING_KEYS.CONTACT_CONTENT_SLUG
  });

  const checkSetting = await DB.collection(COLLECTION.SETTING).findOne({
    key: SETTING_KEYS.CONTACT_CONTENT_ID
  });
  // eslint-disable-next-line no-await-in-loop
  if (!checkContact && !checkSetting) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const postContactContent = await DB.collection(COLLECTION.POST).insertOne(
      postContact
    );
    const setting = {
      key: SETTING_KEYS.CONTACT_CONTENT_ID,
      value: postContactContent.ops[0]._id,
      name: 'Contact content',
      description: 'Contact content',
      type: 'post',
      public: true,
      group: 'general',
      editable: true,
      visible: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // eslint-disable-next-line no-await-in-loop
    await DB.collection(COLLECTION.SETTING).insertOne(setting);
  }

  // eslint-disable-next-line no-console
  // console.log(`Inserted setting: ${addPostContactContent.key}`);

  // eslint-disable-next-line no-console

  next();
};
module.exports.down = function down(next) {
  next();
};

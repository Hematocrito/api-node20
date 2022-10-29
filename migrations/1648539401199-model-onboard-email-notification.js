const { existsSync } = require('fs');
const { readFileSync } = require('fs');
const { join } = require('path');
const { DB, COLLECTION } = require('./lib');

const dir1 = join(
  __dirname,
  '..',
  'src',
  'templates',
  'emails',
  'model-onboard-instructions.html'
);
const dir2 = join(
  __dirname,
  '..',
  'dist',
  'templates',
  'emails',
  'model-onboard-instructions.html'
);

const TEMPLATE = existsSync(dir1) ? dir1 : dir2;

module.exports.up = async function up(next) {
  const exist = await DB.collection(COLLECTION.EMAIL_TEMPLATE).findOne({
    key: 'model-onboard-instructions'
  });

  if (!exist) {
    const content = readFileSync(TEMPLATE).toString();
    await DB.collection(COLLECTION.EMAIL_TEMPLATE).insertOne({
      key: 'model-onboard-instructions',
      content,
      subject: 'Model Onboarding Instructions',
      name: 'Model Onboarding Instructions',
      description: 'Email with onboarding instructions for new models',
      layout: 'layouts/default',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // setting option
  const checkKey = await DB.collection(COLLECTION.SETTING).findOne({
    key: 'sendModelOnboardInstruction'
  });
  if (!checkKey) {
    // eslint-disable-next-line no-await-in-loop
    await DB.collection(COLLECTION.SETTING).insertOne({
      key: 'sendModelOnboardInstruction',
      value: true,
      name: 'Send Model Onboarding Instructions?',
      description:
        'Turn ON to send an email to all new models based on the “Model Onboarding Instructions” template.',
      public: false,
      group: 'general',
      editable: true,
      type: 'boolean',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  next();
};

module.exports.down = function down(next) {
  next();
};

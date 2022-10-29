/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const { readdirSync } = require('fs');
const { readFileSync } = require('fs');
const { join, parse } = require('path');
const { DB, COLLECTION } = require('./lib');

const TEMPLATE_DIR = join(__dirname, '..', 'src', 'templates', 'emails');

const templateMap = {
  'model-report-notify': {
    name: 'Delete content report',
    subject: 'Video Violation',
    desc: 'Notification email will be sent to model once admin deleted video from user report'
  }
};

module.exports.up = async function up(next) {
  const files = readdirSync(TEMPLATE_DIR).filter((f) => f.includes('.html'));
  for (const file of files) {
    const content = readFileSync(join(TEMPLATE_DIR, file)).toString();
    const key = parse(file).name;
    const exist = await DB.collection(COLLECTION.EMAIL_TEMPLATE).findOne({ key });
    if (!exist) {
      templateMap[key] && await DB.collection(COLLECTION.EMAIL_TEMPLATE).insertOne({
        key,
        content,
        subject: templateMap[key].subject,
        name: templateMap[key].name,
        description: templateMap[key].desc,
        layout: 'layouts/default',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  next();
};

module.exports.down = function down(next) {
  next();
};

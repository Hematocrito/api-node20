const { DB, COLLECTION } = require('./lib');

module.exports.up = async function up(next) {
  const homeMenu = await DB.collection(COLLECTION.MENU).findOne({
    path: '/home'
  });
  if (!homeMenu) {
    await DB.collection(COLLECTION.MENU).insertOne({
      internal: false,
      isNewTab: false,
      parentId: null,
      path: '/',
      section: 'footer',
      title: 'Home',
      help: '',
      ordering: 0
    });
  }

  const modelMenu = await DB.collection(COLLECTION.MENU).findOne({
    path: '/model'
  });
  if (!modelMenu) {
    await DB.collection(COLLECTION.MENU).insertOne({
      internal: false,
      isNewTab: false,
      parentId: null,
      path: '/model',
      section: 'footer',
      title: 'Models',
      help: '',
      ordering: 0
    });
  }

  const contactMenu = await DB.collection(COLLECTION.MENU).findOne({
    path: '/contact'
  });
  if (!contactMenu) {
    await DB.collection(COLLECTION.MENU).insertOne({
      internal: false,
      isNewTab: false,
      parentId: null,
      path: '/contact',
      section: 'footer',
      title: 'Contact Us',
      help: '',
      ordering: 0
    });
  }

  next();
};

module.exports.down = function down(next) {
  next();
};

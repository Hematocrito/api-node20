const {
  DB, COLLECTION, encryptPassword, generateSalt
} = require('./lib');

const defaultPassword = 'adminadmin';

async function createAuth(newUser, userId, type = 'email') {
  const salt = generateSalt();
  const authCheck = await DB.collection(COLLECTION.AUTH).findOne({
    type,
    source: 'user',
    sourceId: userId
  });
  if (!authCheck) {
    await DB.collection(COLLECTION.AUTH).insertOne({
      type,
      source: 'user',
      sourceId: userId,
      salt,
      value: encryptPassword(defaultPassword, salt),
      key: type === 'email' ? newUser.email : newUser.username
    });
  }
}

module.exports.up = async function up(next) {
  const user = {
    firstName: 'Admin',
    lastName: 'Admin',
    email: `admin@${process.env.DOMAIN || 'example.com'}`,
    username: 'admin',
    roles: ['admin'],
    status: 'active',
    verifiedEmail: true
  };

  const sources = await DB.collection(COLLECTION.USER).find({
    $or: [{
      email: user.email.toLowerCase()
    }, {
      username: user.username
    }]
  }).toArray();

  if (sources.length) {
    // eslint-disable-next-line no-console
    console.log(`Email ${user.email} have been existed`);
    next();
    return;
  }
  // eslint-disable-next-line no-console
  console.log(`Seeding ${user.username}`);
  // eslint-disable-next-line no-await-in-loop
  const userId = await DB.collection(COLLECTION.USER).insertOne({
    ...user,
    createdAt: new Date(),
    updatedAt: new Date()
  });
    // eslint-disable-next-line no-await-in-loop
  await createAuth(user, userId.insertedId, 'email');
  // eslint-disable-next-line no-await-in-loop
  await createAuth(user, userId.insertedId, 'username');

  next();
};

module.exports.down = function down(next) {
  next();
};

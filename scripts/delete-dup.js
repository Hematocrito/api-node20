/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const { DB, COLLECTION } = require('../migrations/lib');

module.exports = async () => {
  const requireEmailVerificationUser = await DB.collection(
    COLLECTION.SETTING
  ).findOne({
    key: 'requireEmailVerificationUser'
  });
  await DB.collection(COLLECTION.SETTING).deleteMany({
    key: 'requireEmailVerificationUser',
    _id: {
      $ne: requireEmailVerificationUser._id
    }
  });

  const requireEmailVerificationPerformer = await DB.collection(
    COLLECTION.SETTING
  ).findOne({
    key: 'requireEmailVerificationPerformer'
  });
  await DB.collection(COLLECTION.SETTING).deleteMany({
    key: 'requireEmailVerificationPerformer',
    _id: {
      $ne: requireEmailVerificationPerformer._id
    }
  });

  const emailuser = await DB.collection(COLLECTION.EMAIL_TEMPLATE).findOne({
    key: 'email-verificaiton-user'
  });
  await DB.collection(COLLECTION.EMAIL_TEMPLATE).deleteMany({
    key: 'email-verificaiton-user',
    _id: {
      $ne: emailuser._id
    }
  });

  const emailModel = await DB.collection(COLLECTION.EMAIL_TEMPLATE).findOne({
    key: 'email-verificaiton-performer'
  });
  await DB.collection(COLLECTION.EMAIL_TEMPLATE).deleteMany({
    key: 'email-verificaiton-performer',
    _id: {
      $ne: emailModel._id
    }
  });

  await DB.collection(COLLECTION.EMAIL_TEMPLATE).updateOne(
    {
      key: 'email-verificaiton-user'
    },
    {
      $set: {
        key: 'email-verification-user'
      }
    }
  );
  await DB.collection(COLLECTION.EMAIL_TEMPLATE).updateOne(
    {
      key: 'email-verificaiton-performer'
    },
    {
      $set: {
        key: 'email-verification-performer'
      }
    }
  );

  await DB.collection(COLLECTION.SETTING).updateOne(
    {
      key: 'requireEmailVerificationUser'
    },
    {
      $set: {
        description: 'Require users to verify email address to login.'
      }
    }
  );

  await DB.collection(COLLECTION.SETTING).updateOne(
    {
      key: 'requireEmailVerificationPerformer'
    },
    {
      $set: {
        description: 'Require models to verify email address to login.'
      }
    }
  );
};

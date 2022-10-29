const {
  DB, COLLECTION
} = require('./lib');

module.exports.up = async function up(next) {
  await DB.collection(COLLECTION.SETTING).updateOne({
    key: 'userBenefit'
  }, {
    $set: {
      name: 'Fan Benefits',
      description: 'Add content to show in Fan Signup page here.'
    }
  });

  await DB.collection(COLLECTION.SETTING).updateOne({
    key: 'modelBenefit'
  }, {
    $set: {
      name: 'Model Benefits',
      description: 'Add content to show in Model Signup page here.'
    }
  });
  await DB.collection(COLLECTION.SETTING).updateOne({
    key: 'requireEmailVerification'
  }, {
    $set: {
      name: 'Mandatory Email Verification',
      description: 'If active, new users will need to verify email after registration.'
    }
  });

  await DB.collection(COLLECTION.SETTING).updateOne({
    key: 'maintenanceMode'
  }, {
    $set: {
      name: 'Maintenance Mode',
      description: 'If active, website will show up as being under maintenance.'
    }
  });

  await DB.collection(COLLECTION.SETTING).updateOne({
    key: 'cookiePolicyEnabled'
  }, {
    $set: {
      name: 'Enable Cookie Policy Popup',
      description: 'Enable/disable the popup for cookie policy.'
    }
  });

  await DB.collection(COLLECTION.SETTING).updateOne({
    key: 'cookiePolicyContentId'
  }, {
    $set: {
      name: 'Content for Cookie Policy Popup',
      description: 'Select the Post containing the content for the Cookie Policy Popup.'
    }
  });
  await DB.collection(COLLECTION.SETTING).updateOne({
    key: 'popup18Enabled'
  }, {
    $set: {
      name: '18+ Disclaimer Popup',
      description: 'Enable to show the Age Disclaimer popup.'
    }
  });
  await DB.collection(COLLECTION.SETTING).updateOne({
    key: 'popup18ContentId'
  }, {
    $set: {
      name: 'Age Disclaimer Popup Content',
      description: 'Select the Post containing the content for the Age Disclaimer.'
    }
  });
  await DB.collection(COLLECTION.SETTING).updateOne({
    key: 'senderEmail'
  }, {
    $set: {
      name: 'Mailbox for automated emails',
      description: 'Automated emails from the site, like subscription or purchase confirmation, forgot password, and so on, will be sent from this address.'
    }
  });
  await DB.collection(COLLECTION.SETTING).updateOne({
    key: 'adminEmail'
  }, {
    $set: {

      description: 'Emails from site features, such as contact page, or violation report will be delivered to this address.'
    }
  });
  await DB.collection(COLLECTION.SETTING).updateOne({
    key: 'gaCode'
  }, {
    $set: {
      name: 'Tracking ID',
      description: 'Add the Tracking Code here, e.g.: UA-12345678-1 or G-R9D67xxxxx'
    }
  });
  next();
};

module.exports.down = function down(next) {
  next();
};

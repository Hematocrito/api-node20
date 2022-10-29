const { DB, COLLECTION } = require('./lib');

const SETTING_KEYS = {
  PRIVATE_C2C_DEFAULT_PRICE: 'privateC2CDefaultPrice',
  PRIVATE_CHAT_COMMISSION: ' privateChatDefaultCommission',
  TOKEN_TIP_COMMISSION: 'tokenTipCommission',
  VIEWER_URL: 'viewerURL',
  PUBLISHER_URL: 'publisherURL',
  SUBSCRIBER_URL: 'subscriberUrl',
  OPTION_FOR_BROADCAST: 'optionForBroadcast',
  OPTION_FOR_PRIVATE: 'optionForPrivate',
  SECURE_OPTION: 'secureOption',
  ANT_MEDIA_API_ENDPOINT: 'AntMediaApiEndpoint',
  ANT_MEDIA_APPNAME: 'AntMediaAppname'
};

const settings = [
  {
    key: SETTING_KEYS.PRIVATE_CHAT_COMMISSION,
    value: 0.3,
    name: 'Private chat for stream commission',
    description: 'Setting private chat for stream commission',
    public: false,
    group: 'commission',
    editable: true,
    type: 'number',
    meta: {
      min: 0,
      max: 1,
      step: 0.1
    }
  },
  {
    key: SETTING_KEYS.TOKEN_TIP_COMMISSION,
    value: 0.2,
    name: 'Tip Commission',
    description: 'Setting tip commission',
    public: false,
    group: 'commission',
    editable: true,
    type: 'number',
    meta: {
      min: 0,
      max: 1,
      step: 0.1
    }
  },
  {
    key: SETTING_KEYS.ANT_MEDIA_API_ENDPOINT,
    value: 'http://localhost:5080',
    name: 'Api Server',
    description: 'Ant Media Api Server Endpoint eg https://stream.yourserver.com',
    public: false,
    group: 'ant',
    editable: true,
    visible: true,
    type: 'text'
  },
  {
    key: SETTING_KEYS.ANT_MEDIA_APPNAME,
    value: 'LiveApp',
    name: 'App Name',
    description: 'Ant Media AppName (LiveApp, WebRTCApp, WebRTCAppEE)',
    public: true,
    group: 'ant',
    editable: true,
    visible: true,
    type: 'text'
  },
  {
    key: SETTING_KEYS.VIEWER_URL,
    value: `streaming.${process.env.DOMAIN || 'example.com'}`,
    name: 'Viewer url ',
    description: 'Viewer URL',
    public: true,
    group: 'ant',
    editable: true,
    type: 'text'
  },
  {
    key: SETTING_KEYS.PUBLISHER_URL,
    value: `streaming.${process.env.DOMAIN || 'example.com'}`,
    name: 'Publisher url ',
    description: 'Publisher URL',
    public: true,
    group: 'ant',
    editable: true,
    type: 'text'
  },
  {
    key: SETTING_KEYS.SUBSCRIBER_URL,
    value: `streaming.${process.env.DOMAIN || 'example.com'}`,
    name: 'Subscriber url ',
    description: 'Subscriber URL',
    public: true,
    group: 'ant',
    editable: true,
    extra: 'Apply for Ant enterprise option only',
    type: 'text'
  },
  {
    key: SETTING_KEYS.OPTION_FOR_BROADCAST,
    value: 'hls',
    name: 'Option for broadcast ',
    description: 'Option Broadcast',
    public: true,
    group: 'ant',
    editable: true,
    type: 'radio',
    extra: 'Apply for Ant enterprise option only',
    meta: {
      value: [{ key: 'hls', name: 'HLS' }, { key: 'webrtc', name: 'webRTC' }]
    }
  },
  {
    key: SETTING_KEYS.OPTION_FOR_PRIVATE,
    value: 'hls',
    name: 'Option for private ',
    description: 'Option Private',
    public: true,
    group: 'ant',
    editable: true,
    type: 'radio',
    extra: 'Apply for Ant enterprise option only',
    meta: {
      value: [{ key: 'hls', name: 'HLS' }, { key: 'webrtc', name: 'webRTC' }]
    }
  },
  {
    key: SETTING_KEYS.SECURE_OPTION,
    value: false,
    name: 'Secure option ',
    description: 'Option Secure',
    public: true,
    group: 'ant',
    editable: true,
    type: 'boolean',
    extra: 'Apply for Ant enterprise option only'
  }
];

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Migrate live-stream settings');

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
      console.log(`Inserted live-stream setting: ${setting.key}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`Setting: ${setting.key} exists`);
    }
  }
  // eslint-disable-next-line no-console
  console.log('Migrate  live-stream settings done');
  next();
};

module.exports.down = function down(next) {
  next();
};

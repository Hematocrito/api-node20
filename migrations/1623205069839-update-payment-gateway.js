const { DB, COLLECTION } = require('./lib');

const SETTING_KEYS = {
  ENABLE_CCBILL: 'ccbillEnabled',
  VEROTEL_SHOP_ID: 'verotelShopId',
  VEROTEL_FLEXPAY_SIGNATURE_KEY: 'verotelFlexpaySignatureKey',
  VEROTEL_API_VERSION: 'verotelApiVersion',
  VEROTEL_CURRENCY: 'verotelCurrency',
  VEROTEL_ENABLED: 'verotelEnabled',
  VEROTEL_TEST_MODE: 'verotelTestMode'
};

const data = [
  {
    key: SETTING_KEYS.VEROTEL_ENABLED,
    value: false,
    name: 'Verotel Enable',
    description: 'Enable / Disable Verotel Flexpay option in FE',
    public: true,
    type: 'boolean',
    group: 'verotel',
    editable: true
  },
  {
    key: SETTING_KEYS.VEROTEL_TEST_MODE,
    value: false,
    name: 'Verotel Test mode',
    description:
      'Enable if you are using test environment in Verotel dashboard',
    public: false,
    type: 'boolean',
    group: 'verotel',
    editable: true
  },
  {
    key: SETTING_KEYS.VEROTEL_SHOP_ID,
    value: '',
    name: 'Verotel Shop Id',
    description:
      'Verotel Flexpay Numerical ID of the shop or website in the Verotel system.',
    public: false,
    group: 'verotel',
    editable: true
  },
  {
    key: SETTING_KEYS.VEROTEL_FLEXPAY_SIGNATURE_KEY,
    value: '',
    name: 'Verotel Signature key',
    description:
      'Flexpay signature key. . This key is used for calculating signatures to ensure integrity of data in requests and postbacks',
    public: false,
    group: 'verotel',
    editable: true
  },
  {
    key: SETTING_KEYS.VEROTEL_API_VERSION,
    value: '3',
    name: 'Verotel Api version',
    description: 'version of the FlexPay call, 3 for this version',
    public: false,
    group: 'verotel',
    editable: true
  },
  {
    key: SETTING_KEYS.VEROTEL_CURRENCY,
    value: 'USD',
    name: 'Verotel Currency',
    description:
      '3 char ISO code, must be one of the Sale currencies (USD, EUR, GBP, AUD, CAD, CHF, DKK, NOK, SEK) Note: only EUR is can be used for DDEU payment method',
    public: false,
    group: 'verotel',
    editable: true
  }
];

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Update Verotel Settings');

  // eslint-disable-next-line no-restricted-syntax
  for (const setting of data) {
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
      console.log(`Inserted setting: ${setting.key}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`Setting: ${setting.key} exists`);
    }
  }
  // eslint-disable-next-line no-console
  console.log('done');
  next();
};

module.exports.down = function dow(next) {
  next();
};

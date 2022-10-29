const { DB, COLLECTION } = require('./lib');

const SETTING_KEYS = {
  SITE_NAME: 'siteName',
  LOGO_URL: 'logoUrl',
  FAVICON: 'favicon',
  LOGIN_PLACEHOLDER_IMAGE: 'loginPlaceholderImage',
  REQUIRE_EMAIL_VERIFICATION: 'requireEmailVerification',
  ADMIN_EMAIL: 'adminEmail',
  SENDER_EMAIL: 'senderEmail',
  META_KEYWORDS: 'metaKeywords',
  META_DESCRIPTION: 'metaDescription',
  HEADER_SCRIPT: 'headerScript',
  AFTER_BODY_SCRIPT: 'afterBodyScript',
  MONTHLY_SUBSCRIPTION_COMMISSION: 'monthlySubscriptionCommission',
  YEARLY_SUBSCRIPTION_COMMISSION: 'yearlySubscriptionCommission',
  VIDEO_SALE_COMMISSION: 'videoSaleCommission',
  PRODUCT_SALE_COMMISSION: 'productSaleCommission',
  CCBILL_CLIENT_ACCOUNT_NUMBER: 'ccbillClientAccountNumber',
  CCBILL_SUB_ACCOUNT_NUMBER: 'ccbillSubAccountNumber',
  CCBILL_FLEXFORM_ID: 'ccbillFlexformId',
  CCBILL_SALT: 'ccbillSalt',
  SMTP_TRANSPORTER: 'smtpTransporter',
  GOOGLE_ANALYTICS_CODE: 'gaCode',
  MAINTENANCE_MODE: 'maintenanceMode',
  FOOTER_CONTENT: 'footerContent',
  USER_BENEFIT: 'userBenefit',
  MODEL_BENEFIT: 'modelBenefit'
};

const settings = [
  {
    key: SETTING_KEYS.SITE_NAME,
    value: process.env.SITE_NAME || process.env.DOMAIN || 'Application',
    name: 'Site name',
    description: 'Global name',
    public: true,
    group: 'general',
    editable: true
  },
  {
    key: SETTING_KEYS.LOGO_URL,
    value: '',
    name: 'Logo',
    description: 'Site logo',
    public: true,
    group: 'general',
    editable: true,
    meta: {
      upload: true,
      image: true
    }
  },
  {
    key: SETTING_KEYS.FAVICON,
    value: '',
    name: 'Favicon',
    description: 'Site Favicon',
    public: true,
    group: 'general',
    editable: true,
    meta: {
      upload: true,
      image: true
    }
  },
  {
    key: SETTING_KEYS.LOGIN_PLACEHOLDER_IMAGE,
    value: '',
    name: 'Placeholder img',
    description: 'Login placeholder image',
    public: true,
    group: 'general',
    editable: true,
    meta: {
      upload: true,
      image: true
    }
  },
  {
    key: SETTING_KEYS.FOOTER_CONTENT,
    value: `<p style="text-align:center;"><strong>${process.env.DOMAIN} © Copyright 2021</strong></p><p style="text-align:center;"></p style="text-align: center"><img src="https://www.dmca.com/img/dmca_logo.png?=sd" alt="" style="width: 70px"/><p></p>`,
    name: 'Footer content',
    description: 'Add texts for your footer here',
    public: true,
    group: 'general',
    editable: true,
    type: 'text-editor'
  },
  {
    key: SETTING_KEYS.USER_BENEFIT,
    // eslint-disable-next-line quotes
    value: `<ul><li>View exclusive content</li><li>Monthly and Yearly subscriptions</li><li>Fast and reliable buffering and viewing</li><li>Multiple solution options to choose from</li><li>Chat with model</li><li>Access model's personal store</li><li>Search and filter capabilities</li><li>Favorite your video for future viewing</li></ul>`,
    name: 'User Benefit',
    description: 'Add User benefit content here',
    public: true,
    group: 'general',
    editable: true,
    type: 'text-editor'
  },
  {
    key: SETTING_KEYS.MODEL_BENEFIT,
    value: '<ul><li>Lightning fast uploading</li><li>Multi-video uploading</li><li>Chat with fans</li><li>Cross-over-content between models</li><li>Individual model store</li><li>80% Standard commission rate</li><li>Deduct 5% when gained from affiliate</li></ul>',
    name: 'Model Benefit',
    description: 'Add Model benefit content here',
    public: true,
    group: 'general',
    editable: true,
    type: 'text-editor'
  },
  {
    key: SETTING_KEYS.REQUIRE_EMAIL_VERIFICATION,
    value: false,
    name: 'Mandatory email verification',
    description:
      'If active, user must verify email before login to system',
    type: 'boolean',
    public: false,
    group: 'general',
    editable: true
  },
  {
    key: SETTING_KEYS.MAINTENANCE_MODE,
    value: false,
    name: 'Maintenance mode',
    description:
      'If active, user will see maintenance page once visiting site',
    type: 'boolean',
    public: true,
    group: 'general',
    editable: true
  },
  {
    key: SETTING_KEYS.ADMIN_EMAIL,
    value: process.env.ADMIN_EMAIL || `admin@${process.env.DOMAIN}`,
    name: 'Admin email',
    description: 'Email will receive information from site features',
    public: false,
    group: 'email',
    editable: true
  },
  {
    key: SETTING_KEYS.SENDER_EMAIL,
    value: process.env.SENDER_EMAIL || `noreply@${process.env.DOMAIN}`,
    name: 'Sender email',
    description: 'Email will send application email',
    public: false,
    group: 'email',
    editable: true
  },
  {
    key: SETTING_KEYS.META_KEYWORDS,
    value: '',
    name: 'Home meta keywords',
    description: 'Custom meta keywords',
    public: true,
    group: 'custom',
    editable: true
  },
  {
    key: SETTING_KEYS.META_DESCRIPTION,
    value: '',
    name: 'Home meta description',
    description: 'Custom meta description',
    public: true,
    group: 'custom',
    editable: true,
    type: 'text',
    meta: {
      textarea: true
    }
  },
  {
    key: SETTING_KEYS.HEADER_SCRIPT,
    value: '',
    name: 'Custom header script',
    description: 'Custom code in <head> tag',
    public: true,
    group: 'custom',
    editable: true,
    type: 'text',
    meta: {
      textarea: true
    }
  },
  {
    key: SETTING_KEYS.AFTER_BODY_SCRIPT,
    value: '',
    name: 'Custom body script',
    description: 'Custom code at end of <body> tag',
    public: true,
    group: 'custom',
    editable: true,
    type: 'text',
    meta: {
      textarea: true
    }
  },
  {
    key: SETTING_KEYS.MONTHLY_SUBSCRIPTION_COMMISSION,
    value: 0.2,
    name: 'Monthly subscription commission',
    description: 'Monthly subscription commission 0.01-0.99 (1%-99%)',
    public: false,
    group: 'commission',
    editable: true,
    type: 'number'
  },
  {
    key: SETTING_KEYS.YEARLY_SUBSCRIPTION_COMMISSION,
    value: 0.2,
    name: 'Yearly subscription commission',
    description: 'Yearly subscription commission 0.01-0.99 (1%-99%)',
    public: false,
    group: 'commission',
    editable: true,
    type: 'number'
  },
  {
    key: SETTING_KEYS.VIDEO_SALE_COMMISSION,
    value: 0.2,
    name: 'Video for sale commission',
    description: 'Video for sale commission 0.01-0.99 (1%-99%)',
    public: false,
    group: 'commission',
    editable: true,
    type: 'number'
  },
  {
    key: SETTING_KEYS.PRODUCT_SALE_COMMISSION,
    value: 0.2,
    name: 'Product for sale commission',
    description: 'Product for sale commission 0.01-0.99 (1%-99%)',
    public: false,
    group: 'commission',
    editable: true,
    type: 'number'
  },
  {
    key: SETTING_KEYS.CCBILL_SUB_ACCOUNT_NUMBER,
    value: '',
    name: 'Sub account number',
    description: 'CCbill sub account number',
    public: false,
    group: 'ccbill',
    editable: true,
    type: 'text'
  },
  {
    key: SETTING_KEYS.CCBILL_SALT,
    value: '',
    name: 'Sub salt number',
    description: 'CCbill salt number',
    public: false,
    group: 'ccbill',
    editable: true,
    type: 'text'
  },
  {
    key: SETTING_KEYS.CCBILL_FLEXFORM_ID,
    value: '',
    name: 'Flexform ID',
    description: 'CCbill flexform ID',
    public: false,
    group: 'ccbill',
    editable: true,
    type: 'text'
  },
  {
    key: SETTING_KEYS.CCBILL_CLIENT_ACCOUNT_NUMBER,
    value: '',
    name: 'Client account number',
    description: 'CCbill merchant account number (eg: 987654)',
    public: false,
    group: 'ccbill',
    editable: true,
    type: 'text'
  },
  {
    key: SETTING_KEYS.SMTP_TRANSPORTER,
    value: {
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      auth: {
        user: 'username',
        pass: 'password'
      }
    },
    name: 'SMTP Transport',
    description: 'Set up SMTP here',
    public: false,
    group: 'mailer',
    editable: true,
    type: 'mixed'
  },
  {
    key: SETTING_KEYS.GOOGLE_ANALYTICS_CODE,
    value: '',
    name: 'GA code',
    description: 'Google Analytics Code eg: GA-123456xx',
    public: true,
    group: 'analytics',
    editable: true,
    type: 'text'
  }
];

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Migrate settings');

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
      console.log(`Inserted setting: ${setting.key}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`Setting: ${setting.key} exists`);
    }
  }
  // eslint-disable-next-line no-console
  console.log('Migrate settings done');
  next();
};

module.exports.down = function down(next) {
  next();
};

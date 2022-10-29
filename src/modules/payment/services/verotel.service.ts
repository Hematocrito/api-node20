import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { sortBy } from 'lodash';
import { PaymentTransactionModel } from '../models';
import { PAYMENT_TYPE } from '../constants';

@Injectable()
export class VerotelService {
  constructor(
    @Inject(forwardRef(() => SettingService))
    private readonly settingService: SettingService
  ) {
  }

  public async createSingleRequestFromTransaction(transaction: PaymentTransactionModel, options?: any) {
    const [
      VEROTEL_ENABLED,
      VEROTEL_API_VERSION,
      VEROTEL_CURRENCY,
      VEROTEL_FLEXPAY_SIGNATURE_KEY,
      VEROTEL_SHOP_ID,
      VEROTEL_TEST_MODE
    ] = await Promise.all([
      this.settingService.getKeyValue(SETTING_KEYS.VEROTEL_ENABLED),
      this.settingService.getKeyValue(SETTING_KEYS.VEROTEL_API_VERSION),
      this.settingService.getKeyValue(SETTING_KEYS.VEROTEL_CURRENCY),
      this.settingService.getKeyValue(
        SETTING_KEYS.VEROTEL_FLEXPAY_SIGNATURE_KEY
      ),
      this.settingService.getKeyValue(SETTING_KEYS.VEROTEL_SHOP_ID),
      this.settingService.getKeyValue(SETTING_KEYS.VEROTEL_TEST_MODE)
    ]);

    if (!VEROTEL_ENABLED) throw new Error('Flexpay is not enabled!');

    /**
     * The "startorder" request for FlexPay purchase consists of number of parameters passed to
    "https://secure.verotel.com/startorder?" for Verotel accounts or
    "https://secure.billing.creditcard/startorder?" for CardBilling accounts and is secured by a
    signature.

    The signature used in FlexPay requests and postbacks is calculated as SHA-1 hash (hexadecimal
    output) from the request parameters.
    The first parameter has to be your signatureKey, followed by the parameters ordered alphabetically
    by their names.
    Optional arguments that are used (have value) must be contained in the signature calculation.
    Optional arguments that are not used must not be contained in the signature calculation.
    The email parameter in "startorder" request is not included in the signature calculations.
    It is mandatory to convert arguments values into UTF-8 before computing the signature.
    e.g.
    signature = sha1_hex( signatureKey + ":description=" + description + ":period=" + period +
    ":priceAmount=" + priceAmount + ":priceCurrency=" + priceCurrency + ":referenceID=" +
    referenceID + ":shopID=" + shopID + ":subscriptionType=" + subscriptionType + ":type=" + type +
    ":version=" + version )
     */
    const description = options?.description || `One time payment for ${transaction.type}`;
    // priceAmount amount to be processed. in nnn.nn formatt
    const priceAmount = transaction.totalPrice.toFixed(2);
    const shasum = createHash('sha1');
    shasum.update(`${VEROTEL_FLEXPAY_SIGNATURE_KEY}:custom1=${options?.userId}:description=${description}:priceAmount=${priceAmount}:priceCurrency=${VEROTEL_CURRENCY}:referenceID=${transaction._id}:shopID=${VEROTEL_SHOP_ID}:type=purchase:version=${VEROTEL_API_VERSION}`);
    const signature = shasum.digest('hex');
    const payUrl = new URL(
      VEROTEL_TEST_MODE
        ? 'https://secure.verotel.com/startorder'
        : 'https://secure.billing.creditcard/startorder'
    );
    payUrl.searchParams.append('custom1', options?.userId);
    payUrl.searchParams.append('description', description);
    payUrl.searchParams.append('priceAmount', priceAmount);
    payUrl.searchParams.append('priceCurrency', VEROTEL_CURRENCY);
    payUrl.searchParams.append('referenceID', transaction._id);
    payUrl.searchParams.append('shopID', VEROTEL_SHOP_ID);
    payUrl.searchParams.append('type', 'purchase');
    payUrl.searchParams.append('version', VEROTEL_API_VERSION);
    payUrl.searchParams.append('signature', signature);
    return {
      paymentUrl: payUrl.href,
      signature
    };
  }

  public async createRecurringRequestFromTransaction(transaction: PaymentTransactionModel, options: any) {
    const [
      VEROTEL_ENABLED,
      VEROTEL_API_VERSION,
      VEROTEL_CURRENCY,
      VEROTEL_FLEXPAY_SIGNATURE_KEY,
      VEROTEL_SHOP_ID,
      VEROTEL_TEST_MODE
    ] = await Promise.all([
      this.settingService.getKeyValue(SETTING_KEYS.VEROTEL_ENABLED),
      this.settingService.getKeyValue(SETTING_KEYS.VEROTEL_API_VERSION),
      this.settingService.getKeyValue(SETTING_KEYS.VEROTEL_CURRENCY),
      this.settingService.getKeyValue(
        SETTING_KEYS.VEROTEL_FLEXPAY_SIGNATURE_KEY
      ),
      this.settingService.getKeyValue(SETTING_KEYS.VEROTEL_SHOP_ID),
      this.settingService.getKeyValue(SETTING_KEYS.VEROTEL_TEST_MODE)
    ]);

    if (!VEROTEL_ENABLED) throw new Error('Flexpay is not enabled!');

    /**
     * The "startorder" request for FlexPay purchase consists of number of parameters passed to
    "https://secure.verotel.com/startorder?" for Verotel accounts or
    "https://secure.billing.creditcard/startorder?" for CardBilling accounts and is secured by a
    signature.

    The signature used in FlexPay requests and postbacks is calculated as SHA-1 hash (hexadecimal
    output) from the request parameters.
    The first parameter has to be your signatureKey, followed by the parameters ordered alphabetically
    by their names.
    Optional arguments that are used (have value) must be contained in the signature calculation.
    Optional arguments that are not used must not be contained in the signature calculation.
    The email parameter in "startorder" request is not included in the signature calculations.
    It is mandatory to convert arguments values into UTF-8 before computing the signature.
    e.g.
    signature = sha1_hex( signatureKey + ":description=" + description + ":period=" + period +
    ":priceAmount=" + priceAmount + ":priceCurrency=" + priceCurrency + ":referenceID=" +
    referenceID + ":shopID=" + shopID + ":subscriptionType=" + subscriptionType + ":type=" + type +
    ":version=" + version )
    "one-time" subscriptions - simply expire after the time specified in "period" parameter.
     "recurring" subscriptions - will attempt to rebill the buyer in order to stay active.
    The initial period can have different price and duration (set via "trialPeriod" and
    "trialAmount" parameters) then the following rebill periods (specified in "period" and
    "priceAmount" parameters).
     */
    const description = options?.description || `Recurring payment for ${transaction.type}`;
    // priceAmount amount to be processed. in nnn.nn formatt
    const priceAmount = transaction.totalPrice.toFixed(2);
    // duration in ISO8601 format, for example: P30D, minimum is 7 days for "recurring" and 2 days for "on-time"
    const period = transaction.type === PAYMENT_TYPE.MONTHLY_SUBSCRIPTION ? 'P30D' : 'P1Y';
    const shasum = createHash('sha1');
    shasum.update(`${VEROTEL_FLEXPAY_SIGNATURE_KEY}:custom1=${options.userId}:custom2=${options.performerId}:custom3=${transaction.type}:description=${description}:period=${period}:priceAmount=${priceAmount}:priceCurrency=${VEROTEL_CURRENCY}:referenceID=${transaction._id}:shopID=${VEROTEL_SHOP_ID}:subscriptionType=recurring:type=subscription:version=${VEROTEL_API_VERSION}`);
    const signature = shasum.digest('hex');
    const payUrl = new URL(
      VEROTEL_TEST_MODE
        ? 'https://secure.verotel.com/startorder'
        : 'https://secure.billing.creditcard/startorder'
    );
    payUrl.searchParams.append('custom1', options.userId);
    payUrl.searchParams.append('custom2', options.performerId);
    payUrl.searchParams.append('custom3', transaction.type);
    payUrl.searchParams.append('description', description);
    payUrl.searchParams.append('period', period);
    payUrl.searchParams.append('priceAmount', priceAmount);
    payUrl.searchParams.append('priceCurrency', VEROTEL_CURRENCY);
    payUrl.searchParams.append('referenceID', transaction._id);
    payUrl.searchParams.append('shopID', VEROTEL_SHOP_ID);
    payUrl.searchParams.append('subscriptionType', 'recurring');
    payUrl.searchParams.append('type', 'subscription');
    payUrl.searchParams.append('version', VEROTEL_API_VERSION);
    payUrl.searchParams.append('signature', signature);
    return {
      paymentUrl: payUrl.href,
      signature
    };
  }

  public async isValidSignatureFromQuery(query) {
    const [VEROTEL_FLEXPAY_SIGNATURE_KEY] = await Promise.all([
      this.settingService.getKeyValue(SETTING_KEYS.VEROTEL_FLEXPAY_SIGNATURE_KEY)
    ]);
    const arr = [] as any;
    Object.keys(query).forEach((key) => {
      if (key !== 'signature') {
        arr.push({
          key,
          value: query[key]
        });
      }
    });
    const sortArr = sortBy(arr, ['key']).map((item) => `${item.key}=${item.value}`);
    const txtToJoin = `${VEROTEL_FLEXPAY_SIGNATURE_KEY}:${sortArr.join(':')}`;

    const shasum = createHash('sha1');
    shasum.update(txtToJoin);
    const signature = shasum.digest('hex');
    return signature === query.signature;
  }
}

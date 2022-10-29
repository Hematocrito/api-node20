import { Injectable } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { EntityNotFoundException } from 'src/kernel';
import axios from 'axios';
import { SUBSCRIPTION_TYPE } from '../../subscription/constants';

const crypto = require('crypto');

interface CCBillSubscription {
  salt: string;
  flexformId: string;
  subAccountNumber: string;
  price: number;
  transactionId: string | ObjectId;
  subscriptionType: string;
}

interface CCBillSinglePurchase {
  salt: string;
  flexformId: string;
  subAccountNumber: string;
  transactionId: string | ObjectId;
  price: number;
  currencyCode?: string;
}
interface ICCBillCancelSubscription {
  subscriptionId: string;
  ccbillClientAccNo: string,
  ccbillDatalinkUsername: string;
  ccbillDatalinkPassword: string;
}

@Injectable()
export class CCBillService {
  public subscription(options: CCBillSubscription) {
    const { transactionId } = options;
    const { salt } = options;
    const { flexformId } = options;
    const { subAccountNumber } = options;
    const initialPrice = options.price.toFixed(2);
    const initialPeriod = (options.subscriptionType === SUBSCRIPTION_TYPE.MONTHLY || options.subscriptionType === 'monthly_subscription') ? 30 : 365;
    const currencyCode = '840'; // usd
    if (!salt || !flexformId || !subAccountNumber || !transactionId || !initialPrice) {
      throw new EntityNotFoundException();
    }
    const formDigest = crypto.createHash('md5')
      .update(`${initialPrice}${initialPeriod}${initialPrice}${initialPeriod}99${currencyCode}${salt}`).digest('hex');
    return {
      paymentUrl: `https://api.ccbill.com/wap-frontflex/flexforms/${flexformId}?transactionId=${transactionId}&initialPrice=${initialPrice}&initialPeriod=${initialPeriod}&recurringPrice=${initialPrice}&recurringPeriod=${initialPeriod}&numRebills=99&clientSubacc=${subAccountNumber}&currencyCode=${currencyCode}&formDigest=${formDigest}`
    };
  }

  public singlePurchase(options: CCBillSinglePurchase) {
    const { transactionId } = options;
    const { salt } = options;
    const { flexformId } = options;
    const { subAccountNumber } = options;
    const initialPrice = options.price.toFixed(2);
    const currencyCode = options.currencyCode || '840';
    const initialPeriod = 30;
    if (!salt || !flexformId || !subAccountNumber || !transactionId || !initialPrice) {
      throw new EntityNotFoundException();
    }
    const formDigest = crypto.createHash('md5')
      .update(`${initialPrice}${initialPeriod}${currencyCode}${salt}`)
      .digest('hex');
    return {
      paymentUrl: `https://api.ccbill.com/wap-frontflex/flexforms/${flexformId}?transactionId=${transactionId}&initialPrice=${initialPrice}&initialPeriod=${initialPeriod}&clientSubacc=${subAccountNumber}&currencyCode=${currencyCode}&formDigest=${formDigest}`
    };
  }

  public async cancelSubscription(options: ICCBillCancelSubscription) {
    const ccbillCancelUrl = 'https://datalink.ccbill.com/utils/subscriptionManagement.cgi';
    const {
      subscriptionId, ccbillClientAccNo, ccbillDatalinkUsername, ccbillDatalinkPassword
    } = options;
    const resp = await axios.get(`${ccbillCancelUrl}?subscriptionId=${subscriptionId}&username=${ccbillDatalinkUsername}&password=${ccbillDatalinkPassword}&action=cancelSubscription&clientAccnum=${ccbillClientAccNo}`);
    return resp?.data?.includes('"results"\n"1"\n');
  }
}

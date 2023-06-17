import { Injectable } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import * as crypto from 'crypto';
import { AstropayDepositPayload } from '../payloads/astropay.payload';
import { AstropayDepositDto } from '../dtos/astropay.dto';

@Injectable()
export class AstropayPaymentsService {
  async requestDeposit(payload: AstropayDepositDto) {
    console.log(payload);
    try {
      const newPayload = {
        amount: payload.amount,
        currency: payload.currency,
        country: payload.country,
        merchant_deposit_id: payload.merchantDepositId,
        callback_url: 'https://api.myadultfan.com/payments/astropay',
        redirect_url: 'https://www.myadultfan.com',
        user: {
          merchant_user_id: payload.user.merchantUserId
        },
        product: {
          mcc: payload.product.mcc,
          category: payload.product.category,
          merchant_code: payload.product.merchantCode,
          description: payload.product.description
        },
        visual_info: {
          merchant_name: payload.visualInfo.merchantName
        }
      };
      const hmac = crypto.createHmac('sha256', process.env.ASTROPAY_SECRET_KEY);
      hmac.update(JSON.stringify(newPayload));
      const hash = hmac.digest('hex');
      const headers: AxiosRequestConfig['headers'] = {
        'Content-Type': 'application/json',
        Signature: hash,
        'Merchant-Gateway-Api-Key': process.env.ASTROPAY_API_KEY

      };
      const res = await axios.post('https://onetouch-api-sandbox.astropay.com/merchant/v1/deposit/init', newPayload, { headers });
      console.log('response', res.data);
      return {
        ...res.data,
        paymentUrl: res.data.url
      };
    } catch (error) {
      console.log('error====', error);
      return {
        error: error.message
      };
    }
  }

  async requestCashoutV1() {
    try {
      const body = {
        amount: 20,
        currency: 'USD',
        country: 'BR',
        merchant_deposit_id: 'test-transaction3',
        callback_url: 'https://ipns.merchant.com/',
        redirect_url: 'https://redirect.merchant.com/',
        user: {
          merchant_user_id: 'TU-001'
        },
        product: {
          mcc: 7995,
          category: 'gambling',
          merchant_code: '0001',
          description: 'Tokens'
        },
        visual_info: {
          merchant_name: 'MY-MERCHANT-NAME-HERE'
        }
      };
      const hmac = crypto.createHmac('sha256', 'JKK3OAY7SMI7OE3NRVBMUOGPCSZ6CZQT');
      hmac.update(JSON.stringify(body));
      const hash = hmac.digest('hex');
      const headers: AxiosRequestConfig['headers'] = {
        'Content-Type': 'application/json',
        Signature: hash,
        'Merchant-Gateway-Api-Key': 'lOUZkGTgkhv9EqvV0rshfL8M1wccTUZnPF7ZITDfuHLr145C7xVMUBX8wQLVjWW8'

      };
      const res = await axios.post('https://onetouch-api-sandbox.astropay.com/merchant/v1/deposit/init', { headers });
      console.log(res.data);
      return res.data;
    } catch (error) {
      console.log(error);
      return {
        error: error.message
      };
    }
  }

  async requestCashoutV2() {
    try {
      const body = {
        amount: 20,
        currency: 'USD',
        country: 'BR',
        merchant_deposit_id: 'test-transaction3',
        callback_url: 'https://ipns.merchant.com/',
        redirect_url: 'https://redirect.merchant.com/',
        user: {
          merchant_user_id: 'TU-001'
        },
        product: {
          mcc: 7995,
          category: 'gambling',
          merchant_code: '0001',
          description: 'Tokens'
        },
        visual_info: {
          merchant_name: 'MY-MERCHANT-NAME-HERE'
        }
      };
      const hmac = crypto.createHmac('sha256', 'JKK3OAY7SMI7OE3NRVBMUOGPCSZ6CZQT');
      hmac.update(JSON.stringify(body));
      const hash = hmac.digest('hex');
      const headers: AxiosRequestConfig['headers'] = {
        'Content-Type': 'application/json',
        Signature: hash,
        'Merchant-Gateway-Api-Key': 'lOUZkGTgkhv9EqvV0rshfL8M1wccTUZnPF7ZITDfuHLr145C7xVMUBX8wQLVjWW8'

      };
      const res = await axios.post('https://onetouch-api-sandbox.astropay.com/merchant/v1/deposit/init', { headers });
      console.log(res.data);
      return res.data;
    } catch (error) {
      console.log(error);
      return {
        error: error.message
      };
    }
  }

  async getDepositStatus() {
    try {
      const body = {
        amount: 20,
        currency: 'USD',
        country: 'BR',
        merchant_deposit_id: 'test-transaction3',
        callback_url: 'https://ipns.merchant.com/',
        redirect_url: 'https://redirect.merchant.com/',
        user: {
          merchant_user_id: 'TU-001'
        },
        product: {
          mcc: 7995,
          category: 'gambling',
          merchant_code: '0001',
          description: 'Tokens'
        },
        visual_info: {
          merchant_name: 'MY-MERCHANT-NAME-HERE'
        }
      };
      const hmac = crypto.createHmac('sha256', 'JKK3OAY7SMI7OE3NRVBMUOGPCSZ6CZQT');
      hmac.update(JSON.stringify(body));
      const hash = hmac.digest('hex');
      const headers: AxiosRequestConfig['headers'] = {
        'Content-Type': 'application/json',
        Signature: hash,
        'Merchant-Gateway-Api-Key': 'lOUZkGTgkhv9EqvV0rshfL8M1wccTUZnPF7ZITDfuHLr145C7xVMUBX8wQLVjWW8'

      };
      const res = await axios.post('https://onetouch-api-sandbox.astropay.com/merchant/v1/deposit/init', { headers });
      console.log(res.data);
      return res.data;
    } catch (error) {
      console.log(error);
      return {
        error: error.message
      };
    }
  }

  async geCashoutV1Status() {
    try {
      const body = {
        amount: 20,
        currency: 'USD',
        country: 'BR',
        merchant_deposit_id: 'test-transaction3',
        callback_url: 'https://ipns.merchant.com/',
        redirect_url: 'https://redirect.merchant.com/',
        user: {
          merchant_user_id: 'TU-001'
        },
        product: {
          mcc: 7995,
          category: 'gambling',
          merchant_code: '0001',
          description: 'Tokens'
        },
        visual_info: {
          merchant_name: 'MY-MERCHANT-NAME-HERE'
        }
      };
      const hmac = crypto.createHmac('sha256', 'JKK3OAY7SMI7OE3NRVBMUOGPCSZ6CZQT');
      hmac.update(JSON.stringify(body));
      const hash = hmac.digest('hex');
      const headers: AxiosRequestConfig['headers'] = {
        'Content-Type': 'application/json',
        Signature: hash,
        'Merchant-Gateway-Api-Key': 'lOUZkGTgkhv9EqvV0rshfL8M1wccTUZnPF7ZITDfuHLr145C7xVMUBX8wQLVjWW8'

      };
      const res = await axios.post('https://onetouch-api-sandbox.astropay.com/merchant/v1/deposit/init', { headers });
      console.log(res.data);
      return res.data;
    } catch (error) {
      console.log(error);
      return {
        error: error.message
      };
    }
  }

  async geCashoutV2Status() {
    try {
      const body = {
        amount: 20,
        currency: 'USD',
        country: 'BR',
        merchant_deposit_id: 'test-transaction3',
        callback_url: 'https://ipns.merchant.com/',
        redirect_url: 'https://redirect.merchant.com/',
        user: {
          merchant_user_id: 'TU-001'
        },
        product: {
          mcc: 7995,
          category: 'gambling',
          merchant_code: '0001',
          description: 'Tokens'
        },
        visual_info: {
          merchant_name: 'MY-MERCHANT-NAME-HERE'
        }
      };
      const hmac = crypto.createHmac('sha256', 'JKK3OAY7SMI7OE3NRVBMUOGPCSZ6CZQT');
      hmac.update(JSON.stringify(body));
      const hash = hmac.digest('hex');
      const headers: AxiosRequestConfig['headers'] = {
        'Content-Type': 'application/json',
        Signature: hash,
        'Merchant-Gateway-Api-Key': 'lOUZkGTgkhv9EqvV0rshfL8M1wccTUZnPF7ZITDfuHLr145C7xVMUBX8wQLVjWW8'

      };
      const res = await axios.post('https://onetouch-api-sandbox.astropay.com/merchant/v1/deposit/init', { headers });
      console.log(res.data);
      return res.data;
    } catch (error) {
      console.log(error);
      return {
        error: error.message
      };
    }
  }
}

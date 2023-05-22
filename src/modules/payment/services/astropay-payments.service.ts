import { Injectable } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class AstropayPaymentsService {
  async requestDeposit() {
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

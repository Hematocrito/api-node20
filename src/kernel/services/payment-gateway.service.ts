/* eslint-disable @typescript-eslint/no-unused-vars */
import * as crypto from 'crypto';

interface PaymentGateway<T> {
  subscription(options: T): Promise<string>;
  singlePurchase(options: T): Promise<string>;
  cancelSubscription(options: T): Promise<boolean>;
}

export abstract class PaymentGatewayService<T> implements PaymentGateway<T> {
  private baseURL: string;

  private callbackURL: string;

  private redirectSuccessURL: string;

  private redirectCancelURL: string;

  public getBaseURL() {
    return this.baseURL;
  }

  public setBaseURL(baseURL: string) {
    this.baseURL = baseURL;
  }

  public encode(data: { type: string, id: string }) : string|null {
    const { type, id } = data;
    if (!data || !id) {
      return null;
    }

    return [type, id].join('-');
  }

  public decode(data: string) : string[] {
    return data.split('-');
  }

  public abstract subscription(_options: T): Promise<string>;

  public abstract singlePurchase(_options: T): Promise<string>;

  public abstract cancelSubscription(_options: T): Promise<boolean>;

  public createHash(algorithm: string, data, encoding) {
    return crypto
      .createHash(algorithm)
      .update(data)
      .digest(encoding);
  }

  public buildQueryString(query: Record<string, any>) {
    return new URLSearchParams(query).toString();
  }
}

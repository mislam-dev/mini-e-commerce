import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { type Cache } from 'cache-manager';
import { BKASH_OPTIONS } from './bkash.constant';
import type { BkashOptions } from './types/bkash.types';
import {
  BkashCreatePaymentRequest,
  BkashCreatePaymentResponse,
  BkashExecutePaymentResponse,
  BkashGrantTokenResponse,
  BkashQueryPaymentResponse,
  BkashRefundPaymentRequest,
  BkashRefundPaymentResponse,
} from './types/bkash.types';

@Injectable()
export class BkashService {
  private readonly cacheKeys = {
    idToken: 'bkash:id_token',
    refreshToken: 'bkash:refresh_token',
  };

  private readonly logger = new Logger(BkashService.name);
  private idToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(
    @Inject(BKASH_OPTIONS) private readonly options: BkashOptions,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST',
    body?: any,
    isAuthRequest = false,
  ): Promise<T> {
    if (!isAuthRequest && !this.idToken) {
      await this.grantToken();
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      username: this.options.username,
      password: this.options.password,
    };

    if (isAuthRequest) {
      headers.app_key = this.options.appKey;
      headers.app_secret = this.options.appSecret;
    } else {
      headers.Authorization = `Bearer ${this.idToken}`;
      headers['X-APP-Key'] = this.options.appKey;
    }

    const url = `${this.options.baseUrl}${endpoint}`;

    let response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401 && !isAuthRequest) {
      this.logger.warn('Token expired, attempting to refresh...');
      await this.grantToken();
      headers.Authorization = `Bearer ${this.idToken}`;
      response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`bKash API Error: ${response.status} - ${errorText}`);
      throw new InternalServerErrorException(
        `bKash API error: ${response.statusText}`,
      );
    }

    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (err) {
      this.logger.error(
        `Failed to parse bKash JSON response. Raw text: ${rawText}`,
      );
      throw new InternalServerErrorException(
        'Invalid response format from bKash API',
      );
    }

    if (data.statusCode && data.statusCode !== '0000') {
      this.logger.error(`bKash API response error: ${JSON.stringify(data)}`);
      // If token expired within business logic
      if (data.statusCode === '2062' && !isAuthRequest) {
        this.logger.warn('Token invalid (2062), re-authenticating...');
        await this.invalidCachedTokens();
        await this.grantToken();
        headers.Authorization = `Bearer ${this.idToken}`;
        const retryResponse = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });
        const retryData = await retryResponse.json();
        if (retryData.statusCode && retryData.statusCode !== '0000') {
          throw new InternalServerErrorException(retryData.statusMessage);
        }
        return retryData as T;
      }
      throw new InternalServerErrorException(data.statusMessage);
    }

    return data as T;
  }

  private async invalidCachedTokens() {
    await this.cacheManager.del(this.cacheKeys.idToken);
    await this.cacheManager.del(this.cacheKeys.refreshToken);
    this.idToken = null;
    this.refreshToken = null;
  }

  public async grantToken(): Promise<void> {
    this.logger.log('Authenticating with bKash...');

    const idToken = await this.cacheManager.get<string>(this.cacheKeys.idToken);
    const refreshToken = await this.cacheManager.get<string>(
      this.cacheKeys.refreshToken,
    );

    if (idToken && refreshToken) {
      this.idToken = idToken;
      this.refreshToken = refreshToken;
      this.logger.log('Using cached bKash credentials.');
      return;
    }
    const body = {
      app_key: this.options.appKey,
      app_secret: this.options.appSecret,
    };

    console.log({ body });

    const data = await this.request<BkashGrantTokenResponse>(
      '/tokenized/checkout/token/grant',
      'POST',
      body,
      true,
    );
    console.log(data);
    const expiresIn = data.expires_in * 1000;

    await this.cacheManager.set(
      this.cacheKeys.idToken,
      data.id_token,
      expiresIn,
    );
    await this.cacheManager.set(
      this.cacheKeys.refreshToken,
      data.refresh_token,
      expiresIn,
    );

    this.idToken = data.id_token;
    this.refreshToken = data.refresh_token;
    this.logger.log('bKash authentication successful.');
  }

  public async createPayment(
    data: Omit<BkashCreatePaymentRequest, 'callbackURL' | 'mode'>,
  ): Promise<BkashCreatePaymentResponse> {
    this.logger.log(`Creating bKash payment for order: ${data.payerReference}`);
    const payload: BkashCreatePaymentRequest = {
      ...data,
      mode: '0011',
      callbackURL: this.options.callbackUrl,
    };

    console.log({ payload });

    return this.request<BkashCreatePaymentResponse>(
      '/tokenized/checkout/create',
      'POST',
      payload,
    );
  }

  public async executePayment(
    paymentID: string,
  ): Promise<BkashExecutePaymentResponse> {
    this.logger.log(`Executing bKash payment: ${paymentID}`);
    return this.request<BkashExecutePaymentResponse>(
      '/tokenized/checkout/execute',
      'POST',
      { paymentID },
    );
  }

  public async queryPayment(
    paymentID: string,
  ): Promise<BkashQueryPaymentResponse> {
    this.logger.log(`Querying bKash payment: ${paymentID}`);
    return this.request<BkashQueryPaymentResponse>(
      '/tokenized/checkout/payment/status',
      'POST',
      { paymentID },
    );
  }

  public async searchTransaction(trxID: string): Promise<any> {
    this.logger.log(`Searching bKash transaction: ${trxID}`);
    return this.request<any>(
      '/tokenized/checkout/general/searchTransaction',
      'POST',
      { trxID },
    );
  }

  public async refundTransaction(
    data: BkashRefundPaymentRequest,
  ): Promise<BkashRefundPaymentResponse> {
    this.logger.log(`Refunding bKash payment: ${data.paymentID}`);
    return this.request<BkashRefundPaymentResponse>(
      '/tokenized/checkout/payment/refund',
      'POST',
      data,
    );
  }

  public async queryRefund(paymentID: string, trxID: string): Promise<any> {
    this.logger.log(`Querying bKash refund for payment: ${paymentID}`);
    return this.request<any>('/tokenized/checkout/payment/refund', 'POST', {
      paymentID,
      trxID,
    });
  }
}

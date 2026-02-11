import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import SSLCommerzPayment from 'sslcommerz-lts';
import {
  SSLCOMMERZ_CANCEL_URL,
  SSLCOMMERZ_CONFIG,
  SSLCOMMERZ_FAIL_URL,
  SSLCOMMERZ_INSTANCE,
  SSLCOMMERZ_IPN_URL,
  SSLCOMMERZ_SUCCESS_URL,
} from './sllcomerz.constant';
import { SslcomerzStrategy } from './sslcomerz.strategy';
import { SslcommerzConfig } from './types/config.types';

@Global()
@Module({})
export class SslcomerzModule {
  static register(config: SslcommerzConfig): DynamicModule {
    return {
      module: SslcomerzModule,
      providers: [
        { provide: SSLCOMMERZ_CONFIG, useValue: config },
        this.createSslInstanceProvider(),
        SslcomerzStrategy,
      ],
      exports: [SSLCOMMERZ_INSTANCE, SslcomerzStrategy],
    };
  }

  static registerAsync(options: {
    useFactory: (
      ...args: any[]
    ) => Promise<SslcommerzConfig> | SslcommerzConfig;
    inject?: any[];
  }): DynamicModule {
    // 1. Define the main config provider
    const configProvider: Provider = {
      provide: SSLCOMMERZ_CONFIG,
      useFactory: options.useFactory,
      inject: options.inject || [],
    };

    // 2. Define the URL providers
    const sslConfigValue: Provider[] = [
      {
        provide: SSLCOMMERZ_SUCCESS_URL,
        useFactory: (config: SslcommerzConfig) => config.success_url,
        inject: [SSLCOMMERZ_CONFIG],
      },
      {
        provide: SSLCOMMERZ_FAIL_URL,
        useFactory: (config: SslcommerzConfig) => config.failure_url,
        inject: [SSLCOMMERZ_CONFIG],
      },
      {
        provide: SSLCOMMERZ_CANCEL_URL,
        useFactory: (config: SslcommerzConfig) => config.cancel_url,
        inject: [SSLCOMMERZ_CONFIG],
      },
      {
        provide: SSLCOMMERZ_IPN_URL,
        useFactory: (config: SslcommerzConfig) => config.ipn_url,
        inject: [SSLCOMMERZ_CONFIG],
      },
    ];

    const sslInstanceProvider: Provider = {
      provide: SSLCOMMERZ_INSTANCE,
      useFactory: (config: SslcommerzConfig) => {
        return new SSLCommerzPayment(
          config.store_id,
          config.store_password,
          config.is_live,
        );
      },
      inject: [SSLCOMMERZ_CONFIG],
    };

    return {
      module: SslcomerzModule,
      providers: [
        configProvider,
        sslInstanceProvider,
        ...sslConfigValue,
        SslcomerzStrategy, // Make sure this is just the class reference
      ],
      exports: [sslInstanceProvider, ...sslConfigValue, SslcomerzStrategy],
    };
  }

  private static createSslInstanceProvider(): Provider {
    return {
      provide: SSLCOMMERZ_INSTANCE,
      useFactory: (config: SslcommerzConfig) => {
        return new SSLCommerzPayment(
          config.store_id,
          config.store_password,
          config.is_live,
        );
      },
      inject: [SSLCOMMERZ_CONFIG],
    };
  }
}

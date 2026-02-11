import { DynamicModule, Module, Provider } from '@nestjs/common';
import Stripe from 'stripe';
import { STRIPE_INSTANCE, STRIPE_OPTIONS } from './stripe.constant';
import { StripePaymentStrategy } from './stripe.strategy';

export interface StripeModuleAsyncOptions {
  imports?: any[]; // Essential for importing ConfigModule
  inject?: any[]; // Dependencies to inject (e.g., ConfigService)
  useFactory: (...args: any[]) => Promise<Stripe> | Stripe;
}
export interface StripeModuleOptions {
  secret_key: string;
  config?: Stripe.StripeConfig; // Optional extra config
}
@Module({})
export class StripeModule {
  static register(apikey: string, config: Stripe.StripeConfig): DynamicModule {
    const stripe = new Stripe(apikey, config);

    return {
      module: StripeModule,
      providers: [
        {
          provide: STRIPE_INSTANCE,
          useValue: stripe,
        },
        StripePaymentStrategy,
      ],
      exports: [STRIPE_INSTANCE, StripePaymentStrategy],
    };
  }

  static registerAsync(options: {
    imports?: any[];
    inject?: any[];
    useFactory: (
      ...args: any[]
    ) => Promise<StripeModuleOptions> | StripeModuleOptions;
  }): DynamicModule {
    const optionsProvider: Provider = {
      provide: STRIPE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject || [],
    };

    const stripeProvider: Provider = {
      provide: STRIPE_INSTANCE,
      useFactory: (stripeOptions: StripeModuleOptions) => {
        return new Stripe(stripeOptions.secret_key, {
          apiVersion: '2026-01-28.clover', // Default or override
          typescript: true,
          ...stripeOptions.config, // Merge optional config if provided
        });
      },
      inject: [STRIPE_OPTIONS], // Inject the result of Provider 1
    };

    return {
      module: StripeModule,
      imports: options.imports || [],
      providers: [optionsProvider, stripeProvider, StripePaymentStrategy],
      exports: [STRIPE_INSTANCE, StripePaymentStrategy], // Export the actual Stripe instance
    };
  }
}

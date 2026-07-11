import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SslcomerzModule } from './sslcomerz/sslcomerz.module';
import { StripeModule } from './stripe/stripe.module';
import { BkashModule } from './bkash/bkash.module';

@Module({
  imports: [
    SslcomerzModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        store_id: configService.getOrThrow<string>('sslcomerz.store_id'),
        store_password: configService.getOrThrow<string>(
          'sslcomerz.store_password',
        ),
        store_type: configService.getOrThrow<string>('sslcomerz.store_type'),
        is_live: configService.getOrThrow<boolean>('sslcomerz.is_live'),
        success_url: configService.getOrThrow<string>('sslcomerz.success_url'),
        failure_url: configService.getOrThrow<string>('sslcomerz.failure_url'),
        cancel_url: configService.getOrThrow<string>('sslcomerz.cancel_url'),
        ipn_url: configService.getOrThrow<string>('sslcomerz.ipn_url'),
      }),
    }),
    StripeModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret_key: configService.getOrThrow<string>('stripe.secret_key'),
      }),
    }),
    BkashModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        baseUrl: configService.getOrThrow<string>('BKASH_BASE_URL'),
        username: configService.getOrThrow<string>('BKASH_USERNAME'),
        password: configService.getOrThrow<string>('BKASH_PASSWORD'),
        appKey: configService.getOrThrow<string>('BKASH_APP_KEY'),
        appSecret: configService.getOrThrow<string>('BKASH_APP_SECRET'),
        callbackUrl: configService.getOrThrow<string>('BKASH_CALLBACK_URL'),
        refundCallbackUrl: configService.get<string>('BKASH_REFUND_CALLBACK_URL'),
      }),
    }),
  ],
  exports: [SslcomerzModule, StripeModule, BkashModule],
})
export class ProvidersModule {}

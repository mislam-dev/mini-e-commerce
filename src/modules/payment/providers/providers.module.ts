import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BkashModule } from './bkash/bkash.module';
import { SslcomerzModule } from './sslcomerz/sslcomerz.module';
import { StripeModule } from './stripe/stripe.module';

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
        baseUrl: configService.getOrThrow<string>('bkash.base_url'),
        username: configService.getOrThrow<string>('bkash.username'),
        password: configService.getOrThrow<string>('bkash.password'),
        appKey: configService.getOrThrow<string>('bkash.app_key'),
        appSecret: configService.getOrThrow<string>('bkash.app_secret'),
        callbackUrl: configService.getOrThrow<string>('bkash.callback_url'),
        refundCallbackUrl: configService.get<string>(
          'bkash.refund_callback_url',
        ),
      }),
    }),
  ],
  exports: [SslcomerzModule, StripeModule, BkashModule],
})
export class ProvidersModule {}

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BkashModule } from './bkash/bkash.module';
import { SslcomerzModule } from './sslcomerz/sslcomerz.module';
import { StrapiModule } from './strapi/strapi.module';

@Module({
  imports: [
    BkashModule,
    SslcomerzModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // console.log(configService);
        const d = {
          store_id: configService.getOrThrow<string>('sslcomerz.store_id'),
          store_password: configService.getOrThrow<string>(
            'sslcomerz.store_password',
          ),
          store_type: configService.getOrThrow<string>('sslcomerz.store_type'),
          is_live: configService.getOrThrow<boolean>('sslcomerz.is_live'),
          success_url: configService.getOrThrow<string>(
            'sslcomerz.success_url',
          ),
          failure_url: configService.getOrThrow<string>(
            'sslcomerz.failure_url',
          ),
          cancel_url: configService.getOrThrow<string>('sslcomerz.cancel_url'),
          ipn_url: configService.getOrThrow<string>('sslcomerz.ipn_url'),
        };
        return d;
      },
    }),
    StrapiModule,
  ],
})
export class ProvidersModule {}

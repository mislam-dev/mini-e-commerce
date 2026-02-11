import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { authConfig } from './auth.config';
import { databaseConfig } from './database.config';
import { paymentFrontendConfig } from './payment-frontend.config';
import { sslConfig } from './sslcomerz.config';
import { stripeConfig } from './strIpe.config';
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        authConfig,
        sslConfig,
        paymentFrontendConfig,
        stripeConfig,
      ],
    }),
  ],
})
export class ConfigModule {}

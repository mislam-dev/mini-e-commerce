import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { authConfig } from './auth.config';
import { databaseConfig } from './database.config';
import { paymentFrontendConfig } from './payment-frontend.config';
import { sslConfig } from './sslcomerz.config';
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, authConfig, sslConfig, paymentFrontendConfig],
    }),
  ],
})
export class ConfigModule {}

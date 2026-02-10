import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { authConfig } from './auth.config';
import { databaseConfig } from './database.config';
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, authConfig],
    }),
  ],
})
export class ConfigModule {}

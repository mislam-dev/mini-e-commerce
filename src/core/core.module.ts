import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [AuthModule, ConfigModule, DatabaseModule, UserModule],
  providers: [],
  exports: [AuthModule, ConfigModule, DatabaseModule],
})
export class CoreModule {}

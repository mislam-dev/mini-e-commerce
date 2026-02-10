import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { PermissionsGuard } from './auth/guards/permissions.guard';
import { RolePermissionsGuard } from './auth/guards/role-permissions.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [AuthModule, ConfigModule, DatabaseModule, UserModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },

    {
      provide: APP_GUARD,
      useClass: RolePermissionsGuard,
    },
  ],
  exports: [AuthModule, ConfigModule, DatabaseModule],
})
export class CoreModule {}

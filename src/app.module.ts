import { createKeyv } from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtGuard } from './core/auth/guards/jwt.guard';
import { RolesGuard } from './core/auth/guards/roles.guard';
import { CoreModule } from './core/core.module';
import { ModulesModule } from './modules/modules.module';
import { PaymentApiModule } from './modules/payment/payment-api/payment-api.module';

@Module({
  imports: [
    CoreModule,
    ModulesModule,
    PaymentApiModule,
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        return {
          stores: [createKeyv('redis://localhost:6379')], // todo use config service for this
          ttl: 1000 * 60 * 60,
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}

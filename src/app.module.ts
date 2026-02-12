import { createKeyv } from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
      useFactory: async (configService: ConfigService) => {
        const host = configService.get('redis.host');
        const port = configService.get('redis.port');
        return {
          stores: [createKeyv(`redis://${host}:${port}`)],
          ttl: 1000 * 60 * 60,
        };
      },
      inject: [ConfigService],
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

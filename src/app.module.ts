import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtGuard } from './core/auth/guards/jwt.guard';
import { RolesGuard } from './core/auth/guards/roles.guard';
import { CoreModule } from './core/core.module';
import { ModulesModule } from './modules/modules.module';

@Module({
  imports: [CoreModule, ModulesModule],
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

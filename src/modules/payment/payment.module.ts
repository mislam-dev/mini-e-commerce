import { Module } from '@nestjs/common';
import { PaymentFactory } from './payment.factory';
import { ProvidersModule } from './providers/providers.module';

@Module({
  imports: [ProvidersModule],
  providers: [PaymentFactory],
  exports: [PaymentFactory],
})
export class PaymentModule {}

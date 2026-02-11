import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from 'src/core/user/user.module';
import { OrderModule } from 'src/modules/orders/order/order.module';
import { PaymentModule } from '../payment.module';
import { Payment } from './entities/payment-api.entity';
import { PaymentApiController } from './payment-api.controller';
import { PaymentApiService } from './payment-api.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    PaymentModule,
    UserModule,
    OrderModule,
  ],
  controllers: [PaymentApiController],
  providers: [PaymentApiService],
})
export class PaymentApiModule {}

import { Module } from '@nestjs/common';
import { OrderItemModule } from './order-item/order-item.module';
import { OrderModule } from './order/order.module';

@Module({
  imports: [OrderModule, OrderItemModule],
})
export class OrdersModule {}

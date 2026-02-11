import { Module } from '@nestjs/common';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { ProductModule } from './product/product.module';

@Module({
  imports: [ProductModule, OrdersModule, CartModule],
  exports: [ProductModule],
})
export class ModulesModule {}

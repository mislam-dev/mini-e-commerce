import { Module } from '@nestjs/common';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';

@Module({
  imports: [ProductModule, OrdersModule, CartModule, CategoryModule],
  exports: [ProductModule],
})
export class ModulesModule {}

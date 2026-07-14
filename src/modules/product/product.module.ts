import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { IsProductSkuUniqueConstraint } from './validators/is-product-sku-unique.constraint';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductController],
  providers: [ProductService, IsProductSkuUniqueConstraint],
  exports: [ProductService, IsProductSkuUniqueConstraint],
})
export class ProductModule {}

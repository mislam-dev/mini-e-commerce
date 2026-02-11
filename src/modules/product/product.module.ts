import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { IsProductCodeUniqueConstraint } from './validators/is-product-code-unique.constraint';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductController],
  providers: [ProductService, IsProductCodeUniqueConstraint],
  exports: [ProductService, IsProductCodeUniqueConstraint],
})
export class ProductModule {}

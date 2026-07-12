import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '../../core/core.module';
import { User } from '../../core/user/entities/user.entity';
import { Category } from '../../modules/category/entities/category.entity';
import { Product } from '../../modules/product/entities/product.entity';
import { CategorySeedService } from './category-seed.service';
import { ProductSeedService } from './product-seed.service';
import { SeedService } from './seed.service';
import { UserSeedService } from './user-seed.service';

@Module({
  imports: [CoreModule, TypeOrmModule.forFeature([User, Category, Product])],
  providers: [
    SeedService,
    UserSeedService,
    CategorySeedService,
    ProductSeedService,
  ],
})
export class SeedModule {}

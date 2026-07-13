import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../../modules/category/entities/category.entity';
import {
  Product,
  ProductStatus,
} from '../../../modules/product/entities/product.entity';

@Injectable()
export class ProductSeedService {
  private readonly logger = new Logger(ProductSeedService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async run(categories: { smartphones: Category; laptops: Category }) {
    this.logger.log('Seeding Products...');

    const productsToCreate = [
      {
        sku: 'PROD-001',
        name: 'iPhone 15',
        description: 'Apple iPhone 15',
        price: 999,
        stockQuantity: 50,
        categoryId: categories.smartphones.id,
      },
      {
        sku: 'PROD-002',
        name: 'Samsung S24',
        description: 'Samsung Galaxy S24',
        price: 899,
        stockQuantity: 40,
        categoryId: categories.smartphones.id,
      },
      {
        sku: 'PROD-003',
        name: 'MacBook Pro 14',
        description: 'Apple MacBook Pro 14-inch',
        price: 1999,
        stockQuantity: 20,
        categoryId: categories.laptops.id,
      },
      {
        sku: 'PROD-004',
        name: 'Dell XPS 13',
        description: 'Dell XPS 13 Laptop',
        price: 1499,
        stockQuantity: 15,
        categoryId: categories.laptops.id,
      },
      {
        sku: 'PROD-005',
        name: 'OnePlus 12',
        description: 'OnePlus 12 5G',
        price: 799,
        stockQuantity: 30,
        categoryId: categories.smartphones.id,
      },
      {
        sku: 'PROD-006',
        name: 'Google Pixel 8',
        description: 'Google Pixel 8 Pro',
        price: 899,
        stockQuantity: 25,
        categoryId: categories.smartphones.id,
      },
      {
        sku: 'PROD-007',
        name: 'Lenovo ThinkPad',
        description: 'Lenovo ThinkPad X1',
        price: 1299,
        stockQuantity: 10,
        categoryId: categories.laptops.id,
      },
      {
        sku: 'PROD-008',
        name: 'Sony Xperia 1 V',
        description: 'Sony Xperia Smartphone',
        price: 1199,
        stockQuantity: 5,
        categoryId: categories.smartphones.id,
      },
      {
        sku: 'PROD-009',
        name: 'Asus ROG Zephyrus',
        description: 'Gaming Laptop',
        price: 2199,
        stockQuantity: 8,
        categoryId: categories.laptops.id,
      },
      {
        sku: 'PROD-010',
        name: 'Nothing Phone 2',
        description: 'Nothing Phone 2',
        price: 699,
        stockQuantity: 45,
        categoryId: categories.smartphones.id,
      },
    ];

    for (const prodData of productsToCreate) {
      let product = await this.productRepository.findOne({
        where: { sku: prodData.sku },
      });
      if (!product) {
        product = this.productRepository.create({
          ...prodData,
          status: ProductStatus.ACTIVE,
        });
        await this.productRepository.save(product);
      }
    }

    this.logger.log('Products seeded successfully.');
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';

@ValidatorConstraint({ name: 'IsProductSkuUnique', async: true })
@Injectable()
export class IsProductSkuUniqueConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async validate(sku: string) {
    if (!sku) return true;

    const existingProduct = await this.productRepository.findOne({
      where: { sku },
    });

    return !existingProduct;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Product with this code already exists';
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    ValidationArguments,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';

@ValidatorConstraint({ name: 'IsProductCodeUnique', async: true })
@Injectable()
export class IsProductCodeUniqueConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async validate(code: string, args: ValidationArguments) {
    if (!code) return true;

    const existingProduct = await this.productRepository.findOne({
      where: { code },
    });

    return !existingProduct;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Product with this code already exists';
  }
}

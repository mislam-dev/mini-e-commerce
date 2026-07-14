import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';

@ValidatorConstraint({ name: 'IsCategoryExists', async: true })
@Injectable()
export class IsCategoryExistsConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async validate(categoryId: string) {
    if (!categoryId) return true;

    const existingCategory = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    return !!existingCategory;
  }

  defaultMessage() {
    return 'Category with this id does not exist';
  }
}

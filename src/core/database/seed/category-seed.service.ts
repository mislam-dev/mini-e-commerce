import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../../modules/category/entities/category.entity';

@Injectable()
export class CategorySeedService {
  private readonly logger = new Logger(CategorySeedService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async run() {
    this.logger.log('Seeding Categories...');

    let electronics = await this.categoryRepository.findOne({
      where: { name: 'Electronics' },
    });
    if (!electronics) {
      electronics = this.categoryRepository.create({ name: 'Electronics' });
      await this.categoryRepository.save(electronics);
    }

    let mobilePhones = await this.categoryRepository.findOne({
      where: { name: 'Mobile Phones' },
    });
    if (!mobilePhones) {
      mobilePhones = this.categoryRepository.create({
        name: 'Mobile Phones',
        parentId: electronics.id,
      });
      await this.categoryRepository.save(mobilePhones);
    }

    let laptops = await this.categoryRepository.findOne({
      where: { name: 'Laptops' },
    });
    if (!laptops) {
      laptops = this.categoryRepository.create({
        name: 'Laptops',
        parentId: electronics.id,
      });
      await this.categoryRepository.save(laptops);
    }

    let smartphones = await this.categoryRepository.findOne({
      where: { name: 'Smartphones' },
    });
    if (!smartphones) {
      smartphones = this.categoryRepository.create({
        name: 'Smartphones',
        parentId: mobilePhones.id,
      });
      await this.categoryRepository.save(smartphones);
    }

    return {
      electronics,
      mobilePhones,
      laptops,
      smartphones,
    };
  }
}

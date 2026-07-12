import { Injectable, Logger } from '@nestjs/common';
import { CategorySeedService } from './category-seed.service';
import { ProductSeedService } from './product-seed.service';
import { UserSeedService } from './user-seed.service';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly userSeedService: UserSeedService,
    private readonly categorySeedService: CategorySeedService,
    private readonly productSeedService: ProductSeedService,
  ) {}

  async run() {
    this.logger.log('Starting database seeding...');

    await this.userSeedService.run();
    const categories = await this.categorySeedService.run();
    await this.productSeedService.run(categories);

    this.logger.log('Database seeding completed successfully!');
  }
}

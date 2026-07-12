import { NestFactory } from '@nestjs/core';
import { SeedModule } from './database/seed/seed.module';
import { SeedService } from './database/seed/seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedModule);
  const seedService = app.get(SeedService);
  await seedService.run();
  await app.close();
}

bootstrap().catch((err) => {
  console.error('Seeding failed', err);
  process.exit(1);
});

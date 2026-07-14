import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';
import { logger, LoggingInterceptor } from './core/logger';
import { setupSwagger } from './core/swagger/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    logger: logger,
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'api/v',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const formattedError = errors.map((err) => {
          return {
            field: err.property,
            values: Object.values(err.constraints || {}),
          };
        });
        return new BadRequestException({
          status: 400,
          message: 'validation failed!',
          errors: formattedError,
        });
      },
    }),
  );
  setupSwagger(app);

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.useGlobalInterceptors(new LoggingInterceptor());

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

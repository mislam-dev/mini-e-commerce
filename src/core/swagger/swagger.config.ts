import { INestApplication } from '@nestjs/common';
import { OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

export function setupSwagger(app: INestApplication): void {
  const swaggerFile = path.join(__dirname, 'swagger.yaml');

  if (fs.existsSync(swaggerFile)) {
    const files = fs.readFileSync(swaggerFile, 'utf8');
    const document: OpenAPIObject = yaml.load(files) as OpenAPIObject;

    SwaggerModule.setup('docs', app as any, document);
  } else {
    console.warn(`Swagger YAML file not found at ${swaggerFile}`);
  }
}

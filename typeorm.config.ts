import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config(); // Load .env variables

export default new DataSource({
  type: 'postgres', // or your DB type
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'mini_ecom',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/core/database/migrations/*.ts'],
});

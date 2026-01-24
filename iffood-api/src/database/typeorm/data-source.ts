import 'dotenv/config';
import { DataSource } from 'typeorm';

/**
 * Not really used in the application, but TypeORM CLI needs this file to run migrations.
 */
export default new DataSource({
  type: process.env.DB_TYPE as 'postgres' | 'mysql',
  url: process.env.DB_URL,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/typeorm/migrations/*.ts'],
  synchronize: false,
});

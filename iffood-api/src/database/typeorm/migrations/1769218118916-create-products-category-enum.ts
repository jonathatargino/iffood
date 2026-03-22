import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductsCategoryEnum1769218118900 implements MigrationInterface {
  name = 'CreateProductsCategoryEnum1769218118900';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'products_category_enum') THEN
          CREATE TYPE "public"."products_category_enum" AS ENUM('sweet', 'savory');
        END IF;
      END $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."products_category_enum"`,
    );
  }
}

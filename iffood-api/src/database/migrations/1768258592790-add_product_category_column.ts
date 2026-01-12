import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductCategoryColumn1768258592790 implements MigrationInterface {
  name = 'AddProductCategoryColumn1768258592790';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."products_category_enum" AS ENUM('sweet', 'savory')`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "category" "public"."products_category_enum" NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "category"`);
    await queryRunner.query(`DROP TYPE "public"."products_category_enum"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductConstraints1768756839077 implements MigrationInterface {
  name = 'CreateProductConstraints1768756839077';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "name"`);
    await queryRunner.query(
      `ALTER TABLE "products" ADD "name" character varying(60) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "description"`);
    await queryRunner.query(
      `ALTER TABLE "products" ADD "description" character varying(500) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "photo_url"`);
    await queryRunner.query(
      `ALTER TABLE "products" ADD "photo_url" character varying(2048) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "CHK_bb1beb91071f971f20c76a481f" CHECK ("value" >= 0 AND "value" <= 1000)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "CHK_bb1beb91071f971f20c76a481f"`,
    );
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "photo_url"`);
    await queryRunner.query(
      `ALTER TABLE "products" ADD "photo_url" character varying NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "description"`);
    await queryRunner.query(
      `ALTER TABLE "products" ADD "description" character varying NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "name"`);
    await queryRunner.query(
      `ALTER TABLE "products" ADD "name" character varying NOT NULL`,
    );
  }
}

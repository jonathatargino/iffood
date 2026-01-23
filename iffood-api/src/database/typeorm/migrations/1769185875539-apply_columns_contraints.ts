import { MigrationInterface, QueryRunner } from 'typeorm';

export class ApplyColumnsContraints1769185875539 implements MigrationInterface {
  name = 'ApplyColumnsContraints1769185875539';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product_options" DROP COLUMN "name"`);
    await queryRunner.query(
      `ALTER TABLE "product_options" ADD "name" character varying(60) NOT NULL`,
    );
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
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "name"`);
    await queryRunner.query(
      `ALTER TABLE "stores" ADD "name" character varying(60) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "description"`);
    await queryRunner.query(
      `ALTER TABLE "stores" ADD "description" character varying(500) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "whatsapp"`);
    await queryRunner.query(
      `ALTER TABLE "stores" ADD "whatsapp" character varying(11) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "photo_url"`);
    await queryRunner.query(
      `ALTER TABLE "stores" ADD "photo_url" character varying(2048) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "stores" ALTER COLUMN "status" SET DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_options" ADD CONSTRAINT "CHK_899298b93487c83af7c7897f5c" CHECK (LENGTH("name") >= 3)`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_options" ADD CONSTRAINT "CHK_d2366fd63d9c418b5b58e1044d" CHECK ("quantity" >= 0 AND "quantity" <= 500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "CHK_376a9792d1c4d5a6695577624c" CHECK (LENGTH("description") >= 10)`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "CHK_663762b6474bbe1a1e1a44c62d" CHECK (LENGTH("name") >= 3)`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "CHK_a8bbee4bf11c22e6077aa8932e" CHECK ("value" >= 0 AND "value" <= 100000)`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_availabilities" ADD CONSTRAINT "CHK_4d55c0a81c8466f0fea2516304" CHECK ("weekday" >= 0 AND "weekday" <= 6)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "store_availabilities" DROP CONSTRAINT "CHK_4d55c0a81c8466f0fea2516304"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "CHK_a8bbee4bf11c22e6077aa8932e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "CHK_663762b6474bbe1a1e1a44c62d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "CHK_376a9792d1c4d5a6695577624c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_options" DROP CONSTRAINT "CHK_d2366fd63d9c418b5b58e1044d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_options" DROP CONSTRAINT "CHK_899298b93487c83af7c7897f5c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stores" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "photo_url"`);
    await queryRunner.query(
      `ALTER TABLE "stores" ADD "photo_url" character varying NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "whatsapp"`);
    await queryRunner.query(
      `ALTER TABLE "stores" ADD "whatsapp" character varying NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "description"`);
    await queryRunner.query(
      `ALTER TABLE "stores" ADD "description" character varying NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "name"`);
    await queryRunner.query(
      `ALTER TABLE "stores" ADD "name" character varying NOT NULL`,
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
    await queryRunner.query(`ALTER TABLE "product_options" DROP COLUMN "name"`);
    await queryRunner.query(
      `ALTER TABLE "product_options" ADD "name" character varying NOT NULL`,
    );
  }
}

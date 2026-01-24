import { MigrationInterface, QueryRunner } from 'typeorm';

export class Mvp1769218118915 implements MigrationInterface {
  name = 'Mvp1769218118915';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "product_options" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quantity" integer NOT NULL, "name" character varying(60) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "product_id" uuid, CONSTRAINT "CHK_899298b93487c83af7c7897f5c" CHECK (LENGTH("name") >= 3), CONSTRAINT "CHK_d2366fd63d9c418b5b58e1044d" CHECK ("quantity" >= 0 AND "quantity" <= 500), CONSTRAINT "PK_3916b02fb43aa725f8167c718e4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "value" integer NOT NULL, "name" character varying(60) NOT NULL, "description" character varying(500) NOT NULL, "photo_url" character varying(2048) NOT NULL, "category" "public"."products_category_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "store_id" uuid, CONSTRAINT "CHK_376a9792d1c4d5a6695577624c" CHECK (LENGTH("description") >= 10), CONSTRAINT "CHK_663762b6474bbe1a1e1a44c62d" CHECK (LENGTH("name") >= 3), CONSTRAINT "CHK_a8bbee4bf11c22e6077aa8932e" CHECK ("value" >= 0 AND "value" <= 100000), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "store_availabilities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "weekday" integer NOT NULL, "start" TIME NOT NULL, "end" TIME NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "store_id" uuid, CONSTRAINT "CHK_4d55c0a81c8466f0fea2516304" CHECK ("weekday" >= 0 AND "weekday" <= 6), CONSTRAINT "PK_0fe3ab37209741a25b0de09a1ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "stores" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(60) NOT NULL, "description" character varying(500) NOT NULL, "whatsapp" character varying(11) NOT NULL, "photo_url" character varying(2048) NOT NULL, "status" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_7aa6e7d71fa7acdd7ca43d7c9cb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "store_users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "store_id" uuid, "user_profile_id" uuid, CONSTRAINT "PK_6af90d774177332a7a99a7c1c9d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "user_auth_id" character varying NOT NULL, CONSTRAINT "PK_1ec6662219f4605723f1e41b6cb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_options" ADD CONSTRAINT "FK_49677f87ad61a8b2a31f33c8a2c" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_68863607048a1abd43772b314ef" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_availabilities" ADD CONSTRAINT "FK_21e00e5a6bb88e452d8956e60b7" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_users" ADD CONSTRAINT "FK_3077a42ec6ad94cfb93f919359d" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_users" ADD CONSTRAINT "FK_7e35e87617543169429ef09ec5d" FOREIGN KEY ("user_profile_id") REFERENCES "user_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "store_users" DROP CONSTRAINT "FK_7e35e87617543169429ef09ec5d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_users" DROP CONSTRAINT "FK_3077a42ec6ad94cfb93f919359d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_availabilities" DROP CONSTRAINT "FK_21e00e5a6bb88e452d8956e60b7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_68863607048a1abd43772b314ef"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_options" DROP CONSTRAINT "FK_49677f87ad61a8b2a31f33c8a2c"`,
    );
    await queryRunner.query(`DROP TABLE "user_profiles"`);
    await queryRunner.query(`DROP TABLE "store_users"`);
    await queryRunner.query(`DROP TABLE "stores"`);
    await queryRunner.query(`DROP TABLE "store_availabilities"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "product_options"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStoreAndStoreUserTables1767816652421 implements MigrationInterface {
  name = 'CreateStoreAndStoreUserTables1767816652421';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "stores" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying NOT NULL, "whatsapp" character varying NOT NULL, "photo_url" character varying NOT NULL, "status" boolean NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_7aa6e7d71fa7acdd7ca43d7c9cb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "store_users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "store_id" uuid, "user_profile_id" uuid, CONSTRAINT "PK_6af90d774177332a7a99a7c1c9d" PRIMARY KEY ("id"))`,
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
    await queryRunner.query(`DROP TABLE "store_users"`);
    await queryRunner.query(`DROP TABLE "stores"`);
  }
}

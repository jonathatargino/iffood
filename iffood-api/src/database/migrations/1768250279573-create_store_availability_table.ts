import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStoreAvailabilityTable1768250279573 implements MigrationInterface {
  name = 'CreateStoreAvailabilityTable1768250279573';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "store_availabilities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "weekday" integer NOT NULL, "start" TIMESTAMP NOT NULL, "end" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "store_id" uuid, CONSTRAINT "PK_0fe3ab37209741a25b0de09a1ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_availabilities" ADD CONSTRAINT "FK_21e00e5a6bb88e452d8956e60b7" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "store_availabilities" DROP CONSTRAINT "FK_21e00e5a6bb88e452d8956e60b7"`,
    );
    await queryRunner.query(`DROP TABLE "store_availabilities"`);
  }
}

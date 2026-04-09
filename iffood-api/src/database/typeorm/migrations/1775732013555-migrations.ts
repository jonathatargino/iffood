import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1775732013555 implements MigrationInterface {
  name = 'Migrations1775732013555';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "review_resumes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "summary" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "store_id" uuid, CONSTRAINT "PK_f8ddc2aed039d13ef640e34255c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_resumes" ADD CONSTRAINT "FK_c0ba1302ed44365b704bc8efb58" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "review_resumes" DROP CONSTRAINT "FK_c0ba1302ed44365b704bc8efb58"`,
    );
    await queryRunner.query(`DROP TABLE "review_resumes"`);
  }
}

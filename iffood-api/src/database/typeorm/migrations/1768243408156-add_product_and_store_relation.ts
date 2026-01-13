import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductAndStoreRelation1768243408156 implements MigrationInterface {
  name = 'AddProductAndStoreRelation1768243408156';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" ADD "store_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_68863607048a1abd43772b314ef" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_68863607048a1abd43772b314ef"`,
    );
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "store_id"`);
  }
}

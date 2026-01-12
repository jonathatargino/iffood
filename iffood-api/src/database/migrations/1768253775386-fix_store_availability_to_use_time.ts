import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixStoreAvailabilityToUseTime1768253775386 implements MigrationInterface {
  name = 'FixStoreAvailabilityToUseTime1768253775386';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "store_availabilities" DROP COLUMN "start"`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_availabilities" ADD "start" TIME NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_availabilities" DROP COLUMN "end"`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_availabilities" ADD "end" TIME NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "store_availabilities" DROP COLUMN "end"`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_availabilities" ADD "end" TIMESTAMP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_availabilities" DROP COLUMN "start"`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_availabilities" ADD "start" TIMESTAMP NOT NULL`,
    );
  }
}

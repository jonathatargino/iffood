import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1773692299936 implements MigrationInterface {
  name = 'Migrations1773692299936';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_profiles" ADD "photo_url" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_profiles" DROP COLUMN "photo_url"`,
    );
  }
}

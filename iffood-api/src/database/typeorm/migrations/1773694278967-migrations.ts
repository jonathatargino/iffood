import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1773694278967 implements MigrationInterface {
  name = 'Migrations1773694278967';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_profiles" ADD "whatsapp" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_profiles" DROP COLUMN "whatsapp"`,
    );
  }
}

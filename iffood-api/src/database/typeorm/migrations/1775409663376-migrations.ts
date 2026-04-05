import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1775409663376 implements MigrationInterface {
  name = 'Migrations1775409663376';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_request_items" DROP CONSTRAINT "FK_order_request_items_order"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_request_items" DROP CONSTRAINT "FK_order_request_items_product"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_request_items" DROP CONSTRAINT "FK_order_request_items_product_option"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_requests" DROP CONSTRAINT "FK_order_requests_buyer"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_requests" DROP CONSTRAINT "FK_order_requests_store"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."review_requests_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'DENIED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "review_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."review_requests_status_enum" NOT NULL DEFAULT 'PENDING', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "order_request_id" uuid, CONSTRAINT "REL_370923ef42076236962afbf97b" UNIQUE ("order_request_id"), CONSTRAINT "PK_01e5bec2adcef1cf498e861f75a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "rating" integer NOT NULL, "tags" json NOT NULL DEFAULT '[]', "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "review_request_id" uuid, CONSTRAINT "REL_e55323d3eee5ab88f672bf3810" UNIQUE ("review_request_id"), CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_request_items" ADD CONSTRAINT "FK_4464ba313ca6ec213dde40704b2" FOREIGN KEY ("order_request_id") REFERENCES "order_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_request_items" ADD CONSTRAINT "FK_e6f99a9a81d16138c26932a1f76" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_request_items" ADD CONSTRAINT "FK_9bd61d155d0820478750bc577a5" FOREIGN KEY ("product_option_id") REFERENCES "product_options"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_requests" ADD CONSTRAINT "FK_48c7e7459c705a6a946f6d3ec5e" FOREIGN KEY ("buyer_user_id") REFERENCES "user_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_requests" ADD CONSTRAINT "FK_4195874f055b31af2ca25fe3cdb" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_requests" ADD CONSTRAINT "FK_370923ef42076236962afbf97b6" FOREIGN KEY ("order_request_id") REFERENCES "order_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_e55323d3eee5ab88f672bf38105" FOREIGN KEY ("review_request_id") REFERENCES "review_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_e55323d3eee5ab88f672bf38105"`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_requests" DROP CONSTRAINT "FK_370923ef42076236962afbf97b6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_requests" DROP CONSTRAINT "FK_4195874f055b31af2ca25fe3cdb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_requests" DROP CONSTRAINT "FK_48c7e7459c705a6a946f6d3ec5e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_request_items" DROP CONSTRAINT "FK_9bd61d155d0820478750bc577a5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_request_items" DROP CONSTRAINT "FK_e6f99a9a81d16138c26932a1f76"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_request_items" DROP CONSTRAINT "FK_4464ba313ca6ec213dde40704b2"`,
    );
    await queryRunner.query(`DROP TABLE "reviews"`);
    await queryRunner.query(`DROP TABLE "review_requests"`);
    await queryRunner.query(`DROP TYPE "public"."review_requests_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "order_requests" ADD CONSTRAINT "FK_order_requests_store" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_requests" ADD CONSTRAINT "FK_order_requests_buyer" FOREIGN KEY ("buyer_user_id") REFERENCES "user_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_request_items" ADD CONSTRAINT "FK_order_request_items_product_option" FOREIGN KEY ("product_option_id") REFERENCES "product_options"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_request_items" ADD CONSTRAINT "FK_order_request_items_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_request_items" ADD CONSTRAINT "FK_order_request_items_order" FOREIGN KEY ("order_request_id") REFERENCES "order_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}

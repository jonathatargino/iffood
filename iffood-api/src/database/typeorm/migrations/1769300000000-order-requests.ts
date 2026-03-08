import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrderRequests1769300000000 implements MigrationInterface {
  name = 'OrderRequests1769300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."order_requests_status_enum" AS ENUM('PENDING', 'CONCLUDED', 'REJECTED', 'CHANGED_AND_CONCLUDED')`,
    );

    await queryRunner.query(
      `CREATE TABLE "order_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "status" "public"."order_requests_status_enum" NOT NULL DEFAULT 'PENDING',
        "cart_id" character varying NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "buyer_user_id" uuid,
        "store_id" uuid,
        CONSTRAINT "UQ_order_requests_cart_id" UNIQUE ("cart_id"),
        CONSTRAINT "PK_order_requests" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "order_request_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "quantity" integer NOT NULL,
        "product_name" character varying NOT NULL,
        "product_option_name" character varying NOT NULL,
        "product_value" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "order_request_id" uuid,
        "product_id" uuid,
        "product_option_id" uuid,
        CONSTRAINT "PK_order_request_items" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "order_requests" ADD CONSTRAINT "FK_order_requests_buyer" FOREIGN KEY ("buyer_user_id") REFERENCES "user_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "order_requests" ADD CONSTRAINT "FK_order_requests_store" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "order_request_items" ADD CONSTRAINT "FK_order_request_items_order" FOREIGN KEY ("order_request_id") REFERENCES "order_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "order_request_items" ADD CONSTRAINT "FK_order_request_items_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "order_request_items" ADD CONSTRAINT "FK_order_request_items_product_option" FOREIGN KEY ("product_option_id") REFERENCES "product_options"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_request_items" DROP CONSTRAINT "FK_order_request_items_product_option"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_request_items" DROP CONSTRAINT "FK_order_request_items_product"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_request_items" DROP CONSTRAINT "FK_order_request_items_order"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_requests" DROP CONSTRAINT "FK_order_requests_store"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_requests" DROP CONSTRAINT "FK_order_requests_buyer"`,
    );
    await queryRunner.query(`DROP TABLE "order_request_items"`);
    await queryRunner.query(`DROP TABLE "order_requests"`);
    await queryRunner.query(`DROP TYPE "public"."order_requests_status_enum"`);
  }
}

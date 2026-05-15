import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1715000000000 implements MigrationInterface {
  name = 'InitialMigration1715000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_role_enum" AS ENUM('ADMIN', 'PROVIDER', 'CUSTOMER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."booking_status_enum" AS ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')`,
    );

    await queryRunner.query(`
      CREATE TABLE "user" (
        "id"           uuid                       NOT NULL DEFAULT gen_random_uuid(),
        "email"        character varying          NOT NULL,
        "passwordHash" character varying          NOT NULL,
        "role"         "public"."user_role_enum"  NOT NULL DEFAULT 'CUSTOMER',
        "name"         character varying,
        "phoneNumber"  character varying,
        "createdAt"    TIMESTAMP                  NOT NULL DEFAULT now(),
        "updatedAt"    TIMESTAMP                  NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_user_email" UNIQUE ("email"),
        CONSTRAINT "PK_user" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "category" (
        "id"    uuid              NOT NULL DEFAULT gen_random_uuid(),
        "name"  character varying NOT NULL,
        "icon"  character varying,
        "color" character varying,
        CONSTRAINT "UQ_category_name" UNIQUE ("name"),
        CONSTRAINT "PK_category" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "service_entity" (
        "id"          uuid              NOT NULL DEFAULT gen_random_uuid(),
        "title"       character varying NOT NULL,
        "description" text              NOT NULL,
        "imageUrl"    character varying,
        "price"       numeric(10,2)     NOT NULL,
        "status"      character varying NOT NULL DEFAULT 'active',
        "createdAt"   TIMESTAMP         NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMP         NOT NULL DEFAULT now(),
        "categoryId"  uuid,
        "providerId"  uuid,
        CONSTRAINT "PK_service_entity" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "booking" (
        "id"                  uuid                           NOT NULL DEFAULT gen_random_uuid(),
        "date"                character varying              NOT NULL,
        "time"                character varying              NOT NULL,
        "status"              "public"."booking_status_enum" NOT NULL DEFAULT 'PENDING',
        "totalAmount"         numeric(10,2),
        "specialInstructions" text,
        "createdAt"           TIMESTAMP                      NOT NULL DEFAULT now(),
        "updatedAt"           TIMESTAMP                      NOT NULL DEFAULT now(),
        "customerId"          uuid                           NOT NULL,
        "providerId"          uuid,
        "serviceId"           uuid                           NOT NULL,
        CONSTRAINT "PK_booking" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "service_entity" ADD CONSTRAINT "FK_service_entity_category" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_entity" ADD CONSTRAINT "FK_service_entity_provider" FOREIGN KEY ("providerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking" ADD CONSTRAINT "FK_booking_customer" FOREIGN KEY ("customerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking" ADD CONSTRAINT "FK_booking_provider" FOREIGN KEY ("providerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking" ADD CONSTRAINT "FK_booking_service" FOREIGN KEY ("serviceId") REFERENCES "service_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "booking" DROP CONSTRAINT "FK_booking_service"`);
    await queryRunner.query(`ALTER TABLE "booking" DROP CONSTRAINT "FK_booking_provider"`);
    await queryRunner.query(`ALTER TABLE "booking" DROP CONSTRAINT "FK_booking_customer"`);
    await queryRunner.query(
      `ALTER TABLE "service_entity" DROP CONSTRAINT "FK_service_entity_provider"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_entity" DROP CONSTRAINT "FK_service_entity_category"`,
    );
    await queryRunner.query(`DROP TABLE "booking"`);
    await queryRunner.query(`DROP TABLE "service_entity"`);
    await queryRunner.query(`DROP TABLE "category"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TYPE "public"."booking_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
  }
}

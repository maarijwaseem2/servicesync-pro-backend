import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlatformFeatures1716000000000 implements MigrationInterface {
  name = 'AddPlatformFeatures1716000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "category" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "reviewHidden" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "providerStatus" character varying`,
    );
    // Existing providers stay live; only new signups go through approval
    await queryRunner.query(
      `UPDATE "user" SET "providerStatus" = 'APPROVED' WHERE "role" = 'PROVIDER' AND "providerStatus" IS NULL`,
    );
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "platform_settings" (
        "id"                      uuid              NOT NULL DEFAULT gen_random_uuid(),
        "platformName"            character varying NOT NULL DEFAULT 'ServiceSync Pro',
        "logoUrl"                 character varying,
        "serviceCities"           text              NOT NULL DEFAULT 'Karachi, Lahore, Islamabad, Rawalpindi',
        "cancellationWindowHours" integer           NOT NULL DEFAULT 2,
        "cancellationFeePercent"  integer           NOT NULL DEFAULT 15,
        "paymentCash"             boolean           NOT NULL DEFAULT true,
        "paymentCard"             boolean           NOT NULL DEFAULT true,
        "paymentWallet"           boolean           NOT NULL DEFAULT true,
        "notifyEmail"             boolean           NOT NULL DEFAULT true,
        "notifySms"               boolean           NOT NULL DEFAULT true,
        "notifyPush"              boolean           NOT NULL DEFAULT false,
        "updatedAt"               TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_platform_settings" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "platform_settings"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "providerStatus"`);
    await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN IF EXISTS "reviewHidden"`);
    await queryRunner.query(`ALTER TABLE "category" DROP COLUMN IF EXISTS "isActive"`);
  }
}

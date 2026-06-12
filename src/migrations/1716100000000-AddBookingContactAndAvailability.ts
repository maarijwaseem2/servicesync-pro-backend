import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingContactAndAvailability1716100000000 implements MigrationInterface {
  name = 'AddBookingContactAndAvailability1716100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "address" character varying`);
    await queryRunner.query(`ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "city" character varying`);
    await queryRunner.query(`ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "phone" character varying`);
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "availability" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "availability"`);
    await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN IF EXISTS "phone"`);
    await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN IF EXISTS "city"`);
    await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN IF EXISTS "address"`);
  }
}

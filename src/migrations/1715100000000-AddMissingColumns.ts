import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingColumns1715100000000 implements MigrationInterface {
  name = 'AddMissingColumns1715100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "city" character varying`);
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "address" character varying`);
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "avatarUrl" character varying`);
    await queryRunner.query(`ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "rating" integer`);
    await queryRunner.query(`ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "reviewText" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN IF EXISTS "reviewText"`);
    await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN IF EXISTS "rating"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "avatarUrl"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "address"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "city"`);
  }
}

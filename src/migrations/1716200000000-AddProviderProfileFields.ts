import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProviderProfileFields1716200000000 implements MigrationInterface {
  name = 'AddProviderProfileFields1716200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "category" character varying`);
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "serviceArea" character varying`);
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "bio" text`);
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "experienceYears" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "experienceYears"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "bio"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "serviceArea"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "category"`);
  }
}

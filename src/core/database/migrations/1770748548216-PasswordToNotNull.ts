import { MigrationInterface, QueryRunner } from "typeorm";

export class PasswordToNotNull1770748548216 implements MigrationInterface {
    name = 'PasswordToNotNull1770748548216'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL`);
    }

}

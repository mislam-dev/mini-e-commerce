import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRawResponseFieldOnPaymentEntity1783786218016 implements MigrationInterface {
    name = 'AddRawResponseFieldOnPaymentEntity1783786218016'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" ADD "raw_response" jsonb NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "raw_response"`);
    }

}

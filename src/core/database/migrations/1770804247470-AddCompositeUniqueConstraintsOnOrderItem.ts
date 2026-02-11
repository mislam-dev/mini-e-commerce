import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCompositeUniqueConstraintsOnOrderItem1770804247470 implements MigrationInterface {
    name = 'AddCompositeUniqueConstraintsOnOrderItem1770804247470'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "UQ_6335813ef19bc35b8d866cc6565" UNIQUE ("order_id", "product_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "UQ_6335813ef19bc35b8d866cc6565"`);
    }

}

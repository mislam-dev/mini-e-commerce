import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductTable1770790748405 implements MigrationInterface {
    name = 'AddProductTable1770790748405'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "name" character varying NOT NULL, "description" character varying NOT NULL, "price" double precision NOT NULL, "stock_quantity" integer NOT NULL, CONSTRAINT "UQ_7cfc24d6c24f0ec91294003d6b8" UNIQUE ("code"), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "products"`);
    }

}

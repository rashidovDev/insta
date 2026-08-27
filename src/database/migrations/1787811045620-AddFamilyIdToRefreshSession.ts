import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFamilyIdToRefreshSession1787811045620 implements MigrationInterface {
    name = 'AddFamilyIdToRefreshSession1787811045620'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refresh_sessions" ADD "familyId" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refresh_sessions" DROP COLUMN "familyId"`);
    }

}

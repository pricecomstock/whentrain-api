/**
 * This is a template for migration scripts.
 *
 * Helpful Docs:
 * Migrations: https://kysely.dev/docs/migrations
 *
 */

import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
	// Migration Up
	await db.schema
		.createTable('apiKey')
		.addColumn('id', 'integer', (col) => col.primaryKey())
		.addColumn('shortToken', 'text', (col) => col.notNull().unique())
		.addColumn('longTokenHash', 'text', (col) => col.notNull())
		.addColumn('role', 'text', (col) => col.notNull())
		.addColumn('createdAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
		.execute(); // DO NOT FORGET EXECUTE

	await db.schema.createIndex('short_token_index').on('apiKey').column('shortToken').execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	// Migration Down
	await db.schema.dropTable('apiKey').execute();
}

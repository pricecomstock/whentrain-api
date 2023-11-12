import {
	Migrator,
	FileMigrationProvider,
	type MigratorProps,
	type MigrationResultSet,
	Kysely
} from 'kysely';
import { promises as fs } from 'fs';
import path from 'path';

import { db } from '..';

import * as url from 'node:url';

const MIGRATIONS_PATH = './src/db/migrations';

function getMigratorConfig(db: Kysely<any>): MigratorProps {
	return {
		db,
		provider: new FileMigrationProvider({
			fs,
			path,
			migrationFolder: path.join(process.cwd(), MIGRATIONS_PATH)
		})
	};
}

function printResults(resultSet: MigrationResultSet) {
	resultSet.results?.forEach((migration) => {
		const verb = migration.direction === 'Up' ? 'apply' : '🔻 revert';
		if (migration.status === 'Success') {
			console.log(`✅ ${verb} migration ${migration.migrationName}: success`);
		} else {
			console.error(`🚨 ${verb} migration ${migration.migrationName}: failed`);
		}
	});

	if (resultSet.error) {
		console.error('failed to migrate');
		console.error(resultSet.error);
		process.exit(1);
	}
}

export async function migrateToLatest(db: Kysely<any>) {
	const migrator = new Migrator(getMigratorConfig(db));

	const resultSet = await migrator.migrateToLatest();

	printResults(resultSet);
}

export async function migrateUp(db: Kysely<any>) {
	const migrator = new Migrator(getMigratorConfig(db));

	const resultSet = await migrator.migrateUp();

	printResults(resultSet);
}

export async function migrateDown(db: Kysely<any>) {
	const migrator = new Migrator(getMigratorConfig(db));

	const resultSet = await migrator.migrateDown();

	printResults(resultSet);
}

async function main() {
	switch (process.env.MIGRATION_MODE) {
		case 'up':
			await migrateUp(db);
			break;
		case 'down':
			await migrateDown(db);
			break;
		case 'latest':
			await migrateToLatest(db);
			break;
		default:
			break;
	}

	process.exit(0);
}

// ESM Main Check
// https://twitter.com/Rich_Harris/status/1355289863130673153
if (import.meta.url.startsWith('file:')) {
	// (A)
	const modulePath = url.fileURLToPath(import.meta.url);
	if (process.argv[1] === modulePath) {
		// (B)
		main();
	}
}

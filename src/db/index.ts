import { Kysely } from 'kysely';
import { BunWorkerDialect } from 'kysely-bun-worker';
import type { ApiKeyTable } from './schema/apiKey';

export interface Database {
	apiKey: ApiKeyTable;
}

const dialect = new BunWorkerDialect({
	url: 'db.sqlite'
});

export const db = new Kysely<Database>({ dialect });

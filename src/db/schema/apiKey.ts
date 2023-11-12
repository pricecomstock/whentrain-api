import { ColumnType, Generated, Insertable, Selectable, Updateable } from 'kysely';

export enum Roles {
	Free = 'free',
	Premium = 'premium',
	Admin = 'admin'
}

export interface ApiKeyTable {
	id: Generated<number>;
	shortToken: string; // ColumnType<string, string, never>;
	longTokenHash: string; // ColumnType<string, string, never>;
	role: Roles;

	createdAt: Generated<Date>;
}

export type ApiKey = Selectable<ApiKeyTable>;
export type NewApiKey = Insertable<ApiKeyTable>;
export type ApiKeyUpdate = Updateable<ApiKeyTable>;

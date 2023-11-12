import { env } from 'bun';
import { db } from '../db';
import { Roles } from '../db/schema/apiKey';
import { generateAPIKey, getTokenComponents } from './prefixedApiKey';

const SHORT_TOKEN_LENGTH = 10;
const LONG_TOKEN_LENGTH = 32;

export async function createApiKey(role: Roles, shortTokenPrefix = ''): Promise<string> {
	const { token, longTokenHash, shortToken } = await generateAPIKey({
		shortTokenLength: SHORT_TOKEN_LENGTH,
		longTokenLength: LONG_TOKEN_LENGTH,
		keyPrefix: 'whentrain',
		shortTokenPrefix
	});

	if (!token) {
		throw new Error('No token generated, idk why');
	}

	await db
		.insertInto('apiKey')
		.values({
			shortToken,
			longTokenHash,
			role
		})
		.executeTakeFirstOrThrow();

	return token;
}

export interface AuthResult {
	isAuthorized: boolean;
	message: string;
	shortToken: string;
	role?: Roles;
}
export async function checkAuth(
	token: string,
	allowedRoles: Roles[] = [Roles.Free, Roles.Premium, Roles.Admin]
): Promise<AuthResult> {
	const { shortToken, longTokenHash } = getTokenComponents(token);

	if (!shortToken || !longTokenHash) {
		return {
			isAuthorized: false,
			message: 'Invalid token format',
			shortToken: ''
		};
	}

	const matchingKey = await db
		.selectFrom('apiKey')
		.selectAll()
		.where('shortToken', '=', shortToken)
		.executeTakeFirst();

	// Check if long token hash matches
	if (!matchingKey || matchingKey.longTokenHash !== longTokenHash) {
		return {
			isAuthorized: false,
			message: 'Token does not exist',
			shortToken: ''
		};
	}

	return {
		isAuthorized: true,
		message: 'Authorized',
		shortToken: matchingKey.shortToken,
		role: matchingKey.role
	};
}

/** If there are no API Keys in existence, create one and print it to console */
export async function initializeAuth() {
	// const result = await db.selectFrom('apiKey').selectAll().execute();
	const result = await db
		.selectFrom('apiKey')
		.select(({ fn }) => [fn.countAll<number>().as('count')])
		.executeTakeFirst();

	if ((result?.count ?? 0) > 0) {
		return;
	}

	const token = await createApiKey(Roles.Admin, 'admX');
	console.log(
		`🟧 No API keys found in DB. Created 1 admin key. Please copy and paste this as it is not retrievable after this first run.\n🔐\n${token}\n🔐`
	);
}

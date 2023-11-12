import { Context, Next } from 'hono';
import { Roles } from '../db/schema/apiKey';
import { checkAuth } from '.';
import logger from '../logging/logger';

/** Creates an auth middleware that validates the role */
export function auth(roles: Roles[] = [Roles.Admin, Roles.Free, Roles.Premium]) {
	return async function authMiddleware(c: Context, next: Next) {
		const authHeader = c.req.header('Authorization');

		if (!authHeader?.startsWith('Bearer ')) {
			return c.text('Not authorized', 401);
		}
		const token = authHeader.slice(7);

		const { isAuthorized, message, shortToken, role } = await checkAuth(token);

		if (!role || !roles.includes(role)) {
			logger.info("Unauthorized request: Role doesn't match", { shortToken, role });
			return c.text('Not authorized', 401);
		}

		if (!isAuthorized) {
			logger.info(`Unauthorized request: ${message}`, { shortToken });
			return c.text('Not authorized', 401);
		}

		c.set('shortToken', shortToken);
		c.set('role', role);

		await next();
	};
}

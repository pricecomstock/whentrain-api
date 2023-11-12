import { Roles } from './db/schema/apiKey';

export type ContextVariables = {
	shortToken: string;
	role: Roles;
};

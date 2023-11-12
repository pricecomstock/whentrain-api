import { Hono } from 'hono';

// Startup
import { db } from './db';
import { initializeAuth } from './auth';
import { migrateToLatest } from './db/migrationScripts/migrate';

// Middlewares
import { prettyJSON } from 'hono/pretty-json';
import { auth } from './auth/middleware';

// Routers
import { stationsRouter } from './routes/stations';
import { trainsRouter } from './routes/trains';
import { departuresRouter } from './routes/departures';
import { tripsRouter } from './routes/trips';

import logger from './logging/logger';
import { ContextVariables } from './context';
import { Roles } from './db/schema/apiKey';

await migrateToLatest(db);

initializeAuth(); // Create Admin API key if none exist

const app = new Hono<{ Variables: ContextVariables }>();
app.use('*', prettyJSON()); // query param ?pretty to get pretty json
// app.use('*', compress()); // Not yet supported in bun
app.use('*', async (c, next) => {
	await next();
	logger.info(`${c.res.status} - ${c.req.method} ${c.req.url}`, {
		shortToken: c.get('shortToken'),
		role: c.get('role')
	});
});

app.get('/', (c) => c.text('When is that! Train! Coming!?'));

app.use('/auth', auth([Roles.Admin, Roles.Free, Roles.Premium]));
app.get('/auth', (c) => c.text("You're authorized, baby!"));
app.use('/admin', auth([Roles.Admin]));
app.get('/admin', (c) => c.text("You're an admin, baby!"));

app.use('/stations/*', auth([Roles.Admin, Roles.Free, Roles.Premium]));
app.route('/stations', stationsRouter);

app.use('/trains/*', auth([Roles.Admin, Roles.Free, Roles.Premium]));
app.route('/trains', trainsRouter);

app.use('/departures/*', auth([Roles.Admin, Roles.Free, Roles.Premium]));
app.route('/departures', departuresRouter);

app.use('/trips/*', auth([Roles.Admin, Roles.Free, Roles.Premium]));
app.route('/trips', tripsRouter);

export default app;

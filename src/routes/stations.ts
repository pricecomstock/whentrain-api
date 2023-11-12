import { Hono } from 'hono';
import { getStationById, stationsList } from '../mta/station';
import { cache } from 'hono/cache';

const stationsRouter = new Hono();

/* Nvm this doesn't support bun yet
I could probably write a custom one to still use public caches like cloudflare 
*/
// Set up caching
// Station data rarely changes so we can cache it for a long time
// const cacheTime = 60 * 60 * 24; // 1 day
// stationsRouter.get(
// 	'*',
// 	cache({
// 		cacheName: 'station-cache',
// 		cacheControl: `max-age=${cacheTime}`
// 	})
// );

stationsRouter.get('/', (c) => c.json({ stations: stationsList }));
stationsRouter.get('/:station_id', (c) => c.json(getStationById(c.req.param().station_id)));

export { stationsRouter };

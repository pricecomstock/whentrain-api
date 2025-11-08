import { Hono } from 'hono';
import { z } from 'zod';
import { getStationById, stationsList, stationsQuadtree } from '../mta/station';
import { calculateDistanceMiles } from '../util';
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

const nearbyQuerySchema = z.object({
	lat: z.coerce.number(),
	long: z.coerce.number(),
	count: z.coerce.number().int().optional().default(10),
	maxdistance: z.coerce.number().optional().default(1)
});

stationsRouter.get('/', (c) => c.json({ stations: stationsList }));

stationsRouter.get('/nearby', (c) => {
	const query = c.req.query();
	const result = nearbyQuerySchema.safeParse(query);

	if (!result.success) {
		return c.json({ error: 'Invalid query parameters', details: result.error.issues }, 400);
	}

	const { lat, long, count, maxdistance } = result.data;

	const candidateStations = stationsQuadtree.queryRadius(lat, long, maxdistance);

	const stationsWithDistance = candidateStations
		.map((station) => {
			const distance = calculateDistanceMiles(
				lat,
				long,
				station.gtfsLatitude,
				station.gtfsLongitude
			);
			return { station, distance };
		})
		.filter(({ distance }) => distance <= maxdistance)
		.sort((a, b) => a.distance - b.distance)
		.slice(0, count);

	return c.json({
		stations: stationsWithDistance.map(({ station, distance }) => ({
			...station,
			distanceMiles: distance
		}))
	});
});

stationsRouter.get('/:station_id', (c) => c.json(getStationById(c.req.param().station_id)));

export { stationsRouter };

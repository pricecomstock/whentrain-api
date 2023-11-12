import { Hono } from 'hono';
import { getStationListByTrain } from '../mta/station';
// import { cache } from 'hono/cache';

const trainsRouter = new Hono();

// Station data rarely changes so we can cache it for a long time
// const cacheTime = 60 * 60 * 24; // 1 day
// trainsRouter.get(
// 	'*',
// 	cache({
// 		cacheName: 'station-cache',
// 		cacheControl: `max-age=${cacheTime}`
// 	})
// );

trainsRouter.get('/:train', (c) =>
	c.json({ stations: getStationListByTrain(c.req.param().train) })
);

export { trainsRouter };

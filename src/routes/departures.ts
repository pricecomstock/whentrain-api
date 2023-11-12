import { Hono } from 'hono';
import { getStationById } from '../mta/station';
import { MTA } from '../mta';

const mta = new MTA();
await mta.instantiate();

const departuresRouter = new Hono();

departuresRouter.get('/:station_id', (c) => {
	return c.json(mta.getDepartureTimesByStationId(c.req.param().station_id));
});

export { departuresRouter };

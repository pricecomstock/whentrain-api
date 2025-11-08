import { Hono } from 'hono';
import { getStationById } from '../mta/station';
import { MTA } from '../mta';
import type { ArrivalDepartureTime } from '../mta/mtaRealTimeApi';
import { z } from 'zod';

const mta = new MTA();
await mta.instantiate();

const departuresRouter = new Hono();

const querySchema = z.object({
	bytrain: z.string().optional().transform((val) => val !== undefined),
	limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined)
});

departuresRouter.get('/:station_id', (c) => {
	const queryResult = querySchema.safeParse(c.req.query());

	if (!queryResult.success) {
		return c.json({ error: 'Invalid query parameters' }, 400);
	}

	const { bytrain, limit } = queryResult.data;
	const departures = mta.getDepartureTimesByStationId(c.req.param().station_id);

	if (bytrain) {
		const grouped: Record<string, ArrivalDepartureTime[]> = {};

		departures.forEach((departure) => {
			const key = `${departure.train}${departure.direction}`;
			if (!grouped[key]) {
				grouped[key] = [];
			}
			grouped[key].push(departure);
		});

		Object.keys(grouped).forEach((key) => {
			grouped[key].sort((a, b) => a.timestamp - b.timestamp);
			if (limit !== undefined) {
				grouped[key] = grouped[key].slice(0, limit);
			}
		});

		return c.json(grouped);
	}

	const result = limit !== undefined ? departures.slice(0, limit) : departures;
	return c.json(result);
});

export { departuresRouter };

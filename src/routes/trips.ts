import { Hono } from 'hono';

const tripsRouter = new Hono();

tripsRouter.get('/:trip_id', (c) => c.json({ message: 'Under construction' }));

export { tripsRouter };

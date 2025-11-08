import { Station } from '../mta/station';
import { calculateDistanceMiles, MILES_PER_DEGREE_LAT_NYC } from '../util';

interface Point {
	lat: number;
	long: number;
	station: Station;
}

interface Bounds {
	minLat: number;
	maxLat: number;
	minLong: number;
	maxLong: number;
}

const MAX_CAPACITY = 10;
const MAX_DEPTH = 8;

export class QuadtreeNode {
	bounds: Bounds;
	points: Point[];
	divided: boolean;
	depth: number;
	northwest?: QuadtreeNode;
	northeast?: QuadtreeNode;
	southwest?: QuadtreeNode;
	southeast?: QuadtreeNode;

	constructor(bounds: Bounds, depth: number = 0) {
		this.bounds = bounds;
		this.points = [];
		this.divided = false;
		this.depth = depth;
	}

	contains(lat: number, long: number): boolean {
		return (
			lat >= this.bounds.minLat &&
			lat <= this.bounds.maxLat &&
			long >= this.bounds.minLong &&
			long <= this.bounds.maxLong
		);
	}

	subdivide(): void {
		const { minLat, maxLat, minLong, maxLong } = this.bounds;
		const midLat = (minLat + maxLat) / 2;
		const midLong = (minLong + maxLong) / 2;
		const newDepth = this.depth + 1;

		this.northwest = new QuadtreeNode(
			{ minLat, maxLat: midLat, minLong, maxLong: midLong },
			newDepth
		);
		this.northeast = new QuadtreeNode(
			{ minLat, maxLat: midLat, minLong: midLong, maxLong },
			newDepth
		);
		this.southwest = new QuadtreeNode(
			{ minLat: midLat, maxLat, minLong, maxLong: midLong },
			newDepth
		);
		this.southeast = new QuadtreeNode(
			{ minLat: midLat, maxLat, minLong: midLong, maxLong },
			newDepth
		);

		this.divided = true;
	}

	insert(point: Point): boolean {
		if (!this.contains(point.lat, point.long)) {
			return false;
		}

		if (this.points.length < MAX_CAPACITY || this.depth >= MAX_DEPTH) {
			this.points.push(point);
			return true;
		}

		if (!this.divided) {
			this.subdivide();
			const currentPoints = [...this.points];
			this.points = [];

			for (const p of currentPoints) {
				this.insertIntoChild(p);
			}
		}

		return this.insertIntoChild(point);
	}

	private insertIntoChild(point: Point): boolean {
		if (this.northwest!.insert(point)) return true;
		if (this.northeast!.insert(point)) return true;
		if (this.southwest!.insert(point)) return true;
		if (this.southeast!.insert(point)) return true;
		return false;
	}

	queryRadius(lat: number, long: number, radiusMiles: number, results: Point[]): void {
		const radiusDegrees = radiusMiles / MILES_PER_DEGREE_LAT_NYC;

		if (!this.intersectsCircle(lat, long, radiusDegrees)) {
			return;
		}

		for (const point of this.points) {
			const distMiles = calculateDistanceMiles(lat, long, point.lat, point.long);
			if (distMiles <= radiusMiles) {
				results.push(point);
			}
		}

		if (this.divided) {
			this.northwest!.queryRadius(lat, long, radiusMiles, results);
			this.northeast!.queryRadius(lat, long, radiusMiles, results);
			this.southwest!.queryRadius(lat, long, radiusMiles, results);
			this.southeast!.queryRadius(lat, long, radiusMiles, results);
		}
	}

	private intersectsCircle(lat: number, long: number, radius: number): boolean {
		const closestLat = Math.max(this.bounds.minLat, Math.min(lat, this.bounds.maxLat));
		const closestLong = Math.max(this.bounds.minLong, Math.min(long, this.bounds.maxLong));

		const distSquared = (lat - closestLat) ** 2 + (long - closestLong) ** 2;
		return distSquared <= radius ** 2;
	}
}

export class Quadtree {
	private root: QuadtreeNode;

	constructor(bounds: Bounds) {
		this.root = new QuadtreeNode(bounds);
	}

	insert(station: Station): boolean {
		const point: Point = {
			lat: station.gtfsLatitude,
			long: station.gtfsLongitude,
			station
		};
		return this.root.insert(point);
	}

	queryRadius(lat: number, long: number, radiusMiles: number): Station[] {
		const results: Point[] = [];
		this.root.queryRadius(lat, long, radiusMiles, results);
		return results.map((p) => p.station);
	}
}

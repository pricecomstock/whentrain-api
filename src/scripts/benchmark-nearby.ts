import { stationsList, stationsQuadtree } from '../mta/station';
import { calculateDistanceMiles } from '../util';

interface TestCase {
	name: string;
	lat: number;
	long: number;
	maxdistance: number;
	count: number;
}

const testCases: TestCase[] = [
	{ name: 'Times Square', lat: 40.7580, long: -73.9855, maxdistance: 0.5, count: 10 },
	{ name: 'Downtown Brooklyn', lat: 40.6916, long: -73.9890, maxdistance: 1, count: 10 },
	{ name: 'Upper Manhattan', lat: 40.8648, long: -73.9273, maxdistance: 0.3, count: 5 },
	{ name: 'Queens', lat: 40.7282, long: -73.7949, maxdistance: 2, count: 15 },
	{ name: 'Bronx', lat: 40.8448, long: -73.8648, maxdistance: 1.5, count: 10 },
	{ name: 'Staten Island', lat: 40.5795, long: -74.1502, maxdistance: 1, count: 5 },
	{ name: 'Far Rockaway', lat: 40.6050, long: -73.7550, maxdistance: 0.5, count: 3 },
	{ name: 'Coney Island', lat: 40.5755, long: -73.9707, maxdistance: 0.8, count: 8 },
	{ name: 'LaGuardia Airport Area', lat: 40.7769, long: -73.8740, maxdistance: 1.2, count: 10 },
	{ name: 'JFK Airport Area', lat: 40.6413, long: -73.7781, maxdistance: 2, count: 10 },
	{ name: 'Very Small Radius', lat: 40.7580, long: -73.9855, maxdistance: 0.1, count: 3 },
	{ name: 'Large Radius', lat: 40.7580, long: -73.9855, maxdistance: 5, count: 50 },
	{ name: 'Edge of NYC', lat: 40.9176, long: -73.7004, maxdistance: 0.5, count: 5 }
];

function linearSearch(lat: number, long: number, maxdistance: number, count: number) {
	return stationsList
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
}

function quadtreeSearch(lat: number, long: number, maxdistance: number, count: number) {
	const candidateStations = stationsQuadtree.queryRadius(lat, long, maxdistance);

	return candidateStations
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
}

function benchmark(
	fn: () => void,
	iterations: number
): { avgMs: number; totalMs: number } {
	const start = performance.now();
	for (let i = 0; i < iterations; i++) {
		fn();
	}
	const end = performance.now();
	const totalMs = end - start;
	return { avgMs: totalMs / iterations, totalMs };
}

function verifyResults(
	linearResults: { station: any; distance: number }[],
	quadtreeResults: { station: any; distance: number }[],
	testName: string
): boolean {
	if (linearResults.length !== quadtreeResults.length) {
		console.log(`  ❌ MISMATCH: Different result counts (linear: ${linearResults.length}, quadtree: ${quadtreeResults.length})`);
		return false;
	}

	for (let i = 0; i < linearResults.length; i++) {
		const linear = linearResults[i];
		const quadtree = quadtreeResults[i];

		if (linear.station.gtfsStopId !== quadtree.station.gtfsStopId) {
			console.log(`  ❌ MISMATCH at position ${i}: linear=${linear.station.stopName}, quadtree=${quadtree.station.stopName}`);
			return false;
		}

		if (Math.abs(linear.distance - quadtree.distance) > 0.0001) {
			console.log(`  ❌ MISMATCH: Distance differs for ${linear.station.stopName} (linear: ${linear.distance}, quadtree: ${quadtree.distance})`);
			return false;
		}
	}

	console.log(`  ✅ Results verified: Both methods returned identical results`);
	return true;
}

console.log('='.repeat(80));
console.log('NEARBY STATIONS PERFORMANCE BENCHMARK');
console.log('='.repeat(80));
console.log(`Total stations in database: ${stationsList.length}`);
console.log(`Test iterations per case: 1000\n`);

const iterations = 1000;

for (const testCase of testCases) {
	console.log(`\n${'─'.repeat(80)}`);
	console.log(`Test: ${testCase.name}`);
	console.log(`  Location: (${testCase.lat}, ${testCase.long})`);
	console.log(`  Max distance: ${testCase.maxdistance} miles`);
	console.log(`  Count: ${testCase.count}`);
	console.log(`${'─'.repeat(80)}`);

	const linearResults = linearSearch(
		testCase.lat,
		testCase.long,
		testCase.maxdistance,
		testCase.count
	);

	const quadtreeResults = quadtreeSearch(
		testCase.lat,
		testCase.long,
		testCase.maxdistance,
		testCase.count
	);

	console.log(`  Results found: ${linearResults.length} stations`);

	verifyResults(linearResults, quadtreeResults, testCase.name);

	const linearBench = benchmark(
		() => linearSearch(testCase.lat, testCase.long, testCase.maxdistance, testCase.count),
		iterations
	);

	const quadtreeBench = benchmark(
		() => quadtreeSearch(testCase.lat, testCase.long, testCase.maxdistance, testCase.count),
		iterations
	);

	const speedup = linearBench.avgMs / quadtreeBench.avgMs;

	console.log(`\n  Linear Search:`);
	console.log(`    Average: ${linearBench.avgMs.toFixed(4)} ms`);
	console.log(`    Total:   ${linearBench.totalMs.toFixed(2)} ms`);

	console.log(`\n  Quadtree Search:`);
	console.log(`    Average: ${quadtreeBench.avgMs.toFixed(4)} ms`);
	console.log(`    Total:   ${quadtreeBench.totalMs.toFixed(2)} ms`);

	console.log(`\n  ⚡ Speedup: ${speedup.toFixed(2)}x faster`);
	console.log(
		`  💾 Improvement: ${((1 - quadtreeBench.avgMs / linearBench.avgMs) * 100).toFixed(1)}% reduction`
	);
}

console.log(`\n${'='.repeat(80)}`);
console.log('SUMMARY');
console.log('='.repeat(80));

const overallLinear = benchmark(
	() => {
		for (const tc of testCases) {
			linearSearch(tc.lat, tc.long, tc.maxdistance, tc.count);
		}
	},
	200
);

const overallQuadtree = benchmark(
	() => {
		for (const tc of testCases) {
			quadtreeSearch(tc.lat, tc.long, tc.maxdistance, tc.count);
		}
	},
	200
);

console.log(`\nOverall Performance (all test cases combined):`);
console.log(`  Linear:    ${overallLinear.avgMs.toFixed(4)} ms per run`);
console.log(`  Quadtree:  ${overallQuadtree.avgMs.toFixed(4)} ms per run`);
console.log(`  Speedup:   ${(overallLinear.avgMs / overallQuadtree.avgMs).toFixed(2)}x faster`);
console.log('='.repeat(80));

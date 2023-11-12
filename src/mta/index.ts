import { Station, stationsList, getStationById, getStationListByTrain } from './station.js';
import { fetchDepartureTimes, type ArrivalDepartureTime } from './mtaRealTimeApi.js';
import { MTA_NO_RESPONSE_ALERT_MS, MTA_UPDATE_INTERVAL_MS } from '../config.js';
import logger from '../logging/logger.js';

export class MTA {
	private departureTimes: ArrivalDepartureTime[];
	private departureTimesMap: Map<string, ArrivalDepartureTime[]>;

	private realTimeUpdateIntervalId: NodeJS.Timeout = setTimeout(() => {}, 0);
	public lastUpdatedMillis = Date.now();

	constructor() {
		this.departureTimes = [];
		this.departureTimesMap = new Map<string, ArrivalDepartureTime[]>();
	}

	async instantiate(): Promise<void> {
		await this.syncRealTimeDepartures();
		this.startRealTimeUpdates();
		return;
	}

	getStationById(id: string): Station | undefined {
		return getStationById(id);
	}

	getStationListByTrain(train: string): Station[] {
		return getStationListByTrain(train);
	}

	getAllStations(): Station[] {
		return stationsList;
	}

	async syncRealTimeDepartures() {
		try {
			this.departureTimes = await fetchDepartureTimes();
			this.lastUpdatedMillis = Date.now();
			this.departureTimesMap = new Map<string, ArrivalDepartureTime[]>();
			logger.info(`${this.departureTimes.length} departure time updates`);

			this.departureTimes.forEach((departureTime: ArrivalDepartureTime) => {
				const { stationDirection } = departureTime;

				const stationDepartureTimes = this.departureTimesMap.get(stationDirection) ?? [];

				stationDepartureTimes.push(departureTime);

				this.departureTimesMap.set(stationDirection, stationDepartureTimes);
			});
		} catch (error: any) {
			logger.warn('Error syncing realtime data:', error.message);
			if (Date.now() - this.lastUpdatedMillis > MTA_NO_RESPONSE_ALERT_MS) {
				logger.error('No updates received from MTA in 10 minutes');
			}
		}
	}

	getDepartureTimesByStationId(id: string): ArrivalDepartureTime[] {
		const hasDirection = ['N', 'S'].includes(id.slice(-1));
		if (hasDirection) {
			return this.departureTimesMap.get(id) ?? [];
		} else {
			return [
				...(this.departureTimesMap.get(id + 'N') ?? []),
				...(this.departureTimesMap.get(id + 'S') ?? [])
			];
		}
	}

	startRealTimeUpdates() {
		logger.info(`Pulling data from MTA every ${MTA_UPDATE_INTERVAL_MS / 1000} seconds`);
		this.realTimeUpdateIntervalId = setInterval(async () => {
			await this.syncRealTimeDepartures();
		}, MTA_UPDATE_INTERVAL_MS);
	}

	pauseRealTimeUpdates() {
		logger.info(`Pausing data pull from MTA`);
		clearInterval(this.realTimeUpdateIntervalId);
	}
}

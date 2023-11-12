export const MTA_API_KEY: string = process.env.MTA_API_KEY || '';
export const MTA_NO_RESPONSE_ALERT_MS: number = Number(process.env.MTA_NO_RESPONSE_ALERT_MS) || 600_000;
export const MTA_UPDATE_INTERVAL_MS = Number(process.env.MTA_UPDATE_INTERVAL_MS) || 60_000;

export const TELEGRAM_TOKEN: string | null = process.env.TELEGRAM_TOKEN || null;
export const TELEGRAM_CHAT_ID: string | null = process.env.TELEGRAM_CHAT_ID || null;

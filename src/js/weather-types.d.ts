export type WeatherProfile = "growth" | "outing";
export type Measure = number | null;
export interface WeatherZone {
  id: string;
  lat: number;
  lon: number;
  bands: number[];
}
export interface WeatherGroup {
  precipitation?: Measure[];
  precipitation_probability?: Measure[];
  weather_code?: Measure[];
  wind_gusts_10m?: Measure[];
  temperature_2m?: Measure[];
  time: string[];
  [key: string]: (number | string | null)[] | undefined;
}
export interface WeatherRow {
  daily?: WeatherGroup;
  hourly?: WeatherGroup;
  latitude?: number;
  longitude?: number;
  elevation?: number;
  daily_units?: Record<string, string>;
  hourly_units?: Record<string, string>;
  [key: string]: unknown;
}
export interface GrowthRow extends WeatherRow {
  daily: WeatherGroup;
}
export interface OutingRow extends WeatherRow {
  hourly: WeatherGroup;
}
export interface WeatherRecord<Row = WeatherRow> {
  t: number;
  raw: Row[];
  stale?: boolean;
  local?: boolean;
}
export interface ForecastResult {
  raw: unknown[];
  fetchedAt: Date;
  stale: boolean;
  refreshing?: boolean;
  partial?: boolean;
}
export interface ForecastChunk extends ForecastResult {
  start: number;
  count: number;
}
export interface ForecastOptions {
  onProgress?: (completed: number, total: number) => void;
  onChunk?: (chunk: ForecastChunk) => void;
  signal?: AbortSignal;
}
export interface GrowthSource {
  fetchedAt?: string;
  expired?: boolean;
  cached?: boolean;
  snapshot?: boolean;
  requested?: { latitude: number; longitude: number; elevation?: number };
  latitude?: number;
  longitude?: number;
  elevation?: number;
  dailyUnits?: Record<string, string>;
  hourlyUnits?: Record<string, string>;
  models?: string;
}
export interface GrowthSeries {
  dates: string[];
  p: Measure[];
  tmean: Measure[];
  tmin: Measure[];
  tmax: Measure[];
  soilm: Measure[];
  soilt: Measure[];
  soilm9to27: Measure[];
  et0: Measure[];
  todayIndex: number;
  issuedIndex: number;
  source: GrowthSource;
}
export type GrowthMap = Record<string, GrowthSeries[]>;
export interface GrowthSnapshot {
  series: GrowthMap;
  fetchedAt: Date;
  snapshot?: boolean;
  cached?: boolean;
  stale: boolean;
  missingZones?: string[];
  failedZones?: string[];
  offline?: boolean;
}
export interface OutingSeries {
  time: string[];
  p?: Measure[];
  pp?: Measure[];
  wc?: Measure[];
  g?: Measure[];
  t?: Measure[];
  fetchedAt: string;
  elevation?: number;
}
export type OutingMap = Record<string, OutingSeries>;
export type WeatherPhase =
  { phase: "cache"; pending?: string[] } | { phase: "network"; zoneId: string };
export type OutingLevel =
  "ok" | "attenzione" | "sconsigliata" | "non_disponibile" | "passata";
export interface OutingConditions {
  level: OutingLevel;
  available: boolean;
  text: string;
  main: string;
  short: string;
  fetchedAt?: string;
  rain?: number;
  prob?: number;
  thunder?: boolean;
  snow?: boolean;
  fog?: boolean;
  gust?: number;
  tmin?: number;
  tmax?: number;
  from?: number;
}
export type WeatherLoadOptions<Snapshot> = {
  force?: boolean;
  onProgress?: ForecastOptions["onProgress"];
  onUpdate?: (snapshot: Snapshot, detail: WeatherPhase) => void;
  signal?: AbortSignal;
};
export interface EmbeddedWeather {
  series: GrowthMap;
  fetchedAt: string;
}
declare global {
  var FUNGAROLI_DATA:
    { weather?: EmbeddedWeather; outing?: OutingMap } | undefined;
  var FUNGAROLI_REVIEW:
    { weather?: EmbeddedWeather; outing?: OutingMap } | undefined;
}

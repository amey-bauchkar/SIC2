/**
 * MandiMitra Backend: District Rainfall Forecast Client
 *
 * Rain is the single most immediate physical driver of mandi arrival volume: harvesting, field
 * drying and farm-to-yard transport all stall in heavy rain, so arrivals collapse on wet days and
 * are released as a backlog on the first workable day afterwards. Bhed Vivek's rush forecast needs
 * a genuine forward-looking rainfall signal to say anything useful about *tomorrow's* crowd.
 *
 * DATA PROVENANCE
 * ---------------
 *   PRIMARY   Open-Meteo forecast API (open-meteo.com) — free, no API key, per-coordinate daily
 *             precipitation_sum and precipitation_probability_max for the next 7 days.
 *             Source: ECMWF IFS / DWD ICON blended NWP.
 *   FALLBACK  data/weather/*.json — Open-Meteo ERA5 historical reanalysis already archived in this
 *             repository. When the network is unavailable the client derives a day-of-year
 *             CLIMATOLOGY (the observed mean rainfall around that calendar date) and labels the
 *             result `climatology` so nothing downstream can mistake it for a live forecast.
 *
 * The client never invents rainfall. If neither source is available it returns `unavailable`, and
 * the rush forecast drops the weather component and says so.
 */

import fs from 'fs';
import path from 'path';
import { apiCache } from './cache';

const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const FORECAST_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours
const FORECAST_TIMEOUT_MS = 12000;
const FORECAST_RETRIES = 1;

export type RainfallSource = 'open-meteo-forecast' | 'era5-climatology' | 'unavailable';

export interface DailyRainfall {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  /** Millimetres of precipitation expected that day. */
  precipitationMm: number;
  /** Probability of precipitation, 0-100. Only present on the live forecast path. */
  precipitationProbabilityPct?: number;
  temperatureMaxC?: number;
  temperatureMinC?: number;
}

export interface RainfallOutlook {
  source: RainfallSource;
  sourceNote: string;
  latitude: number;
  longitude: number;
  days: DailyRainfall[];
  retrievedAt: string;
}

// ---------------------------------------------------------------------------
// Live forecast
// ---------------------------------------------------------------------------

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    p.then(
      v => { clearTimeout(timer); resolve(v); },
      e => { clearTimeout(timer); reject(e); }
    );
  });
}

async function fetchOpenMeteoForecast(lat: number, lon: number, days: number): Promise<RainfallOutlook> {
  const url = new URL(OPEN_METEO_FORECAST_URL);
  url.searchParams.set('latitude', lat.toFixed(4));
  url.searchParams.set('longitude', lon.toFixed(4));
  url.searchParams.set('daily', 'precipitation_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min');
  url.searchParams.set('forecast_days', String(Math.min(16, Math.max(1, days))));
  url.searchParams.set('timezone', 'Asia/Kolkata');

  const res = await withTimeout(
    fetch(url.toString(), { headers: { 'User-Agent': 'MandiMitra/1.0 (agricultural decision support)' } }),
    FORECAST_TIMEOUT_MS,
    'Open-Meteo forecast'
  );
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);

  const json = await res.json() as {
    daily?: {
      time?: string[];
      precipitation_sum?: (number | null)[];
      precipitation_probability_max?: (number | null)[];
      temperature_2m_max?: (number | null)[];
      temperature_2m_min?: (number | null)[];
    };
  };

  const d = json.daily;
  if (!d?.time || !Array.isArray(d.time) || d.time.length === 0) {
    throw new Error('Open-Meteo returned no daily series');
  }

  const out: DailyRainfall[] = d.time.map((date, i) => ({
    date,
    precipitationMm: Number(d.precipitation_sum?.[i] ?? 0) || 0,
    precipitationProbabilityPct: d.precipitation_probability_max?.[i] ?? undefined,
    temperatureMaxC: d.temperature_2m_max?.[i] ?? undefined,
    temperatureMinC: d.temperature_2m_min?.[i] ?? undefined
  }));

  return {
    source: 'open-meteo-forecast',
    sourceNote: 'Live Open-Meteo daily forecast (ECMWF IFS / DWD ICON blend) for the destination district.',
    latitude: lat,
    longitude: lon,
    days: out,
    retrievedAt: new Date().toISOString()
  };
}

// ---------------------------------------------------------------------------
// Offline climatology fallback (archived Open-Meteo ERA5 reanalysis)
// ---------------------------------------------------------------------------

interface ArchivedSeries {
  latitude: number;
  longitude: number;
  records: Array<{ date: string; precipitation_mm: number; temperature_max_c?: number; temperature_min_c?: number }>;
}

let archiveCache: ArchivedSeries[] | null = null;

/** Coordinate cells with a background warm-up already in flight, to avoid duplicate fetches. */
const inFlight = new Set<string>();

function loadWeatherArchive(): ArchivedSeries[] {
  if (archiveCache) return archiveCache;
  const out: ArchivedSeries[] = [];
  try {
    const dir = path.resolve(process.cwd(), 'data', 'weather');
    if (fs.existsSync(dir)) {
      for (const f of fs.readdirSync(dir)) {
        if (!f.endsWith('.json')) continue;
        try {
          const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
          if (Array.isArray(j.records) && typeof j.latitude === 'number' && typeof j.longitude === 'number') {
            out.push({ latitude: j.latitude, longitude: j.longitude, records: j.records });
          }
        } catch {
          /* skip malformed archive file */
        }
      }
    }
  } catch {
    /* archive unavailable */
  }
  archiveCache = out;
  return out;
}

function dayOfYear(iso: string): number {
  const d = new Date(`${iso}T00:00:00Z`);
  if (isNaN(d.getTime())) return 1;
  const start = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.floor((d.getTime() - start) / 86400000) + 1;
}

/**
 * Derives a rainfall climatology for the requested dates: the mean observed precipitation within
 * a +/- 7 day calendar window around each target date, taken from the nearest archived district
 * series. This is a real historical average, explicitly labelled as such.
 */
function buildClimatologyOutlook(lat: number, lon: number, dates: string[]): RainfallOutlook | null {
  const archive = loadWeatherArchive();
  if (archive.length === 0) return null;

  let nearest = archive[0];
  let best = Infinity;
  for (const s of archive) {
    const d2 = Math.pow(s.latitude - lat, 2) + Math.pow(s.longitude - lon, 2);
    if (d2 < best) { best = d2; nearest = s; }
  }
  if (!nearest.records.length) return null;

  const byDoy = new Map<number, number[]>();
  for (const r of nearest.records) {
    const doy = dayOfYear(r.date);
    const mm = Number(r.precipitation_mm);
    if (!Number.isFinite(mm)) continue;
    if (!byDoy.has(doy)) byDoy.set(doy, []);
    byDoy.get(doy)!.push(mm);
  }

  const days: DailyRainfall[] = dates.map(date => {
    const target = dayOfYear(date);
    const window: number[] = [];
    for (let off = -7; off <= 7; off++) {
      const doy = ((target + off - 1 + 366) % 366) + 1;
      const vals = byDoy.get(doy);
      if (vals) window.push(...vals);
    }
    const mean = window.length ? window.reduce((a, b) => a + b, 0) / window.length : 0;
    return { date, precipitationMm: Math.round(mean * 100) / 100 };
  });

  return {
    source: 'era5-climatology',
    sourceNote: 'Live forecast unavailable — using the archived Open-Meteo ERA5 reanalysis climatology (mean observed rainfall within a +/-7 day calendar window) for the nearest district series.',
    latitude: nearest.latitude,
    longitude: nearest.longitude,
    days,
    retrievedAt: new Date().toISOString()
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function isoDaysFrom(start: Date, count: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/**
 * Returns the rainfall outlook for a coordinate, preferring the live Open-Meteo forecast and
 * degrading to the archived ERA5 climatology. Results are cached for 3 hours per rounded
 * coordinate so a page full of candidate mandis costs at most one upstream call per district.
 */
export async function getRainfallOutlook(
  lat: number,
  lon: number,
  days: number = 5,
  referenceDate: Date = new Date(),
  options: { allowNetwork?: boolean } = {}
): Promise<RainfallOutlook> {
  const allowNetwork = options.allowNetwork !== false;
  const key = `rainfall-${lat.toFixed(2)}-${lon.toFixed(2)}-${days}`;
  const cached = apiCache.get<RainfallOutlook>(key);
  if (cached && !cached.isStale) return cached.data;

  // Non-blocking mode: the caller is on a latency-critical path (the core sell/wait decision),
  // which must never be held hostage to a weather API. Answer instantly from the archived
  // climatology and warm the cache in the background so the next request gets the live forecast.
  if (!allowNetwork) {
    if (!inFlight.has(key)) {
      inFlight.add(key);
      void fetchOpenMeteoForecast(lat, lon, days)
        .then(live => { apiCache.set(key, live, FORECAST_TTL_MS); })
        .catch(() => { /* background warm-up is best-effort */ })
        .finally(() => { inFlight.delete(key); });
    }
    const climatology = buildClimatologyOutlook(lat, lon, isoDaysFrom(referenceDate, days));
    if (climatology) {
      climatology.sourceNote =
        'Live forecast not yet cached for this district, so the archived Open-Meteo ERA5 climatology '
        + '(mean observed rainfall within a +/-7 day calendar window) was used to keep the decision '
        + 'endpoint fast. A live forecast is being fetched in the background for the next request.';
      return climatology;
    }
    return {
      source: 'unavailable',
      sourceNote: 'No cached forecast and no archived series matched this district.',
      latitude: lat,
      longitude: lon,
      days: [],
      retrievedAt: new Date().toISOString()
    };
  }

  // One retry: this network drops parallel TLS handshakes to Open-Meteo intermittently, and a
  // single short retry recovers most cells without stalling the request.
  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= FORECAST_RETRIES; attempt++) {
    try {
      const live = await fetchOpenMeteoForecast(lat, lon, days);
      apiCache.set(key, live, FORECAST_TTL_MS);
      return live;
    } catch (e) {
      lastErr = e;
      if (attempt < FORECAST_RETRIES) {
        await new Promise(r => setTimeout(r, 400));
      }
    }
  }

  {
    const err = lastErr;
    const climatology = buildClimatologyOutlook(lat, lon, isoDaysFrom(referenceDate, days));
    if (climatology) {
      climatology.sourceNote += ` (live fetch failed: ${err instanceof Error ? err.message : String(err)})`;
      // Cache the degraded answer briefly so one outage does not stall every request.
      apiCache.set(key, climatology, 15 * 60 * 1000);
      return climatology;
    }
    return {
      source: 'unavailable',
      sourceNote: `No rainfall data available (live fetch failed: ${err instanceof Error ? err.message : String(err)}; no archived series matched).`,
      latitude: lat,
      longitude: lon,
      days: [],
      retrievedAt: new Date().toISOString()
    };
  }
}

/** Test hook: clears the archived-series memo. */
export function resetWeatherArchiveCache(): void {
  archiveCache = null;
}

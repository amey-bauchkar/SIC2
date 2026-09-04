/**
 * MandiMitra Backend: Mandi Rush Forecast Service
 *
 * Assembles the measured inputs the rush engine needs and produces one forecast per candidate
 * mandi. Everything here is either counted directly out of today's Agmarknet feed or fetched live
 * from Open-Meteo; the only reference data is the published harvest calendar and the documented
 * weekly yard rhythm, both of which the engine labels as such.
 */

import { Market, MarketEvaluation } from '../contracts/domain';
import {
  forecastMandiRush,
  MandiRushForecast,
  RushMeasurements,
  RushWeatherDay
} from '../core/mandi-rush';
import { getCropConfig } from '../config/crops';
import {
  getPriceUniverse,
  getCommodityPriceContext,
  normalizeMarketKey,
  extractMarketQualifier
} from './price-resolver';
import { getRainfallOutlook } from './weather-client';

interface YardMeasurementCache {
  yardBreadth: Map<string, number>;
  yardLots: Map<string, number>;
  breadthDistribution: number[];
}

let yardCache: YardMeasurementCache | null = null;

/**
 * Counts, for every yard in today's feed, how many distinct commodities and how many individual
 * lots it reported. This is the measured absorption signal: a yard trading 69 commodities is
 * demonstrably a larger terminal than one trading a single lot.
 */
export function getYardMeasurements(forceReload: boolean = false): YardMeasurementCache {
  if (yardCache && !forceReload) return yardCache;

  const uni = getPriceUniverse(forceReload);
  const commoditiesByYard = new Map<string, Set<string>>();
  const lotsByYard = new Map<string, number>();

  for (const r of uni.records) {
    const key = normalizeMarketKey(r.market);
    if (!commoditiesByYard.has(key)) commoditiesByYard.set(key, new Set());
    commoditiesByYard.get(key)!.add(r.commodity);
    lotsByYard.set(key, (lotsByYard.get(key) || 0) + 1);
  }

  const yardBreadth = new Map<string, number>();
  for (const [k, set] of commoditiesByYard.entries()) yardBreadth.set(k, set.size);

  const breadthDistribution = Array.from(yardBreadth.values()).sort((a, b) => a - b);

  yardCache = { yardBreadth, yardLots: lotsByYard, breadthDistribution };
  return yardCache;
}

export function resetYardMeasurementCache(): void {
  yardCache = null;
}

/** True when this exact yard reported the commodity in today's feed. */
function yardTradesCommodity(market: Market, ctx: ReturnType<typeof getCommodityPriceContext>): boolean {
  const key = normalizeMarketKey(market.name);
  if (ctx.observedByMarket.has(key)) return true;
  const qualifier = extractMarketQualifier(market.name);
  return Boolean(qualifier && ctx.observedByQualifier.has(qualifier));
}

export interface RushForecastRequest {
  commodity: string;
  markets: Market[];
  referenceDate?: Date;
  horizonDays?: number;
  /**
   * false = never block on the weather API. Used by the core /api/evaluate path so a sell/wait
   * decision is never delayed by an upstream outage; the cache is warmed in the background.
   */
  allowNetwork?: boolean;
}

export interface RushForecastBundle {
  byMarketId: Map<string, MandiRushForecast>;
  forecasts: MandiRushForecast[];
  weatherSource: string;
  weatherSourceNote: string;
  isWeatherLive: boolean;
}

/**
 * Produces a rush forecast for every supplied candidate mandi.
 * Rainfall is fetched once per rounded coordinate cell so a page of candidates costs at most a
 * handful of upstream calls, and the weather client caches for three hours on top of that.
 */
export async function buildRushForecasts(req: RushForecastRequest): Promise<RushForecastBundle> {
  const { commodity, markets } = req;
  const referenceDate = req.referenceDate || new Date();
  const horizonDays = req.horizonDays ?? 4;

  const ctx = getCommodityPriceContext(commodity);
  const yards = getYardMeasurements();
  const cropConfig = getCropConfig(commodity);

  // Outlet scarcity is measured across the candidate set the farmer is actually choosing between.
  const candidateYardsInRange = markets.length;
  const peerOutletsInRange = markets.filter(m => yardTradesCommodity(m, ctx)).length;

  const measurements: RushMeasurements = {
    yardBreadth: yards.yardBreadth,
    yardLots: yards.yardLots,
    breadthDistribution: yards.breadthDistribution,
    peerOutletsInRange,
    candidateYardsInRange
  };

  // Rainfall is a regional field, so one ~1 degree cell per district cluster is ample resolution
  // and keeps the number of upstream calls small.
  const cellKey = (lat: number, lon: number) => `${Math.round(lat).toFixed(0)},${Math.round(lon).toFixed(0)}`;
  const cells = new Map<string, { lat: number; lon: number }>();
  for (const m of markets) {
    const k = cellKey(m.lat, m.lon);
    if (!cells.has(k)) cells.set(k, { lat: m.lat, lon: m.lon });
  }

  // Fetched SEQUENTIALLY on purpose: parallel TLS handshakes to Open-Meteo are dropped on some
  // networks, which silently degraded cells to climatology. Each cell is cached for three hours,
  // so only the first uncached request pays this cost.
  const outlooks = new Map<string, { days: RushWeatherDay[]; live: boolean; note: string }>();
  for (const [k, c] of cells.entries()) {
    const outlook = await getRainfallOutlook(
      c.lat, c.lon, Math.max(horizonDays + 1, 5), referenceDate,
      { allowNetwork: req.allowNetwork !== false }
    );
    outlooks.set(k, {
      days: outlook.days.map(d => ({ date: d.date, precipitationMm: d.precipitationMm })),
      live: outlook.source === 'open-meteo-forecast',
      note: outlook.sourceNote
    });
  }

  // Provenance must describe the WHOLE bundle. Reporting "live" because one cell succeeded while
  // quoting a fallback note from another would be a contradiction, so summarise both counts.
  const allOutlooks = Array.from(outlooks.values());
  const liveCount = allOutlooks.filter(o => o.live).length;
  const totalCells = allOutlooks.length;
  const anyLive = liveCount > 0;
  const allLive = totalCells > 0 && liveCount === totalCells;

  let firstNote: string;
  if (totalCells === 0) {
    firstNote = 'No rainfall outlook available.';
  } else if (allLive) {
    firstNote = allOutlooks[0].note;
  } else if (liveCount === 0) {
    firstNote = allOutlooks[0].note;
  } else {
    const fallbackNote = allOutlooks.find(o => !o.live)?.note || '';
    firstNote = `Mixed rainfall provenance: ${liveCount} of ${totalCells} district cells used the live Open-Meteo forecast; the remaining ${totalCells - liveCount} fell back to the archived ERA5 climatology. ${fallbackNote}`;
  }

  const forecasts: MandiRushForecast[] = markets.map(m => {
    const cell = outlooks.get(cellKey(m.lat, m.lon));
    return forecastMandiRush({
      marketId: m.id,
      marketName: m.name,
      marketKey: normalizeMarketKey(m.name),
      commodity,
      decayType: cropConfig?.decayType,
      measurements,
      weatherDays: cell?.days || [],
      isWeatherLive: cell?.live || false,
      weatherSourceNote: cell?.note || 'No rainfall outlook available for this district.',
      referenceDate,
      horizonDays
    });
  });

  const byMarketId = new Map<string, MandiRushForecast>();
  for (const f of forecasts) byMarketId.set(f.marketId, f);

  return {
    byMarketId,
    forecasts,
    weatherSource: allLive ? 'open-meteo-forecast' : (anyLive ? 'mixed' : 'era5-climatology'),
    weatherSourceNote: firstNote,
    isWeatherLive: allLive
  };
}

/** Convenience wrapper: builds forecasts for the markets present in a set of evaluations. */
export async function buildRushForecastsForEvaluations(
  commodity: string,
  evaluations: MarketEvaluation[],
  referenceDate?: Date,
  horizonDays?: number,
  allowNetwork: boolean = true
): Promise<RushForecastBundle> {
  return buildRushForecasts({
    commodity,
    markets: evaluations.map(e => e.market),
    referenceDate,
    horizonDays,
    allowNetwork
  });
}

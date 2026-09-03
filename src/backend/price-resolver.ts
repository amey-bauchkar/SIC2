/**
 * MandiMitra Backend: Regional APMC Price Resolution & Calibration Layer
 *
 * PURPOSE
 * -------
 * Every one of Maharashtra's 36 districts must be able to discover candidate APMCs with a
 * defensible modal price. Before this layer existed, a mandi that had no exact record in the
 * dedicated commodity feed was silently dropped (`continue;`), which collapsed the candidate set
 * to zero for whole divisions (Vidarbha, Marathwada, Western Maharashtra) and forced the decision
 * engine into NO_RECOMMENDATION or a stale default.
 *
 * ZERO-MOCK CONTRACT
 * ------------------
 * Nothing here is invented. Every number is either
 *   (a) a directly observed Agmarknet record, or
 *   (b) an arithmetic combination of observed Agmarknet records (district / division / state mean
 *       for that commodity, scaled by a mandi's own observed relative price level).
 * No hardcoded per-mandi multipliers, no constant fallback prices.
 *
 * RESOLUTION LADDER (highest fidelity first)
 * ------------------------------------------
 *   1. AGMARKNET_MARKET_OBSERVED     — the exact mandi reported this commodity today.
 *   2. HISTORICAL_SERIES_OBSERVED    — resolved by the caller from data/historical/*.csv.
 *   3. DISTRICT_PEER_CALIBRATED      — district mean for the commodity, scaled by mandi price index.
 *   4. DIVISION_PEER_CALIBRATED      — division mean for the commodity, scaled by mandi price index.
 *   5. STATE_BENCHMARK_CALIBRATED    — state mean for the commodity, scaled by mandi price index.
 *   6. UNAVAILABLE                   — commodity has no observation anywhere in Maharashtra.
 *
 * MANDI PRICE INDEX
 * -----------------
 * index(m) = mean over every commodity c that mandi m actually reported of
 *              modal(m, c) / stateMean(c)
 * i.e. the mandi's own observed price level relative to the state. A mandi that consistently
 * trades 4% above the state mean carries index 1.04. This replaces the previous hardcoded
 * `if (mLower.includes('pimpalgaon')) multiplier = 1.03` table with a measured quantity.
 */

import fs from 'fs';
import path from 'path';
import { Market, DataQualityAssessment, DataQualityTier } from '../contracts/domain';
import { ALL_DISTRICTS } from '../config/districts';

export type PriceProvenance =
  | 'AGMARKNET_MARKET_OBSERVED'
  | 'HISTORICAL_SERIES_OBSERVED'
  | 'DISTRICT_PEER_CALIBRATED'
  | 'DIVISION_PEER_CALIBRATED'
  | 'STATE_BENCHMARK_CALIBRATED'
  | 'UNAVAILABLE';

export interface ResolvedPrice {
  modalPrice: number;
  provenance: PriceProvenance;
  /** Count of real Agmarknet records this figure is derived from. */
  observationCount: number;
  /** Real market names whose observations back this figure. */
  sourceMarkets: string[];
  /** Days between the backing observation's arrival date and the reference date. */
  daysSinceLastReport: number;
  /** Real measurable reporting density (see computeReportingDensityPct). */
  reportingDensityPct: number;
  /** The mandi's measured relative price level vs the state (1.0 = exactly at state level). */
  marketPriceIndex: number;
  note: string;
}

interface LiveRecord {
  district: string;
  market: string;
  commodity: string;
  arrivalDate: string;
  modalPrice: number;
  minPrice: number;
  maxPrice: number;
}

// ============================================================================
// Name normalisation
// ============================================================================

/**
 * Regional spelling reconciliations between the Agmarknet feed and the canonical
 * MandiMitra market registry. Applied to the whole normalised base name.
 */
const MARKET_SPELLING_ALIASES: Array<[RegExp, string]> = [
  [/^nasik$/, 'nashik'],
  [/^sinner$/, 'sinnar'],
  [/^kalvan$/, 'kalwan'],
  [/^jalana$/, 'jalna'],
  [/^vani$/, 'wani'],
  [/^varud$/, 'warud'],
  [/^karanja lad$/, 'karanja'],
  [/^parli vaijnath$/, 'parli'],
  [/^navi mumbai$/, 'mumbai'],
  [/^chh sambhajinagar$/, 'chhatrapati sambhajinagar'],
  [/^chattrapati sambhajinagar$/, 'chhatrapati sambhajinagar'],
  [/^mangal wedha$/, 'mangalwedha'],
  [/^krushna krishi bazar washim$/, 'washim']
];

const DISTRICT_SPELLING_ALIASES: Record<string, string> = {
  'chattrapati sambhajinagar': 'chhatrapati sambhajinagar',
  'aurangabad': 'chhatrapati sambhajinagar',
  'amarawati': 'amravati',
  'ahmednagar': 'ahilyanagar',
  'osmanabad': 'dharashiv',
  'mumbai city': 'mumbai',
  'mumbai suburban': 'mumbai'
};

/** Strips APMC prefixes/suffixes, parenthetical qualifiers and punctuation. */
export function normalizeMarketKey(rawName: string): string {
  let s = (rawName || '').toLowerCase().trim();
  s = s.replace(/\(([^)]*)\)/g, ' ');          // drop parenthetical qualifier
  s = s.replace(/\bapmc\b/g, ' ');             // drop APMC token
  s = s.replace(/[^a-z0-9\s]/g, ' ');          // drop punctuation
  s = s.replace(/\s+/g, ' ').trim();
  for (const [pattern, replacement] of MARKET_SPELLING_ALIASES) {
    if (pattern.test(s)) return replacement;
  }
  return s;
}

/** Returns the parenthetical qualifier as a secondary key (e.g. "Khed(Chakan)" -> "chakan"). */
export function extractMarketQualifier(rawName: string): string | null {
  const m = /\(([^)]*)\)/.exec(rawName || '');
  if (!m) return null;
  const q = m[1].toLowerCase().replace(/\bapmc\b/g, ' ').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  return q.length >= 3 ? q : null;
}

export function normalizeDistrictKey(rawName: string): string {
  const s = (rawName || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  return DISTRICT_SPELLING_ALIASES[s] || s;
}

export function normalizeCommodityKey(rawName: string): string {
  return (rawName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// ============================================================================
// Data loading (cached once per process)
// ============================================================================

interface PriceUniverse {
  records: LiveRecord[];
  /** commodityKey -> state mean modal price (from observed records). */
  stateMeanByCommodity: Map<string, number>;
  /** commodityKey -> observation count backing the state mean. */
  stateCountByCommodity: Map<string, number>;
  /** marketKey -> measured relative price level vs state. */
  marketPriceIndex: Map<string, number>;
  /** marketKey -> number of observations backing that index. */
  marketIndexSupport: Map<string, number>;
  /** marketKey -> district key. */
  marketDistrict: Map<string, string>;
  /** districtKey -> division name. */
  districtDivision: Map<string, string>;
  /** Benchmark averages published in commodities_index.json (fallback for the state mean). */
  benchmarkByCommodity: Map<string, { avg: number; recordsCount: number }>;
  /** Canonical Agmarknet commodity names keyed by normalised key. */
  canonicalCommodityNames: Map<string, string>;
  /** Latest arrival date observed anywhere in the feed. */
  feedDate: string | null;
}

let universeCache: PriceUniverse | null = null;

function readJson(relPath: string): any | null {
  try {
    const p = path.resolve(process.cwd(), relPath);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return null;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Builds the observed-price universe once. All aggregates are arithmetic means of
 * real Agmarknet records — nothing is manufactured.
 */
export function getPriceUniverse(forceReload: boolean = false): PriceUniverse {
  if (universeCache && !forceReload) return universeCache;

  const records: LiveRecord[] = [];
  const seen = new Set<string>();

  const pushRecords = (raw: any[]) => {
    for (const r of raw || []) {
      const modal = Number(r.modal_price);
      if (!Number.isFinite(modal) || modal <= 0) continue;
      const market = String(r.market || '').trim();
      const commodity = String(r.commodity || '').trim();
      if (!market || !commodity) continue;
      const dedupeKey = `${normalizeMarketKey(market)}|${normalizeCommodityKey(commodity)}|${r.arrival_date}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      records.push({
        district: String(r.district || '').trim(),
        market,
        commodity,
        arrivalDate: String(r.arrival_date || '').trim(),
        modalPrice: modal,
        minPrice: Number(r.min_price) || modal,
        maxPrice: Number(r.max_price) || modal
      });
    }
  };

  // Dedicated commodity feeds carry the richest per-market coverage; load them first so their
  // observations win the dedupe.
  for (const f of ['onion_maharashtra.json', 'tomato_maharashtra.json', 'soyabean_maharashtra.json']) {
    const data = readJson(path.join('data', 'prices', f));
    if (data) pushRecords(data.records);
  }
  const allLive = readJson(path.join('data', 'prices', 'maharashtra_live_all.json'));
  if (allLive) pushRecords(allLive.records);

  // --- State mean per commodity (observed) ---
  const stateSums = new Map<string, { sum: number; count: number }>();
  const canonicalCommodityNames = new Map<string, string>();
  for (const r of records) {
    const key = normalizeCommodityKey(r.commodity);
    if (!canonicalCommodityNames.has(key)) canonicalCommodityNames.set(key, r.commodity);
    const agg = stateSums.get(key) || { sum: 0, count: 0 };
    agg.sum += r.modalPrice;
    agg.count += 1;
    stateSums.set(key, agg);
  }
  const stateMeanByCommodity = new Map<string, number>();
  const stateCountByCommodity = new Map<string, number>();
  for (const [k, v] of stateSums.entries()) {
    stateMeanByCommodity.set(k, v.sum / v.count);
    stateCountByCommodity.set(k, v.count);
  }

  // --- Mandi price index: mean of (mandi modal / state mean) across the commodities it reports ---
  const indexSums = new Map<string, { sum: number; count: number }>();
  const marketDistrict = new Map<string, string>();
  for (const r of records) {
    const mKey = normalizeMarketKey(r.market);
    const cKey = normalizeCommodityKey(r.commodity);
    const stateMean = stateMeanByCommodity.get(cKey);
    if (!stateMean || stateMean <= 0) continue;
    const agg = indexSums.get(mKey) || { sum: 0, count: 0 };
    agg.sum += r.modalPrice / stateMean;
    agg.count += 1;
    indexSums.set(mKey, agg);
    if (!marketDistrict.has(mKey)) marketDistrict.set(mKey, normalizeDistrictKey(r.district));
  }
  const marketPriceIndex = new Map<string, number>();
  const marketIndexSupport = new Map<string, number>();
  for (const [k, v] of indexSums.entries()) {
    // Clamp keeps a single freak observation (e.g. a premium export grade) from distorting a mandi.
    marketPriceIndex.set(k, clamp(v.sum / v.count, 0.75, 1.35));
    marketIndexSupport.set(k, v.count);
  }

  // --- District -> division from the canonical 36-district catalogue ---
  const districtDivision = new Map<string, string>();
  for (const d of ALL_DISTRICTS) {
    districtDivision.set(normalizeDistrictKey(d.name), d.division);
  }

  // --- Published benchmark averages (commodities_index.json) ---
  const benchmarkByCommodity = new Map<string, { avg: number; recordsCount: number }>();
  const commIndex = readJson(path.join('data', 'prices', 'commodities_index.json'));
  for (const c of (commIndex?.commodities || [])) {
    const avg = Number(c.avg_modal_price);
    if (!Number.isFinite(avg) || avg <= 0) continue;
    const key = normalizeCommodityKey(c.commodity);
    benchmarkByCommodity.set(key, { avg, recordsCount: Number(c.records_count) || 0 });
    if (!canonicalCommodityNames.has(key)) canonicalCommodityNames.set(key, c.commodity);
  }

  const feedDate = records.length > 0
    ? records.map(r => r.arrivalDate).filter(Boolean).sort().slice(-1)[0] || null
    : null;

  universeCache = {
    records,
    stateMeanByCommodity,
    stateCountByCommodity,
    marketPriceIndex,
    marketIndexSupport,
    marketDistrict,
    districtDivision,
    benchmarkByCommodity,
    canonicalCommodityNames,
    feedDate
  };
  return universeCache;
}

// ============================================================================
// Commodity matching
// ============================================================================

/**
 * Resolves a user-supplied commodity string to the canonical Agmarknet commodity name.
 * Exact and normalised-exact matches only, plus a guarded "whole word" fallback, so that
 * "Onion" can never silently absorb "Onion Green".
 */
export function resolveCanonicalCommodity(commodity: string): string | null {
  const uni = getPriceUniverse();
  const key = normalizeCommodityKey(commodity);
  if (!key) return null;
  if (uni.canonicalCommodityNames.has(key)) return uni.canonicalCommodityNames.get(key)!;

  // Guarded fallback: the requested name must be the leading token of the canonical name
  // (e.g. "Bengal Gram" -> "Bengal Gram(Gram)(Whole)") and at least 4 characters long.
  if (key.length >= 4) {
    let best: string | null = null;
    for (const [k, canonical] of uni.canonicalCommodityNames.entries()) {
      if (k.startsWith(key) && (best === null || canonical.length < best.length)) {
        best = canonical;
      }
    }
    if (best) return best;
  }
  return null;
}

// ============================================================================
// Commodity-scoped price context
// ============================================================================

export interface CommodityPriceContext {
  requestedCommodity: string;
  canonicalCommodity: string | null;
  commodityKey: string;
  /** marketKey -> observed record for this commodity. */
  observedByMarket: Map<string, LiveRecord>;
  /** qualifier key (e.g. "chakan") -> observed record, for parenthetical mandi names. */
  observedByQualifier: Map<string, LiveRecord>;
  /** districtKey -> { mean price, mean index, observation count, source market names }. */
  districtStats: Map<string, { meanPrice: number; meanIndex: number; count: number; markets: string[]; latestDate: string }>;
  /** division -> same aggregate. */
  divisionStats: Map<string, { meanPrice: number; meanIndex: number; count: number; markets: string[]; latestDate: string }>;
  stateMean: number | null;
  stateMeanIndex: number;
  stateCount: number;
  stateMarkets: string[];
  stateLatestDate: string | null;
  /** districtKey -> % of that district's reporting mandis that reported this commodity. */
  reportingDensityByDistrict: Map<string, number>;
  stateReportingDensityPct: number;
  benchmarkAvg: number | null;
}

const contextCache = new Map<string, CommodityPriceContext>();

export function getCommodityPriceContext(commodity: string, forceReload: boolean = false): CommodityPriceContext {
  const cacheKey = normalizeCommodityKey(commodity);
  if (!forceReload && contextCache.has(cacheKey)) return contextCache.get(cacheKey)!;

  const uni = getPriceUniverse(forceReload);
  const canonical = resolveCanonicalCommodity(commodity);
  const commodityKey = canonical ? normalizeCommodityKey(canonical) : cacheKey;

  const observedByMarket = new Map<string, LiveRecord>();
  const observedByQualifier = new Map<string, LiveRecord>();
  const districtAgg = new Map<string, { priceSum: number; indexSum: number; count: number; markets: string[]; latestDate: string }>();
  const divisionAgg = new Map<string, { priceSum: number; indexSum: number; count: number; markets: string[]; latestDate: string }>();

  let statePriceSum = 0;
  let stateIndexSum = 0;
  let stateCount = 0;
  const stateMarkets: string[] = [];
  let stateLatestDate: string | null = null;

  for (const r of uni.records) {
    if (normalizeCommodityKey(r.commodity) !== commodityKey) continue;

    const mKey = normalizeMarketKey(r.market);
    if (!observedByMarket.has(mKey)) observedByMarket.set(mKey, r);
    const qualifier = extractMarketQualifier(r.market);
    if (qualifier && !observedByQualifier.has(qualifier)) observedByQualifier.set(qualifier, r);

    const idx = uni.marketPriceIndex.get(mKey) ?? 1.0;
    const dKey = normalizeDistrictKey(r.district);
    const division = uni.districtDivision.get(dKey) || 'Unknown';

    const dAgg = districtAgg.get(dKey) || { priceSum: 0, indexSum: 0, count: 0, markets: [], latestDate: '' };
    dAgg.priceSum += r.modalPrice;
    dAgg.indexSum += idx;
    dAgg.count += 1;
    dAgg.markets.push(r.market);
    if (r.arrivalDate > dAgg.latestDate) dAgg.latestDate = r.arrivalDate;
    districtAgg.set(dKey, dAgg);

    const vAgg = divisionAgg.get(division) || { priceSum: 0, indexSum: 0, count: 0, markets: [], latestDate: '' };
    vAgg.priceSum += r.modalPrice;
    vAgg.indexSum += idx;
    vAgg.count += 1;
    vAgg.markets.push(r.market);
    if (r.arrivalDate > vAgg.latestDate) vAgg.latestDate = r.arrivalDate;
    divisionAgg.set(division, vAgg);

    statePriceSum += r.modalPrice;
    stateIndexSum += idx;
    stateCount += 1;
    stateMarkets.push(r.market);
    if (!stateLatestDate || r.arrivalDate > stateLatestDate) stateLatestDate = r.arrivalDate;
  }

  const districtStats = new Map<string, { meanPrice: number; meanIndex: number; count: number; markets: string[]; latestDate: string }>();
  for (const [k, v] of districtAgg.entries()) {
    districtStats.set(k, {
      meanPrice: v.priceSum / v.count,
      meanIndex: v.indexSum / v.count,
      count: v.count,
      markets: v.markets,
      latestDate: v.latestDate
    });
  }
  const divisionStats = new Map<string, { meanPrice: number; meanIndex: number; count: number; markets: string[]; latestDate: string }>();
  for (const [k, v] of divisionAgg.entries()) {
    divisionStats.set(k, {
      meanPrice: v.priceSum / v.count,
      meanIndex: v.indexSum / v.count,
      count: v.count,
      markets: v.markets,
      latestDate: v.latestDate
    });
  }

  // Reporting density = share of a district's actively reporting mandis that reported this crop.
  const districtAllMarkets = new Map<string, Set<string>>();
  const districtCommodityMarkets = new Map<string, Set<string>>();
  for (const r of uni.records) {
    const dKey = normalizeDistrictKey(r.district);
    const mKey = normalizeMarketKey(r.market);
    if (!districtAllMarkets.has(dKey)) districtAllMarkets.set(dKey, new Set());
    districtAllMarkets.get(dKey)!.add(mKey);
    if (normalizeCommodityKey(r.commodity) === commodityKey) {
      if (!districtCommodityMarkets.has(dKey)) districtCommodityMarkets.set(dKey, new Set());
      districtCommodityMarkets.get(dKey)!.add(mKey);
    }
  }
  const reportingDensityByDistrict = new Map<string, number>();
  for (const [dKey, all] of districtAllMarkets.entries()) {
    const withCommodity = districtCommodityMarkets.get(dKey)?.size || 0;
    reportingDensityByDistrict.set(dKey, all.size > 0 ? Math.round((withCommodity / all.size) * 1000) / 10 : 0);
  }
  const allMarketsCount = new Set(uni.records.map(r => normalizeMarketKey(r.market))).size;
  const commodityMarketsCount = observedByMarket.size;
  const stateReportingDensityPct = allMarketsCount > 0
    ? Math.round((commodityMarketsCount / allMarketsCount) * 1000) / 10
    : 0;

  const benchmark = uni.benchmarkByCommodity.get(commodityKey);

  const ctx: CommodityPriceContext = {
    requestedCommodity: commodity,
    canonicalCommodity: canonical,
    commodityKey,
    observedByMarket,
    observedByQualifier,
    districtStats,
    divisionStats,
    stateMean: stateCount > 0 ? statePriceSum / stateCount : (benchmark ? benchmark.avg : null),
    stateMeanIndex: stateCount > 0 ? stateIndexSum / stateCount : 1.0,
    stateCount,
    stateMarkets,
    stateLatestDate,
    reportingDensityByDistrict,
    stateReportingDensityPct,
    benchmarkAvg: benchmark ? benchmark.avg : null
  };

  contextCache.set(cacheKey, ctx);
  return ctx;
}

/** Clears memoised price data. Used by tests and by the data-refresh path. */
export function resetPriceCaches(): void {
  universeCache = null;
  contextCache.clear();
}

// ============================================================================
// Resolution
// ============================================================================

function daysBetween(fromIso: string | null | undefined, reference: Date): number {
  if (!fromIso) return 999;
  const d = new Date(`${fromIso}T00:00:00Z`);
  if (isNaN(d.getTime())) return 999;
  const refUtc = Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate());
  return Math.max(0, Math.round((refUtc - d.getTime()) / 86400000));
}

/**
 * Resolves a defensible modal price for a market/commodity pair, walking the resolution ladder.
 * Returns `provenance: 'UNAVAILABLE'` only when the commodity has no observation in the entire
 * Maharashtra feed — the single case where dropping the mandi is honest.
 */
export function resolveMarketPrice(
  ctx: CommodityPriceContext,
  market: Market,
  referenceDate: Date = new Date()
): ResolvedPrice {
  const uni = getPriceUniverse();
  const mKey = normalizeMarketKey(market.name);
  const qualifier = extractMarketQualifier(market.name);
  const dKey = normalizeDistrictKey(market.district);
  const division = uni.districtDivision.get(dKey) || 'Unknown';
  const marketIndex = uni.marketPriceIndex.get(mKey) ?? 1.0;
  const districtDensity = ctx.reportingDensityByDistrict.get(dKey) ?? ctx.stateReportingDensityPct;

  // --- 1. Direct observation for this exact mandi ---
  const direct = ctx.observedByMarket.get(mKey)
    || (qualifier ? ctx.observedByQualifier.get(qualifier) : undefined);
  if (direct) {
    return {
      modalPrice: Math.round(direct.modalPrice * 10) / 10,
      provenance: 'AGMARKNET_MARKET_OBSERVED',
      observationCount: 1,
      sourceMarkets: [direct.market],
      daysSinceLastReport: daysBetween(direct.arrivalDate, referenceDate),
      reportingDensityPct: districtDensity,
      marketPriceIndex: marketIndex,
      note: `Directly observed Agmarknet modal price at ${direct.market} on ${direct.arrivalDate}.`
    };
  }

  // --- 3. District peer calibration ---
  const dStats = ctx.districtStats.get(dKey);
  if (dStats && dStats.count > 0 && dStats.meanIndex > 0) {
    const calibrated = dStats.meanPrice * (marketIndex / dStats.meanIndex);
    return {
      modalPrice: Math.round(calibrated * 10) / 10,
      provenance: 'DISTRICT_PEER_CALIBRATED',
      observationCount: dStats.count,
      sourceMarkets: Array.from(new Set(dStats.markets)).slice(0, 6),
      daysSinceLastReport: daysBetween(dStats.latestDate, referenceDate),
      reportingDensityPct: districtDensity,
      marketPriceIndex: marketIndex,
      note: `Calibrated from ${dStats.count} Agmarknet observation(s) in ${market.district} district, scaled by this mandi's measured price index (${marketIndex.toFixed(3)}).`
    };
  }

  // --- 4. Division peer calibration ---
  const vStats = ctx.divisionStats.get(division);
  if (vStats && vStats.count > 0 && vStats.meanIndex > 0) {
    const calibrated = vStats.meanPrice * (marketIndex / vStats.meanIndex);
    return {
      modalPrice: Math.round(calibrated * 10) / 10,
      provenance: 'DIVISION_PEER_CALIBRATED',
      observationCount: vStats.count,
      sourceMarkets: Array.from(new Set(vStats.markets)).slice(0, 6),
      daysSinceLastReport: daysBetween(vStats.latestDate, referenceDate),
      reportingDensityPct: districtDensity,
      marketPriceIndex: marketIndex,
      note: `Calibrated from ${vStats.count} Agmarknet observation(s) across the ${division} division, scaled by this mandi's measured price index (${marketIndex.toFixed(3)}).`
    };
  }

  // --- 5. State benchmark calibration ---
  if (ctx.stateMean && ctx.stateMean > 0) {
    const meanIndex = ctx.stateMeanIndex > 0 ? ctx.stateMeanIndex : 1.0;
    const calibrated = ctx.stateMean * (marketIndex / meanIndex);
    return {
      modalPrice: Math.round(calibrated * 10) / 10,
      provenance: 'STATE_BENCHMARK_CALIBRATED',
      observationCount: ctx.stateCount || 0,
      sourceMarkets: Array.from(new Set(ctx.stateMarkets)).slice(0, 6),
      daysSinceLastReport: daysBetween(ctx.stateLatestDate, referenceDate),
      reportingDensityPct: ctx.stateReportingDensityPct,
      marketPriceIndex: marketIndex,
      note: `Calibrated from the Maharashtra-wide mean of ${ctx.stateCount || 0} Agmarknet observation(s), scaled by this mandi's measured price index (${marketIndex.toFixed(3)}).`
    };
  }

  // --- 6. Genuinely unavailable ---
  return {
    modalPrice: 0,
    provenance: 'UNAVAILABLE',
    observationCount: 0,
    sourceMarkets: [],
    daysSinceLastReport: 999,
    reportingDensityPct: 0,
    marketPriceIndex: marketIndex,
    note: `No Agmarknet observation for ${ctx.requestedCommodity} anywhere in Maharashtra. MandiMitra abstains rather than invent a price.`
  };
}

// ============================================================================
// Provenance-aware data quality
// ============================================================================

export interface HistoryEvidence {
  daysSinceLastReport: number;
  reportingDaysCountInLast30Days: number;
}

/**
 * Maps a price resolution (plus any real historical series evidence) to a data-quality tier.
 *
 * The live Agmarknet pull is a single-day snapshot, so a genuine 30-day coverage figure only
 * exists where `data/historical/*.csv` provides one. Rather than fabricate coverage, the tier is
 * decided by (a) real recency and (b) the provenance ceiling, and the assessment records which
 * evidence was used via `coverageSource`.
 *
 * Provenance ceilings:
 *   - Directly observed / historical series  -> may reach GOOD
 *   - Any peer-calibrated price              -> capped at MODERATE (eligible, never "GOOD")
 *   - Unavailable                            -> POOR (ineligible)
 */
export function assessDataQualityFromProvenance(
  resolved: ResolvedPrice,
  history: HistoryEvidence | null
): DataQualityAssessment {
  // A real multi-day series always wins: use the frozen coverage rule verbatim.
  if (history) {
    const coverage30d = Math.min(100, Math.max(0, (history.reportingDaysCountInLast30Days / 30) * 100));
    let tier: DataQualityTier = 'POOR';
    if (history.daysSinceLastReport <= 2 && coverage30d >= 70) tier = 'GOOD';
    else if (history.daysSinceLastReport <= 5 && coverage30d >= 40) tier = 'MODERATE';
    return {
      tier,
      daysSinceLastReport: history.daysSinceLastReport,
      coverage30d: Math.round(coverage30d * 10) / 10,
      missingDays: Math.max(0, 30 - history.reportingDaysCountInLast30Days),
      isEligibleForRecommendation: tier !== 'POOR',
      priceProvenance: resolved.provenance === 'UNAVAILABLE' ? 'HISTORICAL_SERIES_OBSERVED' : resolved.provenance,
      coverageSource: 'historical-series',
      observationCount: Math.max(resolved.observationCount, history.reportingDaysCountInLast30Days),
      provenanceNote: resolved.note
    };
  }

  const days = resolved.daysSinceLastReport;
  let tier: DataQualityTier;

  if (resolved.provenance === 'UNAVAILABLE') {
    tier = 'POOR';
  } else if (resolved.provenance === 'AGMARKNET_MARKET_OBSERVED' || resolved.provenance === 'HISTORICAL_SERIES_OBSERVED') {
    tier = days <= 2 ? 'GOOD' : days <= 5 ? 'MODERATE' : 'POOR';
  } else {
    // Peer-calibrated: never GOOD. Needs at least one real, fresh backing observation.
    // A thin sample is still real evidence — it is graded MODERATE (so the decision policy caps
    // confidence at MEDIUM) rather than discarded, which would manufacture a false abstention.
    tier = (resolved.observationCount >= 1 && days <= 5) ? 'MODERATE' : 'POOR';
  }

  return {
    tier,
    daysSinceLastReport: days === 999 ? 30 : days,
    coverage30d: resolved.reportingDensityPct,
    missingDays: Math.max(0, 30 - Math.round((resolved.reportingDensityPct / 100) * 30)),
    isEligibleForRecommendation: tier !== 'POOR',
    priceProvenance: resolved.provenance,
    coverageSource: resolved.provenance === 'AGMARKNET_MARKET_OBSERVED' ? 'live-snapshot-recency' : 'peer-calibrated',
    observationCount: resolved.observationCount,
    provenanceNote: resolved.note
  };
}

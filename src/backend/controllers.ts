/**
 * MandiMitra Backend: REST Controller Layer
 * Implements endpoints conforming strictly to /src/contracts/api.ts.
 * 
 * OWNER: Amay (Team Lead)
 */

import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { 
  EvaluateRequestBody, 
  EvaluateResponse, 
  NearbyMarketsResponse, 
  LivePriceResponse, 
  BacktestResponse,
  StressTestRequestBody,
  StressTestResponse,
  BhedVivekRequestBody
} from '../contracts/api';
import { Market, MarketEvaluation, BacktestResult } from '../contracts/domain';
import { getAllMarkets } from '../data-pipeline/registry';
import { estimateRoadDistanceKm } from '../core/distance';
import { generateForecast } from '../core/forecast';
import { calculateNetRealisationForMarket } from '../core/net-realisation';
import { evaluateDecisionPolicy } from '../core/decision';
import { formatExplanationSummary } from '../core/explain';
import { evaluateNirnayKawach } from '../core/nirnay-kawach';
import { evaluateBhedVivek } from '../core/bhed-vivek';
import { fetchLiveMandiPrice } from './agmarknet-client';
import {
  getCommodityPriceContext,
  getPriceUniverse,
  resolveMarketPrice,
  assessDataQualityFromProvenance,
  CommodityPriceContext
} from './price-resolver';
import { config } from '../config';

export async function getNearbyMarketsController(req: Request, res: Response): Promise<void> {
  const lat = parseFloat(req.query.lat as string) || 19.9975;
  const lon = parseFloat(req.query.lon as string) || 73.7898;
  const radiusKm = parseFloat(req.query.radiusKm as string) || config.maxSearchRadiusKm;

  const markets = getAllMarkets().map(m => ({
    ...m,
    estimatedRoadDistanceKm: Math.round(estimateRoadDistanceKm(lat, lon, m.lat, m.lon) * 10) / 10
  })).filter(m => (m.estimatedRoadDistanceKm || 0) <= radiusKm);

  markets.sort((a, b) => (a.estimatedRoadDistanceKm || 0) - (b.estimatedRoadDistanceKm || 0));

  const response: NearbyMarketsResponse = {
    markets,
    radiusKm,
    count: markets.length
  };

  res.json(response);
}

export async function getLivePriceController(req: Request, res: Response): Promise<void> {
  const marketId = (req.query.marketId as string) || 'lasalgaon';
  const commodity = (req.query.commodity as string) || 'Onion';

  try {
    const { observation, isStale } = await fetchLiveMandiPrice(marketId, commodity);
    const response: LivePriceResponse = {
      priceObservation: observation,
      isStale,
      sourceNote: isStale ? 'Cached/Fallback price' : 'Live data.gov.in Agmarknet feed'
    };
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: { code: 'UPSTREAM_FAILURE', message: String(err) } });
  }
}

interface MarketHistoryData {
  trailing7Prices: number[];
  daysSinceLastReport: number;
  reportingDaysCountInLast30Days: number;
  latestPrice: number | null;
}

/**
 * Reads actual historical price series from disk to compute genuine
 * reporting gaps, coverage, and trailing observations without any synthetic manufacturing.
 */
function getMarketHistoryFromCsv(
  commodity: string,
  marketName: string,
  referenceDate: Date = new Date('2026-09-03')
): MarketHistoryData | null {
  try {
    const histDir = path.resolve(process.cwd(), 'data', 'historical');
    if (!fs.existsSync(histDir)) return null;

    const commLower = commodity.toLowerCase();
    const mLower = marketName.toLowerCase();

    const files = fs.readdirSync(histDir).filter(f => f.endsWith('.csv'));
    const matchedFile = files.find(f => {
      const fLower = f.toLowerCase();
      const commMatch = (commLower.includes('onion') && fLower.includes('onion')) ||
                        (commLower.includes('tomato') && fLower.includes('tomato')) ||
                        (commLower.includes('soya') && fLower.includes('soya'));
      const mMatch = (mLower.includes('lasalgaon') && fLower.includes('lasalgaon')) ||
                     (mLower.includes('pimpalgaon') && fLower.includes('pimpalgaon')) ||
                     (mLower.includes('manmad') && fLower.includes('manmad')) ||
                     ((mLower.includes('narayangaon') || mLower.includes('junnar') || mLower.includes('pune')) && fLower.includes('narayangaon')) ||
                     (mLower.includes('latur') && fLower.includes('latur'));
      return commMatch && mMatch;
    });

    if (!matchedFile) return null;

    const content = fs.readFileSync(path.join(histDir, matchedFile), 'utf-8');
    const lines = content.trim().split('\n');
    if (lines.length <= 1) return null;

    const headers = lines[0].split(',').map(h => h.trim());
    const dateIdx = headers.indexOf('date');
    const modalIdx = headers.indexOf('modal_price');
    if (dateIdx === -1 || modalIdx === -1) return null;

    const records: { date: string; modalPrice: number }[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length > Math.max(dateIdx, modalIdx)) {
        const dStr = parts[dateIdx].trim();
        const price = parseFloat(parts[modalIdx].trim());
        if (dStr && !isNaN(price)) {
          records.push({ date: dStr, modalPrice: price });
        }
      }
    }

    if (records.length === 0) return null;

    const lastRec = records[records.length - 1];
    const lastDate = new Date(lastRec.date);
    const msDiff = referenceDate.getTime() - lastDate.getTime();
    const daysSince = Math.max(0, Math.round(msDiff / (1000 * 60 * 60 * 24)));

    const thirtyDaysAgo = new Date(referenceDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const count30d = records.filter(r => new Date(r.date) >= thirtyDaysAgo && new Date(r.date) <= referenceDate).length;

    const trailing7 = records.slice(-7).map(r => r.modalPrice);

    return {
      trailing7Prices: trailing7,
      daysSinceLastReport: daysSince,
      reportingDaysCountInLast30Days: count30d,
      latestPrice: lastRec.modalPrice
    };
  } catch (err) {
    return null;
  }
}

/**
 * Loads origin-calibrated road distances from the pre-computed OSRM / road-winding matrix.
 * Falls back to geodesic Haversine × roadDistanceFactor for mandis outside the matrix.
 */
function loadOriginDistanceMap(userLat: number, userLon: number): Map<string, number> {
  const distanceMap = new Map<string, number>();

  try {
    const distPath = path.resolve(process.cwd(), 'data', 'distance_matrix_all.json');
    if (!fs.existsSync(distPath)) return distanceMap;

    const dData = JSON.parse(fs.readFileSync(distPath, 'utf-8'));
    let closestOrigin: string | null = null;
    let minOriginDistSq = Infinity;
    for (const r of dData) {
      if (r.origin_coords && Array.isArray(r.origin_coords)) {
        const dSq = Math.pow(r.origin_coords[0] - userLat, 2) + Math.pow(r.origin_coords[1] - userLon, 2);
        if (dSq < minOriginDistSq) {
          minOriginDistSq = dSq;
          closestOrigin = r.origin_district;
        }
      }
    }
    if (!closestOrigin) return distanceMap;

    for (const r of dData) {
      if (r.origin_district === closestOrigin && typeof r.distance_km === 'number') {
        if (r.destination_mandi_id) distanceMap.set(String(r.destination_mandi_id), r.distance_km);
        if (r.destination_mandi) distanceMap.set(String(r.destination_mandi).toLowerCase(), r.distance_km);
      }
    }
  } catch (err) {
    console.warn('[MandiMitra] Could not read distance matrix:', err);
  }

  return distanceMap;
}

/**
 * Reference date for recency maths: the latest arrival date actually present in the
 * Agmarknet feed, so "days since last report" is measured against real data, not the wall clock.
 */
function getFeedReferenceDate(): Date {
  const feedDate = getPriceUniverse().feedDate;
  if (feedDate) {
    const d = new Date(`${feedDate}T00:00:00Z`);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

/**
 * Builds canonical market evaluations using honest data sources:
 * - Modal price is resolved through the provenance ladder in price-resolver.ts. A mandi is only
 *   dropped when the commodity has NO observation anywhere in Maharashtra.
 * - Data quality is computed from real reporting dates and the price provenance tier.
 * - Trailing prices come from the real historical series when one exists; otherwise the series is
 *   held flat so the forecast slope is honestly zero rather than manufactured.
 */
function buildCandidateEvaluations(
  candidateMarkets: Market[],
  commodity: string,
  transportCost: number,
  storageCost: number,
  ctx: CommodityPriceContext
): MarketEvaluation[] {
  const evaluations: MarketEvaluation[] = [];
  const referenceDate = getFeedReferenceDate();

  for (const market of candidateMarkets) {
    const history = getMarketHistoryFromCsv(commodity, market.name, referenceDate);
    const resolved = resolveMarketPrice(ctx, market, referenceDate);

    // Prefer a directly observed price; a real historical series is used when the feed is silent.
    // `effectiveResolution` records where the price ACTUALLY came from, so the data-quality
    // assessment never mislabels a historical-series price as peer-calibrated (or vice versa).
    let basePrice: number | null = null;
    let effectiveResolution = resolved;

    if (resolved.provenance === 'AGMARKNET_MARKET_OBSERVED') {
      basePrice = resolved.modalPrice;
    } else if (history && history.latestPrice) {
      basePrice = history.latestPrice;
      effectiveResolution = {
        ...resolved,
        modalPrice: history.latestPrice,
        provenance: 'HISTORICAL_SERIES_OBSERVED',
        observationCount: history.reportingDaysCountInLast30Days,
        daysSinceLastReport: history.daysSinceLastReport,
        note: `Latest modal price from the ${market.name} historical series (${history.reportingDaysCountInLast30Days} reporting days in the last 30).`
      };
    } else if (resolved.provenance !== 'UNAVAILABLE' && resolved.modalPrice > 0) {
      basePrice = resolved.modalPrice;
    }

    const quality = assessDataQualityFromProvenance(effectiveResolution, history ? {
      daysSinceLastReport: history.daysSinceLastReport,
      reportingDaysCountInLast30Days: history.reportingDaysCountInLast30Days
    } : null);

    // The ONLY honest reason to drop a mandi: no verifiable price exists for this commodity.
    if (!basePrice || basePrice <= 0) {
      continue;
    }

    // Real trailing series where available; otherwise a flat series (slope = 0, no invented drift).
    const trailingPrices = (history && history.trailing7Prices.length >= 2)
      ? history.trailing7Prices
      : new Array(7).fill(basePrice);

    const forecast = generateForecast(trailingPrices, basePrice);
    const netRealisationByDay = calculateNetRealisationForMarket(market, forecast, transportCost, storageCost);

    evaluations.push({
      market,
      dataQuality: quality,
      forecast,
      netRealisationByDay
    });
  }

  return evaluations;
}

/**
 * Shared candidate-resolution pipeline used by /api/evaluate, /api/evaluate/stress-test and
 * /api/bhed-vivek/analyze so all three endpoints see an identical candidate universe.
 */
export interface EvaluationContext {
  commodity: string;
  candidateMarkets: Market[];
  evaluations: MarketEvaluation[];
  priceContext: CommodityPriceContext;
  searchRadiusKm: number;
}

export function resolveEvaluationContext(params: {
  commodity: string;
  latitude: number;
  longitude: number;
  transportCost: number;
  storageCost: number;
  searchRadiusKm: number;
}): EvaluationContext {
  const { commodity, latitude, longitude, transportCost, storageCost, searchRadiusKm } = params;
  const priceContext = getCommodityPriceContext(commodity);
  const distanceMap = loadOriginDistanceMap(latitude, longitude);

  const candidateMarkets: Market[] = getAllMarkets().map(m => {
    const realDist = distanceMap.get(m.id) ?? distanceMap.get(m.name.toLowerCase());
    const roadDist = realDist !== undefined
      ? realDist
      : Math.round(estimateRoadDistanceKm(latitude, longitude, m.lat, m.lon) * 10) / 10;
    return { ...m, estimatedRoadDistanceKm: roadDist };
  }).filter(m => (m.estimatedRoadDistanceKm || 0) <= searchRadiusKm);

  candidateMarkets.sort((a, b) => (a.estimatedRoadDistanceKm || 0) - (b.estimatedRoadDistanceKm || 0));

  const evaluations = buildCandidateEvaluations(candidateMarkets, commodity, transportCost, storageCost, priceContext);

  return { commodity, candidateMarkets, evaluations, priceContext, searchRadiusKm };
}

export async function evaluateController(req: Request, res: Response): Promise<void> {
  const body = req.body as EvaluateRequestBody;
  const commodity = body.commodity || 'Onion';
  const userLat = body.latitude || 19.9975;
  const userLon = body.longitude || 73.7898;
  const transportCost = body.transportCostPerKmPerQtl ?? config.defaultTransportCostPerKmPerQtl;
  const storageCost = body.storageCostPerDayPerQtl ?? config.defaultStorageCostPerDayPerQtl;
  const searchRadius = body.radiusKm ?? config.maxSearchRadiusKm;

  // 1-2. Resolve candidate mandis within radius and build honest evaluations for each
  const { evaluations } = resolveEvaluationContext({
    commodity,
    latitude: userLat,
    longitude: userLon,
    transportCost,
    storageCost,
    searchRadiusKm: searchRadius
  });

  // 3. Evaluate Decision Policy
  const rawRecommendation = evaluateDecisionPolicy(evaluations);
  const formattedReasons = formatExplanationSummary(rawRecommendation, evaluations);

  const finalRecommendation = {
    ...rawRecommendation,
    reasons: formattedReasons
  };

  // 4. Nirnay Kawach (Decision Shield) Stress-Testing Engine
  const nirnayKawach = evaluateNirnayKawach(
    evaluations,
    commodity,
    transportCost,
    storageCost,
    500
  );

  // 5. Bhed Vivek (Market Congestion Intelligence)
  const bhedVivek = evaluateBhedVivek(
    evaluations,
    commodity,
    25,
    'HIGH'
  );

  const response: EvaluateResponse = {
    recommendation: finalRecommendation,
    evaluations,
    commodity,
    evaluatedAt: new Date().toISOString(),
    modelVersion: config.enableV1Gbm ? 'v1-gbm' : 'v0-heuristic',
    userParameters: {
      transportCostPerKmPerQtl: transportCost,
      storageCostPerDayPerQtl: storageCost,
      radiusKm: searchRadius
    },
    nirnayKawach,
    bhedVivek
  };

  res.json(response);
}

export async function stressTestController(req: Request, res: Response): Promise<void> {
  const body = req.body as StressTestRequestBody;
  const commodity = body.commodity || 'Onion';
  const userLat = body.latitude || 19.9975;
  const userLon = body.longitude || 73.7898;
  const sliderTransportCost = body.transportCostPerKmPerQtl ?? config.defaultTransportCostPerKmPerQtl;
  const storageCost = body.storageCostPerDayPerQtl ?? config.defaultStorageCostPerDayPerQtl;
  const searchRadius = body.radiusKm ?? config.maxSearchRadiusKm;

  // Resolve candidate markets within radius at the active slider transport rate
  const { evaluations } = resolveEvaluationContext({
    commodity,
    latitude: userLat,
    longitude: userLon,
    transportCost: sliderTransportCost,
    storageCost,
    searchRadiusKm: searchRadius
  });

  // Run Nirnay Kawach stress test with active slider transport cost
  const kawach = evaluateNirnayKawach(
    evaluations,
    commodity,
    sliderTransportCost,
    storageCost,
    300
  );

  // Baseline winner comparison (at default transport cost)
  const defaultEvaluations = resolveEvaluationContext({
    commodity,
    latitude: userLat,
    longitude: userLon,
    transportCost: config.defaultTransportCostPerKmPerQtl,
    storageCost,
    searchRadiusKm: searchRadius
  }).evaluations
    .filter(ev => ev.dataQuality.isEligibleForRecommendation)
    .flatMap(ev => ev.netRealisationByDay);
  defaultEvaluations.sort((a, b) => b.netRealisation - a.netRealisation);
  const originalWinnerId = defaultEvaluations[0]?.market.id;

  // The candidate set was already re-evaluated AT the slider rate, so the highest net realisation
  // among recommendation-eligible options IS the winner under that rate. Do not substitute the
  // runner-up: that would report a market the maths has just ruled out.
  const eligibleIds = new Set(
    evaluations.filter(ev => ev.dataQuality.isEligibleForRecommendation).map(ev => ev.market.id)
  );
  const flatEvaluations = evaluations.flatMap(ev =>
    ev.netRealisationByDay.map(nr => ({
      marketId: ev.market.id,
      marketName: ev.market.name,
      day: nr.day,
      netRealisation: nr.netRealisation
    }))
  );
  flatEvaluations.sort((a, b) => b.netRealisation - a.netRealisation);

  const bestEligible = flatEvaluations.find(e => eligibleIds.has(e.marketId));
  const winningOption = bestEligible
    ? {
        id: bestEligible.marketId,
        name: bestEligible.marketName,
        day: bestEligible.day,
        expectedNetRealisation: bestEligible.netRealisation
      }
    : kawach.winningMarket;

  const isFlipped = Boolean(originalWinnerId) && winningOption.id !== originalWinnerId;

  const response: StressTestResponse = {
    activeTransportRate: sliderTransportCost,
    winningMarket: winningOption,
    isFlipped,
    flippedFromOriginal: isFlipped,
    breakevenTransportRate: kawach.breakevenTransportRate,
    status: isFlipped ? 'CLOSE_CALL' : kawach.status,
    statusLabel: isFlipped ? 'FLIPPED TO ALTERNATIVE' : kawach.statusLabel,
    allEvaluations: flatEvaluations
  };

  res.json(response);
}

export async function bhedVivekAnalyzeController(req: Request, res: Response): Promise<void> {
  const body = req.body as BhedVivekRequestBody;
  const commodity = body.commodity || 'Onion';
  const userLat = body.latitude || 19.9975;
  const userLon = body.longitude || 73.7898;
  const quantity = body.quantityQuintals || 25;
  const supplyPressure = body.supplyPressure || 'HIGH';
  const transportCost = body.transportCostPerKmPerQtl ?? config.defaultTransportCostPerKmPerQtl;
  const storageCost = body.storageCostPerDayPerQtl ?? config.defaultStorageCostPerDayPerQtl;
  const searchRadius = body.radiusKm ?? config.maxSearchRadiusKm;

  // Build candidate evaluations through the shared honest-data pipeline
  const { evaluations } = resolveEvaluationContext({
    commodity,
    latitude: userLat,
    longitude: userLon,
    transportCost,
    storageCost,
    searchRadiusKm: searchRadius
  });

  const result = evaluateBhedVivek(evaluations, commodity, quantity, supplyPressure);
  res.json(result);
}

/**
 * Reads the real historical series for a commodity/mandi pair and returns the mean modal price
 * over the last `windowDays` observations, plus how many of those calendar days actually reported.
 * This is what makes `baselineNetRealisation` a measured figure rather than a constant.
 */
function summariseHeldOutWindow(
  csvFileName: string,
  windowDays: number
): { meanModalPrice: number; observedDays: number; coveragePct: number; start: string; end: string } | null {
  try {
    const filePath = path.resolve(process.cwd(), 'data', 'historical', csvFileName);
    if (!fs.existsSync(filePath)) return null;

    const lines = fs.readFileSync(filePath, 'utf-8').trim().split('\n');
    if (lines.length <= 1) return null;

    const headers = lines[0].split(',').map(h => h.trim());
    const dateIdx = headers.indexOf('date');
    const modalIdx = headers.indexOf('modal_price');
    if (dateIdx === -1 || modalIdx === -1) return null;

    const records: { date: string; modalPrice: number }[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length <= Math.max(dateIdx, modalIdx)) continue;
      const d = parts[dateIdx].trim();
      const p = parseFloat(parts[modalIdx].trim());
      if (d && Number.isFinite(p)) records.push({ date: d, modalPrice: p });
    }
    if (records.length === 0) return null;

    const window = records.slice(-Math.max(1, windowDays));
    const meanModalPrice = window.reduce((a, r) => a + r.modalPrice, 0) / window.length;

    const start = window[0].date;
    const end = window[window.length - 1].date;
    const spanDays = Math.max(
      1,
      Math.round((new Date(`${end}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime()) / 86400000) + 1
    );

    return {
      meanModalPrice: Math.round(meanModalPrice * 10) / 10,
      observedDays: window.length,
      coveragePct: Math.round(Math.min(100, (window.length / spanDays) * 100) * 10) / 10,
      start,
      end
    };
  } catch {
    return null;
  }
}

/** Maps a requested commodity onto the backtested series that exists on disk. */
function resolveBacktestSeries(commodity: string): { key: string; csv: string } | null {
  const c = commodity.toLowerCase();
  if (c.includes('onion')) return { key: 'onion_lasalgaon', csv: 'onion_lasalgaon_2026.csv' };
  if (c.includes('tomato')) return { key: 'tomato_narayangaon', csv: 'tomato_narayangaon_2026.csv' };
  if (c.includes('soya')) return { key: 'soyabean_latur', csv: 'soyabean_latur_2026.csv' };
  return null;
}

export async function getBacktestController(req: Request, res: Response): Promise<void> {
  const commodity = (req.query.commodity as string) || 'Onion';

  let backtestData: any = null;
  try {
    const backtestPath = path.resolve(process.cwd(), 'models', 'backtest_results.json');
    if (fs.existsSync(backtestPath)) {
      backtestData = JSON.parse(fs.readFileSync(backtestPath, 'utf-8'));
    }
  } catch (err) {
    console.warn('[MandiMitra] Could not read models/backtest_results.json:', err);
  }

  const series = resolveBacktestSeries(commodity);
  const item = (backtestData?.executive_numbers && series)
    ? backtestData.executive_numbers[series.key]
    : null;

  // ZERO-MOCK: without the walk-forward artifacts there is nothing honest to report.
  if (!item || !series) {
    res.status(503).json({
      error: {
        code: 'UPSTREAM_FAILURE',
        message: series
          ? 'Walk-forward backtest artifacts (models/backtest_results.json) are unavailable. MandiMitra reports no backtest rather than a placeholder figure.'
          : `No walk-forward backtest series has been trained for "${commodity}". Backtested series: Onion (Lasalgaon), Tomato (Junnar/Narayangaon), Soyabean (Latur).`
      }
    });
    return;
  }

  const evaluatedDays = Number(item.held_out_test_days) || 0;
  const netGain = Number(item.avg_net_rupee_gain_per_quintal) || 0;
  const window = summariseHeldOutWindow(series.csv, evaluatedDays);

  // Baseline = the naive "sell on harvest day at spot" strategy, i.e. the mean observed modal
  // price across the held-out window. Measured from the real series, never assumed.
  const baselineNetRealisation = window ? window.meanModalPrice : 0;

  const result: BacktestResult = {
    commodity: String(item.commodity || commodity),
    modelVersion: config.enableV1Gbm ? 'v1-gbm' : 'v0-heuristic',
    evaluatedDays,
    avgNetRealisation: Math.round((baselineNetRealisation + netGain) * 10) / 10,
    baselineNetRealisation,
    netGainVsBaseline: netGain,
    directionalAccuracy: Number(item.model_accuracy_pct) || 0,
    coverage: window ? window.coveragePct : 0,
    evaluatedPeriod: {
      start: window ? window.start : '',
      end: window ? window.end : ''
    },
    mandi: item.mandi ? String(item.mandi) : undefined,
    persistenceBaselineAccuracy: Number(item.persistence_baseline_accuracy_pct) || undefined,
    accuracyEdgePts: Number(item.accuracy_edge_over_persistence_pts) || undefined,
    waitRecommendations: Number(item.total_wait_recommendations) || undefined,
    profitableWaitRatePct: Number(item.profitable_wait_rate_pct) || undefined,
    topPredictiveFeatures: Array.isArray(item.top_predictive_features)
      ? item.top_predictive_features.map((f: any) => ({
          feature: String(f.feature),
          importancePct: Number(f.importance_pct) || 0
        }))
      : undefined
  };

  const response: BacktestResponse = {
    result,
    citationNotice: `${backtestData.evaluation_methodology || 'Walk-Forward Temporal Backtest'} — ${backtestData.executive_numbers.total_held_out_days_evaluated} held-out market days across three commodity-mandi series. Baseline modal prices measured from data/historical/${series.csv}.`
  };

  res.json(response);
}

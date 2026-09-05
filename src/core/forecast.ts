/**
 * MandiMitra Core: Price Forecasting Engine
 * Ships v0-heuristic by default (7-day linear slope + standard deviation of daily % changes).
 * Swappable with v1-gbm via configuration flag only if v1 wins backtest.
 * 
 * OWNER: Amay (Team Lead)
 * 
 * DATA PROVENANCE RULE:
 * - Temporal trend inference (slope != 0) is ONLY permitted when the trailing prices
 *   come from verified historical observations (CEDA_OBSERVED or HISTORICAL_CSV_OBSERVED).
 * - Markets with CURRENT_ONLY status receive a flat forecast (slope = 0, uncertainty = 0)
 *   and isForecastEligible = false.
 */

import { Forecast, ModelVersion, DailyPriceForecast, HistorySource } from '../contracts/domain';
import { config } from '../config';
import { evaluateGbmClassifier, resolveGbmModelKey, buildFeatureVector } from './gbm-inference';

/** Minimum number of distinct historical observations required for temporal trend inference. */
export const MIN_HISTORY_FOR_FORECAST = 5;

/**
 * A 0-3 day forecast is a SHORT-TERM momentum claim. It may only be made from observations that
 * are actually recent and actually close together.
 *
 * Without these gates a series of 11 observations spanning 2023-01-01 to 2025-01-02 was being fitted
 * as if it were seven consecutive days, turning two years of onion price inflation into a
 * "+Rs 197.58/day" trend and producing a WAIT_3_DAYS recommendation worth a fabricated +Rs 497/qtl.
 * With real date spacing the same series yields Rs 1.40/day - and being 609 days stale, it should
 * not drive a 3-day forecast at all.
 */
export const MAX_HISTORY_STALENESS_DAYS = 7;
export const MAX_TRAILING_WINDOW_SPAN_DAYS = 21;

/**
 * Calculates Ordinary Least Squares (OLS) slope of price observations over trailing window.
 * Returns ₹ change per day.
 */
export function calculateWindowSlope(prices: number[], dayOffsets?: number[]): number {
  const n = prices.length;
  if (n < 2) return 0.0;

  // x MUST be the real number of days since the first observation. Using the array index silently
  // assumes the observations are consecutive days, which inflates the slope by the average gap.
  const xs = (dayOffsets && dayOffsets.length === n)
    ? dayOffsets
    : Array.from({ length: n }, (_, i) => i);

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    const x = xs[i];
    const y = prices[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return 0.0;

  return (n * sumXY - sumX * sumY) / denominator;
}

/**
 * Calculates empirical standard deviation of daily percentage price variations.
 */
export function calculateVolatility(prices: number[], dayOffsets?: number[]): number {
  if (prices.length < 2) return 0.0;

  // Normalise each change to a PER-DAY change. A jump measured across a 361-day gap is not a
  // daily move, and treating it as one wildly overstates short-term volatility.
  const pctChanges: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] > 0) {
      const raw = (prices[i] - prices[i - 1]) / prices[i - 1];
      const gap = (dayOffsets && dayOffsets.length === prices.length)
        ? Math.max(1, dayOffsets[i] - dayOffsets[i - 1])
        : 1;
      pctChanges.push(raw / gap);
    }
  }

  if (pctChanges.length === 0) return 0.0;

  const mean = pctChanges.reduce((a, b) => a + b, 0) / pctChanges.length;
  const variance = pctChanges.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / pctChanges.length;
  const stdDevPct = Math.sqrt(variance);

  // Convert percentage volatility to absolute INR buffer based on latest price
  const latestPrice = prices[prices.length - 1];
  return stdDevPct * latestPrice;
}

export interface ForecastHistoryMeta {
  historySource: HistorySource;
  observationCount: number;
  startDate?: string;
  endDate?: string;
  /** ISO dates of the trailing observations, aligned 1:1 with the trailing price array. */
  trailingDates?: string[];
  /** Days between the last trailing observation and the evaluation reference date. */
  daysSinceLastObservation?: number;
}

/** Converts trailing ISO dates into day offsets from the first observation. */
function toDayOffsets(dates?: string[]): number[] | undefined {
  if (!dates || dates.length === 0) return undefined;
  const base = new Date(`${dates[0]}T00:00:00Z`).getTime();
  if (isNaN(base)) return undefined;
  const offsets = dates.map(d => {
    const t = new Date(`${d}T00:00:00Z`).getTime();
    return isNaN(t) ? NaN : Math.round((t - base) / 86400000);
  });
  return offsets.some(o => isNaN(o)) ? undefined : offsets;
}

/**
 * Generates 0..3 day price forecast using v0-heuristic.
 * expected_price(d) = latest_price + (slope * d)
 * 
 * Temporal trend inference (slope != 0) is only permitted when historySource
 * is CEDA_OBSERVED or HISTORICAL_CSV_OBSERVED AND observationCount >= MIN_HISTORY_FOR_FORECAST.
 */
export function generateV0Forecast(
  recent7DayPrices: number[], 
  latestPrice: number,
  historyMeta: ForecastHistoryMeta
): Forecast {
  const isRealHistory = (
    historyMeta.historySource === 'CEDA_OBSERVED' ||
    historyMeta.historySource === 'HISTORICAL_CSV_OBSERVED'
  );

  const dayOffsets = toDayOffsets(historyMeta.trailingDates);
  const windowSpanDays = dayOffsets ? dayOffsets[dayOffsets.length - 1] - dayOffsets[0] : undefined;

  // A short-term forecast requires a series that is RECENT and CONTIGUOUS, not merely large.
  const isRecentEnough = historyMeta.daysSinceLastObservation === undefined
    ? true
    : historyMeta.daysSinceLastObservation <= MAX_HISTORY_STALENESS_DAYS;
  const isTightEnough = windowSpanDays === undefined
    ? true
    : windowSpanDays <= MAX_TRAILING_WINDOW_SPAN_DAYS;

  const isForecastEligible = (
    isRealHistory &&
    historyMeta.observationCount >= MIN_HISTORY_FOR_FORECAST &&
    isRecentEnough &&
    isTightEnough
  );

  // Only compute slope/uncertainty from real, recent, tightly-spaced historical observations.
  const slope = isForecastEligible ? calculateWindowSlope(recent7DayPrices, dayOffsets) : 0;
  const uncertainty = isForecastEligible ? calculateVolatility(recent7DayPrices, dayOffsets) : 0;

  const expectedPriceByDay: DailyPriceForecast[] = [
    { day: 0, expectedPrice: Math.round(latestPrice * 10) / 10 },
    { day: 1, expectedPrice: Math.round(Math.max(0, latestPrice + slope * 1) * 10) / 10 },
    { day: 2, expectedPrice: Math.round(Math.max(0, latestPrice + slope * 2) * 10) / 10 },
    { day: 3, expectedPrice: Math.round(Math.max(0, latestPrice + slope * 3) * 10) / 10 }
  ];

  return {
    modelVersion: 'v0-heuristic',
    historicalSlope7d: Math.round(slope * 100) / 100,
    uncertainty: Math.round(uncertainty * 100) / 100,
    expectedPriceByDay,
    historySource: historyMeta.historySource,
    historyObservationCount: historyMeta.observationCount,
    historyStartDate: historyMeta.startDate,
    historyEndDate: historyMeta.endDate,
    isForecastEligible,
    forecastIneligibilityReason: isForecastEligible ? undefined : (
      !isRealHistory ? 'No verified historical observations for this market.'
        : historyMeta.observationCount < MIN_HISTORY_FOR_FORECAST
          ? `Only ${historyMeta.observationCount} verified observation(s); ${MIN_HISTORY_FOR_FORECAST} are required for trend inference.`
          : !isRecentEnough
            ? `Latest verified observation is ${historyMeta.daysSinceLastObservation} days old; a 0-3 day forecast requires history no more than ${MAX_HISTORY_STALENESS_DAYS} days stale.`
            : `Trailing observations span ${windowSpanDays} days; a short-term slope requires a window of at most ${MAX_TRAILING_WINDOW_SPAN_DAYS} days.`
    )
  };
}

/**
 * Generates a CURRENT_ONLY forecast: real current price, no temporal trend inference.
 * Price is held flat across all day offsets. Used when a market has a verifiable current
 * price but insufficient historical observations.
 */
export function generateCurrentOnlyForecast(currentPrice: number): Forecast {
  const p = Math.round(currentPrice * 10) / 10;
  return {
    modelVersion: 'v0-heuristic',
    historicalSlope7d: 0,
    uncertainty: 0,
    expectedPriceByDay: [
      { day: 0, expectedPrice: p },
      { day: 1, expectedPrice: p },
      { day: 2, expectedPrice: p },
      { day: 3, expectedPrice: p }
    ],
    historySource: 'CURRENT_ONLY',
    historyObservationCount: 0,
    historyStartDate: undefined,
    historyEndDate: undefined,
    isForecastEligible: false,
    forecastIneligibilityReason: 'No verified multi-day price series for this market; price held flat with zero invented momentum.'
  };
}

/**
 * Forecast dispatcher supporting the swappable model gate.
 * When v1-gbm is enabled and a trained tree ensemble exists for the commodity,
 * it runs the native TypeScript decision tree evaluator exported from Scikit-Learn.
 */
export function generateForecast(
  recentPrices: number[],
  latestPrice: number,
  historyMeta: ForecastHistoryMeta,
  preferredModel: ModelVersion = config.enableV1Gbm ? 'v1-gbm' : 'v0-heuristic',
  commodity?: string,
  weatherFeatures?: { tempMeanC?: number; precipMm?: number; humidityPct?: number; windSpeedKmh?: number }
): Forecast {
  const v0 = generateV0Forecast(recentPrices, latestPrice, historyMeta);

  if ((preferredModel === 'v1-gbm' || config.enableV1Gbm) && v0.isForecastEligible) {
    const commKey = resolveGbmModelKey(commodity || '');
    if (commKey) {
      const featVec = buildFeatureVector(recentPrices, weatherFeatures);
      const gbmRes = evaluateGbmClassifier(commKey, featVec, latestPrice);
      if (gbmRes) {
        const slope = Math.round(((gbmRes.expectedPriceTrajectory[3] - latestPrice) / 3) * 100) / 100;
        const uncertainty = slope === 0 ? 0 : Math.max(5.0, Math.round((100 - gbmRes.confidencePct) * 0.4 * 10) / 10);
        return {
          modelVersion: 'v1-gbm',
          historicalSlope7d: slope,
          uncertainty,
          expectedPriceByDay: [
            { day: 0, expectedPrice: Math.round(latestPrice * 10) / 10 },
            { day: 1, expectedPrice: Math.round(Math.max(0, latestPrice + slope * 1) * 10) / 10 },
            { day: 2, expectedPrice: Math.round(Math.max(0, latestPrice + slope * 2) * 10) / 10 },
            { day: 3, expectedPrice: Math.round(Math.max(0, latestPrice + slope * 3) * 10) / 10 }
          ],
          historySource: historyMeta.historySource,
          historyObservationCount: historyMeta.observationCount,
          historyStartDate: historyMeta.startDate,
          historyEndDate: historyMeta.endDate,
          isForecastEligible: true,
          forecastIneligibilityReason: undefined
        };
      }
    }
  }

  return v0;
}


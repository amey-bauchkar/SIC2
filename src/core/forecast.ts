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

/** Minimum number of distinct historical observations required for temporal trend inference. */
export const MIN_HISTORY_FOR_FORECAST = 5;

/**
 * Calculates Ordinary Least Squares (OLS) slope of price observations over trailing window.
 * Returns ₹ change per day.
 */
export function calculateWindowSlope(prices: number[]): number {
  const n = prices.length;
  if (n < 2) return 0.0;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    const x = i;
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
export function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0.0;

  const pctChanges: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] > 0) {
      pctChanges.push((prices[i] - prices[i - 1]) / prices[i - 1]);
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
  const isForecastEligible = isRealHistory && historyMeta.observationCount >= MIN_HISTORY_FOR_FORECAST;

  // Only compute slope/uncertainty from real historical data with sufficient observations
  const slope = isForecastEligible ? calculateWindowSlope(recent7DayPrices) : 0;
  const uncertainty = isForecastEligible ? calculateVolatility(recent7DayPrices) : 0;

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
    isForecastEligible
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
    isForecastEligible: false
  };
}

/**
 * Forecast dispatcher supporting the swappable model gate.
 */
export function generateForecast(
  recentPrices: number[],
  latestPrice: number,
  historyMeta: ForecastHistoryMeta,
  preferredModel: ModelVersion = config.enableV1Gbm ? 'v1-gbm' : 'v0-heuristic'
): Forecast {
  if (preferredModel === 'v1-gbm' && config.enableV1Gbm) {
    // In hackathon v0 baseline, if v1 is toggled but not yet trained, log and gracefully fall back to v0
    return generateV0Forecast(recentPrices, latestPrice, historyMeta);
  }
  return generateV0Forecast(recentPrices, latestPrice, historyMeta);
}

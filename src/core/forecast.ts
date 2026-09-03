/**
 * MandiMitra Core: Price Forecasting Engine
 * Ships v0-heuristic by default (7-day linear slope + standard deviation of daily % changes).
 * Swappable with v1-gbm via configuration flag only if v1 wins backtest.
 * 
 * OWNER: Amay (Team Lead)
 */

import { Forecast, ModelVersion, DailyPriceForecast } from '../contracts/domain';
import { config } from '../config';

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

/**
 * Generates 0..3 day price forecast using v0-heuristic.
 * expected_price(d) = latest_price + (slope * d)
 */
export function generateV0Forecast(
  recent7DayPrices: number[], 
  latestPrice: number
): Forecast {
  const slope = calculateWindowSlope(recent7DayPrices);
  const uncertainty = calculateVolatility(recent7DayPrices);

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
    expectedPriceByDay
  };
}

/**
 * Forecast dispatcher supporting the swappable model gate.
 */
export function generateForecast(
  recentPrices: number[],
  latestPrice: number,
  preferredModel: ModelVersion = config.enableV1Gbm ? 'v1-gbm' : 'v0-heuristic'
): Forecast {
  if (preferredModel === 'v1-gbm' && config.enableV1Gbm) {
    // In hackathon v0 baseline, if v1 is toggled but not yet trained, log and gracefully fall back to v0
    return generateV0Forecast(recentPrices, latestPrice);
  }
  return generateV0Forecast(recentPrices, latestPrice);
}

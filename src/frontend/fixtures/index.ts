/**
 * DEVELOPMENT & CONTRACT TEST FIXTURES ONLY
 * 
 * WARNING: These fixtures are strictly for frontend component isolation,
 * unit testing, and contract verification prior to backend integration.
 * They MUST NOT be presented as real project data or live market intelligence.
 * 
 * OWNER: Amay (Maintained for Team Contract Testing)
 */

import { EvaluateResponse, BacktestResponse } from '../../contracts/api';

const lasalgaonMarket = {
  id: 'lasalgaon',
  name: 'Lasalgaon APMC',
  state: 'Maharashtra',
  district: 'Nashik',
  lat: 20.1472,
  lon: 74.2251,
  estimatedRoadDistanceKm: 42.5
};

const pimpalgaonMarket = {
  id: 'pimpalgaon',
  name: 'Pimpalgaon Baswant APMC',
  state: 'Maharashtra',
  district: 'Nashik',
  lat: 20.1706,
  lon: 73.9856,
  estimatedRoadDistanceKm: 31.0
};

export const DEV_FIXTURE_EVALUATION_WAIT: EvaluateResponse = {
  commodity: 'Onion',
  evaluatedAt: '2026-09-03T11:30:00.000Z',
  modelVersion: 'v0-heuristic',
  userParameters: {
    transportCostPerKmPerQtl: 3.0,
    storageCostPerDayPerQtl: 10.0,
    radiusKm: 100.0
  },
  recommendation: {
    action: 'WAIT_2_DAYS',
    market: lasalgaonMarket,
    confidence: 'HIGH',
    expectedGainPerQtl: 85.50,
    riskAdjustedGainPerQtl: 62.00,
    reasons: [
      'Lasalgaon APMC delivers the highest expected net realisation (₹2,382.50/qtl) on Day 2.',
      'Recent 7-day price trajectory indicates an upward slope of +₹55.00/qtl/day.',
      'Anticipated net price appreciation (₹110.00/qtl) comfortably exceeds holding cost (₹20.00/qtl) and the ₹23.50/qtl volatility buffer.'
    ]
  },
  evaluations: [
    {
      market: lasalgaonMarket,
      dataQuality: {
        tier: 'GOOD',
        daysSinceLastReport: 1,
        coverage30d: 93.3,
        missingDays: 2,
        isEligibleForRecommendation: true
      },
      forecast: {
        modelVersion: 'v0-heuristic',
        historicalSlope7d: 55.0,
        uncertainty: 23.5,
        expectedPriceByDay: [
          { day: 0, expectedPrice: 2400.0 },
          { day: 1, expectedPrice: 2455.0 },
          { day: 2, expectedPrice: 2510.0 },
          { day: 3, expectedPrice: 2565.0 }
        ],
        historySource: 'SYNTHETIC_DEMO',
        historyObservationCount: 30,
        isForecastEligible: true
      },
      netRealisationByDay: [
        { market: lasalgaonMarket, day: 0, expectedPrice: 2400.0, transportCostPerQtl: 127.5, waitingCostPerQtl: 0.0, netRealisation: 2272.5 },
        { market: lasalgaonMarket, day: 1, expectedPrice: 2455.0, transportCostPerQtl: 127.5, waitingCostPerQtl: 10.0, netRealisation: 2317.5 },
        { market: lasalgaonMarket, day: 2, expectedPrice: 2510.0, transportCostPerQtl: 127.5, waitingCostPerQtl: 20.0, netRealisation: 2362.5 },
        { market: lasalgaonMarket, day: 3, expectedPrice: 2565.0, transportCostPerQtl: 127.5, waitingCostPerQtl: 30.0, netRealisation: 2407.5 }
      ],
      historySource: 'SYNTHETIC_DEMO',
      historyObservationCount: 30
    },
    {
      market: pimpalgaonMarket,
      dataQuality: {
        tier: 'GOOD',
        daysSinceLastReport: 1,
        coverage30d: 86.7,
        missingDays: 4,
        isEligibleForRecommendation: true
      },
      forecast: {
        modelVersion: 'v0-heuristic',
        historicalSlope7d: 15.0,
        uncertainty: 18.0,
        expectedPriceByDay: [
          { day: 0, expectedPrice: 2350.0 },
          { day: 1, expectedPrice: 2365.0 },
          { day: 2, expectedPrice: 2380.0 },
          { day: 3, expectedPrice: 2395.0 }
        ],
        historySource: 'SYNTHETIC_DEMO',
        historyObservationCount: 30,
        isForecastEligible: true
      },
      netRealisationByDay: [
        { market: pimpalgaonMarket, day: 0, expectedPrice: 2350.0, transportCostPerQtl: 93.0, waitingCostPerQtl: 0.0, netRealisation: 2257.0 },
        { market: pimpalgaonMarket, day: 1, expectedPrice: 2365.0, transportCostPerQtl: 93.0, waitingCostPerQtl: 10.0, netRealisation: 2262.0 },
        { market: pimpalgaonMarket, day: 2, expectedPrice: 2380.0, transportCostPerQtl: 93.0, waitingCostPerQtl: 20.0, netRealisation: 2267.0 },
        { market: pimpalgaonMarket, day: 3, expectedPrice: 2395.0, transportCostPerQtl: 93.0, waitingCostPerQtl: 30.0, netRealisation: 2272.0 }
      ],
      historySource: 'SYNTHETIC_DEMO',
      historyObservationCount: 30
    }
  ]
};

export const DEV_FIXTURE_EVALUATION_ABSTAIN: EvaluateResponse = {
  commodity: 'Tomato',
  evaluatedAt: '2026-09-03T11:35:00.000Z',
  modelVersion: 'v0-heuristic',
  userParameters: {
    transportCostPerKmPerQtl: 3.0,
    storageCostPerDayPerQtl: 10.0,
    radiusKm: 100.0
  },
  recommendation: {
    action: 'NO_RECOMMENDATION',
    market: null,
    confidence: 'LOW',
    expectedGainPerQtl: 0,
    reasons: [
      'All 3 candidate mandis within 100km have stale reporting (>5 days since last quote) or <40% 30-day coverage.',
      'Recommending a transaction under sparse data poses unacceptable financial risk to the farmer.',
      'Nearest reliable reporting market is Pune APMC (168 km away).'
    ]
  },
  evaluations: []
};

export const DEV_FIXTURE_BACKTEST: BacktestResponse = {
  result: {
    commodity: 'Onion',
    modelVersion: 'v0-heuristic',
    evaluatedDays: 184,
    avgNetRealisation: 2314.80,
    baselineNetRealisation: 2246.20,
    netGainVsBaseline: 68.60,
    directionalAccuracy: 74.5,
    coverage: 88.0,
    evaluatedPeriod: {
      start: '2023-07-01',
      end: '2023-12-31'
    }
  },
  citationNotice: 'CEDA Agri Market Data (CEDA-AMD), 2000-2023. Centre for Economic Data & Analysis, Ashoka University'
};

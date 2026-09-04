/**
 * Comprehensive Verification Test Suite:
 * MandiMitra Data Provenance, Synthetic Momentum Removal & CEDA Integration
 *
 * Tests:
 * 1. Synthetic momentum elimination (no deterministic noise, no calibrated drift)
 * 2. CEDA observed history parsing and normalization
 * 3. Lookahead leakage audit (time-travel protection)
 * 4. Forecast eligibility gate (MIN_HISTORY_FOR_FORECAST = 5)
 * 5. CURRENT_ONLY safety (flat price path, slope = 0, uncertainty = 0)
 * 6. Decision policy safety (honest abstention and spatial arbitrage)
 */

import fs from 'fs';
import path from 'path';
import {
  calculateWindowSlope,
  calculateVolatility,
  generateV0Forecast,
  generateCurrentOnlyForecast,
  generateForecast,
  MIN_HISTORY_FOR_FORECAST
} from '../src/core/forecast';
import {
  writeCedaObservedSeries,
  readCedaObservedHistory,
  CedaPriceRecord
} from '../src/backend/ceda-client';
import { evaluateDecisionPolicy } from '../src/core/decision';
import { Market, MarketEvaluation } from '../src/contracts/domain';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('MANDIMITRA DATA PROVENANCE & CEDA INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  // ---------------------------------------------------------------------------
  // 1. Synthetic Momentum Audit
  // ---------------------------------------------------------------------------
  console.log('Test Group 1: Synthetic Momentum Audit in Source Code');

  const controllersCode = fs.readFileSync(
    path.resolve(process.cwd(), 'src', 'backend', 'controllers.ts'),
    'utf-8'
  );

  assert(
    !controllersCode.includes('computeCalibratedTrailingPrices'),
    'computeCalibratedTrailingPrices completely removed from controllers.ts'
  );
  assert(
    !controllersCode.includes('deterministicNoise'),
    'deterministicNoise completely removed from controllers.ts'
  );
  assert(
    !controllersCode.includes('dailyDrift'),
    'dailyDrift removed from controllers.ts'
  );

  // ---------------------------------------------------------------------------
  // 2. Forecast Eligibility & CURRENT_ONLY Gate
  // ---------------------------------------------------------------------------
  console.log('\nTest Group 2: Forecast Eligibility & CURRENT_ONLY Gate');

  // Case A: Current only (no history)
  const currentOnlyForecast = generateCurrentOnlyForecast(2500);
  assert(
    currentOnlyForecast.historySource === 'CURRENT_ONLY',
    'generateCurrentOnlyForecast sets historySource = CURRENT_ONLY'
  );
  assert(
    currentOnlyForecast.historicalSlope7d === 0,
    'generateCurrentOnlyForecast produces slope = 0'
  );
  assert(
    currentOnlyForecast.uncertainty === 0,
    'generateCurrentOnlyForecast produces uncertainty = 0'
  );
  assert(
    currentOnlyForecast.isForecastEligible === false,
    'generateCurrentOnlyForecast sets isForecastEligible = false'
  );
  assert(
    currentOnlyForecast.expectedPriceByDay.every(p => p.expectedPrice === 2500),
    'generateCurrentOnlyForecast holds price flat across days 0..3'
  );

  // Case B: Sparse CEDA history (< MIN_HISTORY_FOR_FORECAST observations)
  const sparsePrices = [2400, 2450, 2500]; // only 3 observations
  const sparseForecast = generateForecast(sparsePrices, 2500, {
    historySource: 'CEDA_OBSERVED',
    observationCount: 3,
    startDate: '2026-08-25',
    endDate: '2026-08-27'
  });
  assert(
    sparseForecast.isForecastEligible === false,
    'Sparse CEDA history (<5 obs) is NOT forecast-eligible'
  );
  assert(
    sparseForecast.historicalSlope7d === 0,
    'Sparse CEDA history gets slope = 0 (no temporal trend inference)'
  );
  assert(
    sparseForecast.uncertainty === 0,
    'Sparse CEDA history gets uncertainty = 0'
  );

  // Case C: Sufficient CEDA history (>= MIN_HISTORY_FOR_FORECAST observations)
  const sufficientPrices = [2100, 2150, 2200, 2250, 2300, 2350, 2400]; // 7 days, upward slope = 50/day
  const realForecast = generateForecast(sufficientPrices, 2400, {
    historySource: 'CEDA_OBSERVED',
    observationCount: 7,
    startDate: '2026-08-20',
    endDate: '2026-08-26'
  });
  assert(
    realForecast.isForecastEligible === true,
    'Sufficient CEDA history (>=5 obs) IS forecast-eligible'
  );
  assert(
    realForecast.historicalSlope7d === 50,
    'Sufficient CEDA history calculates true OLS slope (+₹50/day)'
  );
  assert(
    realForecast.historySource === 'CEDA_OBSERVED',
    'Forecast carries CEDA_OBSERVED provenance'
  );
  assert(
    realForecast.expectedPriceByDay[1].expectedPrice === 2450,
    'Day 1 expected price reflects true slope (2400 + 50 = 2450)'
  );
  assert(
    realForecast.expectedPriceByDay[3].expectedPrice === 2550,
    'Day 3 expected price reflects true slope (2400 + 150 = 2550)'
  );

  // ---------------------------------------------------------------------------
  // 3. CEDA Observed File Storage & Provenance Tracking
  // ---------------------------------------------------------------------------
  console.log('\nTest Group 3: CEDA Observed File Storage & Provenance');

  const testRecords: CedaPriceRecord[] = [
    {
      date: '2026-08-01',
      commodity: 'Onion',
      market: 'Test_Lasalgaon',
      district: 'Nashik',
      state: 'Maharashtra',
      minPrice: 2000,
      maxPrice: 2400,
      modalPrice: 2200,
      arrivalQty: 500,
      rawRecord: {}
    },
    {
      date: '2026-08-02',
      commodity: 'Onion',
      market: 'Test_Lasalgaon',
      district: 'Nashik',
      state: 'Maharashtra',
      minPrice: 2050,
      maxPrice: 2450,
      modalPrice: 2250,
      arrivalQty: 480,
      rawRecord: {}
    },
    {
      date: '2026-08-03',
      commodity: 'Onion',
      market: 'Test_Lasalgaon',
      district: 'Nashik',
      state: 'Maharashtra',
      minPrice: 2100,
      maxPrice: 2500,
      modalPrice: 2300,
      arrivalQty: 510,
      rawRecord: {}
    }
  ];

  const importRes = writeCedaObservedSeries('Onion', 'Test_Lasalgaon', 'Nashik', testRecords);
  assert(
    fs.existsSync(importRes.csvPath),
    'writeCedaObservedSeries writes CSV to data/historical/observed/'
  );

  const provPath = importRes.csvPath.replace('.csv', '_provenance.json');
  assert(
    fs.existsSync(provPath),
    'writeCedaObservedSeries writes companion provenance JSON'
  );

  const provData = JSON.parse(fs.readFileSync(provPath, 'utf-8'));
  assert(
    provData.source === 'CEDA' && provData.provenance === 'OBSERVED',
    'Provenance JSON records source = CEDA, provenance = OBSERVED'
  );

  // Read back
  const readBack = readCedaObservedHistory('Onion', 'Test_Lasalgaon', new Date('2026-08-10'));
  assert(
    readBack !== null && readBack.observationCount === 3,
    'readCedaObservedHistory successfully parses written series'
  );
  assert(
    readBack?.source === 'CEDA_OBSERVED',
    'readCedaObservedHistory returns CEDA_OBSERVED source'
  );

  // Clean up test files
  try {
    fs.unlinkSync(importRes.csvPath);
    fs.unlinkSync(provPath);
  } catch {}

  // ---------------------------------------------------------------------------
  // 4. Lookahead Leakage Audit
  // ---------------------------------------------------------------------------
  console.log('\nTest Group 4: Lookahead Leakage Audit');

  const leakageRecords: CedaPriceRecord[] = [
    { date: '2026-08-01', commodity: 'Onion', market: 'Leakage_Test', district: 'Nashik', state: 'Maharashtra', minPrice: 2000, maxPrice: 2200, modalPrice: 2100, arrivalQty: 100, rawRecord: {} },
    { date: '2026-08-02', commodity: 'Onion', market: 'Leakage_Test', district: 'Nashik', state: 'Maharashtra', minPrice: 2000, maxPrice: 2200, modalPrice: 2150, arrivalQty: 100, rawRecord: {} },
    { date: '2026-08-10', commodity: 'Onion', market: 'Leakage_Test', district: 'Nashik', state: 'Maharashtra', minPrice: 3000, maxPrice: 3500, modalPrice: 3300, arrivalQty: 100, rawRecord: {} } // FUTURE DATE!
  ];

  writeCedaObservedSeries('Onion', 'Leakage_Test', 'Nashik', leakageRecords);

  // Read with referenceDate = 2026-08-05 (before the 2026-08-10 observation)
  const leakageRead = readCedaObservedHistory('Onion', 'Leakage_Test', new Date('2026-08-05'));
  assert(
    leakageRead !== null && leakageRead.observationCount === 2,
    'Observations strictly on or before referenceDate are included (2 of 3)'
  );
  assert(
    leakageRead?.latestPrice === 2150,
    'Future observation of 3300 on 2026-08-10 was NOT leaked into evaluation at 2026-08-05'
  );

  // Clean up
  try {
    const csvP = path.resolve(process.cwd(), 'data', 'historical', 'observed', 'onion_leakage_test_ceda.csv');
    fs.unlinkSync(csvP);
    fs.unlinkSync(csvP.replace('.csv', '_provenance.json'));
  } catch {}

  // ---------------------------------------------------------------------------
  // 5. Decision Policy Safety & No-History Behavior
  // ---------------------------------------------------------------------------
  console.log('\nTest Group 5: Decision Policy Safety & No-History Behavior');

  const mockMarket: Market = {
    id: 'mumbai_byculla',
    name: 'Mumbai (Byculla Market)',
    state: 'Maharashtra',
    district: 'Mumbai City',
    lat: 18.9750,
    lon: 72.8300,
    estimatedRoadDistanceKm: 10.0
  };

  const currentOnlyEval: MarketEvaluation = {
    market: mockMarket,
    dataQuality: {
      tier: 'GOOD',
      daysSinceLastReport: 1,
      coverage30d: 85,
      missingDays: 4,
      isEligibleForRecommendation: true,
      priceProvenance: 'AGMARKNET_MARKET_OBSERVED'
    },
    forecast: generateCurrentOnlyForecast(2800),
    netRealisationByDay: [
      { market: mockMarket, day: 0, expectedPrice: 2800, transportCostPerQtl: 35, waitingCostPerQtl: 0, netRealisation: 2765 },
      { market: mockMarket, day: 1, expectedPrice: 2800, transportCostPerQtl: 35, waitingCostPerQtl: 20, netRealisation: 2745 },
      { market: mockMarket, day: 2, expectedPrice: 2800, transportCostPerQtl: 35, waitingCostPerQtl: 40, netRealisation: 2725 },
      { market: mockMarket, day: 3, expectedPrice: 2800, transportCostPerQtl: 35, waitingCostPerQtl: 60, netRealisation: 2705 }
    ],
    historySource: 'CURRENT_ONLY',
    historyObservationCount: 0
  };

  const decision = evaluateDecisionPolicy([currentOnlyEval]);
  assert(
    decision.action === 'SELL_TODAY',
    'CURRENT_ONLY market recommends SELL_TODAY (no manufactured WAIT)'
  );
  assert(
    decision.reasons.some(r => r.includes('Single-day Agmarknet observation') || r.includes('price held flat')),
    'Decision reason explains price is held flat without verified history'
  );

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('================================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 ALL INTEGRATION & VERIFICATION TESTS PASSED PERFECTLY!\n');
    process.exit(0);
  } else {
    console.error('❌ SOME TESTS FAILED!\n');
    process.exit(1);
  }
}

runTests();

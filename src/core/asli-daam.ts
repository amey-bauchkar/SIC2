/**
 * MandiMitra: AsliDaam ("असली दाम") Net Realizable Value Engine
 * 
 * Computes the true farmer in-hand payout across Candidate Mandis × Day-Offset (0-3 days).
 * Subtracts real haulage freight, statutory APMC market cess (1.10%), hamali (₹9/q), 
 * electronic weighbridge tolai (₹3.5/q), and biological crop spoilage decay per day.
 * 
 * Compares every option against Default Baseline (Selling Today at Nearest Mandi)
 * to output total wallet rupees (+₹ Cash in pocket for Q quintals).
 */

import { Market } from '../contracts/domain';

export interface AsliDaamBreakdown {
  market: Market;
  dayOffset: number; // 0 (today), 1, 2, 3
  grossPricePerQtl: number;
  
  // Deductions per quintal
  roadFreightPerQtl: number;
  apmcCessPerQtl: number; // 1.10% statutory cess
  hamaliAndTolaiPerQtl: number; // ₹9.00 hamali + ₹3.50 tolai = ₹12.50
  holdingAndSpoilagePerQtl: number; // Daily storage + biological decay
  
  // Net per quintal
  asliDaamPerQtl: number;
  
  // Total wallet numbers for quantity Q
  quantityQuintals: number;
  totalGrossValue: number;
  totalTransportCost: number;
  totalApmcDeductions: number;
  totalHoldingSpoilageLoss: number;
  totalNetPayout: number; // Real rupees in farmer's pocket
  
  // Comparison vs baseline
  netGainPerQtlVsDefault: number;
  totalPocketGainVsDefault: number;
  isRecommended: boolean;
  isBaseline: boolean;
  isStaleOrAbstained: boolean;
  abstentionReason?: string;
}

export interface CropDecayProfile {
  dailyDecayRatePct: number;
  dailyStorageRentRs: number;
  shelfLifeDays: number;
  holdingAdvisability: string;
}

export const CROP_DECAY_PROFILES: Record<string, CropDecayProfile> = {
  'Tomato': {
    dailyDecayRatePct: 0.020, // 2% weight & soft rot loss per day
    dailyStorageRentRs: 1.25,
    shelfLifeDays: 5,
    holdingAdvisability: 'Extremely Low — perishable fruit. Waiting >48h risks rapid deterioration.'
  },
  'Onion': {
    dailyDecayRatePct: 0.003, // 0.3% moisture loss per day in ventilated storage
    dailyStorageRentRs: 0.45,
    shelfLifeDays: 90,
    holdingAdvisability: 'Moderate — safe to hold 2-3 days if terminal market spread covers weight shrinkage.'
  },
  'Soyabean': {
    dailyDecayRatePct: 0.000, // Non-perishable grain
    dailyStorageRentRs: 0.25,
    shelfLifeDays: 365,
    holdingAdvisability: 'Very High — non-perishable grain. Can wait days or weeks for favorable price cycle.'
  },
  'Wheat': {
    dailyDecayRatePct: 0.000,
    dailyStorageRentRs: 0.25,
    shelfLifeDays: 365,
    holdingAdvisability: 'Very High — dry grain with zero near-term shelf loss.'
  },
  'Gram': {
    dailyDecayRatePct: 0.000,
    dailyStorageRentRs: 0.25,
    shelfLifeDays: 365,
    holdingAdvisability: 'High — stable pulse with minimal short-term holding decay.'
  }
};

/**
 * Calculates AsliDaam Net Realizable Value breakdown for a single mandi on a given day.
 */
export function calculateAsliDaamForMandiDay(
  market: Market,
  commodity: string,
  quantityQuintals: number,
  dayOffset: number,
  expectedModalPrice: number,
  transportCostPerKmPerQtl: number = 3.0,
  roadDistanceKm?: number,
  isStaleOrAbstained: boolean = false,
  abstentionReason?: string
): AsliDaamBreakdown {
  const distKm = roadDistanceKm ?? market.estimatedRoadDistanceKm ?? 25.0;
  const decayProfile = CROP_DECAY_PROFILES[commodity] || CROP_DECAY_PROFILES['Onion'];

  // 1. Gross price
  const grossPricePerQtl = Math.round(expectedModalPrice * 10) / 10;

  // 2. Transport Freight
  const roadFreightPerQtl = Math.round(distKm * transportCostPerKmPerQtl * 10) / 10;

  // 3. APMC Statutory Tariffs: 1.10% total cess + ₹12.50 handling (hamali ₹9 + tolai ₹3.5)
  const apmcCessPerQtl = Math.round(grossPricePerQtl * 0.0110 * 10) / 10;
  const hamaliAndTolaiPerQtl = 12.50;

  // 4. Holding & Biological Decay Loss
  const decayLossPerQtl = grossPricePerQtl * decayProfile.dailyDecayRatePct * dayOffset;
  const storageRentPerQtl = decayProfile.dailyStorageRentRs * dayOffset;
  const holdingAndSpoilagePerQtl = Math.round((decayLossPerQtl + storageRentPerQtl) * 10) / 10;

  // 5. AsliDaam Net Realisation per quintal
  const asliDaamPerQtl = Math.round(
    (grossPricePerQtl - roadFreightPerQtl - apmcCessPerQtl - hamaliAndTolaiPerQtl - holdingAndSpoilagePerQtl) * 10
  ) / 10;

  // 6. Total wallet rupees for quantity Q
  const totalGrossValue = Math.round(grossPricePerQtl * quantityQuintals);
  const totalTransportCost = Math.round(roadFreightPerQtl * quantityQuintals);
  const totalApmcDeductions = Math.round((apmcCessPerQtl + hamaliAndTolaiPerQtl) * quantityQuintals);
  const totalHoldingSpoilageLoss = Math.round(holdingAndSpoilagePerQtl * quantityQuintals);
  const totalNetPayout = Math.round(asliDaamPerQtl * quantityQuintals);

  return {
    market,
    dayOffset,
    grossPricePerQtl,
    roadFreightPerQtl,
    apmcCessPerQtl,
    hamaliAndTolaiPerQtl,
    holdingAndSpoilagePerQtl,
    asliDaamPerQtl,
    quantityQuintals,
    totalGrossValue,
    totalTransportCost,
    totalApmcDeductions,
    totalHoldingSpoilageLoss,
    totalNetPayout,
    netGainPerQtlVsDefault: 0,
    totalPocketGainVsDefault: 0,
    isRecommended: false,
    isBaseline: false,
    isStaleOrAbstained,
    abstentionReason
  };
}

export interface AsliDaamOptimizationResult {
  commodity: string;
  quantityQuintals: number;
  baseline: AsliDaamBreakdown;
  recommended: AsliDaamBreakdown;
  allCombinations: AsliDaamBreakdown[];
  totalPocketCashGain: number; // ₹ extra in pocket vs baseline
  gainPerQtl: number;
  headlineSummary: {
    en: string;
    mr: string;
    hi: string;
  };
}

/**
 * Runs the complete AsliDaam joint optimization across Mandi × Day (0..3) grid.
 */
export function runAsliDaamOptimization(
  candidateMandis: Array<{ market: Market; currentModalPrice: number; roadDistKm: number; isStale?: boolean; staleReason?: string }>,
  commodity: string = 'Onion',
  quantityQuintals: number = 25,
  transportCostPerKmPerQtl: number = 3.0,
  predictedDirection: 'UP' | 'FLAT' | 'DOWN' = 'UP'
): AsliDaamOptimizationResult {
  const allCombinations: AsliDaamBreakdown[] = [];

  // Sort candidate mandis by distance to identify default local mandi
  const sortedByDist = [...candidateMandis].sort((a, b) => a.roadDistKm - b.roadDistKm);
  const defaultCandidate = sortedByDist[0] || {
    market: { id: 'default', name: 'Local Mandi', state: 'MH', district: 'Nashik', lat: 20.0, lon: 73.8 },
    currentModalPrice: 3100,
    roadDistKm: 5.0
  };

  // Evaluate every combination: mandi × day 0..3
  for (const cand of candidateMandis) {
    for (let day = 0; day <= 3; day++) {
      // Expected price trajectory based on trend
      let dayPriceMultiplier = 1.0;
      if (day > 0) {
        if (predictedDirection === 'UP') {
          dayPriceMultiplier = 1.0 + (day * 0.022); // +2.2% per day appreciation
        } else if (predictedDirection === 'DOWN') {
          dayPriceMultiplier = 1.0 - (day * 0.018); // -1.8% per day depreciation
        }
      }

      const expectedPrice = cand.currentModalPrice * dayPriceMultiplier;
      const breakdown = calculateAsliDaamForMandiDay(
        cand.market,
        commodity,
        quantityQuintals,
        day,
        expectedPrice,
        transportCostPerKmPerQtl,
        cand.roadDistKm,
        cand.isStale || false,
        cand.staleReason
      );

      allCombinations.push(breakdown);
    }
  }

  // Baseline is nearest mandi at Day 0
  const baseline = allCombinations.find(c => c.market.id === defaultCandidate.market.id && c.dayOffset === 0) 
    || allCombinations[0];
  baseline.isBaseline = true;

  // Filter out abstained/stale mandis from recommendation eligibility
  const eligibleCombinations = allCombinations.filter(c => !c.isStaleOrAbstained);

  // Pick combination with highest totalNetPayout
  let recommended = eligibleCombinations.reduce((best, curr) => {
    return curr.totalNetPayout > best.totalNetPayout ? curr : best;
  }, eligibleCombinations[0] || baseline);

  // If gain from waiting or traveling doesn't exceed friction threshold (₹20/q), stick to local sell today
  const minGainThreshold = 20.0 * quantityQuintals;
  if (recommended.totalNetPayout - baseline.totalNetPayout < minGainThreshold) {
    recommended = baseline;
  }

  recommended.isRecommended = true;

  // Annotate all combinations with gain vs baseline
  for (const c of allCombinations) {
    c.netGainPerQtlVsDefault = Math.round((c.asliDaamPerQtl - baseline.asliDaamPerQtl) * 10) / 10;
    c.totalPocketGainVsDefault = Math.round(c.totalNetPayout - baseline.totalNetPayout);
  }

  const totalPocketCashGain = Math.max(0, recommended.totalNetPayout - baseline.totalNetPayout);
  const gainPerQtl = Math.max(0, recommended.asliDaamPerQtl - baseline.asliDaamPerQtl);

  // Multilingual Headlines
  const isWait = recommended.dayOffset > 0;
  const mandiName = recommended.market.name;
  const days = recommended.dayOffset;

  let headlineEn = `Sell Today at ${mandiName} APMC`;
  let headlineMr = `आजच ${mandiName} कृषी उत्पन्न बाजार समितीत विका`;
  let headlineHi = `आज ही ${mandiName} मंडी में बेचें`;

  if (isWait && totalPocketCashGain > 0) {
    headlineEn = `Wait ${days} Day${days > 1 ? 's' : ''}, Sell at ${mandiName} APMC: +₹${totalPocketCashGain.toLocaleString('en-IN')} Extra in Pocket`;
    headlineMr = `${days} दिवस थांबा, ${mandiName} येथे विका: खिशात +₹${totalPocketCashGain.toLocaleString('en-IN')} जास्तीचा निव्वळ नफा`;
    headlineHi = `${days} दिन रुकें, ${mandiName} में बेचें: जेब में +₹${totalPocketCashGain.toLocaleString('en-IN')} अतिरिक्त फायदा`;
  }

  return {
    commodity,
    quantityQuintals,
    baseline,
    recommended,
    allCombinations,
    totalPocketCashGain,
    gainPerQtl,
    headlineSummary: {
      en: headlineEn,
      mr: headlineMr,
      hi: headlineHi
    }
  };
}

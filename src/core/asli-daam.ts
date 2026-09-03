/**
 * MandiMitra: AsliDaam ("असली दाम") Net Realizable Value Engine
 *
 * Computes the true farmer in-hand payout across Candidate Mandis × Day-Offset (0-3 days).
 * Subtracts real haulage freight, statutory APMC market cess (1.10%), hamali (₹9/q),
 * electronic weighbridge tolai (₹3.5/q), biological crop spoilage decay per day, and the
 * commercial "market-perceived freshness" discount buyers apply to non-same-day stock.
 *
 * Compares every option against Default Baseline (Selling Today at Nearest Mandi)
 * to output total wallet rupees (+₹ Cash in pocket for Q quintals).
 *
 * ZERO-MOCK CONTRACT:
 * - This engine never manufactures a price trajectory. Expected gross prices per day must be
 *   supplied by the caller from the backend forecast (`netRealisationByDay[].expectedPrice`).
 *   When a trajectory is absent the price is held FLAT — never synthetically appreciated.
 * - The recommended option is constrained by the backend decision policy action so the
 *   Decision Hub can never contradict the model that produced it.
 */

import { Market, RecommendationAction } from '../contracts/domain';
import { getCropConfig } from '../config/crops';
import { translateMandiName } from '../config/mandis';

export interface AsliDaamBreakdown {
  market: Market;
  dayOffset: number; // 0 (today), 1, 2, 3
  grossPricePerQtl: number;

  // Deductions per quintal
  roadFreightPerQtl: number;
  apmcCessPerQtl: number; // 1.10% statutory cess
  hamaliAndTolaiPerQtl: number; // ₹9.00 hamali + ₹3.50 tolai = ₹12.50
  holdingAndSpoilagePerQtl: number; // Daily storage rent + biological decay
  storageRentPerQtl: number; // Daily storage rent component
  physicalDecayLossPerQtl: number; // Biological weight/rot loss component
  freshnessDiscountPerQtl: number; // Commercial market-perceived freshness penalty

  // Net per quintal
  asliDaamPerQtl: number;

  // Total wallet numbers for quantity Q
  quantityQuintals: number;
  totalGrossValue: number;
  totalTransportCost: number;
  totalApmcDeductions: number;
  totalHoldingSpoilageLoss: number;
  totalFreshnessDiscount: number;
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
  dailyDecayRatePct: number; // Physical loss fraction per day (e.g. 0.02 = 2%)
  dailyStorageRentRs: number; // INR per quintal per day
  /**
   * Market-perceived freshness discount: the commercial haircut mandi buyers apply
   * per day of storage even when the produce has NOT physically spoiled.
   * "Not physically spoiled" != "economically equivalent to fresh harvest".
   */
  dailyFreshnessDiscountPct: number;
  shelfLifeDays: number;
  holdingAdvisability: string;
}

export const CATEGORY_DECAY_FALLBACKS: Record<string, CropDecayProfile> = {
  'PERISHABLE': {
    dailyDecayRatePct: 0.020, // 2% weight & soft rot loss per day
    dailyStorageRentRs: 1.25,
    dailyFreshnessDiscountPct: 0.035, // Buyers heavily penalise non-same-day harvest
    shelfLifeDays: 5,
    holdingAdvisability: 'Extremely Low — perishable commodity. Waiting >48h risks rapid deterioration and a steep buyer freshness haircut.'
  },
  'SEMI_PERISHABLE': {
    dailyDecayRatePct: 0.003, // 0.3% moisture loss per day in ventilated storage
    dailyStorageRentRs: 0.45,
    dailyFreshnessDiscountPct: 0.003, // Mild curing / skin shrinkage discount
    shelfLifeDays: 90,
    holdingAdvisability: 'Moderate — safe to hold 2-3 days if terminal market spread covers weight shrinkage.'
  },
  'DRY_GRAIN': {
    dailyDecayRatePct: 0.000, // Non-perishable dry grain/pulse/oilseed/spice
    dailyStorageRentRs: 0.25,
    dailyFreshnessDiscountPct: 0.000, // Bulk commodities retain full market value over 1-3 days
    shelfLifeDays: 365,
    holdingAdvisability: 'Very High — dry non-perishable crop with zero near-term shelf loss.'
  }
};

export const CROP_DECAY_PROFILES: Record<string, CropDecayProfile> = {
  'Tomato': {
    dailyDecayRatePct: 0.020,
    dailyStorageRentRs: 1.25,
    dailyFreshnessDiscountPct: 0.035,
    shelfLifeDays: 5,
    holdingAdvisability: 'Extremely Low — perishable fruit. Waiting >48h risks rapid deterioration and a steep buyer freshness haircut.'
  },
  'Onion': {
    dailyDecayRatePct: 0.003,
    dailyStorageRentRs: 0.45,
    dailyFreshnessDiscountPct: 0.003,
    shelfLifeDays: 90,
    holdingAdvisability: 'Moderate — safe to hold 2-3 days if terminal market spread covers weight shrinkage.'
  },
  'Soyabean': {
    dailyDecayRatePct: 0.000,
    dailyStorageRentRs: 0.25,
    dailyFreshnessDiscountPct: 0.000,
    shelfLifeDays: 365,
    holdingAdvisability: 'Very High — non-perishable grain. Can wait days or weeks for a favourable price cycle.'
  },
  'Wheat': {
    dailyDecayRatePct: 0.000,
    dailyStorageRentRs: 0.25,
    dailyFreshnessDiscountPct: 0.000,
    shelfLifeDays: 365,
    holdingAdvisability: 'Very High — dry grain with zero near-term shelf loss.'
  },
  'Gram': {
    dailyDecayRatePct: 0.000,
    dailyStorageRentRs: 0.25,
    dailyFreshnessDiscountPct: 0.000,
    shelfLifeDays: 365,
    holdingAdvisability: 'High — stable pulse with minimal short-term holding decay.'
  }
};

/**
 * Resolves crop decay profile using specific overrides or category-level defaults.
 */
export function getCropDecayProfile(commodity: string): CropDecayProfile {
  // 1. Direct match in specific profiles
  if (CROP_DECAY_PROFILES[commodity]) {
    return CROP_DECAY_PROFILES[commodity];
  }

  // 2. Lookup crop catalog metadata (all 99 Maharashtra commodities carry a decayType)
  const config = getCropConfig(commodity);
  if (config && config.decayType && CATEGORY_DECAY_FALLBACKS[config.decayType]) {
    return CATEGORY_DECAY_FALLBACKS[config.decayType];
  }

  // 3. Fallback to semi-perishable category profile
  return CATEGORY_DECAY_FALLBACKS['SEMI_PERISHABLE'];
}

/**
 * Calculates AsliDaam Net Realizable Value breakdown for a single mandi on a given day.
 *
 * AsliDaam = Gross - RoadFreight - APMCDeductions - StorageRent - PhysicalDecayLoss - FreshnessDiscount
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
  abstentionReason?: string,
  /**
   * Explicit freight in INR/quintal. Supplied by SajhaBazaar, where haulage comes from a
   * non-linear vehicle dispatch model rather than a flat per-km-per-quintal rate. When given,
   * it replaces `distKm * transportCostPerKmPerQtl` entirely (including at zero distance, where
   * a dedicated vehicle still costs its minimum trip charge).
   */
  roadFreightPerQtlOverride?: number
): AsliDaamBreakdown {
  const distKm = roadDistanceKm ?? market.estimatedRoadDistanceKm ?? 0;
  const decayProfile = getCropDecayProfile(commodity);

  // 1. Gross price
  const grossPricePerQtl = Math.round(expectedModalPrice * 10) / 10;

  // 2. Transport Freight
  const roadFreightPerQtl = (roadFreightPerQtlOverride !== undefined && Number.isFinite(roadFreightPerQtlOverride))
    ? Math.round(roadFreightPerQtlOverride * 10) / 10
    : Math.round(distKm * transportCostPerKmPerQtl * 10) / 10;

  // 3. APMC Statutory Tariffs: 1.10% total cess + ₹12.50 handling (hamali ₹9 + tolai ₹3.5)
  const apmcCessPerQtl = Math.round(grossPricePerQtl * 0.0110 * 10) / 10;
  const hamaliAndTolaiPerQtl = 12.50;

  // 4. Holding: physical biological decay + warehouse storage rent
  const physicalDecayLossPerQtl = Math.round(grossPricePerQtl * decayProfile.dailyDecayRatePct * dayOffset * 10) / 10;
  const storageRentPerQtl = Math.round(decayProfile.dailyStorageRentRs * dayOffset * 10) / 10;
  const holdingAndSpoilagePerQtl = Math.round((physicalDecayLossPerQtl + storageRentPerQtl) * 10) / 10;

  // 5. Market-perceived freshness discount (commercial buyer haircut on aged stock)
  const freshnessDiscountPerQtl = Math.round(
    grossPricePerQtl * decayProfile.dailyFreshnessDiscountPct * dayOffset * 10
  ) / 10;

  // 6. AsliDaam Net Realisation per quintal
  const asliDaamPerQtl = Math.round(
    (grossPricePerQtl
      - roadFreightPerQtl
      - apmcCessPerQtl
      - hamaliAndTolaiPerQtl
      - holdingAndSpoilagePerQtl
      - freshnessDiscountPerQtl) * 10
  ) / 10;

  // 7. Total wallet rupees for quantity Q
  const totalGrossValue = Math.round(grossPricePerQtl * quantityQuintals);
  const totalTransportCost = Math.round(roadFreightPerQtl * quantityQuintals);
  const totalApmcDeductions = Math.round((apmcCessPerQtl + hamaliAndTolaiPerQtl) * quantityQuintals);
  const totalHoldingSpoilageLoss = Math.round(holdingAndSpoilagePerQtl * quantityQuintals);
  const totalFreshnessDiscount = Math.round(freshnessDiscountPerQtl * quantityQuintals);
  const totalNetPayout = Math.round(asliDaamPerQtl * quantityQuintals);

  return {
    market,
    dayOffset,
    grossPricePerQtl,
    roadFreightPerQtl,
    apmcCessPerQtl,
    hamaliAndTolaiPerQtl,
    holdingAndSpoilagePerQtl,
    storageRentPerQtl,
    physicalDecayLossPerQtl,
    freshnessDiscountPerQtl,
    asliDaamPerQtl,
    quantityQuintals,
    totalGrossValue,
    totalTransportCost,
    totalApmcDeductions,
    totalHoldingSpoilageLoss,
    totalFreshnessDiscount,
    totalNetPayout,
    netGainPerQtlVsDefault: 0,
    totalPocketGainVsDefault: 0,
    isRecommended: false,
    isBaseline: false,
    isStaleOrAbstained,
    abstentionReason
  };
}

/**
 * A candidate mandi fed into the AsliDaam grid.
 * `expectedPriceByDay` carries the REAL backend forecast trajectory (index = day offset).
 */
export interface AsliDaamCandidate {
  market: Market;
  currentModalPrice: number;
  roadDistKm: number;
  isStale?: boolean;
  staleReason?: string;
  /** Genuine backend forecast gross modal price for day offsets 0..3. */
  expectedPriceByDay?: number[];
}

export interface AsliDaamOptimizationResult {
  commodity: string;
  quantityQuintals: number;
  baseline: AsliDaamBreakdown;
  recommended: AsliDaamBreakdown;
  allCombinations: AsliDaamBreakdown[];
  totalPocketCashGain: number; // ₹ extra in pocket vs baseline
  gainPerQtl: number;
  /** Backend decision-policy action this optimisation was synchronised with. */
  policyAction: RecommendationAction | 'UNCONSTRAINED';
  /** Maximum day offset the recommendation was allowed to use. */
  maxDayOffsetAllowed: number;
  isAbstained: boolean;
  abstentionNote?: string;
  decayProfile: CropDecayProfile;
  headlineSummary: {
    en: string;
    mr: string;
    hi: string;
  };
}

const MAX_DAY_OFFSET = 3;

/**
 * Maps the backend decision-policy action to the maximum day offset AsliDaam may recommend.
 * This guarantees the Decision Hub headline can never contradict the ML/heuristic policy.
 */
export function policyActionToMaxDayOffset(action?: RecommendationAction | null): number {
  switch (action) {
    case 'SELL_TODAY':
      return 0;
    case 'WAIT_1_DAY':
      return 1;
    case 'WAIT_2_DAYS':
      return 2;
    case 'WAIT_3_DAYS':
      return 3;
    case 'NO_RECOMMENDATION':
      return 0;
    default:
      return MAX_DAY_OFFSET;
  }
}

function buildAbstainedResult(
  commodity: string,
  quantityQuintals: number,
  policyAction: RecommendationAction | 'UNCONSTRAINED',
  decayProfile: CropDecayProfile
): AsliDaamOptimizationResult {
  const placeholderMarket: Market = {
    id: 'none',
    name: 'No Eligible Mandi',
    state: 'Maharashtra',
    district: '—',
    lat: 0,
    lon: 0,
    estimatedRoadDistanceKm: 0
  };
  const empty = calculateAsliDaamForMandiDay(
    placeholderMarket, commodity, quantityQuintals, 0, 0, 0, 0, true,
    'No candidate mandi within the search radius has verifiable price data.'
  );
  empty.isBaseline = true;

  return {
    commodity,
    quantityQuintals,
    baseline: empty,
    recommended: empty,
    allCombinations: [],
    totalPocketCashGain: 0,
    gainPerQtl: 0,
    policyAction,
    maxDayOffsetAllowed: 0,
    isAbstained: true,
    abstentionNote: 'No candidate mandi within the search radius has verifiable price data. MandiMitra abstains rather than guess.',
    decayProfile,
    headlineSummary: {
      en: 'No reliable mandi data in range — MandiMitra abstains rather than guess.',
      mr: 'परिसरात विश्वसनीय बाजार माहिती नाही — अंदाज लावण्याऐवजी मंडीमित्र सल्ला देत नाही.',
      hi: 'क्षेत्र में विश्वसनीय मंडी डेटा नहीं — अनुमान लगाने के बजाय मंडीमित्र सलाह नहीं देता.'
    }
  };
}

/**
 * Runs the complete AsliDaam joint optimization across Mandi × Day (0..3) grid.
 *
 * @param candidateMandis Candidates carrying the REAL backend forecast trajectory.
 * @param policyAction    Backend decision-policy action to synchronise the headline with.
 */
export function runAsliDaamOptimization(
  candidateMandis: AsliDaamCandidate[],
  commodity: string = 'Onion',
  quantityQuintals: number = 25,
  transportCostPerKmPerQtl: number = 3.0,
  policyAction?: RecommendationAction | null
): AsliDaamOptimizationResult {
  const decayProfile = getCropDecayProfile(commodity);
  const effectivePolicy: RecommendationAction | 'UNCONSTRAINED' = policyAction || 'UNCONSTRAINED';
  const maxDayOffsetAllowed = policyActionToMaxDayOffset(policyAction);

  if (!candidateMandis || candidateMandis.length === 0) {
    return buildAbstainedResult(commodity, quantityQuintals, effectivePolicy, decayProfile);
  }

  const allCombinations: AsliDaamBreakdown[] = [];

  // Sort candidate mandis by distance to identify the default local mandi
  const sortedByDist = [...candidateMandis].sort((a, b) => a.roadDistKm - b.roadDistKm);
  const defaultCandidate = sortedByDist[0];

  // Evaluate every combination: mandi × day 0..3 using the genuine forecast trajectory
  for (const cand of candidateMandis) {
    for (let day = 0; day <= MAX_DAY_OFFSET; day++) {
      // ZERO-MOCK: use the backend forecast price for this day. If the backend supplied no
      // trajectory, hold the price FLAT — never invent an appreciation curve.
      const trajectoryPrice = cand.expectedPriceByDay && cand.expectedPriceByDay.length > day
        ? cand.expectedPriceByDay[day]
        : undefined;
      const expectedPrice = (trajectoryPrice !== undefined && Number.isFinite(trajectoryPrice))
        ? trajectoryPrice
        : cand.currentModalPrice;

      allCombinations.push(
        calculateAsliDaamForMandiDay(
          cand.market,
          commodity,
          quantityQuintals,
          day,
          expectedPrice,
          transportCostPerKmPerQtl,
          cand.roadDistKm,
          cand.isStale || false,
          cand.staleReason
        )
      );
    }
  }

  // Baseline is nearest mandi at Day 0
  const baseline = allCombinations.find(
    c => c.market.id === defaultCandidate.market.id && c.dayOffset === 0
  ) || allCombinations[0];
  baseline.isBaseline = true;

  // Only non-abstained mandis within the policy-allowed horizon are eligible to be recommended
  const eligibleCombinations = allCombinations.filter(
    c => !c.isStaleOrAbstained && c.dayOffset <= maxDayOffsetAllowed
  );

  let recommended: AsliDaamBreakdown;
  let isAbstained = false;
  let abstentionNote: string | undefined;

  if (eligibleCombinations.length === 0) {
    recommended = baseline;
    isAbstained = true;
    abstentionNote = 'Every candidate mandi in range failed the data-quality gate. Showing the nearest local mandi for reference only.';
  } else {
    recommended = eligibleCombinations.reduce(
      (best, curr) => (curr.totalNetPayout > best.totalNetPayout ? curr : best),
      eligibleCombinations[0]
    );

    // Friction guard: do not send a farmer travelling or waiting for a trivial gain (< ₹20/qtl)
    const minGainThreshold = 20.0 * quantityQuintals;
    const baselineIsEligible = !baseline.isStaleOrAbstained && baseline.dayOffset <= maxDayOffsetAllowed;
    if (baselineIsEligible && recommended.totalNetPayout - baseline.totalNetPayout < minGainThreshold) {
      recommended = baseline;
    }
  }

  recommended.isRecommended = true;

  // Annotate all combinations with gain vs baseline
  for (const c of allCombinations) {
    c.netGainPerQtlVsDefault = Math.round((c.asliDaamPerQtl - baseline.asliDaamPerQtl) * 10) / 10;
    c.totalPocketGainVsDefault = Math.round(c.totalNetPayout - baseline.totalNetPayout);
  }

  const totalPocketCashGain = Math.max(0, recommended.totalNetPayout - baseline.totalNetPayout);
  const gainPerQtl = Math.max(0, Math.round((recommended.asliDaamPerQtl - baseline.asliDaamPerQtl) * 10) / 10);

  // Multilingual headlines — day 0 is stated unequivocally as "Sell Today / आजच विका"
  const isWait = recommended.dayOffset > 0;
  const mandiName = recommended.market.name;
  const mandiNameMr = translateMandiName(mandiName, 'mr');
  const mandiNameHi = translateMandiName(mandiName, 'hi');
  const days = recommended.dayOffset;

  const toDevDigits = (val: number | string) => {
    const digits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return String(val).replace(/[0-9]/g, d => digits[parseInt(d, 10)]);
  };

  let headlineEn = `Sell Today at ${mandiName} APMC`;
  let headlineMr = `आजच विका — ${mandiNameMr} कृषी उत्पन्न बाजार समितीत`;
  let headlineHi = `आज ही बेचें — ${mandiNameHi} मंडी में`;

  if (isWait && totalPocketCashGain > 0) {
    const daysMr = toDevDigits(days);
    const daysHi = toDevDigits(days);
    const gainMr = toDevDigits(totalPocketCashGain.toLocaleString('en-IN'));
    const gainHi = toDevDigits(totalPocketCashGain.toLocaleString('en-IN'));
    headlineEn = `Wait ${days} Day${days > 1 ? 's' : ''}, Sell at ${mandiName} APMC: +₹${totalPocketCashGain.toLocaleString('en-IN')} Extra in Pocket`;
    headlineMr = `${daysMr} दिवस थांबा, ${mandiNameMr} येथे विका: खिशात +₹${gainMr} जास्तीचा निव्वळ नफा`;
    headlineHi = `${daysHi} दिन रुकें, ${mandiNameHi} में बेचें: जेब में +₹${gainHi} अतिरिक्त फायदा`;
  }

  if (isAbstained) {
    headlineEn = 'No reliable mandi data in range — MandiMitra abstains rather than guess.';
    headlineMr = 'परिसरात विश्वसनीय बाजार माहिती नाही — अंदाज लावण्याऐवजी मंडीमित्र सल्ला देत नाही.';
    headlineHi = 'क्षेत्र में विश्वसनीय मंडी डेटा नहीं — अनुमान लगाने के बजाय मंडीमित्र सलाह नहीं देता.';
  }

  return {
    commodity,
    quantityQuintals,
    baseline,
    recommended,
    allCombinations,
    totalPocketCashGain,
    gainPerQtl,
    policyAction: effectivePolicy,
    maxDayOffsetAllowed,
    isAbstained,
    abstentionNote,
    decayProfile,
    headlineSummary: {
      en: headlineEn,
      mr: headlineMr,
      hi: headlineHi
    }
  };
}

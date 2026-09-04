/**
 * MandiMitra Domain Contracts
 * Canonical data structures for agricultural markets, time-series prices,
 * and algorithmic evaluation outputs.
 * 
 * OWNER: Amay (Team Lead)
 * STATUS: FROZEN
 */

export interface Crop {
  id: string;
  name: string;
  variety?: string;
  category: 'Cereals' | 'Pulses' | 'Vegetables' | 'Oilseeds' | 'Spices';
  standardUnit: 'quintal';
}

export interface Market {
  id: string;
  name: string;
  state: string;
  district: string;
  lat: number;
  lon: number;
  estimatedRoadDistanceKm?: number;
}

export interface PriceObservation {
  source: 'data.gov.in-live' | 'ceda-historical' | 'kaggle-fallback' | 'agmarknet-verified-cache';
  market: Market;
  commodity: string;
  variety: string;
  grade: string;
  date: string; // ISO 8601 string: YYYY-MM-DD
  minPrice: number; // in INR per quintal
  maxPrice: number; // in INR per quintal
  modalPrice: number; // in INR per quintal
  arrivalQty?: number; // in quintals, where available (e.g. CEDA)
  retrievedAt: string; // ISO 8601 timestamp
}

export type DataQualityTier = 'GOOD' | 'MODERATE' | 'POOR';

/**
 * How the modal price backing an evaluation was established.
 * Peer-calibrated tiers are arithmetic combinations of real Agmarknet observations —
 * never invented constants — but they can never be graded GOOD.
 */
export type PriceProvenanceTier =
  | 'AGMARKNET_MARKET_OBSERVED'
  | 'HISTORICAL_SERIES_OBSERVED'
  | 'DISTRICT_PEER_CALIBRATED'
  | 'DIVISION_PEER_CALIBRATED'
  | 'STATE_BENCHMARK_CALIBRATED'
  | 'UNAVAILABLE';

/** Which evidence produced the coverage figure (the live feed is a single-day snapshot). */
export type CoverageSource = 'historical-series' | 'live-snapshot-recency' | 'peer-calibrated';

export interface DataQualityAssessment {
  tier: DataQualityTier;
  daysSinceLastReport: number;
  coverage30d: number; // percentage (0.0 to 100.0)
  missingDays: number; // count of non-reporting days in past 30 days
  isEligibleForRecommendation: boolean; // true if tier !== 'POOR'
  priceProvenance?: PriceProvenanceTier;
  coverageSource?: CoverageSource;
  observationCount?: number; // real Agmarknet records backing the price
  provenanceNote?: string;
}

export type ModelVersion = 'v0-heuristic' | 'v1-gbm';

/**
 * How the historical price series backing a forecast was established.
 * This is the primary data-provenance flag for temporal trend inference.
 */
export type HistorySource =
  | 'CEDA_OBSERVED'           // Verified historical observations from CEDA Agmarknet archive
  | 'HISTORICAL_CSV_OBSERVED' // Legacy CSV series from data/historical/ (simulated but weather-calibrated)
  | 'CURRENT_ONLY'            // Real current price exists but insufficient historical observations for trend
  | 'INSUFFICIENT'            // Not enough data of any kind for a meaningful evaluation
  | 'SYNTHETIC_DEMO';         // Explicitly synthetic data used only in test/demo fixtures

export interface DailyPriceForecast {
  day: number; // 0, 1, 2, 3
  expectedPrice: number; // INR per quintal
}

export interface Forecast {
  modelVersion: ModelVersion;
  expectedPriceByDay: DailyPriceForecast[];
  uncertainty: number; // Standard deviation / volatility buffer in INR
  historicalSlope7d: number; // ₹/day price rate of change
  /** How the historical observations that produced this forecast were sourced. */
  historySource: HistorySource;
  /** Number of real historical observations backing the slope/uncertainty. */
  historyObservationCount: number;
  /** ISO date of the earliest historical observation used. */
  historyStartDate?: string;
  /** ISO date of the latest historical observation used. */
  historyEndDate?: string;
  /** Whether temporal trend inference was permitted (true only with sufficient real history). */
  isForecastEligible: boolean;
  /** When trend inference was refused, the specific reason - shown to the farmer, not hidden. */
  forecastIneligibilityReason?: string;
}

export interface NetRealisation {
  market: Market;
  day: number; // 0 (today), 1, 2, 3
  expectedPrice: number; // INR per quintal
  transportCostPerQtl: number; // roadDistanceKm * costPerKm
  waitingCostPerQtl: number; // day * storageCostPerDay
  netRealisation: number; // expectedPrice - transportCostPerQtl - waitingCostPerQtl
}

export interface MarketEvaluation {
  market: Market;
  dataQuality: DataQualityAssessment;
  forecast: Forecast;
  netRealisationByDay: NetRealisation[];
  /** How the historical price data for this market was sourced. */
  historySource: HistorySource;
  /** Number of real historical observations available for this market/commodity. */
  historyObservationCount: number;
}

export type RecommendationAction = 
  | 'SELL_TODAY'
  | 'WAIT_1_DAY'
  | 'WAIT_2_DAYS'
  | 'WAIT_3_DAYS'
  | 'NO_RECOMMENDATION';

export type ConfidenceTier = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Recommendation {
  action: RecommendationAction;
  market?: Market | null;
  confidence?: ConfidenceTier;
  expectedGainPerQtl?: number; // In INR vs naive selling today at closest market
  riskAdjustedGainPerQtl?: number;
  reasons: string[]; // Deterministic template-generated explanation strings
  alternativeMarket?: Market | null; // Nearest market with better data if abstaining
}

export interface BacktestResult {
  commodity: string;
  modelVersion: ModelVersion;
  evaluatedDays: number;
  avgNetRealisation: number; // INR/quintal
  baselineNetRealisation: number; // INR/quintal (naive sell-today strategy)
  netGainVsBaseline: number; // avgNetRealisation - baselineNetRealisation
  directionalAccuracy: number; // Percentage (0.0 to 100.0)
  coverage: number; // Reporting coverage of the held-out window (% of calendar days with a quote)
  evaluatedPeriod: {
    start: string;
    end: string;
  };
  /** Mandi whose series was backtested. */
  mandi?: string;
  /** Naive persistence baseline's directional accuracy, for an honest edge comparison. */
  persistenceBaselineAccuracy?: number;
  /** directionalAccuracy - persistenceBaselineAccuracy, in percentage points. */
  accuracyEdgePts?: number;
  waitRecommendations?: number;
  profitableWaitRatePct?: number;
  topPredictiveFeatures?: Array<{ feature: string; importancePct: number }>;
}

/**
 * Nirnay Kawach (Decision Shield) — Decision Stress-Testing Contracts
 */
export type DecisionRobustnessStatus = 'ROBUST' | 'CLOSE_CALL' | 'NO_STRONG_RECOMMENDATION';

export interface NirnayKawachResult {
  status: DecisionRobustnessStatus;
  statusLabel: string;
  robustnessScore: number;
  robustnessPct: number;
  currentTransportRate: number;
  breakevenTransportRate: number | null;
  breakevenMarginPct?: number;
  breakevenExplanation: string;
  simulationsCount: number;
  winningMarket: {
    id: string;
    name: string;
    day: number;
    expectedNetRealisation: number;
  };
  topAlternative?: {
    id: string;
    name: string;
    day: number;
    expectedNetRealisation: number;
    marginDiffPerQtl: number;
  } | null;
  decisionMessage: string;
  sliderBounds: {
    min: number;
    max: number;
    current: number;
    breakeven: number;
    step: number;
  };
}

/**
 * Bhed Vivek (Crowd-Aware / Market Congestion Intelligence)
 */
export type SupplyPressureLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type CongestionRiskStatus = 'LOW_RISK' | 'HIGH_RISK' | 'UNKNOWN';

/**
 * Where the arrival-pressure figure driving a congestion evaluation came from.
 * `FORECAST` is MandiMitra's own per-mandi prediction; `USER_OVERRIDE` is a what-if the farmer
 * selected manually. The two must never be confused when the result is shown.
 */
export type SupplyPressureBasis = 'FORECAST' | 'USER_OVERRIDE';

export interface BhedVivekEvaluation {
  status: CongestionRiskStatus;
  statusLabel: string;
  supplyPressure: SupplyPressureLevel;
  supplyPressureNumeric: number; // Predicted arrival-pressure score in 0..1
  /** Whether supplyPressure was predicted by the rush forecast or overridden by the farmer. */
  supplyPressureBasis: SupplyPressureBasis;
  /** Per-mandi rush forecasts backing this evaluation (empty when overridden without forecasts). */
  rushForecasts?: import('../core/mandi-rush').MandiRushForecast[];
  /** The rush forecast for the mandi actually recommended. */
  winnerRushForecast?: import('../core/mandi-rush').MandiRushForecast | null;
  originalWinner: {
    marketId: string;
    marketName: string;
    day: number;
    normalNrv: number;
    grossPrice: number;
  };
  adjustedWinner: {
    marketId: string;
    marketName: string;
    day: number;
    adjustedNrv: number;
    adjustedGrossPrice: number;
  };
  isFlipped: boolean;
  congestionImpactPerQtl: number;
  totalPocketImpact: number;
  pcs: number;
  absorptionCapacity: string;
  alertMessage: string;
  diversionAdvice?: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}



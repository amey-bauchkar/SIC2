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
  source: 'data.gov.in-live' | 'ceda-historical' | 'kaggle-fallback';
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

export interface DataQualityAssessment {
  tier: DataQualityTier;
  daysSinceLastReport: number;
  coverage30d: number; // percentage (0.0 to 100.0)
  missingDays: number; // count of non-reporting days in past 30 days
  isEligibleForRecommendation: boolean; // true if tier !== 'POOR'
}

export type ModelVersion = 'v0-heuristic' | 'v1-gbm';

export interface DailyPriceForecast {
  day: number; // 0, 1, 2, 3
  expectedPrice: number; // INR per quintal
}

export interface Forecast {
  modelVersion: ModelVersion;
  expectedPriceByDay: DailyPriceForecast[];
  uncertainty: number; // Standard deviation / volatility buffer in INR
  historicalSlope7d: number; // ₹/day price rate of change
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
  coverage: number; // Percentage of days system gave advice vs abstaining
  evaluatedPeriod: {
    start: string;
    end: string;
  };
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


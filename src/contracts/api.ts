/**
 * MandiMitra API Request & Response Contracts
 * Defines strict JSON schemas for REST communication between Client and Backend.
 * 
 * OWNER: Amay (Team Lead)
 * STATUS: FROZEN
 */

import { 
  Market, 
  PriceObservation, 
  MarketEvaluation, 
  Recommendation, 
  BacktestResult,
  ModelVersion 
} from './domain';

// ==========================================
// 1. /api/markets/nearby
// ==========================================
export interface NearbyMarketsRequestQuery {
  lat: number;
  lon: number;
  radiusKm?: number;
}

export interface NearbyMarketsResponse {
  markets: Market[];
  radiusKm: number;
  count: number;
}

// ==========================================
// 2. /api/prices/live
// ==========================================
export interface LivePriceRequestQuery {
  marketId: string;
  commodity: string;
}

export interface LivePriceResponse {
  priceObservation: PriceObservation;
  isStale: boolean;
  sourceNote: string;
}

// ==========================================
// 3. /api/evaluate
// ==========================================
export interface EvaluateRequestBody {
  commodity: string;
  latitude: number;
  longitude: number;
  transportCostPerKmPerQtl?: number; // Optional override; defaults to config
  storageCostPerDayPerQtl?: number;  // Optional override; defaults to config
  radiusKm?: number;                 // Optional override; defaults to 100km
}

export interface EvaluateResponse {
  recommendation: Recommendation;
  evaluations: MarketEvaluation[];
  commodity: string;
  evaluatedAt: string; // ISO 8601 timestamp
  modelVersion: ModelVersion;
  userParameters: {
    transportCostPerKmPerQtl: number;
    storageCostPerDayPerQtl: number;
    radiusKm: number;
  };
  nirnayKawach?: import('./domain').NirnayKawachResult;
  bhedVivek?: import('./domain').BhedVivekEvaluation;
}

// ==========================================
// 4. /api/evaluate/stress-test (Live Slider)
// ==========================================
export interface StressTestRequestBody {
  commodity: string;
  latitude: number;
  longitude: number;
  transportCostPerKmPerQtl: number; // Slider value
  storageCostPerDayPerQtl?: number;
  radiusKm?: number;
}

export interface StressTestResponse {
  activeTransportRate: number;
  winningMarket: {
    id: string;
    name: string;
    day: number;
    expectedNetRealisation: number;
  };
  isFlipped: boolean;
  flippedFromOriginal: boolean;
  breakevenTransportRate: number | null;
  status: import('./domain').DecisionRobustnessStatus;
  statusLabel: string;
  allEvaluations: Array<{
    marketId: string;
    marketName: string;
    day: number;
    netRealisation: number;
  }>;
}

// ==========================================
// 5. /api/bhed-vivek/analyze (Congestion Intelligence)
// ==========================================
export interface BhedVivekRequestBody {
  commodity: string;
  latitude?: number;
  longitude?: number;
  quantityQuintals?: number;
  supplyPressure?: import('./domain').SupplyPressureLevel;
  transportCostPerKmPerQtl?: number;
  storageCostPerDayPerQtl?: number;
  radiusKm?: number;
}

export type BhedVivekResponse = import('./domain').BhedVivekEvaluation;

// ==========================================
// 4. /api/backtest
// ==========================================
export interface BacktestRequestQuery {
  commodity: string;
  modelVersion?: ModelVersion;
}

export interface BacktestResponse {
  result: BacktestResult;
  citationNotice: string; // CEDA required attribution notice
}

// ==========================================
// Standard Error Envelope
// ==========================================
export interface ApiErrorResponse {
  error: {
    code: 'BAD_REQUEST' | 'NOT_FOUND' | 'UPSTREAM_FAILURE' | 'INTERNAL_ERROR';
    message: string;
    details?: Record<string, unknown>;
  };
}

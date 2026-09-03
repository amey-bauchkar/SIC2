/**
 * MandiMitra Shared Frontend Contracts
 * Component interface definitions, global client state, and navigation routing types.
 * 
 * OWNER: Janhvi (Frontend Lead)
 * STATUS: FROZEN
 */

import { 
  Market, 
  Recommendation, 
  DataQualityAssessment, 
  MarketEvaluation, 
  BacktestResult 
} from './domain';
import { EvaluateResponse } from './api';

export type AppRoute = 
  | '/'
  | '/hub'
  | '/markets'
  | '/decision'
  | '/evidence'
  | '/backtest'
  | '/settings';

export interface UserLocation {
  district: string;
  lat: number;
  lon: number;
}

export interface UserCostConfig {
  transportCostPerKmPerQtl: number;
  storageCostPerDayPerQtl: number;
  searchRadiusKm: number;
}

export interface AppState {
  currentRoute: AppRoute;
  selectedCrop: string;
  harvestQuantityQuintals?: number;
  userLocation: UserLocation | null;
  costConfig: UserCostConfig;
  evaluationData: EvaluateResponse | null;
  isLoading: boolean;
  errorMessage: string | null;
}

// ==========================================
// Shared UI Component Contracts (Janhvi Owned)
// ==========================================

export interface DecisionCardProps {
  recommendation: Recommendation;
  commodity: string;
  onViewEvidenceClick?: () => void;
  onSelectAnotherCropClick?: () => void;
}

export interface QualityBadgeProps {
  assessment: DataQualityAssessment;
  compact?: boolean;
}

export interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  variant?: 'positive' | 'neutral' | 'warning' | 'negative';
}

export interface MarketListCardProps {
  evaluation: MarketEvaluation;
  isRecommended: boolean;
  onMarketSelect?: (market: Market) => void;
}

export interface BacktestSummaryProps {
  backtest: BacktestResult;
  citationNotice: string;
}

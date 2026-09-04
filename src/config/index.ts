/**
 * MandiMitra Central Configuration
 * Centralizes environment variables, algorithmic hyper-parameters, and model feature flags.
 * 
 * OWNER: Amay (Team Lead)
 */

import dotenv from 'dotenv';
dotenv.config();

export interface SystemConfig {
  env: 'development' | 'production' | 'test';
  port: number;
  frontendPort: number;
  apiBaseUrl: string;
  dataGovInApiKey: string;
  
  // Supabase Cloud Database Credentials
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  
  // Algorithmic Hyper-parameters (Frozen before build)
  defaultTransportCostPerKmPerQtl: number;
  defaultStorageCostPerDayPerQtl: number;
  decisionRiskK: number;
  decisionGainThreshold: number;
  maxSearchRadiusKm: number;
  roadDistanceFactor: number;

  // Feature Flags
  enableV1Gbm: boolean; // Swap between v0-heuristic and v1-gbm
}

export const config: SystemConfig = {
  env: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  frontendPort: parseInt(process.env.FRONTEND_PORT || '3000', 10),
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3001/api',
  dataGovInApiKey: process.env.DATA_GOV_IN_API_KEY || '',

  supabaseUrl: process.env.SUPABASE_URL || 'https://xxlmtxojlamouifxguzr.supabase.co',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  defaultTransportCostPerKmPerQtl: parseFloat(process.env.DEFAULT_TRANSPORT_COST_PER_KM_QTL || '2.5'),
  defaultStorageCostPerDayPerQtl: parseFloat(process.env.DEFAULT_STORAGE_COST_PER_DAY_QTL || '0.45'),
  decisionRiskK: parseFloat(process.env.DECISION_RISK_K || '0.5'),
  decisionGainThreshold: parseFloat(process.env.DECISION_GAIN_THRESHOLD || '20.0'),
  maxSearchRadiusKm: parseFloat(process.env.MAX_SEARCH_RADIUS_KM || '120.0'),
  roadDistanceFactor: parseFloat(process.env.ROAD_DISTANCE_FACTOR || '1.35'),

  enableV1Gbm: process.env.ENABLE_V1_GBM === 'true'
};

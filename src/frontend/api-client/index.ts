/**
 * MandiMitra Client API Boundary
 * Strongly-typed HTTP client wrapping backend endpoints.
 *
 * Provides uniform interface so frontend does not know if data is live, cached,
 * or served from local offline stores.
 */

import {
  EvaluateRequestBody,
  EvaluateResponse,
  NearbyMarketsResponse,
  LivePriceResponse,
  BacktestResponse,
  StressTestRequestBody,
  StressTestResponse,
  BhedVivekRequestBody
} from '../../contracts/api';
import { BhedVivekEvaluation } from '../../contracts/domain';
// Type-only imports: erased at compile time, so the browser bundle never pulls in the
// Node-only (`fs`/`path`) internals of the SajhaBazaar engine.
import type { SajhaBazaarResult, SajhaFarmerProfile, SajhaClusterSummary, SajhaVehicleSpec } from '../../core/sajha-bazaar';
import type { VoiceExtraction } from '../../core/voice-extraction';

export interface SajhaBazaarEvaluateParams {
  commodity: string;
  latitude: number;
  longitude: number;
  district?: string;
  quantityQuintals: number;
  targetDate?: string;
  radiusKm?: number;
  matchRadiusKm?: number;
  requesterName?: string;
  requesterVillage?: string;
  transportCostPerKmPerQtl?: number;
  storageCostPerDayPerQtl?: number;
}

export interface SajhaRosterResponse {
  isSynthetic: boolean;
  syntheticNotice: string;
  farmerCount: number;
  crops: string[];
  clusters: SajhaClusterSummary[];
  farmers: SajhaFarmerProfile[];
  vehicleEconomics: {
    vehicles: SajhaVehicleSpec[];
    fuelCostSharePct: number;
    roundTripFactor: number;
    perAdditionalPickupKm: number;
    costModel: string;
    ratePerKmDerivation: string;
  };
}

export interface VoiceProcessResult {
  ok: boolean;
  extraction: VoiceExtraction;
  pipeline: {
    sttProvider: string;
    sttStatus: string;
    sttDetail?: string;
    nluProvider: string;
    nluStatus: string;
    nluDetail?: string;
    usedFallback: boolean;
  };
  unitConversionTable: Record<string, number>;
  hint?: string;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  private async postJson<T>(path: string, body: unknown, label: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      throw new Error(`${label} failed: ${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }

  public async getNearbyMarkets(lat: number, lon: number, radiusKm: number = 100): Promise<NearbyMarketsResponse> {
    const response = await fetch(`${this.baseUrl}/markets/nearby?lat=${lat}&lon=${lon}&radiusKm=${radiusKm}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch nearby markets: ${response.statusText}`);
    }
    return response.json();
  }

  public async getLivePrice(marketId: string, commodity: string): Promise<LivePriceResponse> {
    const response = await fetch(`${this.baseUrl}/prices/live?marketId=${encodeURIComponent(marketId)}&commodity=${encodeURIComponent(commodity)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch live price: ${response.statusText}`);
    }
    return response.json();
  }

  public async evaluate(params: EvaluateRequestBody): Promise<EvaluateResponse> {
    return this.postJson<EvaluateResponse>('/evaluate', params, 'Evaluation request');
  }

  /** Nirnay Kawach live transport-cost stress slider. */
  public async stressTest(params: StressTestRequestBody): Promise<StressTestResponse> {
    return this.postJson<StressTestResponse>('/evaluate/stress-test', params, 'Stress test request');
  }

  /** Bhed Vivek market-congestion scenario analysis. */
  public async analyzeBhedVivek(params: BhedVivekRequestBody): Promise<BhedVivekEvaluation> {
    return this.postJson<BhedVivekEvaluation>('/bhed-vivek/analyze', params, 'Bhed Vivek analysis');
  }

  /** SajhaBazaar shared-freight pooling evaluation. */
  public async evaluateSajhaBazaar(params: SajhaBazaarEvaluateParams): Promise<SajhaBazaarResult> {
    return this.postJson<SajhaBazaarResult>('/sajha-bazaar/evaluate', params, 'SajhaBazaar evaluation');
  }

  public async getSajhaRoster(): Promise<SajhaRosterResponse> {
    const response = await fetch(`${this.baseUrl}/sajha-bazaar/roster`);
    if (!response.ok) {
      throw new Error(`Failed to fetch SajhaBazaar roster: ${response.statusText}`);
    }
    return response.json();
  }

  /** Voice autofill: send a transcript or multiple candidate hypotheses. */
  public async processVoiceText(
    textOrCandidates: string | string[],
    sttSource: 'web-speech' | 'demo-chip' | 'typed' = 'typed',
    language: 'mr' | 'hi' | 'en' | 'auto' = 'auto'
  ): Promise<VoiceProcessResult> {
    const payload = Array.isArray(textOrCandidates)
      ? { candidates: textOrCandidates, text: textOrCandidates[0] || '', sttSource, language }
      : { text: textOrCandidates, sttSource, language };
    return this.postJson<VoiceProcessResult>('/voice/process', payload, 'Voice processing');
  }

  /** Voice autofill: send recorded audio for server-side Whisper transcription. */
  public async processVoiceAudio(blob: Blob, language: string = 'mr'): Promise<VoiceProcessResult> {
    const response = await fetch(`${this.baseUrl}/voice/process?language=${encodeURIComponent(language)}`, {
      method: 'POST',
      headers: { 'Content-Type': blob.type || 'audio/webm' },
      body: blob
    });
    if (!response.ok) {
      throw new Error(`Voice audio processing failed: ${response.statusText}`);
    }
    return response.json();
  }

  public async getBacktest(commodity: string): Promise<BacktestResponse> {
    const response = await fetch(`${this.baseUrl}/backtest?commodity=${encodeURIComponent(commodity)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch backtest results: ${response.statusText}`);
    }
    return response.json();
  }
}

export const apiClient = new ApiClient();

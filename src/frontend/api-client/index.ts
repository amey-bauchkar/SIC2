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
  BacktestResponse 
} from '../../contracts/api';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
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
    const response = await fetch(`${this.baseUrl}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!response.ok) {
      throw new Error(`Evaluation request failed: ${response.statusText}`);
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

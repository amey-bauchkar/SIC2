/**
 * MandiMitra Client State Store
 * Lightweight reactive store holding session state, crop selection, and evaluation payload.
 * 
 * OWNER: Janhvi (Frontend Lead)
 */

import { AppState, AppRoute, UserCostConfig } from '../../contracts/frontend';
import { EvaluateResponse } from '../../contracts/api';
import { Language } from '../i18n';

type StateListener = (state: AppState) => void;

const DEFAULT_COST_CONFIG: UserCostConfig = {
  transportCostPerKmPerQtl: 3.0,
  storageCostPerDayPerQtl: 10.0,
  searchRadiusKm: 100.0
};

class Store {
  private state: AppState = {
    currentRoute: '/',
    selectedCrop: 'Onion',
    harvestQuantityQuintals: 25,
    userLocation: {
      district: 'Nashik',
      lat: 19.9975,
      lon: 73.7898
    },
    costConfig: { ...DEFAULT_COST_CONFIG },
    evaluationData: null,
    isLoading: false,
    errorMessage: null,
    language: (typeof localStorage !== 'undefined' && (localStorage.getItem('mm_lang') as Language)) || 'mr'
  };


  private listeners: StateListener[] = [];

  public getState(): AppState {
    return { ...this.state };
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    const currentState = this.getState();
    this.listeners.forEach(listener => listener(currentState));
  }

  public setRoute(route: AppRoute): void {
    this.state.currentRoute = route;
    this.notify();
  }

  public setSelectedCrop(crop: string): void {
    this.state.selectedCrop = crop;
    this.notify();
  }

  public setHarvestQuantity(qty: number): void {
    this.state.harvestQuantityQuintals = qty;
    this.notify();
  }

  public setUserLocation(lat: number, lon: number, district: string): void {
    this.state.userLocation = { lat, lon, district };
    this.notify();
  }

  public updateCostConfig(config: Partial<UserCostConfig>): void {
    this.state.costConfig = { ...this.state.costConfig, ...config };
    this.notify();
  }

  public setEvaluationData(data: EvaluateResponse | null): void {
    this.state.evaluationData = data;
    this.state.isLoading = false;
    this.state.errorMessage = null;
    this.notify();
  }

  public setLoading(loading: boolean): void {
    this.state.isLoading = loading;
    this.notify();
  }

  public setError(message: string | null): void {
    this.state.errorMessage = message;
    this.state.isLoading = false;
    this.notify();
  }

  public setLanguage(lang: Language): void {
    this.state.language = lang;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('mm_lang', lang);
      }
    } catch {}
    this.notify();
  }
}


export const store = new Store();

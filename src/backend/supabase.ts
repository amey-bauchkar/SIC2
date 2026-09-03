/**
 * MandiMitra Backend: Supabase Cloud Database Client
 * Handles real-time farmer pooling (SajhaBazaar) and price alert subscriptions.
 * 
 * OWNER: Amay (Team Lead)
 * Architecture: Hybrid Edge + Cloud (with automatic offline fallback if Wi-Fi drops!)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xxlmtxojlamouifxguzr.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('[Supabase] Initialized cloud client with project:', SUPABASE_URL);
  } catch (err) {
    console.warn('[Supabase] Initialization failed, using local offline fallback:', err);
  }
}

export interface FarmerPoolRecord {
  id?: string;
  farmer_name: string;
  phone: string;
  village: string;
  taluka: string;
  crop: string;
  quantity_quintals: number;
  target_mandi: string;
  status?: string;
  created_at?: string;
}

export interface PriceAlertRecord {
  id?: string;
  phone: string;
  crop: string;
  target_mandi: string;
  trigger_price: number;
  status?: string;
  created_at?: string;
}

/**
 * Fetches active farmer pooling clusters from Supabase.
 * Falls back to data/farmer_pooling_profiles.json if Supabase is offline.
 */
export async function getFarmerPools(): Promise<{ data: FarmerPoolRecord[]; source: 'supabase' | 'local_cache' }> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('farmer_pools')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return { data: data as FarmerPoolRecord[], source: 'supabase' };
      }
    } catch (err) {
      console.warn('[Supabase] Fetch farmer_pools failed, falling back to local cache:', err);
    }
  }

  // Fallback to local verified farmer cluster
  try {
    const localPath = path.resolve(process.cwd(), 'data', 'farmer_pooling_profiles.json');
    if (fs.existsSync(localPath)) {
      const localJson = JSON.parse(fs.readFileSync(localPath, 'utf-8'));
      const fallbackRows: FarmerPoolRecord[] = (localJson.farmers || []).map((f: any) => ({
        id: f.farmer_id,
        farmer_name: f.name,
        phone: '9822012345',
        village: f.village,
        taluka: f.taluka,
        crop: f.crop,
        quantity_quintals: f.quantity_quintals,
        target_mandi: localJson.hub_mandi,
        status: 'open'
      }));
      return { data: fallbackRows, source: 'local_cache' };
    }
  } catch (err) {
    console.error('[Supabase] Local fallback failed:', err);
  }

  return { data: [], source: 'local_cache' };
}

/**
 * Inserts a new farmer into the shared pooling collective.
 */
export async function insertFarmerPool(record: FarmerPoolRecord): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase client not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('farmer_pools')
      .insert([record])
      .select();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown network error' };
  }
}

/**
 * Inserts a new farmer price trigger alert.
 */
export async function insertPriceAlert(alert: PriceAlertRecord): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase client not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('price_alerts')
      .insert([alert])
      .select();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown network error' };
  }
}

/**
 * Fetches all active price alerts.
 */
export async function getPriceAlerts(): Promise<PriceAlertRecord[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('price_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) return data as PriceAlertRecord[];
  } catch (err) {
    console.warn('[Supabase] Fetch price_alerts error:', err);
  }
  return [];
}

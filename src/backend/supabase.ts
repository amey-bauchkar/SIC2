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
 * Masks phone numbers to prevent PII exposure while retaining dial-code recognition.
 * e.g., "9822012345" -> "98220*****"
 */
export function maskPhoneNumber(phone: string): string {
  const p = String(phone || '').trim();
  if (p.length >= 10) {
    return p.slice(0, 5) + '*****';
  }
  return '98220*****';
}

/**
 * Fetches active farmer pooling clusters from Supabase.
 * Falls back to data/farmer_pooling_profiles.json if Supabase is offline.
 * Enforces strict PII phone number masking.
 */
export async function getFarmerPools(): Promise<{ data: FarmerPoolRecord[]; source: 'supabase' | 'local_cache' }> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('farmer_pools')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const masked = (data as FarmerPoolRecord[]).map(f => ({
          ...f,
          phone: maskPhoneNumber(f.phone)
        }));
        return { data: masked, source: 'supabase' };
      }
    } catch (err) {
      console.warn('[Supabase] Fetch farmer_pools failed, falling back to local cache:', err);
    }
  }

  // Fallback to local verified farmer cluster with PII masking
  try {
    const localPath = path.resolve(process.cwd(), 'data', 'farmer_pooling_profiles.json');
    if (fs.existsSync(localPath)) {
      const localJson = JSON.parse(fs.readFileSync(localPath, 'utf-8'));
      const fallbackRows: FarmerPoolRecord[] = (localJson.farmers || []).map((f: any) => ({
        id: f.farmer_id,
        farmer_name: f.name,
        phone: maskPhoneNumber(f.phone || '9822012345'),
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
 * Enforces strict schema validation against bot spam.
 */
export async function insertFarmerPool(record: any): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase client not configured' };
  }

  const rawPhone = String(record.phone || record.farmer_phone || '').trim();
  const cleanPhone = rawPhone.replace(/\D/g, '');
  if (cleanPhone.length !== 10) {
    return { success: false, error: 'Invalid phone number: exactly 10 digits required' };
  }

  const rawQty = Number(record.quantity_quintals || record.quantity);
  if (!Number.isFinite(rawQty) || rawQty < 0.5 || rawQty > 1000) {
    return { success: false, error: 'Invalid quantity: must be between 0.5 and 1000 quintals' };
  }

  // Normalize incoming fields to match Supabase schema exactly
  const cleanRecord: FarmerPoolRecord = {
    farmer_name: String(record.farmer_name || record.name || 'Farmer').trim().slice(0, 60),
    phone: cleanPhone,
    village: String(record.village || record.origin_village || 'Niphad').trim().slice(0, 60),
    taluka: String(record.taluka || 'Niphad').trim().slice(0, 60),
    crop: String(record.crop || record.commodity || 'Onion').trim().slice(0, 40),
    quantity_quintals: rawQty,
    target_mandi: String(record.target_mandi || record.destination_mandi || record.mandi || 'Lasalgaon').trim().slice(0, 60),
    status: record.status || 'open'
  };

  try {
    const { data, error } = await supabase
      .from('farmer_pools')
      .insert([cleanRecord])
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
 * Enforces strict schema validation.
 */
export async function insertPriceAlert(alert: any): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase client not configured' };
  }

  const rawPhone = String(alert.phone || alert.farmer_phone || '').trim();
  const cleanPhone = rawPhone.replace(/\D/g, '');
  if (cleanPhone.length !== 10) {
    return { success: false, error: 'Invalid phone number: exactly 10 digits required' };
  }

  const rawPrice = Number(alert.trigger_price || alert.threshold_price);
  if (!Number.isFinite(rawPrice) || rawPrice <= 0 || rawPrice > 100000) {
    return { success: false, error: 'Invalid trigger price: must be a positive number' };
  }

  // Normalize incoming fields to match Supabase schema exactly
  const cleanAlert: PriceAlertRecord = {
    phone: cleanPhone,
    crop: String(alert.crop || alert.commodity || 'Onion').trim().slice(0, 40),
    target_mandi: String(alert.target_mandi || alert.mandi || alert.market_id || 'lasalgaon').trim().slice(0, 60),
    trigger_price: rawPrice,
    status: alert.status || 'active'
  };

  try {
    const { data, error } = await supabase
      .from('price_alerts')
      .insert([cleanAlert])
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
 * Fetches all active price alerts with PII phone masking.
 */
export async function getPriceAlerts(): Promise<PriceAlertRecord[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('price_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return (data as PriceAlertRecord[]).map(a => ({
        ...a,
        phone: maskPhoneNumber(a.phone)
      }));
    }
  } catch (err) {
    console.warn('[Supabase] Fetch price_alerts error:', err);
  }
  return [];
}


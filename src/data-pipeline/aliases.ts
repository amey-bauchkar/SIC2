/**
 * MandiMitra Data Pipeline: Market & Commodity Alias Normalization
 * Reconciles casing, regional spelling variations, and suffix differences across Agmarknet/CEDA.
 * 
 * OWNER: Amay (Team Lead)
 * Scoped to target demo scope (Maharashtra APMCs & key commodities).
 */

export const MARKET_ALIASES: Record<string, string> = {
  // Lasalgaon
  'lasalgaon': 'lasalgaon',
  'lasalgaon(niphad)': 'lasalgaon',
  'lasalgaon apmc': 'lasalgaon',
  'lasalgaon_main': 'lasalgaon',
  
  // Pimpalgaon
  'pimpalgaon': 'pimpalgaon',
  'pimpalgaon baswant': 'pimpalgaon',
  'pimpalgaon(baswant)': 'pimpalgaon',
  'pimpalgaon apmc': 'pimpalgaon',

  // Yeola
  'yeola': 'yeola',
  'yeola apmc': 'yeola',

  // Nashik
  'nashik': 'nashik',
  'nashik apmc': 'nashik',

  // Pune
  'pune': 'pune',
  'pune apmc': 'pune',
  'pune(gultekdi)': 'pune'
};

export const COMMODITY_ALIASES: Record<string, string> = {
  'onion': 'Onion',
  'pyaz': 'Onion',
  'kanda': 'Onion',
  'tomato': 'Tomato',
  'tamatar': 'Tomato',
  'soyabean': 'Soyabean',
  'soybean': 'Soyabean',
  'wheat': 'Wheat',
  'gehun': 'Wheat',
  'gram': 'Gram',
  'chana': 'Gram'
};

export function normalizeMarketName(rawName: string): string {
  const clean = rawName.trim().toLowerCase();
  return MARKET_ALIASES[clean] || clean;
}

export function normalizeCommodity(rawName: string): string {
  const clean = rawName.trim().toLowerCase();
  return COMMODITY_ALIASES[clean] || rawName.trim();
}

/**
 * MandiMitra Backend: Live Agmarknet Client
 * Integrates with data.gov.in REST endpoint (Resource ID: 9ef84268-d588-465a-a308-a864a43d0070).
 * 
 * OWNER: Amay (Team Lead)
 * Handles DD/MM/YYYY date normalization, pagination limit, and circuit-breaker cache fallback.
 */

import { PriceObservation } from '../contracts/domain';
import { findMarketById } from '../data-pipeline/registry';
import { apiCache } from './cache';
import { config } from '../config';

const DATA_GOV_RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
const DATA_GOV_BASE_URL = 'https://api.data.gov.in/resource';

/**
 * Normalizes Indian DD/MM/YYYY dates to standard ISO YYYY-MM-DD.
 */
export function normalizeDateToIso(rawDate: string): string {
  const parts = rawDate.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return rawDate;
}

export async function fetchLiveMandiPrice(
  marketId: string,
  commodity: string
): Promise<{ observation: PriceObservation; isStale: boolean }> {
  const cacheKey = `live-price-${marketId}-${commodity.toLowerCase()}`;
  const cached = apiCache.get<PriceObservation>(cacheKey);

  const market = findMarketById(marketId);
  if (!market) {
    throw new Error(`Market '${marketId}' not registered in regional registry.`);
  }

  // If cached and fresh (<1 hour), return immediately
  if (cached && !cached.isStale) {
    return { observation: cached.data, isStale: false };
  }

  // Attempt live data.gov.in query if API key is present
  if (config.dataGovInApiKey) {
    try {
      const url = new URL(`${DATA_GOV_BASE_URL}/${DATA_GOV_RESOURCE_ID}`);
      url.searchParams.set('api-key', config.dataGovInApiKey);
      url.searchParams.set('format', 'json');
      url.searchParams.set('limit', '10');
      url.searchParams.set('filters[market]', market.name);
      url.searchParams.set('filters[commodity]', commodity);

      const res = await fetch(url.toString());
      if (res.ok) {
        const json = await res.json();
        if (json.records && json.records.length > 0) {
          const rec = json.records[0];
          const observation: PriceObservation = {
            source: 'data.gov.in-live',
            market,
            commodity,
            variety: rec.variety || 'Local',
            grade: rec.grade || 'FAQ',
            date: normalizeDateToIso(rec.arrival_date),
            minPrice: parseFloat(rec.min_price),
            maxPrice: parseFloat(rec.max_price),
            modalPrice: parseFloat(rec.modal_price),
            retrievedAt: new Date().toISOString()
          };

          apiCache.set(cacheKey, observation, 3600000); // 1 hour TTL
          return { observation, isStale: false };
        }
      }
    } catch (err) {
      console.warn(`Upstream data.gov.in fetch failed for ${marketId}:`, err);
    }
  }

  // Fallback 1: If memory cache exists (even stale), return with isStale: true
  if (cached) {
    return { observation: cached.data, isStale: true };
  }

  // Fallback 2: Check verified real Agmarknet price files on disk
  try {
    const fs = await import('fs');
    const path = await import('path');
    const commLower = commodity.toLowerCase();
    let priceFile = 'onion_maharashtra.json';
    if (commLower.includes('tomato')) priceFile = 'tomato_maharashtra.json';
    else if (commLower.includes('soya')) priceFile = 'soyabean_maharashtra.json';

    const diskPath = path.resolve(process.cwd(), 'data', 'prices', priceFile);
    if (fs.existsSync(diskPath)) {
      const pData = JSON.parse(fs.readFileSync(diskPath, 'utf-8'));
      const mNameLower = market.name.toLowerCase();
      const match = (pData.records || []).find((r: any) => {
        const rMarket = (r.market || '').toLowerCase();
        return rMarket.includes(mNameLower) || mNameLower.includes(rMarket);
      });

      if (match && match.modal_price) {
        const observation: PriceObservation = {
          source: 'agmarknet-verified-cache',
          market,
          commodity,
          variety: match.variety || 'Standard',
          grade: match.grade || 'FAQ',
          date: match.arrival_date || new Date().toISOString().split('T')[0],
          minPrice: Number(match.min_price || match.modal_price),
          maxPrice: Number(match.max_price || match.modal_price),
          modalPrice: Number(match.modal_price),
          retrievedAt: match.fetched_at || new Date().toISOString()
        };
        apiCache.set(cacheKey, observation, 3600000);
        return { observation, isStale: true };
      }
    }
  } catch (err) {
    console.warn(`Disk cache lookup failed for ${marketId}:`, err);
  }

  // If no verified record exists anywhere, throw an explicit error rather than inventing a price
  throw new Error(`NO_PRICE_DATA: No verified Agmarknet observation available for market '${market.name}' (${commodity}).`);
}

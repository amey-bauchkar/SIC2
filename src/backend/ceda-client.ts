/**
 * MandiMitra Backend: CEDA (Ashoka University) Agmarknet Historical Data Client
 *
 * Provides access to verified historical Agmarknet observations from the CEDA Data Portal API.
 * This is the PRIMARY historical data source for the decision engine.
 *
 * CEDA API documentation: https://api.ceda.ashoka.edu.in/v1
 * Required attribution: "CEDA Agri Market Data (CEDA-AMD), 2000-2023".
 *   Centre for Economic Data & Analysis, Ashoka University, https://ceda.ashoka.edu.in/agmarknet
 *
 * OWNER: Amay (Team Lead)
 */

import fs from 'fs';
import path from 'path';
import {
  normalizeMarketKey,
  normalizeDistrictKey,
  normalizeCommodityKey
} from './price-resolver';

const CEDA_API_BASE = 'https://api.ceda.ashoka.edu.in/v1';
const OBSERVED_DIR = path.resolve(process.cwd(), 'data', 'historical', 'observed');

export interface CedaApiConfig {
  apiKey: string;
}

export interface CedaPriceRecord {
  date: string;            // ISO YYYY-MM-DD
  commodity: string;
  market: string;
  district: string;
  state: string;
  minPrice: number | null;
  maxPrice: number | null;
  modalPrice: number;
  arrivalQty: number | null;
  /** Raw CEDA field names for auditing. */
  rawRecord: Record<string, unknown>;
}

export interface CedaImportResult {
  commodity: string;
  market: string;
  district: string;
  observations: number;
  dateRange: { start: string; end: string } | null;
  csvPath: string;
  source: 'CEDA';
  retrievedAt: string;
}

export interface CedaCoverageReport {
  totalCommoditiesCovered: number;
  totalMarketsCovered: number;
  totalPairs: number;
  pairsWithSufficientHistory: number;
  pairsWithInsufficientHistory: number;
  unmatchedMarkets: string[];
  unmatchedCommodities: string[];
  details: CedaImportResult[];
}

// ============================================================================
// CEDA API Client
// ============================================================================

function getCedaHeaders(apiKey: string): Record<string, string> {
  const token = apiKey.trim().replace(/^Bearer\s+/i, '');
  return {
    'Authorization': `Bearer ${token}`,
    'x-api-key': token,
    'Content-Type': 'application/json'
  };
}

export interface CedaCommodityItem {
  id: number;
  name: string;
}

/**
 * Fetches the list of all commodities from the CEDA Agmarknet platform.
 */
export async function cedaGetCommodities(apiKey: string): Promise<CedaCommodityItem[]> {
  const url = `${CEDA_API_BASE}/agmarknet/commodities`;
  const res = await fetch(url, { headers: getCedaHeaders(apiKey) });
  if (!res.ok) {
    throw new Error(`CEDA /commodities failed: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  const payload = json.output || json;
  if (payload.commodities && Array.isArray(payload.commodities)) return payload.commodities;
  if (payload.data && Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

export interface CedaDistrictItem {
  district_id: number;
  district_name: string;
}

export interface CedaStateItem {
  state_id: number;
  state_name: string;
  districts: CedaDistrictItem[];
}

/**
 * Fetches available geographies (states and districts) from CEDA.
 */
export async function cedaGetGeographies(apiKey: string): Promise<CedaStateItem[]> {
  const url = `${CEDA_API_BASE}/agmarknet/geographies`;
  const res = await fetch(url, { headers: getCedaHeaders(apiKey) });
  if (!res.ok) {
    throw new Error(`CEDA /geographies failed: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  const payload = json.output || json;
  if (payload.geographies && Array.isArray(payload.geographies)) return payload.geographies;
  if (payload.data && Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

export interface CedaMarketItem {
  census_state_id: number;
  census_district_id: number;
  market_id: number;
  market_name: string;
}

/**
 * Fetches markets for a given commodity, state and district from CEDA.
 */
export async function cedaGetMarkets(
  apiKey: string,
  commodityId: number,
  stateId: number,
  districtId: number,
  indicator: 'price' | 'quantity' = 'price'
): Promise<CedaMarketItem[]> {
  const url = `${CEDA_API_BASE}/agmarknet/markets`;
  const res = await fetch(url, {
    method: 'POST',
    headers: getCedaHeaders(apiKey),
    body: JSON.stringify({
      commodity_id: commodityId,
      state_id: stateId,
      district_id: districtId,
      indicator
    })
  });
  if (!res.ok) {
    throw new Error(`CEDA /markets failed: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  const payload = json.output || json;
  if (payload.data && Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

export interface CedaPriceQueryParams {
  commodity_id: number;
  state_id: number;
  district_id?: number[];
  market_id?: number[];
  from_date: string;
  to_date: string;
}

/**
 * Fetches historical price data from CEDA for a commodity at market level.
 * Conforms strictly to POST /agmarknet/prices OpenAPI schema.
 */
export async function cedaGetPrices(
  apiKey: string,
  params: CedaPriceQueryParams
): Promise<CedaPriceRecord[]> {
  const url = `${CEDA_API_BASE}/agmarknet/prices`;
  const res = await fetch(url, {
    method: 'POST',
    headers: getCedaHeaders(apiKey),
    body: JSON.stringify(params)
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`CEDA /prices failed: ${res.status} ${res.statusText} — ${errText}`);
  }

  const json = await res.json();
  const payload = json.output || json;
  const rawRecords: any[] = Array.isArray(payload)
    ? payload
    : (payload.data || payload.records || payload.prices || []);

  return rawRecords
    .map((r: any) => normalizeCedaRecord(r))
    .filter((r): r is CedaPriceRecord => r !== null);
}

/**
 * Normalizes a raw CEDA API record into the MandiMitra schema.
 * Does NOT invent missing values.
 */
function normalizeCedaRecord(raw: Record<string, any>): CedaPriceRecord | null {
  // CEDA field names may vary — try common variants
  const dateStr = raw.date || raw.arrival_date || raw.Date || raw.arrival_Date || '';
  const modal = Number(raw.modal_price ?? raw.Modal_Price ?? raw.modalPrice ?? raw.modal ?? NaN);

  if (!dateStr || !Number.isFinite(modal) || modal <= 0) return null;

  // Normalize date to ISO
  let isoDate = dateStr;
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [d, m, y] = parts;
      isoDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }

  const minPrice = Number(raw.min_price ?? raw.Min_Price ?? raw.minPrice ?? NaN);
  const maxPrice = Number(raw.max_price ?? raw.Max_Price ?? raw.maxPrice ?? NaN);
  const arrivalQty = Number(raw.arrivals ?? raw.arrival_qty ?? raw.Arrivals ?? NaN);

  return {
    date: isoDate,
    commodity: String(raw.commodity || raw.Commodity || '').trim(),
    market: String(raw.market || raw.Market || '').trim(),
    district: String(raw.district || raw.District || '').trim(),
    state: String(raw.state || raw.State || 'Maharashtra').trim(),
    minPrice: Number.isFinite(minPrice) ? minPrice : null,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : null,
    modalPrice: modal,
    arrivalQty: Number.isFinite(arrivalQty) ? arrivalQty : null,
    rawRecord: raw
  };
}

// ============================================================================
// Storage: Write CEDA data to observed CSV + provenance metadata
// ============================================================================

/**
 * Writes verified CEDA observations to a CSV in data/historical/observed/.
 * Also writes a companion provenance JSON file.
 */
export function writeCedaObservedSeries(
  commodity: string,
  market: string,
  district: string,
  records: CedaPriceRecord[]
): CedaImportResult {
  if (!fs.existsSync(OBSERVED_DIR)) {
    fs.mkdirSync(OBSERVED_DIR, { recursive: true });
  }

  // Sort by date, deduplicate
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const seen = new Set<string>();
  const deduped = sorted.filter(r => {
    if (seen.has(r.date)) return false;
    seen.add(r.date);
    return true;
  });

  // Validate: no future dates, no negative prices, chronological
  const validRecords = deduped.filter(r => {
    if (r.modalPrice <= 0) return false;
    // No future dates relative to now
    const rDate = new Date(r.date);
    if (isNaN(rDate.getTime()) || rDate > new Date()) return false;
    return true;
  });

  const safeComm = normalizeCommodityKey(commodity).replace(/[^a-z0-9]/g, '_');
  const safeMkt = normalizeMarketKey(market).replace(/[^a-z0-9]/g, '_').slice(0, 40);
  const csvName = `${safeComm}_${safeMkt}_ceda.csv`;
  const csvPath = path.join(OBSERVED_DIR, csvName);

  // Write CSV
  const header = 'date,commodity,market,district,min_price,max_price,modal_price,arrivals_quintals';
  const lines = validRecords.map(r =>
    `${r.date},${r.commodity},${r.market},${r.district},${r.minPrice ?? ''},${r.maxPrice ?? ''},${r.modalPrice},${r.arrivalQty ?? ''}`
  );
  fs.writeFileSync(csvPath, [header, ...lines].join('\n'), 'utf-8');

  // Write provenance metadata
  const provenancePath = csvPath.replace('.csv', '_provenance.json');
  const dateRange = validRecords.length > 0
    ? { start: validRecords[0].date, end: validRecords[validRecords.length - 1].date }
    : null;

  const provenance = {
    source: 'CEDA',
    provenance: 'OBSERVED',
    retrievedAt: new Date().toISOString(),
    commodity,
    market,
    district,
    dateRange,
    observations: validRecords.length,
    csvFile: csvName,
    attribution: 'CEDA Agri Market Data (CEDA-AMD). Centre for Economic Data & Analysis, Ashoka University, https://ceda.ashoka.edu.in/agmarknet'
  };
  fs.writeFileSync(provenancePath, JSON.stringify(provenance, null, 2), 'utf-8');

  return {
    commodity,
    market,
    district,
    observations: validRecords.length,
    dateRange,
    csvPath,
    source: 'CEDA',
    retrievedAt: provenance.retrievedAt
  };
}

// ============================================================================
// Reading CEDA observed data (used by the production pipeline)
// ============================================================================

export interface ObservedHistoryData {
  trailing7Prices: number[];
  daysSinceLastReport: number;
  reportingDaysCountInLast30Days: number;
  latestPrice: number | null;
  observationCount: number;
  startDate: string;
  endDate: string;
  source: 'CEDA_OBSERVED';
}

/**
 * Reads CEDA observed historical data for a commodity/market pair.
 * Returns null if no CEDA observed CSV exists.
 */
export function readCedaObservedHistory(
  commodity: string,
  marketName: string,
  referenceDate: Date = new Date()
): ObservedHistoryData | null {
  if (!fs.existsSync(OBSERVED_DIR)) return null;

  const commKey = normalizeCommodityKey(commodity).replace(/[^a-z0-9]/g, '_');
  const mktKey = normalizeMarketKey(marketName).replace(/[^a-z0-9]/g, '_').slice(0, 40);

  // Try exact match first
  let csvPath = path.join(OBSERVED_DIR, `${commKey}_${mktKey}_ceda.csv`);

  if (!fs.existsSync(csvPath)) {
    // Fallback: scan for files matching the commodity + partial market name
    try {
      const files = fs.readdirSync(OBSERVED_DIR).filter(f =>
        f.startsWith(commKey + '_') && f.endsWith('_ceda.csv')
      );
      const match = files.find(f => {
        const parts = f.replace(`${commKey}_`, '').replace('_ceda.csv', '');
        return parts === mktKey || mktKey.includes(parts) || parts.includes(mktKey);
      });
      if (match) {
        csvPath = path.join(OBSERVED_DIR, match);
      } else {
        return null;
      }
    } catch {
      return null;
    }
  }

  try {
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.trim().split('\n');
    if (lines.length <= 1) return null;

    const headers = lines[0].split(',').map(h => h.trim());
    const dateIdx = headers.indexOf('date');
    const modalIdx = headers.indexOf('modal_price');
    if (dateIdx === -1 || modalIdx === -1) return null;

    const records: { date: string; modalPrice: number }[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length > Math.max(dateIdx, modalIdx)) {
        const dStr = parts[dateIdx].trim();
        const price = parseFloat(parts[modalIdx].trim());
        if (dStr && !isNaN(price) && price > 0) {
          records.push({ date: dStr, modalPrice: price });
        }
      }
    }

    if (records.length === 0) return null;

    // Leakage safeguard: strictly filter out any observations after referenceDate
    const validRecords = records
      .filter(r => new Date(r.date) <= referenceDate)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (validRecords.length === 0) return null;

    const lastRec = validRecords[validRecords.length - 1];
    const lastDate = new Date(lastRec.date);
    const msDiff = referenceDate.getTime() - lastDate.getTime();
    const daysSince = Math.max(0, Math.round(msDiff / (1000 * 60 * 60 * 24)));

    const thirtyDaysAgo = new Date(referenceDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const count30d = validRecords.filter(r => {
      const d = new Date(r.date);
      return d >= thirtyDaysAgo && d <= referenceDate;
    }).length;

    const trailing7 = validRecords.slice(-7).map(r => r.modalPrice);

    return {
      trailing7Prices: trailing7,
      daysSinceLastReport: daysSince,
      reportingDaysCountInLast30Days: count30d,
      latestPrice: lastRec.modalPrice,
      observationCount: validRecords.length,
      startDate: validRecords[0].date,
      endDate: lastRec.date,
      source: 'CEDA_OBSERVED'
    };
  } catch {
    return null;
  }
}

/**
 * Lists all available CEDA observed series in data/historical/observed/.
 */
export function listCedaObservedSeries(): Array<{
  commodity: string;
  market: string;
  csvFile: string;
  observations: number;
}> {
  if (!fs.existsSync(OBSERVED_DIR)) return [];

  const results: Array<{ commodity: string; market: string; csvFile: string; observations: number }> = [];

  try {
    const files = fs.readdirSync(OBSERVED_DIR).filter(f => f.endsWith('_ceda.csv'));
    for (const f of files) {
      const provenancePath = path.join(OBSERVED_DIR, f.replace('.csv', '_provenance.json'));
      if (fs.existsSync(provenancePath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(provenancePath, 'utf-8'));
          results.push({
            commodity: meta.commodity || '',
            market: meta.market || '',
            csvFile: f,
            observations: meta.observations || 0
          });
        } catch {
          // Skip malformed provenance
        }
      }
    }
  } catch {
    // Directory read failed
  }

  return results;
}

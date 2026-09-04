/**
 * MandiMitra Core: SajhaBazaar ("साझा बाज़ार") — Shared Freight & Market Access Engine
 *
 * THE PROBLEM
 * -----------
 * AsliDaam can prove that a distant terminal APMC pays more per quintal. A smallholder with
 * 3 quintals still cannot act on that advice: a transporter will not dispatch a vehicle below a
 * minimum trip charge, so the whole fixed cost of the trip lands on those 3 quintals
 * (₹400-₹530/qtl) and erases the price premium. The correct individual recommendation is
 * "sell locally" — and the farmer stays locked out of the better market.
 *
 * THE FIX
 * -------
 * Pool compatible neighbours into one dispatch. The fixed base and the minimum trip charge are
 * then spread across the combined load, and effective freight collapses to ~₹100-₹130/qtl —
 * at which point the distant mandi genuinely becomes the better option for every participant.
 *
 *   "AsliDaam tells you where the economics are better;
 *    SajhaBazaar gives you the scale required to act on that advice."
 *
 * ECONOMICS (non-linear, which is what makes pooling real rather than cosmetic)
 * ----------------------------------------------------------------------------
 *   TripCost(Q, D) = max(MinTripCharge, FixedVehicleBase + D*RatePerKm + Q*D*IncrementalPerQtlKm)
 *   FarmerShare_i  = TotalPooledTripCost * q_i / Q_pool
 *
 * A purely linear `distance * rate * quintals` model would produce identical per-quintal freight
 * for 3 quintals and 30 quintals and therefore ZERO pooling benefit. The fixed base and the trip
 * floor are the entire source of the saving.
 *
 * INVARIANTS (asserted by scripts/test_sajha_bazaar.py)
 * ----------------------------------------------------
 *   1. sum(FarmerShare_i) === TotalPooledTripCost exactly (largest-remainder settlement).
 *   2. sum(q_i) === Q_pool exactly.
 *   3. A pool is only surfaced when EVERY participant gains more than the materiality threshold.
 *   4. A mandi failing the data-quality gate is never a pooling destination.
 */

import fs from 'fs';
import path from 'path';
import { Market, MarketEvaluation } from '../contracts/domain';
import { estimateRoadDistanceKm, haversineDistanceKm } from '../core/distance';
import { calculateAsliDaamForMandiDay, AsliDaamBreakdown } from './asli-daam';

// ============================================================================
// Data structures
// ============================================================================

export interface SajhaFarmerProfile {
  farmerId: string;
  displayName: string;
  village: string;
  taluka: string;
  district: string;
  latitude: number;
  longitude: number;
  crop: string;
  quantityQuintals: number;
  harvestDate: string;
  sellWindowStart: string;
  sellWindowEnd: string;
  phoneMasked?: string;
  clusterId?: string;
  clusterLabel?: string;
}

export interface SajhaVehicleSpec {
  id: string;
  name: string;
  nameMr: string;
  nameHi: string;
  capacityQuintals: number;
  mileageKmPerLitre: number;
  fixedVehicleBaseRs: number;
  minTripChargeRs: number;
  incrementalPerQtlKmRs: number;
}

export interface FreightEconomics {
  vehicles: SajhaVehicleSpec[];
  fuelCostSharePct: number;
  roundTripFactor: number;
  stateAverageDieselPrice: number;
  perAdditionalPickupKm: number;
  districtDieselPrices: Record<string, number>;
}

export interface TripCostBreakdown {
  vehicle: SajhaVehicleSpec;
  tripsRequired: number;
  distanceKm: number;
  dieselPricePerLitre: number;
  ratePerKmRs: number;
  fixedComponentRs: number;
  distanceComponentRs: number;
  payloadComponentRs: number;
  minTripChargeRs: number;
  minTripChargeApplied: boolean;
  totalTripCostRs: number;
  costPerQuintalRs: number;
}

export interface SajhaParticipant {
  farmerId: string;
  displayName: string;
  village: string;
  district: string;
  latitude: number;
  longitude: number;
  quantityQuintals: number;
  isRequester: boolean;
  distanceFromRequesterKm: number;

  /** Selling alone at this farmer's own nearest eligible mandi. */
  localMandiName: string;
  localMandiDistanceKm: number;
  localTransportPerQtl: number;
  localNrvPerQtl: number;
  localNetPayout: number;

  /** Travelling alone to the pooled destination mandi. */
  soloTransportPerQtl: number;
  soloNrvPerQtl: number;
  soloNetPayout: number;

  /** Travelling as part of the pool. */
  pooledTransportSharePerQtl: number;
  pooledTransportShareTotal: number;
  pooledNrvPerQtl: number;
  pooledNetPayout: number;

  /** Pooled vs best individual option (local or solo, whichever is better). */
  netGainPerQtl: number;
  netGainTotal: number;
}

export type SajhaStatus = 'POOL_AVAILABLE' | 'NO_POOL' | 'ABSTAINED';

export interface SajhaBazaarResult {
  status: SajhaStatus;
  statusLabel: string;
  isSyntheticRoster: boolean;
  syntheticNotice: string;
  commodity: string;
  requestedQuantityQuintals: number;
  matchRadiusKm: number;
  sellWindowToleranceDays: number;
  materialityThresholdPerQtl: number;

  destinationMandi: {
    id: string;
    name: string;
    district: string;
    directDistanceKm: number;
    pickupCorridorDistanceKm: number;
    grossModalPricePerQtl: number;
    dataQualityTier: string;
  } | null;

  localMandi: {
    id: string;
    name: string;
    district: string;
    distanceKm: number;
    grossModalPricePerQtl: number;
    nrvPerQtl: number;
    netPayout: number;
  } | null;

  soloAtDestination: {
    transportPerQtl: number;
    nrvPerQtl: number;
    netPayout: number;
    tripCost: TripCostBreakdown | null;
    isEconomical: boolean;
  } | null;

  pooled: {
    totalQuintals: number;
    participantCount: number;
    tripCost: TripCostBreakdown | null;
    transportPerQtl: number;
    requesterNrvPerQtl: number;
    requesterNetPayout: number;
  } | null;

  participants: SajhaParticipant[];

  /** Requester-facing headline numbers. */
  requesterGainPerQtl: number;
  requesterGainTotal: number;
  collectiveGainTotal: number;

  /** Exact-conservation audit figures. */
  allocationAudit: {
    totalPooledTripCostRs: number;
    sumOfFarmerSharesRs: number;
    allocationResidualRs: number;
    totalPooledQuintals: number;
    sumOfFarmerQuintals: number;
    quantityResidualQuintals: number;
    conserves: boolean;
  };

  reasons: string[];
  headline: { en: string; mr: string; hi: string };
}

// ============================================================================
// Loading
// ============================================================================

export interface SajhaClusterSummary {
  clusterId: string;
  label: string;
  labelMr: string;
  crop: string;
  taluka: string;
  district: string;
  narrative: string;
  farmerCount: number;
  totalQuintals: number;
  centroidLatitude: number;
  centroidLongitude: number;
}

let profilesCache: SajhaFarmerProfile[] | null = null;
let clustersCache: SajhaClusterSummary[] | null = null;
let profilesNoticeCache = '';
let economicsCache: FreightEconomics | null = null;

function readJsonFile(relPath: string): any | null {
  try {
    const p = path.resolve(process.cwd(), relPath);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return null;
  }
}

export function loadSajhaFarmerProfiles(forceReload: boolean = false): SajhaFarmerProfile[] {
  if (profilesCache && !forceReload) return profilesCache;

  const data = readJsonFile(path.join('data', 'sajha_bazaar_profiles.json'));
  const out: SajhaFarmerProfile[] = [];
  const clusters: SajhaClusterSummary[] = [];
  profilesNoticeCache = data?.synthetic_notice || 'Synthetic demonstration roster.';

  for (const cluster of (data?.clusters || [])) {
    const members = (cluster.farmers || []);
    if (members.length > 0) {
      clusters.push({
        clusterId: String(cluster.clusterId),
        label: String(cluster.label),
        labelMr: String(cluster.labelMr || cluster.label),
        crop: String(cluster.crop),
        taluka: String(cluster.taluka),
        district: String(cluster.district),
        narrative: String(cluster.narrative || ''),
        farmerCount: members.length,
        totalQuintals: Math.round(members.reduce((a: number, f: any) => a + Number(f.quantityQuintals || 0), 0) * 100) / 100,
        centroidLatitude: Math.round((members.reduce((a: number, f: any) => a + Number(f.latitude), 0) / members.length) * 10000) / 10000,
        centroidLongitude: Math.round((members.reduce((a: number, f: any) => a + Number(f.longitude), 0) / members.length) * 10000) / 10000
      });
    }
    for (const f of members) {
      out.push({
        farmerId: String(f.farmerId),
        displayName: String(f.displayName),
        village: String(f.village),
        taluka: String(f.taluka),
        district: String(f.district),
        latitude: Number(f.latitude),
        longitude: Number(f.longitude),
        crop: String(f.crop),
        quantityQuintals: Number(f.quantityQuintals),
        harvestDate: String(f.harvestDate),
        sellWindowStart: String(f.sellWindowStart),
        sellWindowEnd: String(f.sellWindowEnd),
        phoneMasked: f.phoneMasked ? String(f.phoneMasked) : undefined,
        clusterId: String(cluster.clusterId),
        clusterLabel: String(cluster.label)
      });
    }
  }

  profilesCache = out;
  clustersCache = clusters;
  return out;
}

export function loadSajhaClusters(): SajhaClusterSummary[] {
  if (!clustersCache) loadSajhaFarmerProfiles();
  return clustersCache || [];
}

export function getSyntheticRosterNotice(): string {
  if (!profilesCache) loadSajhaFarmerProfiles();
  return profilesNoticeCache;
}

export function loadFreightEconomics(forceReload: boolean = false): FreightEconomics {
  if (economicsCache && !forceReload) return economicsCache;

  const data = readJsonFile(path.join('data', 'freight_vehicle_economics.json'));
  const diesel = readJsonFile(path.join('data', 'diesel_rates_maharashtra.json'));

  const vehicles: SajhaVehicleSpec[] = (data?.vehicles || []).map((v: any) => ({
    id: String(v.id),
    name: String(v.name),
    nameMr: String(v.nameMr || v.name),
    nameHi: String(v.nameHi || v.name),
    capacityQuintals: Number(v.capacityQuintals),
    mileageKmPerLitre: Number(v.mileageKmPerLitre),
    fixedVehicleBaseRs: Number(v.fixedVehicleBaseRs),
    minTripChargeRs: Number(v.minTripChargeRs),
    incrementalPerQtlKmRs: Number(v.incrementalPerQtlKmRs)
  })).sort((a: SajhaVehicleSpec, b: SajhaVehicleSpec) => a.capacityQuintals - b.capacityQuintals);

  economicsCache = {
    vehicles,
    fuelCostSharePct: Number(data?.fuel_cost_share_pct) || 58.0,
    roundTripFactor: Number(data?.round_trip_factor) || 2.0,
    stateAverageDieselPrice: Number(diesel?.state_average_diesel_price) || Number(data?.state_average_diesel_price) || 92.45,
    perAdditionalPickupKm: Number(data?.pickup_corridor?.per_additional_pickup_km) || 2.5,
    districtDieselPrices: (diesel?.district_prices || {}) as Record<string, number>
  };
  return economicsCache;
}

export function resetSajhaCaches(): void {
  profilesCache = null;
  clustersCache = null;
  economicsCache = null;
}

export function getDieselPriceForDistrict(district: string): number {
  const econ = loadFreightEconomics();
  const key = Object.keys(econ.districtDieselPrices).find(
    k => k.toLowerCase() === (district || '').toLowerCase()
  );
  return key ? econ.districtDieselPrices[key] : econ.stateAverageDieselPrice;
}

// ============================================================================
// Vehicle dispatch cost model
// ============================================================================

/** Smallest vehicle able to carry the load in one trip; the largest vehicle otherwise. */
export function selectVehicle(quantityQuintals: number, vehicles: SajhaVehicleSpec[]): SajhaVehicleSpec {
  const fit = vehicles.find(v => v.capacityQuintals >= quantityQuintals);
  return fit || vehicles[vehicles.length - 1];
}

/**
 * Per-km running cost derived from the real district diesel price:
 *   RatePerKm = (dieselPrice / mileage) / fuelCostShare * roundTripFactor
 */
export function deriveRatePerKm(
  vehicle: SajhaVehicleSpec,
  dieselPricePerLitre: number,
  fuelCostSharePct: number,
  roundTripFactor: number
): number {
  const fuelPerKm = dieselPricePerLitre / vehicle.mileageKmPerLitre;
  const runningPerKm = fuelPerKm / (fuelCostSharePct / 100);
  return Math.round(runningPerKm * roundTripFactor * 100) / 100;
}

/**
 * TripCost(Q, D) = max(MinTripCharge, FixedVehicleBase + D*RatePerKm + Q*D*IncrementalPerQtlKm)
 * Loads exceeding the largest vehicle are split into whole additional trips.
 */
export function computeTripCost(
  quantityQuintals: number,
  distanceKm: number,
  district: string,
  econ: FreightEconomics = loadFreightEconomics()
): TripCostBreakdown {
  const vehicle = selectVehicle(quantityQuintals, econ.vehicles);
  const tripsRequired = Math.max(1, Math.ceil(quantityQuintals / vehicle.capacityQuintals));
  const dieselPrice = getDieselPriceForDistrict(district);
  const ratePerKm = deriveRatePerKm(vehicle, dieselPrice, econ.fuelCostSharePct, econ.roundTripFactor);

  const perTripQuantity = quantityQuintals / tripsRequired;
  const fixedComponent = vehicle.fixedVehicleBaseRs;
  const distanceComponent = distanceKm * ratePerKm;
  const payloadComponent = perTripQuantity * distanceKm * vehicle.incrementalPerQtlKmRs;
  const variableTotal = fixedComponent + distanceComponent + payloadComponent;
  const minTripChargeApplied = variableTotal < vehicle.minTripChargeRs;
  const singleTripCost = Math.max(vehicle.minTripChargeRs, variableTotal);
  const totalTripCostRs = Math.round(singleTripCost * tripsRequired * 100) / 100;

  return {
    vehicle,
    tripsRequired,
    distanceKm: Math.round(distanceKm * 10) / 10,
    dieselPricePerLitre: dieselPrice,
    ratePerKmRs: ratePerKm,
    fixedComponentRs: Math.round(fixedComponent * tripsRequired * 100) / 100,
    distanceComponentRs: Math.round(distanceComponent * tripsRequired * 100) / 100,
    payloadComponentRs: Math.round(payloadComponent * tripsRequired * 100) / 100,
    minTripChargeRs: vehicle.minTripChargeRs,
    minTripChargeApplied,
    totalTripCostRs,
    costPerQuintalRs: quantityQuintals > 0
      ? Math.round((totalTripCostRs / quantityQuintals) * 100) / 100
      : 0
  };
}

/**
 * Proportional allocation with exact conservation.
 * Shares are rounded to paise; the rounding residual is settled onto the largest load so that
 * sum(shares) === totalCost to the paise. Never approximate — the farmers split a real invoice.
 */
export function allocateTripCost(
  totalCostRs: number,
  quantities: number[]
): number[] {
  const totalQty = quantities.reduce((a, b) => a + b, 0);
  if (totalQty <= 0) return quantities.map(() => 0);

  const totalPaise = Math.round(totalCostRs * 100);
  const rawShares = quantities.map(q => (totalPaise * q) / totalQty);
  const flooredPaise = rawShares.map(s => Math.floor(s));
  let residual = totalPaise - flooredPaise.reduce((a, b) => a + b, 0);

  // Largest-remainder: hand the leftover paise to the largest fractional remainders.
  const order = rawShares
    .map((s, i) => ({ i, frac: s - Math.floor(s) }))
    .sort((a, b) => b.frac - a.frac);
  let k = 0;
  while (residual > 0 && order.length > 0) {
    flooredPaise[order[k % order.length].i] += 1;
    residual -= 1;
    k += 1;
  }

  return flooredPaise.map(p => p / 100);
}

// ============================================================================
// NRV helpers
// ============================================================================

/**
 * Runs the AsliDaam NRV formula with an explicit freight figure (₹/qtl) coming from the
 * vehicle dispatch model instead of a flat ₹/km/qtl slider rate.
 */
function nrvWithExplicitFreight(
  market: Market,
  commodity: string,
  quantityQuintals: number,
  dayOffset: number,
  grossPricePerQtl: number,
  freightPerQtl: number,
  distanceKm: number
): AsliDaamBreakdown {
  return calculateAsliDaamForMandiDay(
    market,
    commodity,
    quantityQuintals,
    dayOffset,
    grossPricePerQtl,
    0,
    distanceKm,
    false,
    undefined,
    freightPerQtl
  );
}

interface EligibleMandi {
  market: Market;
  grossPrice: number;
  tier: string;
}

function extractEligibleMandis(evaluations: MarketEvaluation[]): EligibleMandi[] {
  const out: EligibleMandi[] = [];
  for (const ev of evaluations) {
    // INVARIANT 4: never pool towards a mandi that failed the data-quality gate.
    if (!ev.dataQuality.isEligibleForRecommendation) continue;
    const day0 = ev.netRealisationByDay.find(nr => nr.day === 0) || ev.netRealisationByDay[0];
    if (!day0 || !(day0.expectedPrice > 0)) continue;
    out.push({ market: ev.market, grossPrice: day0.expectedPrice, tier: ev.dataQuality.tier });
  }
  return out;
}

function roadDistanceFromPoint(lat: number, lon: number, market: Market): number {
  return Math.round(estimateRoadDistanceKm(lat, lon, market.lat, market.lon) * 10) / 10;
}

/** Best individual option for a farmer: their own nearest eligible mandi, sold today. */
function bestLocalOption(
  lat: number,
  lon: number,
  district: string,
  commodity: string,
  quantityQuintals: number,
  mandis: EligibleMandi[]
): { mandi: EligibleMandi; distanceKm: number; transportPerQtl: number; breakdown: AsliDaamBreakdown } | null {
  let best: { mandi: EligibleMandi; distanceKm: number; transportPerQtl: number; breakdown: AsliDaamBreakdown } | null = null;

  for (const m of mandis) {
    const distanceKm = roadDistanceFromPoint(lat, lon, m.market);
    const trip = computeTripCost(quantityQuintals, distanceKm, district);
    const transportPerQtl = trip.costPerQuintalRs;
    const breakdown = nrvWithExplicitFreight(
      m.market, commodity, quantityQuintals, 0, m.grossPrice, transportPerQtl, distanceKm
    );
    if (!best || breakdown.asliDaamPerQtl > best.breakdown.asliDaamPerQtl) {
      best = { mandi: m, distanceKm, transportPerQtl, breakdown };
    }
  }

  return best;
}

// ============================================================================
// Matching
// ============================================================================

function toDate(iso: string): number {
  const d = new Date(`${iso}T00:00:00Z`);
  return isNaN(d.getTime()) ? NaN : d.getTime();
}

/**
 * A candidate is compatible when their sell window, widened by the tolerance on both sides,
 * contains the requester's target sell date.
 */
export function isSellWindowCompatible(
  candidate: SajhaFarmerProfile,
  targetDateIso: string,
  toleranceDays: number
): boolean {
  const target = toDate(targetDateIso);
  const start = toDate(candidate.sellWindowStart);
  const end = toDate(candidate.sellWindowEnd);
  if (isNaN(target) || isNaN(start) || isNaN(end)) return false;
  const tol = toleranceDays * 86400000;
  return target >= (start - tol) && target <= (end + tol);
}

export function isSameCrop(a: string, b: string): boolean {
  const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return norm(a) === norm(b);
}

const MAHARASHTRA_VILLAGE_NAMES = [
  'Pimpalgaon', 'Mohadi', 'Vinchur', 'Belapur', 'Rahata', 'Murud', 'Ausa', 'Sangola',
  'Akot', 'Murtizapur', 'Narayangaon', 'Otur', 'Belhe', 'Kopargaon', 'Baramati', 'Indapur'
];

const MAHARASHTRA_FARMER_NAMES = [
  'Ramesh Kisan Shinde', 'Suresh Bhaurao Jadhav', 'Dnyaneshwar Vitthal Patil', 
  'Anita Baban Gaikwad', 'Pandurang Madhavrao Shinde', 'Vishnu Digambar Deshmukh',
  'Gajanan Motiram Wankhade', 'Tanaji Baban Shinde', 'Sunil Baburao Ghodke'
];

/**
 * Universal dynamic smallholder generator: Enables SajhaBazaar pooling for ALL 99 Maharashtra commodities.
 */
export function synthesizeDynamicSmallholders(
  commodity: string,
  district: string,
  latitude: number,
  longitude: number,
  targetDateIso: string
): SajhaFarmerProfile[] {
  const dateObj = new Date(`${targetDateIso}T00:00:00Z`);
  const startIso = new Date(dateObj.getTime() - 86400000).toISOString().slice(0, 10);
  const endIso = new Date(dateObj.getTime() + 3 * 86400000).toISOString().slice(0, 10);

  // Deterministic seed based on commodity string
  const hash = commodity.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const offsets = [
    { dLat: 0.025, dLon: 0.015, q: 4.0 },
    { dLat: -0.020, dLon: 0.030, q: 5.0 },
    { dLat: 0.015, dLon: -0.025, q: 3.5 },
    { dLat: -0.030, dLon: -0.018, q: 4.5 }
  ];

  return offsets.map((off, idx) => {
    const nameIdx = (hash + idx * 3) % MAHARASHTRA_FARMER_NAMES.length;
    const villageIdx = (hash + idx * 5) % MAHARASHTRA_VILLAGE_NAMES.length;
    return {
      farmerId: `dyn_${commodity.toLowerCase().replace(/[^a-z0-9]/g, '')}_${idx + 1}`,
      displayName: MAHARASHTRA_FARMER_NAMES[nameIdx],
      village: `${MAHARASHTRA_VILLAGE_NAMES[villageIdx]}, ${district}`,
      taluka: district,
      district: district,
      latitude: latitude + off.dLat,
      longitude: longitude + off.dLon,
      crop: commodity,
      quantityQuintals: off.q,
      harvestDate: startIso,
      sellWindowStart: startIso,
      sellWindowEnd: endIso,
      phoneMasked: `9822${idx}-xxxxx`,
      clusterId: `cluster_${commodity.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      clusterLabel: `${district} ${commodity} Smallholders`
    };
  });
}

// ============================================================================
// Main engine
// ============================================================================

export interface SajhaBazaarRequest {
  commodity: string;
  latitude: number;
  longitude: number;
  district: string;
  quantityQuintals: number;
  targetDate: string;
  requesterName?: string;
  requesterVillage?: string;
  matchRadiusKm?: number;
  sellWindowToleranceDays?: number;
  materialityThresholdPerQtl?: number;
  allowSyntheticFallback?: boolean;
}

export const DEFAULT_MATCH_RADIUS_KM = 10.0;
export const DEFAULT_SELL_WINDOW_TOLERANCE_DAYS = 1;
export const DEFAULT_MATERIALITY_THRESHOLD_PER_QTL = 100.0;

export function evaluateSajhaBazaar(
  request: SajhaBazaarRequest,
  evaluations: MarketEvaluation[]
): SajhaBazaarResult {
  const commodity = request.commodity;
  const matchRadiusKm = request.matchRadiusKm ?? DEFAULT_MATCH_RADIUS_KM;
  const toleranceDays = request.sellWindowToleranceDays ?? DEFAULT_SELL_WINDOW_TOLERANCE_DAYS;
  const threshold = request.materialityThresholdPerQtl ?? DEFAULT_MATERIALITY_THRESHOLD_PER_QTL;
  const requesterQty = request.quantityQuintals;
  const reasons: string[] = [];

  const emptyAudit = {
    totalPooledTripCostRs: 0,
    sumOfFarmerSharesRs: 0,
    allocationResidualRs: 0,
    totalPooledQuintals: 0,
    sumOfFarmerQuintals: 0,
    quantityResidualQuintals: 0,
    conserves: true
  };

  const baseResult = (status: SajhaStatus, statusLabel: string, why: string[]): SajhaBazaarResult => ({
    status,
    statusLabel,
    isSyntheticRoster: true,
    syntheticNotice: getSyntheticRosterNotice(),
    commodity,
    requestedQuantityQuintals: requesterQty,
    matchRadiusKm,
    sellWindowToleranceDays: toleranceDays,
    materialityThresholdPerQtl: threshold,
    destinationMandi: null,
    localMandi: null,
    soloAtDestination: null,
    pooled: null,
    participants: [],
    requesterGainPerQtl: 0,
    requesterGainTotal: 0,
    collectiveGainTotal: 0,
    allocationAudit: emptyAudit,
    reasons: why,
    headline: {
      en: why[0] || 'No pooling opportunity found.',
      mr: 'सध्या तुमच्या परिसरात एकत्रित वाहतुकीची संधी नाही.',
      hi: 'फिलहाल आपके क्षेत्र में साझा परिवहन का अवसर नहीं है.'
    }
  });

  // --- Data-quality gate on destinations ---
  const eligibleMandis = extractEligibleMandis(evaluations);
  if (eligibleMandis.length === 0) {
    return baseResult('ABSTAINED', 'NO ELIGIBLE DESTINATION MANDI', [
      'No mandi in range passed the MandiMitra data-quality gate, so there is no destination worth pooling towards.',
      'SajhaBazaar never routes a shared trip to a mandi with stale or unverifiable prices.'
    ]);
  }

  // --- Requester's own local baseline ---
  const requesterLocal = bestLocalOption(
    request.latitude, request.longitude, request.district, commodity, requesterQty, eligibleMandis
  );
  if (!requesterLocal) {
    return baseResult('ABSTAINED', 'NO LOCAL BASELINE', [
      'Could not establish a local selling baseline for your location.'
    ]);
  }

  // --- Compatible neighbours ---
  const roster = loadSajhaFarmerProfiles();
  let matched = roster
    .filter(f => isSameCrop(f.crop, commodity))
    .map(f => ({
      profile: f,
      distanceKm: Math.round(haversineDistanceKm(request.latitude, request.longitude, f.latitude, f.longitude) * 10) / 10
    }))
    .filter(x => x.distanceKm <= matchRadiusKm)
    .filter(x => isSellWindowCompatible(x.profile, request.targetDate, toleranceDays))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  // Universal Fallback: If explicitly requested and no static cluster in roster, synthesize realistic local smallholders
  if (matched.length === 0 && request.allowSyntheticFallback) {
    const dynamicRoster = synthesizeDynamicSmallholders(
      commodity, request.district, request.latitude, request.longitude, request.targetDate
    );
    matched = dynamicRoster.map(f => ({
      profile: f,
      distanceKm: Math.round(haversineDistanceKm(request.latitude, request.longitude, f.latitude, f.longitude) * 10) / 10
    })).sort((a, b) => a.distanceKm - b.distanceKm);
  }

  if (matched.length === 0) {
    const cropMatches = roster.filter(f => isSameCrop(f.crop, commodity)).length;
    reasons.push(
      cropMatches === 0
        ? `No farmer on the SajhaBazaar roster is currently holding ${commodity}.`
        : `${cropMatches} ${commodity} farmer(s) are on the roster, but none are within ${matchRadiusKm} km of you with a compatible sell window (±${toleranceDays} day).`
    );
    reasons.push('SajhaBazaar does not invent a pool. Without genuinely compatible neighbours, sell individually as AsliDaam advises.');
    return baseResult('NO_POOL', 'NO COMPATIBLE NEIGHBOURS', reasons);
  }


  const poolQuantities = [requesterQty, ...matched.map(m => m.profile.quantityQuintals)];
  const poolTotalQty = poolQuantities.reduce((a, b) => a + b, 0);
  const participantCount = poolQuantities.length;
  const econ = loadFreightEconomics();
  const corridorExtraKm = econ.perAdditionalPickupKm * (participantCount - 1);

  // --- Choose the destination that maximises the requester's POOLED net realisation ---
  let bestDestination: {
    mandi: EligibleMandi;
    directDistanceKm: number;
    corridorDistanceKm: number;
    trip: TripCostBreakdown;
    transportPerQtl: number;
    breakdown: AsliDaamBreakdown;
  } | null = null;

  for (const m of eligibleMandis) {
    const directDistanceKm = roadDistanceFromPoint(request.latitude, request.longitude, m.market);
    const corridorDistanceKm = Math.round((directDistanceKm + corridorExtraKm) * 10) / 10;
    const trip = computeTripCost(poolTotalQty, corridorDistanceKm, request.district);
    const transportPerQtl = trip.costPerQuintalRs;
    const breakdown = nrvWithExplicitFreight(
      m.market, commodity, requesterQty, 0, m.grossPrice, transportPerQtl, corridorDistanceKm
    );
    if (!bestDestination || breakdown.asliDaamPerQtl > bestDestination.breakdown.asliDaamPerQtl) {
      bestDestination = { mandi: m, directDistanceKm, corridorDistanceKm, trip, transportPerQtl, breakdown };
    }
  }

  if (!bestDestination) {
    return baseResult('ABSTAINED', 'NO DESTINATION', ['No eligible destination mandi could be priced.']);
  }

  // --- Solo trip to the same destination (the option pooling must beat) ---
  const soloTrip = computeTripCost(requesterQty, bestDestination.directDistanceKm, request.district);
  const soloBreakdown = nrvWithExplicitFreight(
    bestDestination.mandi.market, commodity, requesterQty, 0,
    bestDestination.mandi.grossPrice, soloTrip.costPerQuintalRs, bestDestination.directDistanceKm
  );

  // --- Exact-conservation cost allocation ---
  const shares = allocateTripCost(bestDestination.trip.totalTripCostRs, poolQuantities);
  const sumShares = Math.round(shares.reduce((a, b) => a + b, 0) * 100) / 100;
  const sumQty = Math.round(poolQuantities.reduce((a, b) => a + b, 0) * 1000) / 1000;

  // --- Per-participant economics ---
  const participants: SajhaParticipant[] = [];

  const buildParticipant = (
    idx: number,
    farmerId: string,
    displayName: string,
    village: string,
    district: string,
    lat: number,
    lon: number,
    qty: number,
    isRequester: boolean,
    distanceFromRequesterKm: number
  ): SajhaParticipant | null => {
    const local = bestLocalOption(lat, lon, district, commodity, qty, eligibleMandis);
    if (!local) return null;

    const solo = computeTripCost(qty, roadDistanceFromPoint(lat, lon, bestDestination!.mandi.market), request.district);
    const soloDist = roadDistanceFromPoint(lat, lon, bestDestination!.mandi.market);
    const soloBd = nrvWithExplicitFreight(
      bestDestination!.mandi.market, commodity, qty, 0,
      bestDestination!.mandi.grossPrice, solo.costPerQuintalRs, soloDist
    );

    const shareTotal = shares[idx];
    const sharePerQtl = qty > 0 ? Math.round((shareTotal / qty) * 100) / 100 : 0;
    const pooledBd = nrvWithExplicitFreight(
      bestDestination!.mandi.market, commodity, qty, 0,
      bestDestination!.mandi.grossPrice, sharePerQtl, bestDestination!.corridorDistanceKm
    );

    // The pool must beat the farmer's BEST individual option, not a strawman.
    const bestIndividualPerQtl = Math.max(local.breakdown.asliDaamPerQtl, soloBd.asliDaamPerQtl);
    const netGainPerQtl = Math.round((pooledBd.asliDaamPerQtl - bestIndividualPerQtl) * 10) / 10;

    return {
      farmerId,
      displayName,
      village,
      district,
      latitude: lat,
      longitude: lon,
      quantityQuintals: qty,
      isRequester,
      distanceFromRequesterKm,
      localMandiName: local.mandi.market.name,
      localMandiDistanceKm: local.distanceKm,
      localTransportPerQtl: local.transportPerQtl,
      localNrvPerQtl: local.breakdown.asliDaamPerQtl,
      localNetPayout: local.breakdown.totalNetPayout,
      soloTransportPerQtl: solo.costPerQuintalRs,
      soloNrvPerQtl: soloBd.asliDaamPerQtl,
      soloNetPayout: soloBd.totalNetPayout,
      pooledTransportSharePerQtl: sharePerQtl,
      pooledTransportShareTotal: shareTotal,
      pooledNrvPerQtl: pooledBd.asliDaamPerQtl,
      pooledNetPayout: pooledBd.totalNetPayout,
      netGainPerQtl,
      netGainTotal: Math.round(netGainPerQtl * qty)
    };
  };

  const requesterParticipant = buildParticipant(
    0,
    'requester',
    request.requesterName || 'You',
    request.requesterVillage || request.district,
    request.district,
    request.latitude,
    request.longitude,
    requesterQty,
    true,
    0
  );
  if (requesterParticipant) participants.push(requesterParticipant);

  matched.forEach((m, i) => {
    const p = buildParticipant(
      i + 1,
      m.profile.farmerId,
      m.profile.displayName,
      m.profile.village,
      m.profile.district,
      m.profile.latitude,
      m.profile.longitude,
      m.profile.quantityQuintals,
      false,
      m.distanceKm
    );
    if (p) participants.push(p);
  });

  const allocationAudit = {
    totalPooledTripCostRs: bestDestination.trip.totalTripCostRs,
    sumOfFarmerSharesRs: sumShares,
    allocationResidualRs: Math.round((bestDestination.trip.totalTripCostRs - sumShares) * 100) / 100,
    totalPooledQuintals: Math.round(poolTotalQty * 1000) / 1000,
    sumOfFarmerQuintals: sumQty,
    quantityResidualQuintals: Math.round((poolTotalQty - sumQty) * 1000) / 1000,
    conserves:
      Math.abs(bestDestination.trip.totalTripCostRs - sumShares) < 0.005 &&
      Math.abs(poolTotalQty - sumQty) < 0.0005
  };

  // --- Materiality gate: no pooling for pooling's sake ---
  const losers = participants.filter(p => p.netGainPerQtl <= threshold);
  if (losers.length > 0) {
    reasons.push(
      `A ${poolTotalQty}q pool to ${bestDestination.mandi.market.name} was evaluated, but ${losers.length} of ${participants.length} participant(s) would not clear the ₹${threshold}/qtl materiality threshold.`
    );
    reasons.push(
      `Smallest gain in the group: ₹${Math.min(...participants.map(p => p.netGainPerQtl)).toFixed(1)}/qtl. SajhaBazaar only surfaces a pool when every member is materially better off.`
    );
    reasons.push('Sell individually at your local mandi as AsliDaam advises.');

    const result = baseResult('NO_POOL', 'POOL NOT WORTHWHILE', reasons);
    result.destinationMandi = {
      id: bestDestination.mandi.market.id,
      name: bestDestination.mandi.market.name,
      district: bestDestination.mandi.market.district,
      directDistanceKm: bestDestination.directDistanceKm,
      pickupCorridorDistanceKm: bestDestination.corridorDistanceKm,
      grossModalPricePerQtl: bestDestination.mandi.grossPrice,
      dataQualityTier: bestDestination.mandi.tier
    };
    result.participants = participants;
    result.allocationAudit = allocationAudit;
    return result;
  }

  // --- Pool is genuine ---
  const requesterRow = participants.find(p => p.isRequester)!;
  const collectiveGainTotal = participants.reduce((a, p) => a + p.netGainTotal, 0);

  reasons.push(
    `${participants.length} farmers within ${matchRadiusKm} km are holding ${commodity} with overlapping sell windows, combining to ${poolTotalQty} quintals.`
  );
  reasons.push(
    `Alone, ${requesterQty}q must charter a whole ${soloTrip.vehicle.name}: ₹${soloTrip.totalTripCostRs.toLocaleString('en-IN')} for the trip, i.e. ₹${soloTrip.costPerQuintalRs}/qtl of freight${soloTrip.minTripChargeApplied ? ' (the transporter’s minimum trip charge applies)' : ''}.`
  );
  reasons.push(
    `Pooled into one ${bestDestination.trip.vehicle.name}, the same trip costs ₹${bestDestination.trip.totalTripCostRs.toLocaleString('en-IN')} shared across ${poolTotalQty}q — ₹${bestDestination.trip.costPerQuintalRs}/qtl.`
  );
  const sameMandi = bestDestination.mandi.market.id === requesterLocal.mandi.market.id;
  const freightDrop = (soloTrip.costPerQuintalRs - bestDestination.trip.costPerQuintalRs).toFixed(2);
  reasons.push(
    sameMandi
      ? `Freight per quintal falls by ₹${freightDrop}. Your best mandi was already ${bestDestination.mandi.market.name}; pooling is what makes reaching it affordable on a ${requesterQty}q load.`
      : `Freight per quintal falls by ₹${freightDrop}, which is what turns ${bestDestination.mandi.market.name} from unreachable into economically superior to your local ${requesterLocal.mandi.market.name} yard.`
  );
  reasons.push(
    'Pooling does not change the mandi price. It converts sub-scale individual freight into full-load economics, and the entire gain is freight the farmer no longer pays.'
  );

  const gainTotal = requesterRow.netGainTotal;
  const gainPerQtl = requesterRow.netGainPerQtl;
  const destName = bestDestination.mandi.market.name;

  return {
    status: 'POOL_AVAILABLE',
    statusLabel: 'SAJHABAZAAR POOL AVAILABLE',
    isSyntheticRoster: true,
    syntheticNotice: getSyntheticRosterNotice(),
    commodity,
    requestedQuantityQuintals: requesterQty,
    matchRadiusKm,
    sellWindowToleranceDays: toleranceDays,
    materialityThresholdPerQtl: threshold,
    destinationMandi: {
      id: bestDestination.mandi.market.id,
      name: destName,
      district: bestDestination.mandi.market.district,
      directDistanceKm: bestDestination.directDistanceKm,
      pickupCorridorDistanceKm: bestDestination.corridorDistanceKm,
      grossModalPricePerQtl: bestDestination.mandi.grossPrice,
      dataQualityTier: bestDestination.mandi.tier
    },
    localMandi: {
      id: requesterLocal.mandi.market.id,
      name: requesterLocal.mandi.market.name,
      district: requesterLocal.mandi.market.district,
      distanceKm: requesterLocal.distanceKm,
      grossModalPricePerQtl: requesterLocal.mandi.grossPrice,
      nrvPerQtl: requesterLocal.breakdown.asliDaamPerQtl,
      netPayout: requesterLocal.breakdown.totalNetPayout
    },
    soloAtDestination: {
      transportPerQtl: soloTrip.costPerQuintalRs,
      nrvPerQtl: soloBreakdown.asliDaamPerQtl,
      netPayout: soloBreakdown.totalNetPayout,
      tripCost: soloTrip,
      isEconomical: soloBreakdown.asliDaamPerQtl > requesterLocal.breakdown.asliDaamPerQtl
    },
    pooled: {
      totalQuintals: Math.round(poolTotalQty * 100) / 100,
      participantCount: participants.length,
      tripCost: bestDestination.trip,
      transportPerQtl: bestDestination.trip.costPerQuintalRs,
      requesterNrvPerQtl: requesterRow.pooledNrvPerQtl,
      requesterNetPayout: requesterRow.pooledNetPayout
    },
    participants,
    requesterGainPerQtl: gainPerQtl,
    requesterGainTotal: gainTotal,
    collectiveGainTotal,
    allocationAudit,
    reasons,
    headline: {
      en: `Pool with ${participants.length - 1} nearby farmers: ${destName} becomes viable, +₹${gainPerQtl.toFixed(0)}/qtl (+₹${gainTotal.toLocaleString('en-IN')} in your pocket).`,
      mr: `जवळच्या ${participants.length - 1} शेतकऱ्यांसोबत वाहतूक वाटून घ्या: ${destName} परवडते, +₹${gainPerQtl.toFixed(0)}/क्विंटल (खिशात +₹${gainTotal.toLocaleString('en-IN')}).`,
      hi: `पास के ${participants.length - 1} किसानों के साथ ढुलाई साझा करें: ${destName} फायदेमंद बनता है, +₹${gainPerQtl.toFixed(0)}/क्विंटल (जेब में +₹${gainTotal.toLocaleString('en-IN')}).`
    }
  };
}

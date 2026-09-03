/**
 * MandiMitra Backend: SajhaBazaar ("साझा बाज़ार") REST Controller
 *
 * POST /api/sajha-bazaar/evaluate
 *   Body: { commodity, latitude, longitude, district?, quantityQuintals, targetDate?, radiusKm?,
 *           matchRadiusKm?, sellWindowToleranceDays?, materialityThresholdPerQtl?,
 *           transportCostPerKmPerQtl?, storageCostPerDayPerQtl? }
 *   Returns the matched pool, total quintals, pickup waypoint distance, individual vs pooled
 *   transport costs, per-farmer allocations and net wallet gain.
 *
 * GET /api/sajha-bazaar/roster
 *   Returns the synthetic farmer roster with its provenance notice, so judges can inspect exactly
 *   what the matching engine is drawing from.
 *
 * The candidate mandi universe is produced by the SAME pipeline that serves /api/evaluate, so a
 * mandi that MandiMitra refuses to recommend can never become a pooling destination.
 */

import { Request, Response } from 'express';
import { resolveEvaluationContext } from './controllers';
import {
  evaluateSajhaBazaar,
  loadSajhaFarmerProfiles,
  loadSajhaClusters,
  loadFreightEconomics,
  getSyntheticRosterNotice,
  DEFAULT_MATCH_RADIUS_KM,
  DEFAULT_SELL_WINDOW_TOLERANCE_DAYS,
  DEFAULT_MATERIALITY_THRESHOLD_PER_QTL
} from '../core/sajha-bazaar';
import { getDistrictConfig } from '../config/districts';
import { config } from '../config';

export interface SajhaBazaarRequestBody {
  commodity?: string;
  latitude?: number;
  longitude?: number;
  district?: string;
  quantityQuintals?: number;
  targetDate?: string;
  radiusKm?: number;
  matchRadiusKm?: number;
  sellWindowToleranceDays?: number;
  materialityThresholdPerQtl?: number;
  transportCostPerKmPerQtl?: number;
  storageCostPerDayPerQtl?: number;
  requesterName?: string;
  requesterVillage?: string;
}

/** Latest arrival date in the price feed is the natural "today" for the demo dataset. */
function defaultTargetDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function sajhaBazaarEvaluateController(req: Request, res: Response): Promise<void> {
  try {
    const body = (req.body || {}) as SajhaBazaarRequestBody;

    const commodity = body.commodity || 'Tomato';
    const quantityQuintals = Number(body.quantityQuintals) > 0 ? Number(body.quantityQuintals) : 3;

    // Resolve the origin: explicit coordinates win, otherwise the canonical district centroid.
    let latitude = Number(body.latitude);
    let longitude = Number(body.longitude);
    let districtName = body.district || '';

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      const d = getDistrictConfig(districtName || 'Nashik');
      latitude = d.latitude;
      longitude = d.longitude;
      districtName = d.name;
    } else if (!districtName) {
      districtName = getDistrictConfig('Nashik').name;
    }

    const transportCost = body.transportCostPerKmPerQtl ?? config.defaultTransportCostPerKmPerQtl;
    const storageCost = body.storageCostPerDayPerQtl ?? config.defaultStorageCostPerDayPerQtl;
    const searchRadiusKm = body.radiusKm ?? config.maxSearchRadiusKm;

    // Same candidate universe as /api/evaluate — including its data-quality gate.
    const { evaluations } = resolveEvaluationContext({
      commodity,
      latitude,
      longitude,
      transportCost,
      storageCost,
      searchRadiusKm
    });

    const result = evaluateSajhaBazaar(
      {
        commodity,
        latitude,
        longitude,
        district: districtName,
        quantityQuintals,
        targetDate: body.targetDate || defaultTargetDate(),
        requesterName: body.requesterName,
        requesterVillage: body.requesterVillage,
        matchRadiusKm: body.matchRadiusKm ?? DEFAULT_MATCH_RADIUS_KM,
        sellWindowToleranceDays: body.sellWindowToleranceDays ?? DEFAULT_SELL_WINDOW_TOLERANCE_DAYS,
        materialityThresholdPerQtl: body.materialityThresholdPerQtl ?? DEFAULT_MATERIALITY_THRESHOLD_PER_QTL
      },
      evaluations
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: `SajhaBazaar evaluation failed: ${String(err)}`
      }
    });
  }
}

export async function sajhaBazaarRosterController(_req: Request, res: Response): Promise<void> {
  try {
    const roster = loadSajhaFarmerProfiles();
    const economics = loadFreightEconomics();
    res.json({
      isSynthetic: true,
      syntheticNotice: getSyntheticRosterNotice(),
      farmerCount: roster.length,
      crops: Array.from(new Set(roster.map(f => f.crop))),
      clusters: loadSajhaClusters(),
      farmers: roster,
      vehicleEconomics: {
        vehicles: economics.vehicles,
        fuelCostSharePct: economics.fuelCostSharePct,
        roundTripFactor: economics.roundTripFactor,
        perAdditionalPickupKm: economics.perAdditionalPickupKm,
        costModel: 'TripCost(Q, D) = max(MinTripCharge, FixedVehicleBase + D*RatePerKm + Q*D*IncrementalPerQtlKm)',
        ratePerKmDerivation: 'RatePerKm = (dieselPrice / mileageKmPerLitre) / (fuelCostSharePct/100) * roundTripFactor'
      }
    });
  } catch (err) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: String(err) }
    });
  }
}

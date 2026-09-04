/**
 * MandiMitra Core: Net Realisation Calculator
 * Factors transport haulage tariffs and daily storage holding depreciation into market price.
 * 
 * OWNER: Amay (Team Lead)
 * 
 * Formula:
 * net_realisation(market, day) = expected_price(market, day)
 *                              - (road_distance_km * cost_per_km_per_qtl)
 *                              - (day * storage_cost_per_day_per_qtl)
 */

import { Market, NetRealisation, Forecast } from '../contracts/domain';
import { getCropDecayProfile } from './asli-daam';

export function calculateNetRealisationForMarket(
  market: Market,
  forecast: Forecast,
  transportCostPerKmPerQtl: number,
  storageCostPerDayPerQtl: number,
  commodity?: string
): NetRealisation[] {
  const roadDistanceKm = market.estimatedRoadDistanceKm || 0.0;
  const transportCostPerQtl = Math.round(roadDistanceKm * transportCostPerKmPerQtl * 10) / 10;
  const decayProfile = commodity ? getCropDecayProfile(commodity) : null;

  return forecast.expectedPriceByDay.map(fp => {
    let waitingCostPerQtl = Math.round(fp.day * storageCostPerDayPerQtl * 10) / 10;
    if (decayProfile && fp.day > 0) {
      const decayLoss = fp.expectedPrice * decayProfile.dailyDecayRatePct * fp.day;
      const freshnessLoss = fp.expectedPrice * decayProfile.dailyFreshnessDiscountPct * fp.day;
      const storageRent = decayProfile.dailyStorageRentRs * fp.day;
      waitingCostPerQtl = Math.round((decayLoss + freshnessLoss + storageRent) * 10) / 10;
    }
    const net = Math.round((fp.expectedPrice - transportCostPerQtl - waitingCostPerQtl) * 10) / 10;

    return {
      market,
      day: fp.day,
      expectedPrice: fp.expectedPrice,
      transportCostPerQtl,
      waitingCostPerQtl,
      netRealisation: net
    };
  });
}

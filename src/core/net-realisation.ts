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

export function calculateNetRealisationForMarket(
  market: Market,
  forecast: Forecast,
  transportCostPerKmPerQtl: number,
  storageCostPerDayPerQtl: number
): NetRealisation[] {
  const roadDistanceKm = market.estimatedRoadDistanceKm || 0.0;
  const transportCostPerQtl = Math.round(roadDistanceKm * transportCostPerKmPerQtl * 10) / 10;

  return forecast.expectedPriceByDay.map(fp => {
    const waitingCostPerQtl = Math.round(fp.day * storageCostPerDayPerQtl * 10) / 10;
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

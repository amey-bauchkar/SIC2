/**
 * MandiMitra Core: Bhed Vivek (भीड़ विवेक) — Crowd-Aware / Market Congestion Intelligence
 * 
 * OWNER: Amay (Team Lead)
 * 
 * Mathematical Architecture:
 * 1. Price Congestion Sensitivity (PCS): Empirical elasticity derived from 
 *    mandi trading capacity and historical Agmarknet intra-day price dispersion.
 *    - Terminal APMCs (Lasalgaon, Pimpalgaon): Large buyer liquidity absorbs shocks (PCS ~0.08 - 0.10)
 *    - Regional Sub-Markets (Yeola, Manmad): Thin buyer liquidity, sharp slippage (PCS ~0.20 - 0.26)
 * 2. Supply Pressure Scenario (θ):
 *    - LOW (0.20): Normal dispersed arrivals
 *    - MEDIUM (0.50): Moderate post-forecast arrival concentration
 *    - HIGH (0.85): Heavy simultaneous harvest surge / crowd bottleneck
 * 3. Timing Factor (τ):
 *    - Day 0 (today): 0.35 | Day 1 (+1d): 0.90 | Day 2 (+2d): 1.00 | Day 3 (+3d): 0.75
 * 4. Congestion-Adjusted Net Realization (NRV_adj):
 *    - ΔP = GrossPrice × PCS × θ × τ
 *    - P_adj = GrossPrice - ΔP
 *    - NRV_adj = P_adj - Transport - WaitingCost
 */

import { 
  MarketEvaluation, 
  BhedVivekEvaluation, 
  SupplyPressureLevel, 
  CongestionRiskStatus 
} from '../contracts/domain';

// Empirical Price Congestion Sensitivity (PCS) table
const MANDI_PCS_REGISTRY: Record<string, { pcs: number; capacity: string }> = {
  // Terminal Major APMCs (Deep liquidity, export terminals)
  'lasalgaon': { pcs: 0.08, capacity: 'High (National Terminal APMC)' },
  'pimpalgaon': { pcs: 0.10, capacity: 'High (Processing & Export Hub)' },
  'vashi': { pcs: 0.07, capacity: 'Very High (Metro Terminal APMC)' },
  'gultekdi': { pcs: 0.09, capacity: 'High (Pune Metro APMC)' },
  'pune': { pcs: 0.09, capacity: 'High (Pune Metro APMC)' },
  'latur': { pcs: 0.08, capacity: 'High (Marathwada Oilseed Terminal)' },
  'narayangaon': { pcs: 0.11, capacity: 'Moderate-High (Tomato Auction Terminal)' },
  
  // Mid-sized / Urban Consumer Mandis
  'nashik': { pcs: 0.13, capacity: 'Moderate (Urban Wholesale Yard)' },
  'dindori': { pcs: 0.15, capacity: 'Moderate (Regional APMC)' },
  'satara': { pcs: 0.14, capacity: 'Moderate (Regional APMC)' },
  'sangli': { pcs: 0.12, capacity: 'Moderate-High (Regional APMC)' },
  'kolhapur': { pcs: 0.13, capacity: 'Moderate (Regional APMC)' },
  'ahmednagar': { pcs: 0.14, capacity: 'Moderate (Regional APMC)' },
  
  // Regional Sub-Market Yards (Thin buyer pool, heavy slippage when crowded)
  'yeola': { pcs: 0.22, capacity: 'Low (Sub-Market Yard)' },
  'manmad': { pcs: 0.25, capacity: 'Low (Sub-Market Yard - Data Fragile)' },
  'vinchur': { pcs: 0.24, capacity: 'Low (Sub-Market Yard)' },
  'satana': { pcs: 0.21, capacity: 'Low (Sub-Market Yard)' },
  'kalwan': { pcs: 0.23, capacity: 'Low (Sub-Market Yard)' },
  'rahata': { pcs: 0.20, capacity: 'Low (Sub-Market Yard)' }
};

const SUPPLY_PRESSURE_NUMERIC: Record<SupplyPressureLevel, number> = {
  'LOW': 0.20,
  'MEDIUM': 0.50,
  'HIGH': 0.85
};

const TIMING_FACTORS: Record<number, number> = {
  0: 0.35, // Today: farmers cannot mobilize simultaneously
  1: 0.90, // Day +1: initial wave arrives
  2: 1.00, // Day +2: peak coordinated arrival concentration
  3: 0.75  // Day +3: dispersion and clearing begins
};

/**
 * Resolves empirical PCS for any given market name or id.
 */
export function resolveMandiPcs(marketId: string, marketName: string): { pcs: number; capacity: string } {
  const combined = `${marketId} ${marketName}`.toLowerCase();
  for (const [key, val] of Object.entries(MANDI_PCS_REGISTRY)) {
    if (combined.includes(key)) {
      return val;
    }
  }
  return { pcs: 0.15, capacity: 'Standard Regional APMC' };
}

interface CandidateEvaluationFlat {
  marketId: string;
  marketName: string;
  day: number;
  grossPrice: number;
  transportCost: number;
  waitingCost: number;
  normalNrv: number;
  adjustedPrice: number;
  adjustedNrv: number;
  congestionImpactPerQtl: number;
  pcs: number;
  capacity: string;
  isEligible: boolean;
}

/**
 * Evaluates Bhed Vivek Crowd Congestion Intelligence across candidate markets.
 */
export function evaluateBhedVivek(
  evaluations: MarketEvaluation[],
  commodity: string = 'Onion',
  quantityQuintals: number = 25,
  supplyPressure: SupplyPressureLevel = 'HIGH'
): BhedVivekEvaluation {
  const pressureNumeric = SUPPLY_PRESSURE_NUMERIC[supplyPressure] || 0.85;

  const flatCandidates: CandidateEvaluationFlat[] = [];

  for (const ev of evaluations) {
    const isEligible = ev.dataQuality.isEligibleForRecommendation;
    const { pcs, capacity } = resolveMandiPcs(ev.market.id, ev.market.name);

    for (const nr of ev.netRealisationByDay) {
      const timingFactor = TIMING_FACTORS[nr.day] ?? 0.80;

      // Mathematical Congestion Impact: ΔP = Price × PCS × θ × τ
      const priceImpact = Math.round(nr.expectedPrice * pcs * pressureNumeric * timingFactor * 10) / 10;
      const adjustedPrice = Math.max(0, nr.expectedPrice - priceImpact);
      const adjustedNrv = Math.round((adjustedPrice - nr.transportCostPerQtl - nr.waitingCostPerQtl) * 10) / 10;

      flatCandidates.push({
        marketId: ev.market.id,
        marketName: ev.market.name,
        day: nr.day,
        grossPrice: nr.expectedPrice,
        transportCost: nr.transportCostPerQtl,
        waitingCost: nr.waitingCostPerQtl,
        normalNrv: nr.netRealisation,
        adjustedPrice,
        adjustedNrv,
        congestionImpactPerQtl: priceImpact,
        pcs,
        capacity,
        isEligible
      });
    }
  }

  const eligibleCandidates = flatCandidates.filter(c => c.isEligible);

  // If no eligible markets, trigger honest abstention
  if (eligibleCandidates.length === 0) {
    return {
      status: 'UNKNOWN',
      statusLabel: 'CONGESTION RISK UNKNOWN',
      supplyPressure,
      supplyPressureNumeric: pressureNumeric,
      originalWinner: { marketId: '', marketName: 'None', day: 0, normalNrv: 0, grossPrice: 0 },
      adjustedWinner: { marketId: '', marketName: 'None', day: 0, adjustedNrv: 0, adjustedGrossPrice: 0 },
      isFlipped: false,
      congestionImpactPerQtl: 0,
      totalPocketImpact: 0,
      pcs: 0.15,
      absorptionCapacity: 'Insufficient Data',
      alertMessage: 'Historical data is insufficient to model market congestion reliably. Using standard AsliDaam advice.',
      confidence: 'LOW'
    };
  }

  // 1. Identify Normal Winner (Highest Normal NRV)
  eligibleCandidates.sort((a, b) => b.normalNrv - a.normalNrv);
  const normalWinner = eligibleCandidates[0];

  // 2. Identify Congestion-Adjusted Winner (Highest Adjusted NRV)
  const sortedByAdjusted = [...eligibleCandidates].sort((a, b) => b.adjustedNrv - a.adjustedNrv);
  const adjustedWinner = sortedByAdjusted[0];

  const isFlipped = (
    normalWinner.marketId !== adjustedWinner.marketId || 
    normalWinner.day !== adjustedWinner.day
  );

  const congestionImpactPerQtl = normalWinner.congestionImpactPerQtl;
  const totalPocketImpact = Math.round(congestionImpactPerQtl * quantityQuintals);

  let status: CongestionRiskStatus;
  let statusLabel: string;
  let alertMessage: string;
  let diversionAdvice: string | undefined;

  if (isFlipped) {
    status = 'HIGH_RISK';
    statusLabel = '⚠️ BHED VIVEK ALERT: CONGESTION DIVERSION';
    const pocketSaved = Math.round((adjustedWinner.adjustedNrv - normalWinner.adjustedNrv) * quantityQuintals);
    alertMessage = `Under ${supplyPressure} supply pressure, ${normalWinner.marketName} faces heavy arrival congestion (-₹${congestionImpactPerQtl}/q). Diverting to ${adjustedWinner.marketName} (Day +${adjustedWinner.day}) protects your profit by +₹${pocketSaved.toLocaleString('en-IN')}!`;
    diversionAdvice = `Divert selling to ${adjustedWinner.marketName} (+${adjustedWinner.day}d). Expected pocket cash: ₹${Math.round(adjustedWinner.adjustedNrv * quantityQuintals).toLocaleString('en-IN')}`;
  } else {
    status = 'LOW_RISK';
    statusLabel = '🟢 LOW CONGESTION RISK';
    alertMessage = `${normalWinner.marketName} has high trading absorption capacity (${normalWinner.capacity}). The recommendation remains optimal even under ${supplyPressure.toLowerCase()} market congestion.`;
    diversionAdvice = `Proceed with ${normalWinner.marketName} (+${normalWinner.day}d) as planned.`;
  }

  return {
    status,
    statusLabel,
    supplyPressure,
    supplyPressureNumeric: pressureNumeric,
    originalWinner: {
      marketId: normalWinner.marketId,
      marketName: normalWinner.marketName,
      day: normalWinner.day,
      normalNrv: normalWinner.normalNrv,
      grossPrice: normalWinner.grossPrice
    },
    adjustedWinner: {
      marketId: adjustedWinner.marketId,
      marketName: adjustedWinner.marketName,
      day: adjustedWinner.day,
      adjustedNrv: adjustedWinner.adjustedNrv,
      adjustedGrossPrice: adjustedWinner.adjustedPrice
    },
    isFlipped,
    congestionImpactPerQtl,
    totalPocketImpact,
    pcs: normalWinner.pcs,
    absorptionCapacity: normalWinner.capacity,
    alertMessage,
    diversionAdvice,
    confidence: 'HIGH'
  };
}

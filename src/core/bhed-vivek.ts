/**
 * MandiMitra Core: Bhed Vivek (भीड़ विवेक) — Crowd-Aware / Market Congestion Intelligence
 *
 * OWNER: Amay (Team Lead)
 *
 * WHAT CHANGED AND WHY
 * --------------------
 * Bhed Vivek used to require the farmer to pick the crowd level themselves (LOW / MEDIUM / HIGH)
 * and scored each yard against a hand-written table of 19 congestion constants, leaving 63 of
 * Maharashtra's 82 registered yards on a single default number. That is precisely backwards: the
 * farmer cannot know the crowd before travelling, and the constants were not measured.
 *
 * Bhed Vivek now consumes a per-mandi, per-day arrival-pressure FORECAST from src/core/mandi-rush.ts:
 *   - theta (arrival pressure) is PREDICTED for each mandi and each day, from live Agmarknet
 *     outlet scarcity, measured yard absorption, the published harvest calendar and the live
 *     Open-Meteo rainfall outlook.
 *   - PCS (price congestion sensitivity) is derived from each yard's MEASURED trading breadth
 *     rather than assigned by name.
 * A farmer may still override the level to explore a what-if; the result records which basis was
 * used via `supplyPressureBasis` so a prediction is never presented as a manual scenario, or the
 * reverse.
 *
 * Mathematical Architecture (unchanged in form, now fed by measurements):
 *   Timing Factor (tau):  Day 0: 0.35 | Day 1: 0.90 | Day 2: 1.00 | Day 3: 0.75
 *     Farmers cannot all mobilise today; a coordinated wave peaks around +2 days and then disperses.
 *   Congestion Impact:    dP    = GrossPrice x PCS x theta x tau
 *   Adjusted Price:       P_adj = GrossPrice - dP
 *   Adjusted Realisation: NRV_adj = P_adj - Transport - WaitingCost
 */

import {
  MarketEvaluation,
  BhedVivekEvaluation,
  SupplyPressureLevel,
  SupplyPressureBasis,
  CongestionRiskStatus
} from '../contracts/domain';
import { MandiRushForecast, levelToScore, CSI_MIN, CSI_MAX } from './mandi-rush';

/**
 * Timing concentration factor: how synchronised arrivals are on each day offset after a
 * recommendation is issued. Documented behavioural structure, applied identically to every mandi.
 */
const TIMING_FACTORS: Record<number, number> = {
  0: 0.35, // Today: farmers cannot mobilise simultaneously
  1: 0.90, // Day +1: initial wave arrives
  2: 1.00, // Day +2: peak coordinated arrival concentration
  3: 0.75  // Day +3: dispersion and clearing begins
};

/**
 * Fallback congestion sensitivity for a mandi with no rush forecast: the midpoint of the observed
 * band. Used only when the forecast could not be produced at all, and reported as LOW confidence.
 */
const FALLBACK_CSI = Math.round(((CSI_MIN + CSI_MAX) / 2) * 1000) / 1000;

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
  theta: number;
  capacity: string;
  predictedLevel: SupplyPressureLevel;
  isEligible: boolean;
}

export interface BhedVivekOptions {
  /** Per-mandi rush forecasts keyed by market id. When absent, evaluation falls back to defaults. */
  rushForecasts?: Map<string, MandiRushForecast>;
  /** Farmer-selected what-if level. When provided it replaces the predicted arrival pressure. */
  supplyPressureOverride?: SupplyPressureLevel | null;
}

/**
 * Evaluates Bhed Vivek crowd-congestion intelligence across candidate markets.
 */
export function evaluateBhedVivek(
  evaluations: MarketEvaluation[],
  commodity: string = 'Onion',
  quantityQuintals: number = 25,
  options: BhedVivekOptions = {}
): BhedVivekEvaluation {
  const rushForecasts = options.rushForecasts || new Map<string, MandiRushForecast>();
  const override = options.supplyPressureOverride || null;
  const basis: SupplyPressureBasis = override ? 'USER_OVERRIDE' : 'FORECAST';
  const overrideScore = override ? levelToScore(override) : null;

  const flatCandidates: CandidateEvaluationFlat[] = [];

  for (const ev of evaluations) {
    const isEligible = ev.dataQuality.isEligibleForRecommendation;
    const rush = rushForecasts.get(ev.market.id);

    // PCS is the yard's MEASURED position inside the observed congestion-sensitivity band.
    const pcs = rush ? rush.congestionSensitivity : FALLBACK_CSI;
    const capacity = rush ? rush.absorptionCapacityLabel : 'Absorption capacity not measured for this yard';

    for (const nr of ev.netRealisationByDay) {
      const timingFactor = TIMING_FACTORS[nr.day] ?? 0.80;

      // theta: predicted arrival pressure for THIS mandi on THIS day, unless overridden.
      const dayOutlook = rush?.byDay.find(d => d.day === nr.day);
      const theta = overrideScore !== null
        ? overrideScore
        : (dayOutlook ? dayOutlook.pressureScore : (rush ? rush.pressureScore : 0.5));
      const predictedLevel: SupplyPressureLevel =
        override || dayOutlook?.level || rush?.predictedPressure || 'MEDIUM';

      // Congestion impact: dP = Price x PCS x theta x tau
      const priceImpact = Math.round(nr.expectedPrice * pcs * theta * timingFactor * 10) / 10;
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
        theta,
        capacity,
        predictedLevel,
        isEligible
      });
    }
  }

  const eligibleCandidates = flatCandidates.filter(c => c.isEligible);

  // Honest abstention when nothing in range passes the data-quality gate.
  if (eligibleCandidates.length === 0) {
    return {
      status: 'UNKNOWN',
      statusLabel: 'CONGESTION RISK UNKNOWN',
      supplyPressure: override || 'MEDIUM',
      supplyPressureNumeric: overrideScore ?? 0.5,
      supplyPressureBasis: basis,
      rushForecasts: Array.from(rushForecasts.values()),
      winnerRushForecast: null,
      originalWinner: { marketId: '', marketName: 'None', day: 0, normalNrv: 0, grossPrice: 0 },
      adjustedWinner: { marketId: '', marketName: 'None', day: 0, adjustedNrv: 0, adjustedGrossPrice: 0 },
      isFlipped: false,
      congestionImpactPerQtl: 0,
      totalPocketImpact: 0,
      pcs: FALLBACK_CSI,
      absorptionCapacity: 'Insufficient Data',
      alertMessage: 'No mandi in range passed the data-quality gate, so crowd risk cannot be modelled. Standard AsliDaam advice applies.',
      confidence: 'LOW'
    };
  }

  // 1. Winner ignoring congestion
  eligibleCandidates.sort((a, b) => b.normalNrv - a.normalNrv);
  const normalWinner = eligibleCandidates[0];

  // 2. Winner once predicted congestion is priced in
  const sortedByAdjusted = [...eligibleCandidates].sort((a, b) => b.adjustedNrv - a.adjustedNrv);
  const adjustedWinner = sortedByAdjusted[0];

  const isFlipped = (
    normalWinner.marketId !== adjustedWinner.marketId ||
    normalWinner.day !== adjustedWinner.day
  );

  const congestionImpactPerQtl = normalWinner.congestionImpactPerQtl;
  const totalPocketImpact = Math.round(congestionImpactPerQtl * quantityQuintals);
  const winnerRush = rushForecasts.get(normalWinner.marketId) || null;

  const levelWord: Record<SupplyPressureLevel, string> = {
    LOW: 'light', MEDIUM: 'moderate', HIGH: 'heavy'
  };
  const pressureWord = levelWord[normalWinner.predictedLevel];
  const basisPhrase = override
    ? `Under your selected ${override.toLowerCase()} crowd scenario`
    : `MandiMitra forecasts ${pressureWord} arrivals`;

  let status: CongestionRiskStatus;
  let statusLabel: string;
  let alertMessage: string;
  let diversionAdvice: string | undefined;

  if (isFlipped) {
    status = 'HIGH_RISK';
    statusLabel = 'BHED VIVEK ALERT: CONGESTION DIVERSION';
    const pocketSaved = Math.round((adjustedWinner.adjustedNrv - normalWinner.adjustedNrv) * quantityQuintals);
    alertMessage = `${basisPhrase} at ${normalWinner.marketName} on day +${normalWinner.day}, costing about ₹${congestionImpactPerQtl}/q in auction slippage. Diverting to ${adjustedWinner.marketName} (Day +${adjustedWinner.day}) protects roughly ₹${pocketSaved.toLocaleString('en-IN')} of your payout.`;
    diversionAdvice = `Divert to ${adjustedWinner.marketName} (+${adjustedWinner.day}d). Expected pocket cash: ₹${Math.round(adjustedWinner.adjustedNrv * quantityQuintals).toLocaleString('en-IN')}`;
  } else {
    status = normalWinner.predictedLevel === 'HIGH' ? 'HIGH_RISK' : 'LOW_RISK';
    statusLabel = normalWinner.predictedLevel === 'HIGH'
      ? 'HEAVY ARRIVALS EXPECTED — STILL THE BEST YARD'
      : 'LOW CONGESTION RISK';
    alertMessage = `${basisPhrase} at ${normalWinner.marketName}. Absorption capacity: ${normalWinner.capacity}. Even after pricing in about ₹${congestionImpactPerQtl}/q of crowd slippage, it remains the best net option.`;
    diversionAdvice = `Proceed with ${normalWinner.marketName} (+${normalWinner.day}d) as planned.`;
  }

  if (winnerRush && !override) {
    const quietest = [...winnerRush.byDay].sort((a, b) => a.pressureScore - b.pressureScore)[0];
    if (quietest && quietest.day !== normalWinner.day && quietest.level !== normalWinner.predictedLevel) {
      alertMessage += ` Quietest day in the window: ${quietest.weekdayName} (${quietest.level.toLowerCase()} crowd) — ${quietest.note}`;
    }
  }

  // Confidence follows the forecast that produced theta, not a fixed literal.
  const confidence: 'HIGH' | 'MEDIUM' | 'LOW' = override
    ? 'MEDIUM'
    : (winnerRush ? winnerRush.confidence : 'LOW');

  return {
    status,
    statusLabel,
    supplyPressure: normalWinner.predictedLevel,
    supplyPressureNumeric: Math.round(normalWinner.theta * 1000) / 1000,
    supplyPressureBasis: basis,
    rushForecasts: Array.from(rushForecasts.values()),
    winnerRushForecast: winnerRush,
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
    confidence
  };
}

/**
 * MandiMitra Core: Decision Policy & Confidence Engine
 * Evaluates sell-today vs wait policy, risk adjustment, and confidence grading.
 * 
 * OWNER: Amay (Team Lead)
 * 
 * Invariants:
 * - NO_RECOMMENDATION is a first-class action, not a null/error.
 * - Ineligible (POOR) markets are never recommended.
 * - Deterministic, rule-based confidence assignment.
 */

import { 
  MarketEvaluation, 
  Recommendation, 
  ConfidenceTier, 
  NetRealisation 
} from '../contracts/domain';
import { config } from '../config';

export function evaluateDecisionPolicy(
  evaluations: MarketEvaluation[],
  k: number = config.decisionRiskK,
  threshold: number = config.decisionGainThreshold
): Recommendation {
  // 1. Filter to eligible markets only (Data quality !== 'POOR')
  const eligibleEvaluations = evaluations.filter(ev => ev.dataQuality.isEligibleForRecommendation);

  // 2. Abstention check: If no candidate market has acceptable data quality
  if (eligibleEvaluations.length === 0) {
    return {
      action: 'NO_RECOMMENDATION',
      market: null,
      confidence: 'LOW',
      expectedGainPerQtl: 0,
      riskAdjustedGainPerQtl: 0,
      reasons: [
        'All candidate mandis within search radius have stale or sparse reporting (POOR data quality tier).',
        'Data recency is older than 5 days or 30-day reporting density is under 40%.',
        'To protect farmer financial returns from misleading advice, MandiMitra refuses to recommend.'
      ]
    };
  }

  // 3. Find best option on Day 0 (Sell Today) across all eligible markets
  let bestTodayOption: { evaluation: MarketEvaluation; net: NetRealisation } | null = null;

  for (const ev of eligibleEvaluations) {
    const day0Net = ev.netRealisationByDay.find(nr => nr.day === 0);
    if (day0Net) {
      if (!bestTodayOption || day0Net.netRealisation > bestTodayOption.net.netRealisation) {
        bestTodayOption = { evaluation: ev, net: day0Net };
      }
    }
  }

  // 4. Find best future option across days 1, 2, 3
  let bestFutureOption: { evaluation: MarketEvaluation; net: NetRealisation } | null = null;

  for (const ev of eligibleEvaluations) {
    const futureNets = ev.netRealisationByDay.filter(nr => nr.day > 0);
    for (const fn of futureNets) {
      if (!bestFutureOption || fn.netRealisation > bestFutureOption.net.netRealisation) {
        bestFutureOption = { evaluation: ev, net: fn };
      }
    }
  }

  if (!bestTodayOption) {
    return {
      action: 'NO_RECOMMENDATION',
      market: null,
      confidence: 'LOW',
      expectedGainPerQtl: 0,
      reasons: ['No price observation available for current market day.']
    };
  }

  // 5. Evaluate Expected Gain & Risk-Adjusted Gain
  const expectedGain = bestFutureOption 
    ? bestFutureOption.net.netRealisation - bestTodayOption.net.netRealisation
    : 0;

  const volatility = bestFutureOption ? bestFutureOption.evaluation.forecast.uncertainty : 0;
  const riskAdjustedGain = expectedGain - (k * volatility);

  // 6. Assign Confidence based on the Frozen Rule Table
  let confidence: ConfidenceTier = 'LOW';
  const targetQuality = (bestFutureOption || bestTodayOption).evaluation.dataQuality.tier;

  if (targetQuality === 'GOOD' && expectedGain > 2 * volatility) {
    confidence = 'HIGH';
  } else if ((targetQuality === 'GOOD' || targetQuality === 'MODERATE') && expectedGain > volatility) {
    confidence = 'MEDIUM';
  } else {
    confidence = 'LOW';
  }

  // 7. Policy threshold decision: wait vs sell today
  if (bestFutureOption && riskAdjustedGain > threshold) {
    const waitDay = bestFutureOption.net.day;
    const action = waitDay === 1 ? 'WAIT_1_DAY' : waitDay === 2 ? 'WAIT_2_DAYS' : 'WAIT_3_DAYS';

    return {
      action,
      market: bestFutureOption.evaluation.market,
      confidence,
      expectedGainPerQtl: Math.round(expectedGain * 10) / 10,
      riskAdjustedGainPerQtl: Math.round(riskAdjustedGain * 10) / 10,
      reasons: [
        `${bestFutureOption.evaluation.market.name} offers highest projected net return (₹${bestFutureOption.net.netRealisation.toFixed(1)}/qtl) on Day ${waitDay}.`,
        `Expected gross price gain is +₹${(bestFutureOption.net.expectedPrice - bestTodayOption.net.expectedPrice).toFixed(1)}/qtl vs selling today.`,
        `Net gain after holding cost (₹${bestFutureOption.net.waitingCostPerQtl.toFixed(1)}/qtl) and transport exceeds risk threshold by ₹${riskAdjustedGain.toFixed(1)}/qtl.`
      ]
    };
  } else {
    return {
      action: 'SELL_TODAY',
      market: bestTodayOption.evaluation.market,
      confidence: targetQuality === 'GOOD' ? 'HIGH' : 'MEDIUM',
      expectedGainPerQtl: 0,
      riskAdjustedGainPerQtl: 0,
      reasons: [
        `Selling today at ${bestTodayOption.evaluation.market.name} secures optimal net return of ₹${bestTodayOption.net.netRealisation.toFixed(1)}/qtl.`,
        `Projected future price appreciation does not sufficiently compensate for holding depreciation and price volatility buffer (₹${volatility.toFixed(1)}/qtl).`,
        `Road distance of ~${bestTodayOption.evaluation.market.estimatedRoadDistanceKm?.toFixed(1) || 0} km keeps haulage tariffs minimal at ₹${bestTodayOption.net.transportCostPerQtl.toFixed(1)}/qtl.`
      ]
    };
  }
}

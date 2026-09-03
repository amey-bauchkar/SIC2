/**
 * MandiMitra Core: Template-Based Explanation Generator
 * Constructs transparent, factual reasons derived directly from algorithmic variables.
 * 
 * OWNER: Amay (Team Lead)
 * Invariant: Never invented language, never LLM hallucination.
 */

import { MarketEvaluation, Recommendation } from '../contracts/domain';

export function formatExplanationSummary(
  recommendation: Recommendation,
  evaluations: MarketEvaluation[]
): string[] {
  const reasons = [...recommendation.reasons];

  if (recommendation.action === 'NO_RECOMMENDATION') {
    const poorMarkets = evaluations.filter(e => e.dataQuality.tier === 'POOR');
    if (poorMarkets.length > 0) {
      reasons.push(
        `Underlying data for ${poorMarkets.map(m => m.market.name).join(', ')} failed quality checks.`
      );
    }
    return reasons;
  }

  // Add transport cost insight
  if (recommendation.market) {
    const chosenEval = evaluations.find(e => e.market.id === recommendation.market?.id);
    if (chosenEval && chosenEval.market.estimatedRoadDistanceKm) {
      const day0 = chosenEval.netRealisationByDay.find(n => n.day === 0);
      if (day0) {
        reasons.push(
          `Haulage logistics: ~${chosenEval.market.estimatedRoadDistanceKm.toFixed(1)} km estimated road haulage incurs ₹${day0.transportCostPerQtl.toFixed(1)}/qtl freight cost.`
        );
      }
    }
  }

  return reasons;
}

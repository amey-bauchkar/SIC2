/**
 * MandiMitra Core: Nirnay Kawach (निर्णय कवच) — Decision Shield
 * Decision Stress-Testing & Robustness Verification Engine
 * 
 * OWNER: Amay (Team Lead)
 * 
 * Mathematical Architecture:
 * 1. Breakeven Analysis: Calculates the exact transport cost threshold where
 *    the recommended market flips to the next best alternative.
 * 2. Monte Carlo Stress-Testing: Perturbs transport rates and price forecasts
 *    using empirical prediction-error residuals from the historical backtest.
 * 3. 3-Tier Classification:
 *    - ROBUST (>= 70%): High stability under plausible cost & price shocks.
 *    - CLOSE CALL (60% - 69%): Advantage is narrow; small shift changes the winner.
 *    - NO STRONG RECOMMENDATION (< 60%): High fragility; refuses to force false certainty.
 */

import { 
  MarketEvaluation, 
  NirnayKawachResult, 
  DecisionRobustnessStatus 
} from '../contracts/domain';

// Historical prediction residual standard deviations (from 324-day backtest)
const HISTORICAL_RESIDUAL_SIGMA: Record<string, number> = {
  onion: 125.0,    // Onion Lasalgaon residual std dev (₹/q)
  tomato: 180.0,   // Tomato Junnar residual std dev (₹/q)
  soyabean: 65.0,  // Soyabean Latur residual std dev (₹/q)
  default: 110.0
};

interface CandidateOption {
  marketId: string;
  marketName: string;
  day: number;
  expectedPrice: number;
  roadDistanceKm: number;
  baselineTransportCost: number;
  waitingCost: number;
  netRealisation: number;
  isEligible: boolean;
}

/**
 * Standard Box-Muller Gaussian sampling for Monte Carlo residuals.
 */
function sampleGaussian(mean: number, stdDev: number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * stdDev;
}

/**
 * Extracts flat candidate options across all mandis and forecast days (0 to 3).
 */
function flattenCandidateOptions(evaluations: MarketEvaluation[]): CandidateOption[] {
  const options: CandidateOption[] = [];

  for (const ev of evaluations) {
    const isEligible = ev.dataQuality.isEligibleForRecommendation;
    const roadDist = ev.market.estimatedRoadDistanceKm || 0.0;

    for (const nr of ev.netRealisationByDay) {
      options.push({
        marketId: ev.market.id,
        marketName: ev.market.name,
        day: nr.day,
        expectedPrice: nr.expectedPrice,
        roadDistanceKm: roadDist,
        baselineTransportCost: nr.transportCostPerQtl,
        waitingCost: nr.waitingCostPerQtl,
        netRealisation: nr.netRealisation,
        isEligible
      });
    }
  }

  return options;
}

/**
 * Calculates the exact algebraic transport breakeven rate where:
 * NRV(winner, T*) = NRV(runnerUp, T*)
 */
function calculateAlgebraicBreakeven(
  winner: CandidateOption,
  runnerUp: CandidateOption,
  storageCostPerDay: number
): number | null {
  const distDiff = winner.roadDistanceKm - runnerUp.roadDistanceKm;
  if (Math.abs(distDiff) < 1.0) {
    // Mandis have nearly identical distance; transport cost will not flip them
    return null;
  }

  // Equation: P1 - T* * D1 - d1*S = P2 - T* * D2 - d2*S
  // T* * (D1 - D2) = (P1 - P2) - S * (d1 - d2)
  const priceDiff = winner.expectedPrice - runnerUp.expectedPrice;
  const storageDiff = storageCostPerDay * (winner.day - runnerUp.day);
  const breakevenT = (priceDiff - storageDiff) / distDiff;

  if (breakevenT > 0 && breakevenT < 30.0) {
    return Math.round(breakevenT * 100) / 100;
  }

  return null;
}

/**
 * Evaluates Nirnay Kawach Decision Shield over AsliDaam evaluations.
 */
export function evaluateNirnayKawach(
  evaluations: MarketEvaluation[],
  commodity: string,
  currentTransportRate: number = 2.5,
  storageCostPerDay: number = 0.45,
  simulationsCount: number = 500
): NirnayKawachResult {
  const commKey = commodity.toLowerCase();
  const residualSigma = HISTORICAL_RESIDUAL_SIGMA[commKey] || HISTORICAL_RESIDUAL_SIGMA['default'];

  // 1. Flatten and filter eligible candidates
  const allOptions = flattenCandidateOptions(evaluations);
  const eligibleOptions = allOptions.filter(o => o.isEligible);

  if (eligibleOptions.length === 0) {
    return {
      status: 'NO_STRONG_RECOMMENDATION',
      statusLabel: 'NO STRONG RECOMMENDATION',
      robustnessScore: 0.0,
      robustnessPct: 0.0,
      currentTransportRate,
      breakevenTransportRate: null,
      breakevenExplanation: 'All markets have poor reporting quality; abstention triggered.',
      simulationsCount: 0,
      winningMarket: { id: '', name: 'None', day: 0, expectedNetRealisation: 0 },
      topAlternative: null,
      decisionMessage: 'Cannot evaluate robustness due to complete data abstention.',
      sliderBounds: { min: 1.0, max: 10.0, current: currentTransportRate, breakeven: currentTransportRate, step: 0.2 }
    };
  }

  // 2. Identify Original Winner and Runner-up
  eligibleOptions.sort((a, b) => b.netRealisation - a.netRealisation);
  const winner = eligibleOptions[0];
  const runnerUp = eligibleOptions.length > 1 ? eligibleOptions[1] : null;

  // 3. Algebraic Breakeven Calculation
  let breakevenRate: number | null = null;
  if (runnerUp) {
    breakevenRate = calculateAlgebraicBreakeven(winner, runnerUp, storageCostPerDay);
  }

  // 4. Monte Carlo Decision Stability Simulation
  let winnerWinsCount = 0;
  const runnerUpWinsCount = 0;

  for (let i = 0; i < simulationsCount; i++) {
    // Perturb transport rate uniformly: +/- 40%
    const perturbedTransport = currentTransportRate * (0.6 + Math.random() * 0.8);
    // Perturb price using real backtest residual distribution
    const priceShock = sampleGaussian(0, residualSigma);

    let simBestNet = -Infinity;
    let simWinnerOption: CandidateOption | null = null;

    for (const opt of eligibleOptions) {
      // Recompute NRV under simulated scenario
      const simTransportCost = opt.roadDistanceKm * perturbedTransport;
      const simPrice = opt.expectedPrice + priceShock;
      const simNet = simPrice - simTransportCost - opt.waitingCost;

      if (simNet > simBestNet) {
        simBestNet = simNet;
        simWinnerOption = opt;
      }
    }

    if (
      simWinnerOption && 
      simWinnerOption.marketId === winner.marketId && 
      simWinnerOption.day === winner.day
    ) {
      winnerWinsCount++;
    }
  }

  const robustnessScore = Math.round((winnerWinsCount / simulationsCount) * 1000) / 1000;
  const robustnessPct = Math.round(robustnessScore * 1000) / 10;

  // 5. Determine Decision State
  let status: DecisionRobustnessStatus;
  let statusLabel: string;
  let decisionMessage: string;

  const marginDiff = runnerUp ? Math.round((winner.netRealisation - runnerUp.netRealisation) * 10) / 10 : 0.0;

  if (robustnessScore >= 0.70) {
    status = 'ROBUST';
    statusLabel = 'ROBUST DECISION';
    decisionMessage = breakevenRate
      ? `This recommendation remains unchanged under ${robustnessPct}% of tested cost and price scenarios. Remains optimal until transport exceeds ₹${breakevenRate}/km.`
      : `This recommendation remains unchanged under ${robustnessPct}% of tested scenarios with high safety margin.`;
  } else if (robustnessScore >= 0.60 || (runnerUp && marginDiff < 30.0)) {
    status = 'CLOSE_CALL';
    statusLabel = 'CLOSE CALL';
    decisionMessage = runnerUp
      ? `Advantage of ${winner.marketName} over ${runnerUp.marketName} is only ₹${marginDiff}/q. Small cost changes could make the alternative better.`
      : `Decision is moderately sensitive to transport and price swings.`;
  } else {
    status = 'NO_STRONG_RECOMMENDATION';
    statusLabel = 'NO STRONG RECOMMENDATION';
    decisionMessage = 'Small changes in transport or price assumptions change the best option. No single choice dominates with confidence.';
  }

  // 6. Format Breakeven Explanation
  let breakevenExplanation = '';
  if (breakevenRate && runnerUp) {
    const marginPct = Math.round(((breakevenRate - currentTransportRate) / currentTransportRate) * 100);
    breakevenExplanation = `Recommendation flips to ${runnerUp.marketName} (+${runnerUp.day}d) if transport cost rises above ₹${breakevenRate}/km (${marginPct > 0 ? '+' : ''}${marginPct}% buffer).`;
  } else {
    breakevenExplanation = 'Recommendation does not flip within the tested transport range.';
  }

  // 7. Slider Bounds for Frontend Demo
  const sliderMin = 1.0;
  const sliderMax = Math.max(12.0, (breakevenRate || currentTransportRate) * 1.5);

  return {
    status,
    statusLabel,
    robustnessScore,
    robustnessPct,
    currentTransportRate,
    breakevenTransportRate: breakevenRate,
    breakevenMarginPct: breakevenRate ? Math.round(((breakevenRate - currentTransportRate) / currentTransportRate) * 100) : undefined,
    breakevenExplanation,
    simulationsCount,
    winningMarket: {
      id: winner.marketId,
      name: winner.marketName,
      day: winner.day,
      expectedNetRealisation: winner.netRealisation
    },
    topAlternative: runnerUp ? {
      id: runnerUp.marketId,
      name: runnerUp.marketName,
      day: runnerUp.day,
      expectedNetRealisation: runnerUp.netRealisation,
      marginDiffPerQtl: marginDiff
    } : null,
    decisionMessage,
    sliderBounds: {
      min: sliderMin,
      max: Math.round(sliderMax * 10) / 10,
      current: currentTransportRate,
      breakeven: breakevenRate || currentTransportRate,
      step: 0.25
    }
  };
}

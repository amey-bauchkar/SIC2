/**
 * MandiMitra Core: Data Quality Assessment Engine
 * Enforces data-quality tiering rules and recommendation eligibility.
 * 
 * OWNER: Amay (Team Lead)
 * 
 * Rules:
 * - daysSinceLastReport <= 2 AND coverage30d >= 70% -> GOOD
 * - daysSinceLastReport <= 5 AND coverage30d >= 40% -> MODERATE
 * - Else                                           -> POOR (Ineligible)
 */

import { DataQualityAssessment, DataQualityTier } from '../contracts/domain';

export function assessDataQuality(
  daysSinceLastReport: number,
  reportingDaysCountInLast30Days: number
): DataQualityAssessment {
  const coverage30d = Math.min(100.0, Math.max(0.0, (reportingDaysCountInLast30Days / 30.0) * 100.0));
  const missingDays = Math.max(0, 30 - reportingDaysCountInLast30Days);

  let tier: DataQualityTier = 'POOR';

  if (daysSinceLastReport <= 2 && coverage30d >= 70.0) {
    tier = 'GOOD';
  } else if (daysSinceLastReport <= 5 && coverage30d >= 40.0) {
    tier = 'MODERATE';
  } else {
    tier = 'POOR';
  }

  return {
    tier,
    daysSinceLastReport,
    coverage30d,
    missingDays,
    isEligibleForRecommendation: tier !== 'POOR'
  };
}

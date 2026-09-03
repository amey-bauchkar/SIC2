/**
 * MandiMitra Shared Component: QualityBadge
 * Renders a visual tag reflecting data quality tier (GOOD, MODERATE, POOR).
 * 
 * OWNER: Janhvi (Frontend Lead)
 * Pure presentation - consumes DataQualityAssessment contract.
 * Strictly using the 3-color palette:
 * - GOOD: sage green accent (#8B9271) on soft yellow (#FEF3A3) or sage-tint
 * - MODERATE: soft yellow fill (#FEF3A3) with black text (#1A1A1A)
 * - POOR: pale sage tint with black text
 */

import { QualityBadgeProps } from '../../contracts/frontend';

export function renderQualityBadge(props: QualityBadgeProps): HTMLElement {
  const { assessment, compact = false } = props;
  const badge = document.createElement('span');
  badge.className = `quality-badge tier-${assessment.tier.toLowerCase()}`;

  let label: string = assessment.tier;
  if (!compact) {
    label = `${assessment.tier} DATA (${assessment.coverage30d.toFixed(0)}% coverage, ${assessment.daysSinceLastReport}d ago)`;
  }

  badge.textContent = label;

  badge.style.display = 'inline-flex';
  badge.style.alignItems = 'center';
  badge.style.padding = compact ? '3px 10px' : '4px 12px';
  badge.style.borderRadius = 'var(--radius-full)';
  badge.style.fontSize = 'var(--font-size-xs)';
  badge.style.fontWeight = '700';
  badge.style.letterSpacing = '0.02em';
  badge.style.fontFamily = 'var(--font-family-sans)';

  if (assessment.tier === 'GOOD') {
    badge.style.backgroundColor = 'var(--color-sage)';
    badge.style.color = 'var(--color-white)';
    badge.style.border = 'none';
  } else if (assessment.tier === 'MODERATE') {
    badge.style.backgroundColor = 'var(--color-yellow)';
    badge.style.color = 'var(--color-black)';
    badge.style.border = '1px solid rgba(26, 26, 26, 0.08)';
  } else {
    // POOR / Abstain
    badge.style.backgroundColor = 'var(--color-sage-light)';
    badge.style.color = 'var(--color-black)';
    badge.style.border = '1px solid rgba(26, 26, 26, 0.12)';
  }

  return badge;
}

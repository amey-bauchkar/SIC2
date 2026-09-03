/**
 * MandiMitra Shared Component: QualityBadge
 * Renders a visual tag reflecting data quality tier (GOOD, MODERATE, POOR).
 * 
 * OWNER: Janhvi (Frontend Lead)
 * Pure presentation - consumes DataQualityAssessment contract.
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

  // Inline scoped styling referencing CSS tokens
  badge.style.display = 'inline-flex';
  badge.style.alignItems = 'center';
  badge.style.padding = compact ? '2px 8px' : '4px 10px';
  badge.style.borderRadius = 'var(--radius-full)';
  badge.style.fontSize = 'var(--font-size-xs)';
  badge.style.fontWeight = '600';

  if (assessment.tier === 'GOOD') {
    badge.style.backgroundColor = 'var(--color-status-success-bg)';
    badge.style.color = 'var(--color-status-success)';
  } else if (assessment.tier === 'MODERATE') {
    badge.style.backgroundColor = 'var(--color-status-warning-bg)';
    badge.style.color = 'var(--color-status-warning)';
  } else {
    badge.style.backgroundColor = 'var(--color-status-abstain-bg)';
    badge.style.color = 'var(--color-status-abstain)';
  }

  return badge;
}

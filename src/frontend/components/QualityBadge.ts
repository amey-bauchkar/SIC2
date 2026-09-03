/**
 * MandiMitra Shared Component: QualityBadge
 * Renders a visual tag reflecting data quality tier (GOOD, MODERATE, POOR).
 * Adheres strictly to the brand design system tokens.
 */

import { QualityBadgeProps } from '../../contracts/frontend';

export function renderQualityBadge(props: QualityBadgeProps): HTMLElement {
  const { assessment, compact = false } = props;
  const badge = document.createElement('span');
  badge.className = `badge quality-badge tier-${assessment.tier.toLowerCase()}`;

  let label: string = assessment.tier;
  if (!compact) {
    label = `${assessment.tier} DATA (${assessment.coverage30d.toFixed(0)}% coverage, ${assessment.daysSinceLastReport}d ago)`;
  }

  badge.textContent = label;

  if (assessment.tier === 'GOOD') {
    badge.className += ' badge-success';
  } else if (assessment.tier === 'MODERATE') {
    badge.className += ' badge-warning';
  } else {
    badge.className += ' badge-danger';
  }

  return badge;
}

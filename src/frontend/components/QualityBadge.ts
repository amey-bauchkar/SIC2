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
    if (assessment.priceProvenance) {
      const short: Record<string, string> = {
        AGMARKNET_MARKET_OBSERVED: 'observed',
        HISTORICAL_SERIES_OBSERVED: 'historical series',
        DISTRICT_PEER_CALIBRATED: 'district-calibrated',
        DIVISION_PEER_CALIBRATED: 'division-calibrated',
        STATE_BENCHMARK_CALIBRATED: 'state-calibrated',
        UNAVAILABLE: 'unavailable'
      };
      const tag = short[assessment.priceProvenance] || assessment.priceProvenance.toLowerCase();
      label += ` · ${tag}`;
      if (assessment.observationCount !== undefined) {
        label += ` ×${assessment.observationCount}`;
      }
    }
  }

  // The provenance note explains exactly which Agmarknet records back this price.
  if (assessment.provenanceNote) {
    badge.title = assessment.provenanceNote;
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

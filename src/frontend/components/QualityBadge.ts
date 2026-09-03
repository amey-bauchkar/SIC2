/**
 * MandiMitra Shared Component: QualityBadge
 * Renders a visual tag reflecting data quality tier (GOOD, MODERATE, POOR).
 * Adheres strictly to the brand design system tokens.
 */

import { QualityBadgeProps } from '../../contracts/frontend';
import { store } from '../state/store';
import { formatNumber, Language } from '../i18n';

export function renderQualityBadge(props: QualityBadgeProps): HTMLElement {
  const { assessment, compact = false } = props;
  const lang: Language = store.getState().language || 'mr';
  const badge = document.createElement('span');
  badge.className = `badge quality-badge tier-${assessment.tier.toLowerCase()}`;

  const tierLabels: Record<string, Record<Language, string>> = {
    GOOD: { en: 'GOOD DATA', mr: 'उत्कृष्ट डेटा', hi: 'उत्कृष्ट डेटा' },
    MODERATE: { en: 'MODERATE DATA', mr: 'मध्यम डेटा', hi: 'मध्यम डेटा' },
    POOR: { en: 'POOR DATA', mr: 'निकृष्ट डेटा', hi: 'खराब डेटा' }
  };

  const provenanceLabels: Record<string, Record<Language, string>> = {
    AGMARKNET_MARKET_OBSERVED: { en: 'observed', mr: 'प्रत्यक्ष निरीक्षण', hi: 'प्रत्यक्ष अवलोकन' },
    HISTORICAL_SERIES_OBSERVED: { en: 'historical series', mr: 'ऐतिहासिक मालिका', hi: 'ऐतिहासिक श्रृंखला' },
    DISTRICT_PEER_CALIBRATED: { en: 'district-calibrated', mr: 'जिल्हा-कॅलिब्रेटेड', hi: 'जिला-कैलिब्रेटेड' },
    DIVISION_PEER_CALIBRATED: { en: 'division-calibrated', mr: 'विभाग-कॅलिब्रेटेड', hi: 'मंडल-कैलिब्रेटेड' },
    STATE_BENCHMARK_CALIBRATED: { en: 'state-calibrated', mr: 'राज्य-कॅलिब्रेटेड', hi: 'राज्य-कैलिब्रेटेड' },
    UNAVAILABLE: { en: 'unavailable', mr: 'अनुपलब्ध', hi: 'अनुपलब्ध' }
  };

  let label: string = tierLabels[assessment.tier]?.[lang] || assessment.tier;
  if (!compact) {
    const cov = formatNumber(assessment.coverage30d.toFixed(0), lang);
    const days = formatNumber(assessment.daysSinceLastReport, lang);
    const covDays = lang === 'mr'
      ? `(${cov}% कव्हरेज, ${days} दिवसांपूर्वी)`
      : (lang === 'hi'
      ? `(${cov}% कवरेज, ${days} दिन पूर्व)`
      : `(${cov}% coverage, ${days}d ago)`);

    label = `${label} ${covDays}`;

    if (assessment.priceProvenance) {
      const tag = provenanceLabels[assessment.priceProvenance]?.[lang] || assessment.priceProvenance.toLowerCase();
      label += ` · ${tag}`;
      if (assessment.observationCount !== undefined) {
        label += ` ×${formatNumber(assessment.observationCount, lang)}`;
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


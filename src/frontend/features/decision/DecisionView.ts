/**
 * MandiMitra Feature: Decision Card View
 * Route: /decision
 * 
 * VerdaAgro Editorial Agricultural Redesign
 */

import { store } from '../../state/store';
import { renderDecisionCard } from '../../components/DecisionCard';

export function renderDecisionView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'feature-decision-view';

  const state = store.getState();
  const evalData = state.evaluationData;

  const lang = state.language || 'mr';

  if (!evalData) {
    container.innerHTML = `
      <div class="editorial-panel" style="text-align: center; padding: var(--space-12); max-width: 640px; margin: var(--space-8) auto;">
        <div style="font-size: 3rem; margin-bottom: var(--space-3);">🌾</div>
        <h2 class="heading-lg" style="margin-bottom: var(--space-2);">${lang === 'mr' ? 'कोणतेही सक्रिय मूल्यमापन नाही' : (lang === 'hi' ? 'कोई सक्रिय मूल्यांकन नहीं' : 'No Active Evaluation')}</h2>
        <p style="color: var(--color-text-muted); font-size: var(--font-size-sm); margin-bottom: var(--space-6);">
          ${lang === 'mr' ? 'नफ्याची मोजणी करण्यासाठी कृपया निर्णय केंद्र किंवा शेतमाल नोंदणीतून पीक व तालुका निवडा.' : (lang === 'hi' ? 'मुनाफे की गणना करने के लिए कृपया निर्णय केंद्र या फसल प्रविष्टि से फसल व स्थान चुनें.' : 'Please select your crop and location from the Decision Hub or Entry view to calculate optimal returns.')}
        </p>
        <button class="btn btn-primary" id="btn-back-to-entry">
          ${lang === 'mr' ? 'निर्णय केंद्रावर जा' : (lang === 'hi' ? 'निर्णय केंद्र पर जाएं' : 'Go to Decision Hub')}
        </button>
      </div>
    `;

    const btn = container.querySelector('#btn-back-to-entry');
    if (btn) {
      btn.addEventListener('click', () => store.setRoute('/hub'));
    }
    return container;
  }

  const decisionCard = renderDecisionCard({
    recommendation: evalData.recommendation,
    commodity: evalData.commodity,
    onViewEvidenceClick: () => store.setRoute('/evidence'),
    onSelectAnotherCropClick: () => store.setRoute('/hub')
  });

  container.appendChild(decisionCard);
  return container;
}

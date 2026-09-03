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

  if (!evalData) {
    container.innerHTML = `
      <div class="editorial-panel" style="text-align: center; padding: var(--space-12); max-width: 640px; margin: var(--space-8) auto;">
        <div style="font-size: 3rem; margin-bottom: var(--space-3);">🌾</div>
        <h2 class="heading-lg" style="margin-bottom: var(--space-2);">No Active Evaluation</h2>
        <p style="color: var(--color-text-muted); font-size: var(--font-size-sm); margin-bottom: var(--space-6);">
          Please select your crop and location from the Decision Hub or Entry view to calculate optimal returns.
        </p>
        <button class="btn btn-primary" id="btn-back-to-entry">
          Go to Decision Hub
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

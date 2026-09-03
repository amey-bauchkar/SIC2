/**
 * MandiMitra Feature: Decision Card View
 * Route: /decision
 * 
 * OWNER: Tanmay (Frontend Feature Engineer - Decision & Evidence Vertical)
 * Structural placeholder - mounts shared DecisionCard and wires route transitions.
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
      <div class="card" style="text-align: center; padding: var(--space-8);">
        <p style="color: var(--color-text-muted); margin-bottom: var(--space-4);">
          No active evaluation found. Please select a crop first.
        </p>
        <button class="btn btn-primary" id="btn-back-to-entry" style="max-width: 240px; margin: 0 auto;">
          Go to Crop Selection
        </button>
      </div>
    `;
    const btn = container.querySelector('#btn-back-to-entry');
    if (btn) {
      btn.addEventListener('click', () => store.setRoute('/'));
    }
    return container;
  }

  const decisionCard = renderDecisionCard({
    recommendation: evalData.recommendation,
    commodity: evalData.commodity,
    onViewEvidenceClick: () => store.setRoute('/evidence'),
    onSelectAnotherCropClick: () => store.setRoute('/')
  });

  container.appendChild(decisionCard);
  return container;
}

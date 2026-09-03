/**
 * MandiMitra Feature: Nearby Markets Shortlist View
 * Route: /markets
 * 
 * OWNER: Purva (Frontend Feature Engineer - Markets & Trust Vertical)
 * Structural placeholder - renders shortlisted markets, geodesic distance, and quality tier.
 */

import { store } from '../../state/store';
import { renderQualityBadge } from '../../components/QualityBadge';

export function renderMarketsView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'feature-markets-view';

  const state = store.getState();
  const evalData = state.evaluationData;

  container.innerHTML = `
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
        <div>
          <h2 style="font-size: var(--font-size-xl); font-weight: 800;">
            Candidate Mandis (${state.selectedCrop})
          </h2>
          <p style="font-size: var(--font-size-xs); color: var(--color-text-muted);">
            Markets within ${state.costConfig.searchRadiusKm} km of ${state.userLocation?.district || 'Location'}
          </p>
        </div>
        <button class="btn btn-outline" id="btn-adjust-radius" style="width: auto; padding: var(--space-2) var(--space-3); font-size: var(--font-size-xs);">
          Settings
        </button>
      </div>

      <div id="markets-list" style="display: flex; flex-direction: column; gap: var(--space-3);">
        ${!evalData || evalData.evaluations.length === 0 ? `
          <div style="text-align: center; padding: var(--space-6); color: var(--color-text-muted); font-size: var(--font-size-sm);">
            No evaluated candidate markets. Run evaluation from home screen.
          </div>
        ` : ''}
      </div>
    </div>
  `;

  const listContainer = container.querySelector('#markets-list');
  if (listContainer && evalData && evalData.evaluations.length > 0) {
    evalData.evaluations.forEach(ev => {
      const item = document.createElement('div');
      item.style.border = '1px solid var(--color-border)';
      item.style.borderRadius = 'var(--radius-md)';
      item.style.padding = 'var(--space-3) var(--space-4)';
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';

      const isRecommended = evalData.recommendation.market?.id === ev.market.id;

      item.innerHTML = `
        <div>
          <div style="font-size: var(--font-size-base); font-weight: 700; color: var(--color-text-main); display: flex; align-items: center; gap: var(--space-2);">
            ${ev.market.name}
            ${isRecommended ? '<span style="font-size: var(--font-size-xs); background: var(--color-status-success-bg); color: var(--color-status-success); padding: 2px 6px; border-radius: var(--radius-sm); font-weight: 700;">RECOMMENDED</span>' : ''}
          </div>
          <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: var(--space-1);">
            ${ev.market.district}, ${ev.market.state} • ~${ev.market.estimatedRoadDistanceKm?.toFixed(1) || '--'} km road est.
          </div>
        </div>
        <div id="badge-slot"></div>
      `;

      const badgeSlot = item.querySelector('#badge-slot');
      if (badgeSlot) {
        badgeSlot.appendChild(renderQualityBadge({ assessment: ev.dataQuality, compact: true }));
      }

      listContainer.appendChild(item);
    });
  }

  const btnAdjust = container.querySelector('#btn-adjust-radius');
  if (btnAdjust) {
    btnAdjust.addEventListener('click', () => store.setRoute('/settings'));
  }

  return container;
}

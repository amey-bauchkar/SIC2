/**
 * MandiMitra Feature: Nearby Markets Shortlist View
 * Route: /markets
 * 
 * VerdaAgro Editorial Agricultural Redesign
 * 100% Preserves market listing, quality badge slot, and radius navigation
 */

import { store } from '../../state/store';
import { renderQualityBadge } from '../../components/QualityBadge';

export function renderMarketsView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'feature-markets-view';

  const state = store.getState();
  const evalData = state.evaluationData;

  container.innerHTML = `
    <div class="editorial-panel" style="padding: var(--space-8); margin-bottom: var(--space-8);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--space-4); margin-bottom: var(--space-6); border-bottom: 1px solid var(--color-border-subtle); padding-bottom: var(--space-6);">
        <div>
          <div class="kicker">REGIONAL APMC DIRECTORY</div>
          <h2 class="heading-xl">
            Candidate Mandis for ${state.selectedCrop}
          </h2>
          <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); margin-top: 4px;">
            Agricultural produce markets within ${state.costConfig.searchRadiusKm} km of ${state.userLocation?.district || 'Nashik'}
          </p>
        </div>
        <button class="btn btn-outline" id="btn-adjust-radius">
          ⚙️ Adjust Radius & Freight
        </button>
      </div>

      <div id="markets-list" style="display: flex; flex-direction: column; gap: var(--space-3);">
        ${!evalData || evalData.evaluations.length === 0 ? `
          <div style="text-align: center; padding: var(--space-10); color: var(--color-text-muted); font-size: var(--font-size-sm);">
            <div style="font-size: 2.5rem; margin-bottom: var(--space-2);">🗺️</div>
            <p>No active candidate markets evaluated yet.</p>
            <p style="font-size: var(--font-size-xs); margin-top: 4px;">Run an evaluation from the Decision Hub to populate regional mandi data.</p>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  const listContainer = container.querySelector('#markets-list');
  if (listContainer && evalData && evalData.evaluations.length > 0) {
    evalData.evaluations.forEach(ev => {
      const item = document.createElement('div');
      item.style.border = '1.5px solid var(--color-border)';
      item.style.borderRadius = 'var(--radius-lg)';
      item.style.padding = 'var(--space-4) var(--space-5)';
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';
      item.style.flexWrap = 'wrap';
      item.style.gap = 'var(--space-3)';
      item.style.backgroundColor = 'var(--color-bg-surface)';
      item.style.transition = 'all var(--transition-fast)';

      const isRecommended = evalData.recommendation.market?.id === ev.market.id;
      if (isRecommended) {
        item.style.borderColor = 'var(--color-brand-primary)';
        item.style.backgroundColor = 'var(--color-brand-primary-subtle)';
      }

      item.innerHTML = `
        <div>
          <div style="font-family: var(--font-family-heading); font-size: 1.15rem; font-weight: 800; color: var(--color-text-main); display: flex; align-items: center; gap: var(--space-2);">
            ${ev.market.name}
            ${isRecommended ? '<span class="badge badge-accent">🏆 RECOMMENDED</span>' : ''}
          </div>
          <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 4px;">
            ${ev.market.district}, ${ev.market.state} • ~${ev.market.estimatedRoadDistanceKm?.toFixed(1) || '--'} km estimated road haulage
          </div>
        </div>
        <div id="badge-slot"></div>
      `;

      const badgeSlot = item.querySelector('#badge-slot');
      if (badgeSlot) {
        badgeSlot.appendChild(renderQualityBadge({ assessment: ev.dataQuality, compact: false }));
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

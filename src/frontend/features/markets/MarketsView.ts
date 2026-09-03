/**
 * MandiMitra Feature: Nearby Markets Shortlist View
 * Route: /markets
 * 
 * OWNER: Purva (Frontend Feature Engineer - Markets & Trust Vertical)
 * Structural placeholder - renders shortlisted markets, geodesic distance, and quality tier.
 */

import { store } from '../../state/store';
import { renderQualityBadge } from '../../components/QualityBadge';
import { icons } from '../../components/shared/icons';

export function renderMarketsView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'feature-markets-view';

  const state = store.getState();
  const evalData = state.evaluationData;

  container.innerHTML = `
    <!-- Quality Tier Explanation Banner -->
    <div class="markets-legend-banner">
      <div class="markets-legend-title">Data Quality & Trust Tiers</div>
      <div class="markets-legend-grid">
        <div class="legend-item">
          <div class="legend-badge-row">
            <span class="legend-dot-good"></span>
            <span>GOOD QUALITY</span>
          </div>
          <p class="legend-desc">Reported ≤ 2 days ago with ≥ 70% monthly data coverage. Fully eligible for recommendations.</p>
        </div>
        <div class="legend-item">
          <div class="legend-badge-row">
            <span class="legend-dot-mod"></span>
            <span>MODERATE QUALITY</span>
          </div>
          <p class="legend-desc">Reported ≤ 5 days ago with ≥ 40% monthly coverage. Advice given with confidence buffer.</p>
        </div>
        <div class="legend-item">
          <div class="legend-badge-row">
            <span class="legend-dot-poor"></span>
            <span>POOR / ABSTAIN</span>
          </div>
          <p class="legend-desc">Stale reporting (> 5 days) or sparse records. Excluded from recommendations to prevent misleading advice.</p>
        </div>
      </div>
    </div>

    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); flex-wrap: wrap; gap: var(--space-2);">
        <div>
          <h2 style="font-size: var(--font-size-xl); font-weight: 800;">
            Candidate Mandis (${state.selectedCrop})
          </h2>
          <p style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 2px;">
            Markets discovered within ${state.costConfig.searchRadiusKm} km of ${state.userLocation?.district || 'Location'} (Haversine × 1.35 road factor)
          </p>
        </div>
        <button class="btn btn-outline" id="btn-adjust-radius" style="width: auto; padding: 8px 16px; font-size: var(--font-size-xs); display: inline-flex; align-items: center; gap: 6px;">
          <span>Change Search Radius</span>
          <span>${icons.arrowRight(14, '#1A1A1A')}</span>
        </button>
      </div>

      <div id="markets-list" style="display: flex; flex-direction: column; gap: var(--space-3);">
        ${!evalData || evalData.evaluations.length === 0 ? `
          <div style="text-align: center; padding: var(--space-8); color: var(--color-text-muted); font-size: var(--font-size-sm); background: var(--color-bg-canvas); border-radius: var(--radius-lg); border: 1px dashed var(--color-black-border);">
            <div style="display: flex; justify-content: center; margin-bottom: 8px;">
              ${icons.wheat(32, '#8B9271')}
            </div>
            <p style="font-weight: 700; color: var(--color-text-main); margin-bottom: 4px; font-size: 1rem;">No Candidate Mandis Evaluated Yet</p>
            <p style="font-size: 0.85rem; margin-bottom: 16px; color: var(--color-black-muted);">Select your crop and click Calculate on the Home page to evaluate nearby mandis.</p>
            <a href="#/" class="btn btn-primary" style="width: auto; padding: 10px 22px; font-size: 0.85rem; display: inline-flex; gap: 6px;">
              <span>Go to Decision Engine</span>
              <span>${icons.arrowRight(14, '#FFFFFF')}</span>
            </a>
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
          <div style="font-size: var(--font-size-base); font-weight: 700; color: var(--color-text-main); display: flex; align-items: center; gap: 6px;">
            <span style="display: inline-flex; align-items: center; color: var(--color-sage);">
              ${icons.locationPin(16, '#8B9271')}
            </span>
            <span>${ev.market.name}</span>
            ${isRecommended ? '<span style="font-size: var(--font-size-xs); background: var(--color-yellow); color: var(--color-black); padding: 2px 8px; border-radius: var(--radius-full); font-weight: 800; letter-spacing: 0.04em;">RECOMMENDED</span>' : ''}
          </div>
          <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 4px;">
            ${ev.market.district}, ${ev.market.state} • ~${ev.market.estimatedRoadDistanceKm?.toFixed(1) || '--'} km road est.
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <a href="#/evidence" class="btn btn-outline" style="width: auto; padding: 6px 12px; font-size: 0.75rem; white-space: nowrap; display: inline-flex; align-items: center; gap: 4px;">
            <span>View Net Breakdown</span>
            <span>${icons.arrowRight(12, '#1A1A1A')}</span>
          </a>
          <div id="badge-slot"></div>
        </div>
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

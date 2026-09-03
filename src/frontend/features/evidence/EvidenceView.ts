/**
 * MandiMitra Feature: Evidence ("Why?") View
 * Route: /evidence
 * 
 * OWNER: Tanmay (Frontend Feature Engineer - Decision & Evidence Vertical)
 * Structural placeholder - renders granular net realisation breakdown and reasons list.
 */

import { store } from '../../state/store';
import { renderQualityBadge } from '../../components/QualityBadge';

export function renderEvidenceView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'feature-evidence-view';

  const state = store.getState();
  const evalData = state.evaluationData;

  if (!evalData) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: var(--space-8);">
        <p style="color: var(--color-text-muted); margin-bottom: var(--space-4);">
          No active evaluation found to explain.
        </p>
        <button class="btn btn-primary" id="btn-back-to-entry" style="max-width: 240px; margin: 0 auto;">
          Go to Crop Selection
        </button>
      </div>
    `;
    const btn = container.querySelector('#btn-back-to-entry');
    if (btn) btn.addEventListener('click', () => store.setRoute('/'));
    return container;
  }

  const { recommendation, evaluations } = evalData;

  container.innerHTML = `
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
        <h2 style="font-size: var(--font-size-xl); font-weight: 800;">
          Decision Evidence & Why
        </h2>
        <button class="btn btn-outline" id="btn-back-decision" style="width: auto; padding: var(--space-2) var(--space-3); font-size: var(--font-size-xs);">
          ← Back to Decision
        </button>
      </div>

      <div style="margin-bottom: var(--space-6);">
        <h3 style="font-size: var(--font-size-sm); font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: var(--space-2);">
          Algorithmic Rationale
        </h3>
        <ul style="list-style-type: none; padding: 0;">
          ${recommendation.reasons.map(reason => `
            <li style="padding: var(--space-2) 0; border-bottom: 1px solid var(--color-border-subtle); font-size: var(--font-size-sm); display: flex; gap: var(--space-2);">
              <span style="color: var(--color-brand-primary); font-weight: 700;">✓</span>
              <span>${reason}</span>
            </li>
          `).join('')}
        </ul>
      </div>

      ${evaluations && evaluations.length > 0 ? `
        <div style="margin-bottom: var(--space-6);">
          <h3 style="font-size: var(--font-size-sm); font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: var(--space-3);">
            Net Realisation Analysis (Day 0 to 3)
          </h3>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: var(--font-size-xs); text-align: left;">
              <thead>
                <tr style="border-bottom: 2px solid var(--color-border); color: var(--color-text-muted);">
                  <th style="padding: var(--space-2);">Market</th>
                  <th style="padding: var(--space-2);">Day</th>
                  <th style="padding: var(--space-2);">Expected Price</th>
                  <th style="padding: var(--space-2);">Transport</th>
                  <th style="padding: var(--space-2);">Wait Cost</th>
                  <th style="padding: var(--space-2); font-weight: 700;">Net Return</th>
                </tr>
              </thead>
              <tbody>
                ${evaluations.flatMap(ev => 
                  ev.netRealisationByDay.map(nr => `
                    <tr style="border-bottom: 1px solid var(--color-border-subtle);">
                      <td style="padding: var(--space-2); font-weight: 600;">${ev.market.name}</td>
                      <td style="padding: var(--space-2);">Day ${nr.day}</td>
                      <td style="padding: var(--space-2);">₹${nr.expectedPrice.toFixed(1)}</td>
                      <td style="padding: var(--space-2); color: var(--color-status-abstain);">-₹${nr.transportCostPerQtl.toFixed(1)}</td>
                      <td style="padding: var(--space-2); color: var(--color-status-abstain);">-₹${nr.waitingCostPerQtl.toFixed(1)}</td>
                      <td style="padding: var(--space-2); font-weight: 700; color: var(--color-brand-primary);">₹${nr.netRealisation.toFixed(1)}</td>
                    </tr>
                  `)
                ).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}

      <div id="quality-badges-section" style="margin-top: var(--space-4);">
        <h3 style="font-size: var(--font-size-sm); font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: var(--space-2);">
          Evaluated Market Data Quality
        </h3>
        <div id="badges-container" style="display: flex; flex-direction: column; gap: var(--space-2);"></div>
      </div>
    </div>
  `;

  const badgesContainer = container.querySelector('#badges-container');
  if (badgesContainer && evaluations) {
    evaluations.forEach(ev => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';
      row.innerHTML = `<span style="font-size: var(--font-size-xs); font-weight: 600;">${ev.market.name}</span>`;
      row.appendChild(renderQualityBadge({ assessment: ev.dataQuality, compact: false }));
      badgesContainer.appendChild(row);
    });
  }

  const btnBack = container.querySelector('#btn-back-decision');
  if (btnBack) {
    btnBack.addEventListener('click', () => store.setRoute('/decision'));
  }

  return container;
}

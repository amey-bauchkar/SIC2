/**
 * MandiMitra Feature: Evidence ("Why?") View
 * Route: /evidence
 * 
 * VerdaAgro Editorial Agricultural Redesign
 * 100% Preserves reasons list, data quality tiers, and net realisation by day
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
      <div class="editorial-panel" style="text-align: center; padding: var(--space-12); max-width: 640px; margin: var(--space-8) auto;">
        <div style="font-size: 3rem; margin-bottom: var(--space-3);">📊</div>
        <h2 class="heading-lg" style="margin-bottom: var(--space-2);">No Active Evidence</h2>
        <p style="color: var(--color-text-muted); font-size: var(--font-size-sm); margin-bottom: var(--space-6);">
          Run a crop price evaluation from the Decision Hub first to view the empirical rationale.
        </p>
        <button class="btn btn-primary" id="btn-back-to-entry">
          Go to Decision Hub
        </button>
      </div>
    `;
    const btn = container.querySelector('#btn-back-to-entry');
    if (btn) btn.addEventListener('click', () => store.setRoute('/hub'));
    return container;
  }

  const { recommendation, evaluations } = evalData;

  container.innerHTML = `
    <div class="editorial-panel" style="padding: var(--space-8); margin-bottom: var(--space-8);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--space-4); margin-bottom: var(--space-6); border-bottom: 1px solid var(--color-border-subtle); padding-bottom: var(--space-6);">
        <div>
          <div class="kicker">DECISION INTEGRITY & EVIDENCE</div>
          <h2 class="heading-xl">
            Why This Recommendation Was Made
          </h2>
          <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); margin-top: 4px;">
            Full audit trail of physical road haulage deductions, APMC statutory tariffs, biological holding decay, and Agmarknet data quality.
          </p>
        </div>
        <button class="btn btn-outline" id="btn-back-decision">
          ← Back to Decision
        </button>
      </div>

      <!-- Algorithmic Rationale List -->
      <div style="margin-bottom: var(--space-8);">
        <h3 class="heading-sm" style="color: var(--color-brand-primary-dark); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-3);">
          Algorithmic Factors & Logic
        </h3>
        <div style="display: flex; flex-direction: column; gap: var(--space-2);">
          ${recommendation.reasons.map(reason => `
            <div style="display: flex; align-items: flex-start; gap: var(--space-3); padding: var(--space-3) var(--space-4); background: var(--color-brand-primary-subtle); border-radius: var(--radius-md); border: 1px solid rgba(139,146,113,0.2);">
              <span style="color: var(--color-brand-primary); font-weight: 900; font-size: 1.1rem; line-height: 1.2;">✓</span>
              <span style="font-size: var(--font-size-sm); color: var(--color-text-main); line-height: 1.5;">${reason}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Net Realisation by Day Table -->
      ${evaluations && evaluations.length > 0 ? `
        <div style="margin-bottom: var(--space-8);">
          <h3 class="heading-sm" style="color: var(--color-brand-primary-dark); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-3);">
            Net Realisation Analysis (Day 0 to Day 3)
          </h3>
          <div class="table-responsive-wrapper">
            <table class="editorial-table">
              <thead>
                <tr>
                  <th>Mandi / APMC</th>
                  <th>Timeline</th>
                  <th>Expected Gross</th>
                  <th>Transport Haulage</th>
                  <th>Holding Decay</th>
                  <th>Take-Home Cash</th>
                </tr>
              </thead>
              <tbody>
                ${evaluations.flatMap(ev => 
                  ev.netRealisationByDay.map(nr => `
                    <tr>
                      <td style="font-weight: 700;">${ev.market.name}</td>
                      <td>Day ${nr.day} (${nr.day === 0 ? 'Today' : `+${nr.day}d`})</td>
                      <td>₹${nr.expectedPrice.toFixed(1)}</td>
                      <td style="color: var(--color-status-abstain);">-₹${nr.transportCostPerQtl.toFixed(1)}</td>
                      <td style="color: var(--color-status-abstain);">-₹${nr.waitingCostPerQtl.toFixed(1)}</td>
                      <td class="number-display number-positive" style="font-weight: 800; font-size: var(--font-size-sm);">₹${nr.netRealisation.toFixed(1)}/qtl</td>
                    </tr>
                  `)
                ).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}

      <!-- Data Quality Tiers -->
      <div id="quality-badges-section">
        <h3 class="heading-sm" style="color: var(--color-brand-primary-dark); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-3);">
          Assessed Mandi Data Quality (Zero Fabrication Policy)
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
      row.style.padding = 'var(--space-3) var(--space-4)';
      row.style.background = 'var(--color-bg-muted)';
      row.style.borderRadius = 'var(--radius-md)';
      row.style.border = '1px solid var(--color-border)';
      row.innerHTML = `<span style="font-size: var(--font-size-sm); font-weight: 700; color: var(--color-text-main);">${ev.market.name}</span>`;
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

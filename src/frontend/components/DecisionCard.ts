/**
 * MandiMitra Shared Component: DecisionCard
 * Primary hero card displaying the sell/wait recommendation, confidence, and financial upside.
 * 
 * DESIGN: VerdaAgro Editorial Agricultural Direction
 * - Strong Manrope headings and numbers
 * - Sage Green #8B9271 Primary CTA
 * - Soft Yellow #FEF3A3 Accent Pill
 */

import { DecisionCardProps } from '../../contracts/frontend';

export function renderDecisionCard(props: DecisionCardProps): HTMLElement {
  const { recommendation, commodity, onViewEvidenceClick, onSelectAnotherCropClick } = props;
  const card = document.createElement('div');
  card.className = 'editorial-panel decision-card';
  card.style.borderTop = '4px solid var(--color-brand-primary)';

  const isAbstain = recommendation.action === 'NO_RECOMMENDATION';
  const isSellToday = recommendation.action === 'SELL_TODAY';

  let actionTitle = '';
  let badgeClass = 'badge-sage';

  if (isAbstain) {
    actionTitle = 'Cannot Recommend (Data Stale or Missing)';
    badgeClass = 'badge-danger';
  } else if (isSellToday) {
    actionTitle = 'Sell Today';
    badgeClass = 'badge-success';
  } else {
    const days = recommendation.action.replace('WAIT_', '').replace('_DAYS', '').replace('_DAY', '');
    actionTitle = `Wait ${days} Days Before Selling`;
    badgeClass = 'badge-accent';
  }

  const marketName = recommendation.market ? recommendation.market.name : 'No eligible market';

  card.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--space-3); margin-bottom: var(--space-4);">
      <div>
        <div class="kicker">
          🌾 RECOMMENDATION FOR ${commodity.toUpperCase()}
        </div>
        <h2 class="heading-xl" style="color: var(--color-text-main); margin-top: var(--space-1);">
          ${actionTitle}
        </h2>
      </div>
      <span class="badge ${badgeClass}" style="font-size: var(--font-size-xs); padding: 4px 12px;">
        ${recommendation.confidence || 'LOW'} CONFIDENCE
      </span>
    </div>

    ${!isAbstain && recommendation.market ? `
      <div style="background-color: var(--color-brand-primary-subtle); border: 1px solid rgba(139,146,113,0.25); border-radius: var(--radius-lg); padding: var(--space-4) var(--space-5); margin-bottom: var(--space-5); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-3);">
        <div>
          <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 700; text-transform: uppercase;">
            Best Place to Sell
          </div>
          <div style="font-family: var(--font-family-heading); font-size: 1.35rem; font-weight: 800; color: var(--color-text-main);">
            ${marketName}
          </div>
        </div>
        ${recommendation.expectedGainPerQtl && recommendation.expectedGainPerQtl > 0 ? `
          <div style="text-align: right;">
            <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 700; text-transform: uppercase;">
              Extra In Your Pocket
            </div>
            <div class="number-display number-lg number-positive">
              +₹${recommendation.expectedGainPerQtl.toFixed(2)}/qtl
            </div>
          </div>
        ` : ''}
      </div>
    ` : ''}

    <div style="margin-bottom: var(--space-6);">
      <div style="font-family: var(--font-family-heading); font-size: var(--font-size-xs); font-weight: 800; color: var(--color-text-muted); margin-bottom: var(--space-3); text-transform: uppercase; letter-spacing: 0.05em;">
        Why We Recommend This
      </div>
      <ul style="list-style-type: none; padding: 0;">
        ${recommendation.reasons.slice(0, 3).map(r => `
          <li style="display: flex; align-items: flex-start; gap: var(--space-2); font-size: var(--font-size-sm); color: var(--color-text-main); margin-bottom: var(--space-2);">
            <span style="color: var(--color-brand-primary); font-weight: 800; font-size: 1.1rem; line-height: 1;">✓</span>
            <span>${r}</span>
          </li>
        `).join('')}
      </ul>
    </div>

    <div style="display: flex; gap: var(--space-3); flex-wrap: wrap;">
      <button class="btn btn-primary" id="btn-view-evidence">
        Why This Decision? (Full Evidence)
      </button>
      <button class="btn btn-outline" id="btn-select-crop">
        Change Crop
      </button>
    </div>
  `;

  const btnEvidence = card.querySelector('#btn-view-evidence');
  if (btnEvidence && onViewEvidenceClick) {
    btnEvidence.addEventListener('click', onViewEvidenceClick);
  }

  const btnCrop = card.querySelector('#btn-select-crop');
  if (btnCrop && onSelectAnotherCropClick) {
    btnCrop.addEventListener('click', onSelectAnotherCropClick);
  }

  return card;
}

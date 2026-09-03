/**
 * MandiMitra Shared Component: DecisionCard
 * Primary hero card displaying the sell/wait recommendation, confidence, and financial upside.
 * 
 * OWNER: Janhvi (Frontend Lead)
 * Pure presentation - consumes Recommendation contract.
 */

import { DecisionCardProps } from '../../contracts/frontend';

export function renderDecisionCard(props: DecisionCardProps): HTMLElement {
  const { recommendation, commodity, onViewEvidenceClick, onSelectAnotherCropClick } = props;
  const card = document.createElement('div');
  card.className = 'card decision-card';

  const isAbstain = recommendation.action === 'NO_RECOMMENDATION';
  const isSellToday = recommendation.action === 'SELL_TODAY';

  let actionTitle = '';
  let badgeColor = 'var(--color-status-info)';
  let badgeBg = 'var(--color-status-info-bg)';

  if (isAbstain) {
    actionTitle = 'Cannot Recommend (Data Stale or Sparse)';
    badgeColor = 'var(--color-status-abstain)';
    badgeBg = 'var(--color-status-abstain-bg)';
  } else if (isSellToday) {
    actionTitle = 'Sell Today';
    badgeColor = 'var(--color-status-success)';
    badgeBg = 'var(--color-status-success-bg)';
  } else {
    // WAIT_1_DAY, WAIT_2_DAYS, etc.
    const days = recommendation.action.replace('WAIT_', '').replace('_DAYS', '').replace('_DAY', '');
    actionTitle = `Wait ${days} Days Before Selling`;
    badgeColor = 'var(--color-status-info)';
    badgeBg = 'var(--color-status-info-bg)';
  }

  const marketName = recommendation.market ? recommendation.market.name : 'No eligible market';

  card.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-3);">
      <div>
        <span style="font-size: var(--font-size-xs); font-weight: 700; text-transform: uppercase; color: var(--color-text-muted); letter-spacing: 0.05em;">
          RECOMMENDATION FOR ${commodity.toUpperCase()}
        </span>
        <h2 style="font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-text-main); margin-top: var(--space-1);">
          ${actionTitle}
        </h2>
      </div>
      <span style="padding: 4px 10px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 700; background: ${badgeBg}; color: ${badgeColor};">
        ${recommendation.confidence || 'LOW'} CONFIDENCE
      </span>
    </div>

    ${!isAbstain && recommendation.market ? `
      <div style="background: var(--color-bg-canvas); border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); margin-bottom: var(--space-4); display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: var(--font-size-xs); color: var(--color-text-muted);">Recommended APMC</div>
          <div style="font-size: var(--font-size-base); font-weight: 700; color: var(--color-text-main);">${marketName}</div>
        </div>
        ${recommendation.expectedGainPerQtl && recommendation.expectedGainPerQtl > 0 ? `
          <div style="text-align: right;">
            <div style="font-size: var(--font-size-xs); color: var(--color-text-muted);">Expected Net Gain</div>
            <div style="font-size: var(--font-size-lg); font-weight: 800; color: var(--color-status-success);">+₹${recommendation.expectedGainPerQtl.toFixed(2)}/qtl</div>
          </div>
        ` : ''}
      </div>
    ` : ''}

    <div style="margin-bottom: var(--space-5);">
      <div style="font-size: var(--font-size-xs); font-weight: 700; color: var(--color-text-muted); margin-bottom: var(--space-2); text-transform: uppercase;">
        Primary Reasoning
      </div>
      <ul style="list-style-type: none; padding: 0;">
        ${recommendation.reasons.slice(0, 2).map(r => `
          <li style="display: flex; gap: var(--space-2); font-size: var(--font-size-sm); color: var(--color-text-main); margin-bottom: var(--space-2);">
            <span style="color: var(--color-brand-primary);">•</span>
            <span>${r}</span>
          </li>
        `).join('')}
      </ul>
    </div>

    <div style="display: flex; gap: var(--space-3);">
      <button class="btn btn-primary" id="btn-view-evidence">
        Why This Decision? (Full Evidence)
      </button>
      <button class="btn btn-outline" id="btn-select-crop" style="width: auto; white-space: nowrap;">
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

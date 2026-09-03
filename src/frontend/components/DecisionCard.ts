/**
 * MandiMitra Shared Component: DecisionCard
 * Primary hero card displaying the sell/wait recommendation, confidence, and financial upside.
 * 
 * OWNER: Janhvi (Frontend Lead)
 * Pure presentation - consumes Recommendation contract.
 * Strictly 3-color palette: Sage #8B9271, Soft yellow #FEF3A3, White #FFFFFF, Black #1A1A1A.
 */

import { DecisionCardProps } from '../../contracts/frontend';
import { icons } from './shared/icons';

export function renderDecisionCard(props: DecisionCardProps): HTMLElement {
  const { recommendation, commodity, onViewEvidenceClick, onSelectAnotherCropClick } = props;
  const card = document.createElement('div');
  card.className = 'card decision-card';

  const isAbstain = recommendation.action === 'NO_RECOMMENDATION';
  const isSellToday = recommendation.action === 'SELL_TODAY';

  let actionTitle = '';
  let badgeColor = 'var(--color-black)';
  let badgeBg = 'var(--color-yellow)';

  if (isAbstain) {
    actionTitle = 'Cannot Recommend (Data Stale or Sparse)';
    badgeColor = 'var(--color-black)';
    badgeBg = 'var(--color-sage-light)';
  } else if (isSellToday) {
    actionTitle = 'Sell Today';
    badgeColor = 'var(--color-white)';
    badgeBg = 'var(--color-sage)';
  } else {
    // WAIT_1_DAY, WAIT_2_DAYS, etc.
    const days = recommendation.action.replace('WAIT_', '').replace('_DAYS', '').replace('_DAY', '');
    actionTitle = `Wait ${days} Days Before Selling`;
    badgeColor = 'var(--color-black)';
    badgeBg = 'var(--color-yellow)';
  }

  const marketName = recommendation.market ? recommendation.market.name : 'No eligible market';

  card.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-4); flex-wrap: wrap; gap: var(--space-2);">
      <div>
        <span style="font-family: var(--font-family-sans); font-size: var(--font-size-xs); font-weight: 700; text-transform: uppercase; color: var(--color-black-muted); letter-spacing: 0.05em; display: flex; align-items: center; gap: 4px;">
          ${icons.wheat(14, '#8B9271')}
          <span>RECOMMENDATION FOR ${commodity.toUpperCase()}</span>
        </span>
        <h2 style="font-family: var(--font-family-heading); font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-text-main); margin-top: var(--space-1); letter-spacing: -0.02em;">
          ${actionTitle}
        </h2>
      </div>
      <span style="padding: 4px 12px; border-radius: var(--radius-full); font-family: var(--font-family-sans); font-size: var(--font-size-xs); font-weight: 700; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid rgba(26, 26, 26, 0.08); white-space: nowrap; display: inline-flex; align-items: center; gap: 6px;">
        ${icons.shieldCheck(14, badgeColor)}
        <span>${recommendation.confidence || 'LOW'} CONFIDENCE</span>
      </span>
    </div>

    ${!isAbstain && recommendation.market ? `
      <div style="background: var(--color-bg-canvas); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-5); display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-family: var(--font-family-sans); font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 500;">Recommended APMC</div>
          <div style="font-family: var(--font-family-heading); font-size: var(--font-size-lg); font-weight: 800; color: var(--color-text-main); margin-top: 2px; display: flex; align-items: center; gap: 6px;">
            <span style="color: var(--color-sage);">${icons.market(18, '#8B9271')}</span>
            <span>${marketName}</span>
          </div>
        </div>
        ${recommendation.expectedGainPerQtl && recommendation.expectedGainPerQtl > 0 ? `
          <div style="text-align: right;">
            <div style="font-family: var(--font-family-sans); font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 500;">Expected Net Gain</div>
            <div style="font-family: var(--font-family-heading); font-size: var(--font-size-xl); font-weight: 800; color: var(--color-sage); margin-top: 2px;">+₹${recommendation.expectedGainPerQtl.toFixed(2)}/qtl</div>
          </div>
        ` : ''}
      </div>
    ` : ''}

    <div style="margin-bottom: var(--space-5);">
      <div style="font-family: var(--font-family-sans); font-size: var(--font-size-xs); font-weight: 700; color: var(--color-black-muted); margin-bottom: var(--space-2); text-transform: uppercase; letter-spacing: 0.05em;">
        Primary Reasoning
      </div>
      <ul style="list-style-type: none; padding: 0;">
        ${recommendation.reasons.slice(0, 2).map(r => `
          <li style="display: flex; gap: var(--space-2); font-family: var(--font-family-sans); font-size: var(--font-size-sm); color: var(--color-text-main); margin-bottom: var(--space-2); line-height: 1.4;">
            <span style="color: var(--color-sage); margin-top: 2px;">${icons.check(14, '#8B9271')}</span>
            <span>${r}</span>
          </li>
        `).join('')}
      </ul>
    </div>

    <div style="display: flex; gap: var(--space-3); flex-wrap: wrap;">
      <button class="btn btn-primary" id="btn-view-evidence" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
        <span>Why This Decision? (Full Evidence)</span>
        <span>${icons.arrowRight(14, '#FFFFFF')}</span>
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

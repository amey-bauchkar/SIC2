/**
 * MandiMitra Shared Component: StatCard
 * Presentation metric card displaying key numerical metrics (e.g. net realisation, backtest accuracy).
 * Uses Manrope for numbers and Inter for labels.
 */

import { StatCardProps } from '../../contracts/frontend';

export function renderStatCard(props: StatCardProps): HTMLElement {
  const { label, value, subtext, variant = 'neutral' } = props;
  const card = document.createElement('div');
  card.className = `stat-card variant-${variant} editorial-panel`;

  let valueClass = 'number-main';
  if (variant === 'positive') valueClass = 'number-positive';
  else if (variant === 'negative') valueClass = 'number-negative';

  card.style.padding = 'var(--space-5)';

  card.innerHTML = `
    <div style="font-family: var(--font-family-body); font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-2);">
      ${label}
    </div>
    <div class="number-display number-xl ${valueClass}" style="margin-bottom: var(--space-1);">
      ${value}
    </div>
    ${subtext ? `
      <div style="font-family: var(--font-family-body); font-size: var(--font-size-xs); color: var(--color-text-muted); line-height: 1.4;">
        ${subtext}
      </div>
    ` : ''}
  `;

  return card;
}

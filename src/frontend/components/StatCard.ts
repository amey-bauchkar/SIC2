/**
 * MandiMitra Shared Component: StatCard
 * Presentation card for displaying key numerical metrics (e.g. net realisation, backtest accuracy).
 * 
 * OWNER: Janhvi (Frontend Lead)
 */

import { StatCardProps } from '../../contracts/frontend';

export function renderStatCard(props: StatCardProps): HTMLElement {
  const { label, value, subtext, variant = 'neutral' } = props;
  const card = document.createElement('div');
  card.className = `stat-card variant-${variant}`;

  let valueColor = 'var(--color-text-main)';
  if (variant === 'positive') valueColor = 'var(--color-status-success)';
  if (variant === 'warning') valueColor = 'var(--color-status-warning)';
  if (variant === 'negative') valueColor = 'var(--color-status-abstain)';

  card.style.background = 'var(--color-bg-surface)';
  card.style.border = '1px solid var(--color-border)';
  card.style.borderRadius = 'var(--radius-md)';
  card.style.padding = 'var(--space-3) var(--space-4)';
  card.style.boxShadow = 'var(--shadow-sm)';

  card.innerHTML = `
    <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 500; margin-bottom: var(--space-1);">
      ${label}
    </div>
    <div style="font-size: var(--font-size-xl); font-weight: 800; color: ${valueColor}; line-height: 1.2;">
      ${value}
    </div>
    ${subtext ? `
      <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: var(--space-1);">
        ${subtext}
      </div>
    ` : ''}
  `;

  return card;
}

/**
 * MandiMitra Shared Component: StatCard
 * Presentation card for displaying key numerical metrics (e.g. net realisation, backtest accuracy).
 * 
 * OWNER: Janhvi (Frontend Lead)
 * 
 * Typography & Layout:
 * - Label: small uppercase Inter
 * - Value: large bold Manrope numeric focal point
 * - Subtext: small helper caption Inter
 * - Colors: strictly Sage green (#8B9271) for positive numeric highlights, black for neutral, soft yellow background accents
 * - Card: white background, rounded corners (16px), soft black shadow
 */

import { StatCardProps } from '../../contracts/frontend';

export function renderStatCard(props: StatCardProps): HTMLElement {
  const { label, value, subtext, variant = 'neutral' } = props;
  const card = document.createElement('div');
  card.className = `stat-card variant-${variant}`;

  let valueColor = 'var(--color-black)';
  if (variant === 'positive') valueColor = 'var(--color-sage)';
  if (variant === 'warning') valueColor = 'var(--color-black)';
  if (variant === 'negative') valueColor = 'var(--color-black)';

  card.style.background = 'var(--color-white)';
  card.style.border = '1px solid var(--color-black-border)';
  card.style.borderRadius = 'var(--radius-lg)';
  card.style.padding = 'var(--space-4) var(--space-5)';
  card.style.boxShadow = 'var(--shadow-sm)';
  card.style.display = 'flex';
  card.style.flexDirection = 'column';
  card.style.justifyContent = 'space-between';

  card.innerHTML = `
    <div style="font-family: var(--font-family-sans); font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-2);">
      ${label}
    </div>
    <div style="font-family: var(--font-family-heading); font-size: var(--font-size-stat); font-weight: 800; color: ${valueColor}; line-height: 1.1; letter-spacing: -0.03em; margin: var(--space-1) 0;">
      ${value}
    </div>
    ${subtext ? `
      <div style="font-family: var(--font-family-sans); font-size: var(--font-size-xs); color: var(--color-black-subtle); margin-top: var(--space-2); line-height: 1.4;">
        ${subtext}
      </div>
    ` : ''}
  `;

  return card;
}

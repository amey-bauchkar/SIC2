/**
 * MandiMitra Feature: Backtest Evidence View
 * Route: /backtest
 * 
 * OWNER: Purva (Frontend Feature Engineer - Markets & Trust Vertical)
 * Structural placeholder - displays empirical single-holdout evaluation metrics and CEDA attribution.
 */

import { store } from '../../state/store';
import { apiClient } from '../../api-client';
import { renderStatCard } from '../../components/StatCard';
import { BacktestResult } from '../../../contracts/domain';
import { icons } from '../../components/shared/icons';

export function renderBacktestView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'feature-backtest-view';

  const state = store.getState();
  const currentCrop = state.selectedCrop;

  container.innerHTML = `
    <!-- Explanatory Header Box -->
    <div style="background: var(--color-white); border: 1px solid var(--color-black-border); border-radius: var(--radius-xl); padding: var(--space-6); margin-bottom: var(--space-5); box-shadow: var(--shadow-sm);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--space-4);">
        <div>
          <span style="font-size: var(--font-size-xs); font-weight: 800; text-transform: uppercase; color: var(--color-sage); letter-spacing: 0.08em; display: flex; align-items: center; gap: 6px;">
            ${icons.shieldCheck(16, '#8B9271')}
            <span>EMPIRICAL VALIDATION & BACKTEST</span>
          </span>
          <h2 style="font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-text-main); margin-top: var(--space-1);">
            Historical Backtest: ${currentCrop}
          </h2>
          <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); margin-top: 4px; max-width: 650px; line-height: 1.5;">
            We don't just claim MandiMitra works — here is exactly how our mathematical model performed against real historical APMC records. Single time-based holdout evaluation across real mandi time-series with zero fabricated numbers.
          </p>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 0.8rem; font-weight: 600; color: var(--color-black-muted);">Evaluated Commodity:</span>
          <span style="background: var(--color-yellow); color: var(--color-black); padding: 4px 12px; border-radius: var(--radius-full); font-weight: 800; font-size: 0.8rem;">
            ${currentCrop}
          </span>
        </div>
      </div>
    </div>

    <div class="card">
      <div id="backtest-stats-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-6);">
        <!-- Mounted dynamically -->
      </div>

      <div style="background: var(--color-bg-canvas); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-5); margin-bottom: var(--space-6);">
        <h4 style="font-size: var(--font-size-xs); font-weight: 800; color: var(--color-black-muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: var(--space-3); display: flex; align-items: center; gap: 6px;">
          ${icons.shieldCheck(14, '#1A1A1A')}
          <span>Methodology & Invariants</span>
        </h4>
        
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; gap: 8px; font-size: var(--font-size-xs); color: var(--color-text-main); line-height: 1.5;">
            <span style="color: var(--color-sage); margin-top: 2px;">${icons.check(12, '#8B9271')}</span>
            <span><strong>Baseline:</strong> Naive strategy that sells immediately at the closest geographic APMC on Day 0.</span>
          </div>
          <div style="display: flex; gap: 8px; font-size: var(--font-size-xs); color: var(--color-text-main); line-height: 1.5;">
            <span style="color: var(--color-sage); margin-top: 2px;">${icons.check(12, '#8B9271')}</span>
            <span><strong>Directional Accuracy:</strong> Proportion of days where forecast direction aligned with actual market movement.</span>
          </div>
          <div style="display: flex; gap: 8px; font-size: var(--font-size-xs); color: var(--color-text-main); line-height: 1.5;">
            <span style="color: var(--color-sage); margin-top: 2px;">${icons.check(12, '#8B9271')}</span>
            <span><strong>Coverage:</strong> Proportion of market-days where data quality permitted actionable advice rather than abstention.</span>
          </div>
        </div>
      </div>

      <!-- Mandatory CEDA Citation Notice -->
      <div style="border-top: 1px solid var(--color-border); padding-top: var(--space-4); text-align: center;">
        <p style="font-size: var(--font-size-xs); color: var(--color-text-muted); font-style: italic;" id="citation-text">
          Data Source: CEDA Agri Market Data (CEDA-AMD), 2000-2023. Centre for Economic Data & Analysis, Ashoka University.
        </p>
      </div>
    </div>
  `;

  const grid = container.querySelector('#backtest-stats-grid');

  // Fetch real backtest results from backend
  apiClient.getBacktest(currentCrop)
    .then(response => {
      renderMetrics(response.result, response.citationNotice);
    })
    .catch(() => {
      // If backend is not yet started, render placeholder pending integration
      if (grid) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: var(--space-4); color: var(--color-text-muted); font-size: var(--font-size-sm);">
            Connecting to backtest runner for ${currentCrop}...
          </div>
        `;
      }
    });

  function renderMetrics(res: BacktestResult, citation: string) {
    if (!grid) return;
    grid.innerHTML = '';

    grid.appendChild(renderStatCard({
      label: 'Tested Market-Days',
      value: `${res.evaluatedDays} days`,
      subtext: `Window: ${res.evaluatedPeriod.start} to ${res.evaluatedPeriod.end}`
    }));

    grid.appendChild(renderStatCard({
      label: 'Net Gain vs Baseline',
      value: `+₹${res.netGainVsBaseline.toFixed(1)}/qtl`,
      subtext: `Avg: ₹${res.avgNetRealisation.toFixed(1)} vs ₹${res.baselineNetRealisation.toFixed(1)}`,
      variant: res.netGainVsBaseline > 0 ? 'positive' : 'negative'
    }));

    grid.appendChild(renderStatCard({
      label: 'Directional Accuracy',
      value: `${res.directionalAccuracy.toFixed(1)}%`,
      subtext: 'Target: >65% on 0-3 day slope',
      variant: res.directionalAccuracy >= 65 ? 'positive' : 'neutral'
    }));

    grid.appendChild(renderStatCard({
      label: 'Decision Coverage',
      value: `${res.coverage.toFixed(1)}%`,
      subtext: `${(100 - res.coverage).toFixed(1)}% honest abstention rate`,
      variant: 'neutral'
    }));

    const citationEl = container.querySelector('#citation-text');
    if (citationEl) {
      citationEl.textContent = citation;
    }
  }

  return container;
}

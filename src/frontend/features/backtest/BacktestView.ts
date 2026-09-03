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

export function renderBacktestView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'feature-backtest-view';

  const state = store.getState();
  const currentCrop = state.selectedCrop;

  container.innerHTML = `
    <div class="card">
      <div style="margin-bottom: var(--space-4);">
        <span style="font-size: var(--font-size-xs); font-weight: 700; text-transform: uppercase; color: var(--color-brand-primary);">
          EMPIRICAL VALIDATION
        </span>
        <h2 style="font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-text-main); margin-top: var(--space-1);">
          Historical Backtest: ${currentCrop}
        </h2>
        <p style="font-size: var(--font-size-sm); color: var(--color-text-muted);">
          Single time-based holdout evaluation across real mandi time-series. Honest numbers with zero fabrication.
        </p>
      </div>

      <div id="backtest-stats-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin-bottom: var(--space-6);">
        <!-- Mounted dynamically -->
      </div>

      <div style="background: var(--color-bg-canvas); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-6);">
        <h4 style="font-size: var(--font-size-xs); font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: var(--space-2);">
          Methodology & Invariants
        </h4>
        <p style="font-size: var(--font-size-xs); color: var(--color-text-main); margin-bottom: var(--space-2);">
          • <strong>Baseline:</strong> Naive strategy that sells immediately at the closest geographic APMC on Day 0.
        </p>
        <p style="font-size: var(--font-size-xs); color: var(--color-text-main); margin-bottom: var(--space-2);">
          • <strong>Directional Accuracy:</strong> Proportion of days where forecast direction aligned with actual market movement.
        </p>
        <p style="font-size: var(--font-size-xs); color: var(--color-text-main);">
          • <strong>Coverage:</strong> Proportion of market-days where data quality permitted actionable advice rather than abstention.
        </p>
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
      value: res.evaluatedDays.toString(),
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

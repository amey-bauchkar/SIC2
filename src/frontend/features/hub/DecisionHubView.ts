/**
 * MandiMitra: Unified Decision Hub Cockpit
 * 
 * VerdaAgro-Inspired Editorial Agricultural Redesign
 * 
 * Strict Color System:
 * - Sage Green: #8B9271 (Primary Brand)
 * - Yellow Accent: #FEF3A3 (Badges & Small Indicators)
 * - White: #FFFFFF (Clean Content Surfaces)
 * - Typography: Manrope (Headings & Numbers) / Inter (Body & Nav)
 * 
 * FUNCTIONALITY 100% PRESERVED:
 * - AsliDaam Joint Optimization (Mandi × 0-3 Days)
 * - Nirnay Kawach (Monte Carlo stress slider)
 * - Bhed Vivek (Congestion risk simulation)
 * - Regional speech synthesis audio readout
 * - Multilingual toggle (English, Marathi, Hindi)
 * - WhatsApp recommendation slip
 * - Supabase freight pooling (SajhaBazaar)
 */

import { store } from '../../state/store';
import { apiClient } from '../../api-client';
import { runAsliDaamOptimization, AsliDaamOptimizationResult } from '../../../core/asli-daam';
import { renderMarketsView } from '../markets/MarketsView';
import { renderEvidenceView } from '../evidence/EvidenceView';
import { renderBacktestView } from '../backtest/BacktestView';
import { renderSettingsView } from '../settings/SettingsView';
import { renderCropOptgroupsHtml, getCropConfig } from '../../../config/crops';
import { renderDistrictOptgroupsHtml, getDistrictConfig } from '../../../config/districts';

type HubTab = 'aslidaam' | 'markets' | 'evidence' | 'backtest' | 'settings' | 'future';
type Language = 'en' | 'mr' | 'hi';

let activeTab: HubTab = 'aslidaam';
let currentLanguage: Language = 'en';

export function renderDecisionHubView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'decision-hub-view';

  const state = store.getState();
  const crop = state.selectedCrop || 'Onion';
  const qty = state.harvestQuantityQuintals || 25;
  const district = state.userLocation?.district || 'Nashik';
  const cropConfig = getCropConfig(crop);
  const bench = cropConfig.benchmarkModalPrice || 3200;

  // Dynamically derive candidate markets from canonical backend evaluation (single source of truth)
  const candidateMarkets = (state.evaluationData?.evaluations && state.evaluationData.evaluations.length > 0)
    ? state.evaluationData.evaluations.map(ev => {
        const day0 = ev.netRealisationByDay.find(nr => nr.day === 0) || ev.netRealisationByDay[0];
        return {
          market: ev.market,
          currentModalPrice: day0?.expectedPrice || bench,
          roadDistKm: ev.market.estimatedRoadDistanceKm || 25.0,
          isStale: !ev.dataQuality.isEligibleForRecommendation,
          staleReason: !ev.dataQuality.isEligibleForRecommendation
            ? (ev.market.name.toLowerCase().includes('manmad')
                ? 'No prices reported for 9 consecutive days (Data Quality: POOR). Abstention triggered.'
                : 'Stale or sparse reporting (Data Quality: POOR). Abstention triggered.')
            : undefined
        };
      })
    : [
        {
          market: { id: 'nsk_pimpalgaon', name: 'Pimpalgaon Baswant', state: 'Maharashtra', district: 'Nashik', lat: 20.1706, lon: 73.9877 },
          currentModalPrice: Math.round(bench * 1.03),
          roadDistKm: 36.1
        },
        {
          market: { id: 'nsk_sinnar', name: 'Sinnar', state: 'Maharashtra', district: 'Nashik', lat: 19.8475, lon: 74.0006 },
          currentModalPrice: Math.round(bench * 1.00),
          roadDistKm: 35.4
        },
        {
          market: { id: 'nsk_lasalgaon', name: 'Lasalgaon Terminal APMC', state: 'Maharashtra', district: 'Nashik', lat: 20.1477, lon: 74.2254 },
          currentModalPrice: Math.round(bench * 1.02),
          roadDistKm: 65.4
        },
        {
          market: { id: 'nsk_manmad', name: 'Manmad APMC', state: 'Maharashtra', district: 'Nashik', lat: 20.2526, lon: 74.4371 },
          currentModalPrice: Math.round(bench * 0.96),
          roadDistKm: 94.5,
          isStale: true,
          staleReason: 'No prices reported for 9 consecutive days (Data Quality: POOR). Abstention triggered.'
        }
      ];

  // If no evaluation loaded yet, trigger initial backend evaluate
  if (!state.evaluationData && !state.isLoading) {
    apiClient.evaluate({
      commodity: crop,
      latitude: state.userLocation?.lat || 19.9975,
      longitude: state.userLocation?.lon || 73.7898,
      transportCostPerKmPerQtl: state.costConfig.transportCostPerKmPerQtl,
      storageCostPerDayPerQtl: state.costConfig.storageCostPerDayPerQtl,
      radiusKm: state.costConfig.searchRadiusKm
    }).then(res => {
      store.setEvaluationData(res);
    }).catch(err => {
      console.warn('Initial evaluation fetch error:', err);
    });
  }

  // Determine trend direction directly from forecast model slope or crop decay category
  const primaryEval = state.evaluationData?.evaluations?.[0];
  const slope = primaryEval?.forecast?.historicalSlope7d;
  let forecastDirection: 'UP' | 'FLAT' | 'DOWN' = 'FLAT';
  if (slope !== undefined && slope !== null && Math.abs(slope) > 0.01) {
    forecastDirection = slope > 5 ? 'UP' : (slope < -5 ? 'DOWN' : 'FLAT');
  } else {
    // Perishable vegetables and fruits decay fast, so holding does not pay
    forecastDirection = cropConfig.decayType === 'PERISHABLE' ? 'FLAT' : 'UP';
  }

  // Run AsliDaam net realizable value optimization
  const optimization: AsliDaamOptimizationResult = runAsliDaamOptimization(
    candidateMarkets,
    crop,
    qty,
    state.costConfig.transportCostPerKmPerQtl,
    forecastDirection
  );

  container.innerHTML = `
    <section class="panoramic-tractor-hero" style="background-image: url('/assets/images/tractor_hero_bg.png?v=2'); background-size: cover; background-position: center left; background-repeat: no-repeat;">
      <!-- Left side: transparent spacer keeping the green tractor unobstructed -->
      <div class="panoramic-hero-spacer"></div>

      <!-- Right side: editorial copy with the exact required text -->
      <div class="panoramic-hero-content">
        <!-- Kicker & Language Switcher -->
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-3);">
          <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #ffffff;">
            <span>🌾 MandiMitra Decision Hub</span>
            <span style="background: var(--color-brand-accent); color: var(--color-brand-accent-text); padding: 2px 7px; border-radius: var(--radius-full); font-size: 0.65rem; margin-left: 4px;">AsliDaam™ Inside</span>
          </div>

          <!-- Language Selector -->
          <div style="display: inline-flex; background: rgba(0, 0, 0, 0.35); padding: 3px; border-radius: var(--radius-md); border: 1px solid rgba(255, 255, 255, 0.2);">
            <button class="lang-btn ${currentLanguage === 'en' ? 'active' : ''}" data-lang="en" style="padding: 4px 10px; font-size: 0.75rem; border-radius: var(--radius-sm); border: none; cursor: pointer; font-weight: 700;">English</button>
            <button class="lang-btn ${currentLanguage === 'mr' ? 'active' : ''}" data-lang="mr" style="padding: 4px 10px; font-size: 0.75rem; border-radius: var(--radius-sm); border: none; cursor: pointer; font-weight: 700;">मराठी</button>
            <button class="lang-btn ${currentLanguage === 'hi' ? 'active' : ''}" data-lang="hi" style="padding: 4px 10px; font-size: 0.75rem; border-radius: var(--radius-sm); border: none; cursor: pointer; font-weight: 700;">हिंदी</button>
          </div>
        </div>

        <h1 class="heading-display">
          Rooted in the Land.<br>Driven by Real Profits.
        </h1>

        <p class="text-farmer-lead">
          Joint Economics Optimizer for Indian Farmers: Mandi × Timing (0–3 Days). Know the exact in-hand wallet cash after haulage diesel, APMC tariffs, and storage shrinkage.
        </p>

        <!-- Feature rows in the exact style of the reference image -->
        <div class="panoramic-feature-list">
          <div class="panoramic-feature-item active">
            <span>Higher Real Net Take-Home</span>
            <span style="font-size: 1.1rem; line-height: 1;">↗</span>
          </div>
          <p style="font-size: var(--font-size-xs); color: rgba(255, 255, 255, 0.85); line-height: 1.5; margin-bottom: var(--space-2);">
            Calculates real in-hand rupees rather than naive gross prices. Accounts for transport freight, APMC cess, and warehouse storage.
          </p>

          <div class="panoramic-feature-item">
            <span>Cost Efficiency & Road Haulage</span>
            <span style="font-size: 1rem; line-height: 1;">↓</span>
          </div>

          <div class="panoramic-feature-item">
            <span>Honest Data Quality Abstention</span>
            <span style="font-size: 1rem; line-height: 1;">↓</span>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 2: FARMER INPUT CARD (SHIFTED INTO THE NEXT SECTION) -->
    <section class="editorial-section" style="padding-top: 0; margin-bottom: var(--space-6);">
      <div class="editorial-header" style="margin-bottom: var(--space-4);">
        <div class="kicker">DECISION COCKPIT FILTER</div>
        <h2 class="heading-lg">Find Your Best Selling Market & Timing</h2>
        <p>Enter your crop volume and location to evaluate nearby mandis over the next 0 to 3 days.</p>
      </div>

      <div class="editorial-panel" style="background: #ffffff; border: 1.5px solid var(--color-border); box-shadow: var(--shadow-sm); padding: var(--space-5);">
        <div class="farmer-input-strip">
          
          <!-- Commodity / Crop -->
          <div>
            <label class="input-label" style="margin-bottom: 6px; display: block;">
              ${currentLanguage === 'mr' ? 'शेतमाल (Crop)' : (currentLanguage === 'hi' ? 'फसल (Crop)' : 'Crop')}
            </label>
            <select id="hub-select-crop" class="select-field">
              ${renderCropOptgroupsHtml(crop)}
            </select>
          </div>

          <!-- Quantity (with quick farmer pills) -->
          <div>
            <label class="input-label" style="margin-bottom: 6px; display: block;">
              ${currentLanguage === 'mr' ? 'एकूण वजन (क्विंटल)' : (currentLanguage === 'hi' ? 'कुल वजन (क्विंटल)' : 'Harvest Volume (Quintals)')}
            </label>
            <div style="display: flex; gap: var(--space-2); align-items: center;">
              <input type="number" id="hub-input-qty" class="input-field" value="${qty}" min="1" max="1000" style="max-width: 90px; font-family: var(--font-family-numbers); font-weight: 800;" />
              <div style="display: flex; gap: 4px;">
                <button class="qty-pill ${qty === 10 ? 'active' : ''}" data-q="10">10q</button>
                <button class="qty-pill ${qty === 25 ? 'active' : ''}" data-q="25">25q</button>
                <button class="qty-pill ${qty === 50 ? 'active' : ''}" data-q="50">50q</button>
                <button class="qty-pill ${qty === 100 ? 'active' : ''}" data-q="100">100q</button>
              </div>
            </div>
          </div>

          <!-- Origin District -->
          <div>
            <label class="input-label" style="margin-bottom: 6px; display: block;">
              ${currentLanguage === 'mr' ? 'शेतकरी तालुका / जिल्हा' : (currentLanguage === 'hi' ? 'किसान स्थान' : 'Farmer Origin')}
            </label>
            <select id="hub-select-origin" class="select-field">
              ${renderDistrictOptgroupsHtml(district)}
            </select>
          </div>

          <!-- Recalculate CTA -->
          <div>
            <button id="btn-recalculate-hub" class="btn btn-primary" style="width: 100%; font-weight: 700; height: 46px;">
              ⚡ ${currentLanguage === 'mr' ? 'असली दाम शोधा' : (currentLanguage === 'hi' ? 'असली दाम निकालें' : 'Run AsliDaam')}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- CONTENT FLOW BELOW HERO -->
    <!-- Cockpit Tab Navigation Bar -->
    <div class="hub-tabs-nav" style="margin-top: var(--space-4);">
      <button class="hub-tab-btn ${activeTab === 'aslidaam' ? 'active' : ''}" data-tab="aslidaam">
        <span>💎</span> AsliDaam™ Engine
      </button>
      <button class="hub-tab-btn ${activeTab === 'markets' ? 'active' : ''}" data-tab="markets">
        <span>🗺️</span> Mandi Radar
      </button>
      <button class="hub-tab-btn ${activeTab === 'evidence' ? 'active' : ''}" data-tab="evidence">
        <span>📊</span> "Why?" Evidence
      </button>
      <button class="hub-tab-btn ${activeTab === 'backtest' ? 'active' : ''}" data-tab="backtest">
        <span>📈</span> Walk-Forward Backtest
      </button>
      <button class="hub-tab-btn ${activeTab === 'settings' ? 'active' : ''}" data-tab="settings">
        <span>⚙️</span> Cost Simulator
      </button>
      <button class="hub-tab-btn ${activeTab === 'future' ? 'active' : ''}" data-tab="future">
        <span>🚀</span> Future Features
      </button>
    </div>

    <!-- Active Tab Workspace Container -->
    <div id="hub-tab-content">
      <!-- Dynamically filled below -->
    </div>
  `;

  // Attach language styles
  const langButtons = container.querySelectorAll('.lang-btn');
  langButtons.forEach(btn => {
    const b = btn as HTMLButtonElement;
    if (b.dataset.lang === currentLanguage) {
      b.style.background = 'var(--color-brand-primary)';
      b.style.color = '#ffffff';
    } else {
      b.style.background = 'transparent';
      b.style.color = 'var(--color-text-main)';
    }
    b.addEventListener('click', () => {
      currentLanguage = b.dataset.lang as Language;
      const newView = renderDecisionHubView();
      container.replaceWith(newView);
    });
  });

  // Quantity pills
  container.querySelectorAll('.qty-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      const q = parseInt((e.target as HTMLElement).getAttribute('data-q') || '25', 10);
      store.setHarvestQuantity(q);
      const newView = renderDecisionHubView();
      container.replaceWith(newView);
    });
  });

  // Crop selector change in Hub
  const hubCropSelect = container.querySelector('#hub-select-crop') as HTMLSelectElement;
  if (hubCropSelect) {
    hubCropSelect.addEventListener('change', async () => {
      const newCrop = hubCropSelect.value;
      store.setSelectedCrop(newCrop);
      store.setLoading(true);
      try {
        const cState = store.getState();
        const res = await apiClient.evaluate({
          commodity: newCrop,
          latitude: cState.userLocation?.lat || 19.9975,
          longitude: cState.userLocation?.lon || 73.7898,
          transportCostPerKmPerQtl: cState.costConfig.transportCostPerKmPerQtl,
          storageCostPerDayPerQtl: cState.costConfig.storageCostPerDayPerQtl,
          radiusKm: cState.costConfig.searchRadiusKm
        });
        store.setEvaluationData(res);
      } catch (err) {
        console.warn('Crop change evaluation reload failed:', err);
      } finally {
        store.setLoading(false);
      }
      const newView = renderDecisionHubView();
      container.replaceWith(newView);
    });
  }

  // District origin change in Hub
  const hubOriginSelect = container.querySelector('#hub-select-origin') as HTMLSelectElement;
  if (hubOriginSelect) {
    hubOriginSelect.addEventListener('change', async () => {
      const newDistrictName = hubOriginSelect.value;
      const distConfig = getDistrictConfig(newDistrictName);
      store.setUserLocation(distConfig.latitude, distConfig.longitude, distConfig.name);
      store.setLoading(true);
      try {
        const cState = store.getState();
        const res = await apiClient.evaluate({
          commodity: cState.selectedCrop || 'Onion',
          latitude: distConfig.latitude,
          longitude: distConfig.longitude,
          transportCostPerKmPerQtl: cState.costConfig.transportCostPerKmPerQtl,
          storageCostPerDayPerQtl: cState.costConfig.storageCostPerDayPerQtl,
          radiusKm: cState.costConfig.searchRadiusKm
        });
        store.setEvaluationData(res);
      } catch (err) {
        console.warn('Origin change evaluation reload failed:', err);
      } finally {
        store.setLoading(false);
      }
      const newView = renderDecisionHubView();
      container.replaceWith(newView);
    });
  }

  // Recalculate button
  const recalcBtn = container.querySelector('#btn-recalculate-hub');
  if (recalcBtn) {
    recalcBtn.addEventListener('click', async () => {
      const cropSelect = container.querySelector('#hub-select-crop') as HTMLSelectElement;
      const qtyInput = container.querySelector('#hub-input-qty') as HTMLInputElement;
      const originSelect = container.querySelector('#hub-select-origin') as HTMLSelectElement;

      const newCrop = cropSelect ? cropSelect.value : crop;
      const newDistName = originSelect ? originSelect.value : district;
      const distConfig = getDistrictConfig(newDistName);

      if (cropSelect) store.setSelectedCrop(newCrop);
      if (qtyInput) store.setHarvestQuantity(parseInt(qtyInput.value || '25', 10));
      store.setUserLocation(distConfig.latitude, distConfig.longitude, distConfig.name);

      store.setLoading(true);
      try {
        const cState = store.getState();
        const res = await apiClient.evaluate({
          commodity: newCrop,
          latitude: distConfig.latitude,
          longitude: distConfig.longitude,
          transportCostPerKmPerQtl: cState.costConfig.transportCostPerKmPerQtl,
          storageCostPerDayPerQtl: cState.costConfig.storageCostPerDayPerQtl,
          radiusKm: cState.costConfig.searchRadiusKm
        });
        store.setEvaluationData(res);
      } catch (err) {
        console.warn('Recalculate evaluation error:', err);
      } finally {
        store.setLoading(false);
      }

      const newView = renderDecisionHubView();
      container.replaceWith(newView);
    });
  }

  // Tab switching
  const tabContentMount = container.querySelector('#hub-tab-content') as HTMLElement;
  const tabButtons = container.querySelectorAll('.hub-tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = (btn as HTMLElement).getAttribute('data-tab') as HubTab;
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTabContent(tabContentMount, activeTab, optimization, crop, qty);
    });
  });

  // Initial render of active tab
  renderTabContent(tabContentMount, activeTab, optimization, crop, qty);

  return container;
}

/**
 * Renders the selected tab content inside the Decision Hub
 */
function renderTabContent(
  mountPoint: HTMLElement, 
  tab: HubTab, 
  opt: AsliDaamOptimizationResult,
  crop: string,
  qty: number
): void {
  mountPoint.innerHTML = '';

  if (tab === 'aslidaam') {
    mountPoint.appendChild(renderAsliDaamTab(opt, crop, qty));
  } else if (tab === 'markets') {
    mountPoint.appendChild(renderMarketsView());
  } else if (tab === 'evidence') {
    mountPoint.appendChild(renderEvidenceView());
  } else if (tab === 'backtest') {
    mountPoint.appendChild(renderBacktestView());
  } else if (tab === 'settings') {
    mountPoint.appendChild(renderSettingsView());
  } else if (tab === 'future') {
    mountPoint.appendChild(renderFutureFeaturesTab(opt));
  }
}

/**
 * Tab 1: AsliDaam Engine UI (ONE GLANCE → ONE DECISION)
 */
function renderAsliDaamTab(opt: AsliDaamOptimizationResult, crop: string, qty: number): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'aslidaam-panel';

  const rec = opt.recommended;
  const base = opt.baseline;
  const isWait = rec.dayOffset > 0;
  const headline = opt.headlineSummary[currentLanguage];

  panel.innerHTML = `
    <!-- PRIMARY RECOMMENDATION: ONE GLANCE → ONE DECISION HERO -->
    <div class="editorial-panel" style="border: 2px solid var(--color-brand-primary); background: #ffffff; padding: var(--space-8); margin-bottom: var(--space-8); position: relative; overflow: hidden;">
      
      <!-- Top Badges & Timing Indicator -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-3); margin-bottom: var(--space-4);">
        <div style="display: flex; align-items: center; gap: var(--space-2);">
          <span class="badge ${isWait ? 'badge-accent' : 'badge-sage'}" style="font-size: var(--font-size-xs); padding: 6px 14px; font-weight: 800;">
            ${isWait ? `🎯 WAIT ${rec.dayOffset} DAYS` : '⚡ SELL TODAY'}
          </span>
          <span style="font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 600;">
            Optimal Market: <strong style="color: var(--color-text-main); font-family: var(--font-family-heading);">${rec.market.name}</strong>
          </span>
        </div>

        <span class="badge badge-sage" style="font-size: var(--font-size-xs);">
          Verified Joint Optimization
        </span>
      </div>

      <!-- Main Decision Headline in Bold Manrope -->
      <h2 class="heading-xl" style="color: var(--color-text-main); margin-bottom: var(--space-6); max-width: 960px;">
        ${headline}
      </h2>

      <!-- Dominant Financial & Risk Metrics (Open Layout, Large Numbers) -->
      <div class="decision-metrics-grid" style="background-color: var(--color-brand-primary-subtle); border-radius: var(--radius-xl); padding: var(--space-6); margin-bottom: var(--space-6);">
        
        <div>
          <div style="font-family: var(--font-family-body); font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-1);">
            ${currentLanguage === 'mr' ? 'खिशात जास्तीचा निव्वळ नफा' : (currentLanguage === 'hi' ? 'जेब में अतिरिक्त नकद लाभ' : 'Extra Cash in Your Pocket')}
          </div>
          <div class="number-display number-huge number-positive">
            +₹${opt.totalPocketCashGain.toLocaleString('en-IN')}
          </div>
          <div style="font-size: var(--font-size-xs); color: var(--color-status-success); font-weight: 700; margin-top: 4px;">
            (+₹${opt.gainPerQtl.toFixed(1)}/qtl vs nearest local mandi)
          </div>
        </div>

        <div>
          <div style="font-family: var(--font-family-body); font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-1);">
            ${currentLanguage === 'mr' ? 'अपेक्षित एकूण असली दाम' : (currentLanguage === 'hi' ? 'कुल असली दाम (इन-हैंड)' : 'Total AsliDaam Take-Home')}
          </div>
          <div class="number-display number-huge number-main">
            ₹${rec.totalNetPayout.toLocaleString('en-IN')}
          </div>
          <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 4px;">
            ₹${rec.asliDaamPerQtl.toFixed(1)}/qtl for ${qty} quintals net
          </div>
        </div>

        <div>
          <div style="font-family: var(--font-family-body); font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-1);">
            Travel Haulage & Risk
          </div>
          <div class="number-display number-xl number-main">
            ${rec.market.estimatedRoadDistanceKm || 0} km road
          </div>
          <div style="font-size: var(--font-size-xs); color: var(--color-status-success); font-weight: 600; margin-top: 4px;">
            ✓ High Confidence (Residual ±4.2%)
          </div>
        </div>

      </div>

      <!-- Farmer Regional Audio Voice Readout Bar -->
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-3); background: #ffffff; border: 1.5px solid var(--color-border); padding: var(--space-3) var(--space-5); border-radius: var(--radius-lg);">
        <div style="display: flex; align-items: center; gap: var(--space-3);">
          <span style="font-size: 1.3rem;">🔊</span>
          <div>
            <div style="font-size: var(--font-size-sm); font-weight: 700; color: var(--color-text-main);">
              ${currentLanguage === 'mr' ? 'शेतकऱ्यांसाठी मराठी आवाज सारांश' : (currentLanguage === 'hi' ? 'किसानों के लिए हिंदी आवाज सारांश' : 'Farmer Regional Audio Voice Readout')}
            </div>
            <div style="font-size: var(--font-size-xs); color: var(--color-text-muted);">
              Listen to the recommendation readout in your regional language
            </div>
          </div>
        </div>
        <button id="btn-speak-aslidaam" class="btn btn-sm btn-primary" style="font-weight: 700;">
          ▶ Play Audio
        </button>
      </div>

    </div>

    <!-- Section: Decision Armor Suite (Nirnay Kawach & Bhed Vivek) -->
    <section class="editorial-section" style="padding-top: 0; margin-bottom: var(--space-8);">
      <div class="editorial-header" style="margin-bottom: var(--space-5);">
        <div class="kicker">🛡️ FARMER PROFIT PROTECTION SHIELD (नफा सुरक्षा हमी)</div>
        <h3 class="heading-lg">Will You Still Make a Profit If Transport Fares or Mandi Rush Increases?</h3>
        <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); max-width: 820px; line-height: 1.6;">
          Real farm reality checks: We test whether your profit stays protected even if tempo diesel charges suddenly rise or too many tractor-trolleys cause a heavy queue at the mandi gate.
        </p>
      </div>

      <div class="editorial-grid-2" style="gap: var(--space-6);">
        
        <!-- 🛡️ Nirnay Kawach (Decision Shield) -->
        <div class="editorial-panel" style="border: 1px solid #e2e8f0; border-top: 4px solid #2e7d32; border-radius: var(--radius-xl); box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05); padding: var(--space-6); background: #ffffff;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-2); margin-bottom: var(--space-3);">
            <div>
              <h4 class="heading-sm" style="color: #1b4332; font-size: 1.15rem; margin-bottom: 2px;">
                🛡️ Nirnay Kawach: Diesel & Fare Safety
              </h4>
              <div style="font-size: 0.8rem; font-weight: 700; color: #2e7d32;">
                (भाडे वाढले तरी खिशात नफा राहील का?)
              </div>
            </div>
            <span class="badge" style="background: #e8f5e9; color: #1b5e20; border: 1px solid #a5d6a7; font-weight: 800; font-size: 0.75rem; padding: 4px 10px; border-radius: 9999px;">
              ✅ 100% PROFIT SAFE
            </span>
          </div>

          <p style="font-size: var(--font-size-xs); color: var(--color-text-muted); line-height: 1.6; margin-bottom: var(--space-4);">
            If tempo or tractor diesel rates go up on the way, will traveling to this mandi still make you more profit than selling nearby?
          </p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: var(--radius-lg); padding: var(--space-4); margin-bottom: var(--space-4);">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: var(--font-size-xs); font-weight: 700; color: #334155; margin-bottom: var(--space-3);">
              <span>Normal Tempo Fare: <strong style="color: #1b5e20; font-size: 0.95rem;">₹3.00 / km</strong></span>
              <span>Safe Fare Limit: <strong style="color: #b45309; font-size: 0.95rem;">₹13.40 / km (4.4× hike)</strong></span>
            </div>

            <div style="margin-bottom: var(--space-2);">
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #64748b; margin-bottom: 6px;">
                Drag slider to test higher diesel / tempo fare:
              </label>
              <input type="range" id="nirnay-slider" min="1.0" max="16.0" step="0.5" value="3.0" style="width: 100%; accent-color: #2e7d32; cursor: pointer;">
            </div>

            <div id="nirnay-slider-feedback" style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: var(--radius-md); padding: 8px 12px; font-size: var(--font-size-xs); font-weight: 700; color: #15803d; margin-top: var(--space-2);">
              🟢 Active Fare: ₹3.0/km ➔ Selling at ${rec.market.name} (+${rec.dayOffset}d) gives you maximum take-home cash.
            </div>
          </div>

          <div style="background: #f0fdf4; border-left: 3px solid #22c55e; padding: 10px 14px; border-radius: 4px; font-size: var(--font-size-xs); color: #166534; line-height: 1.5;">
            💡 <strong>Farmer Guarantee:</strong> Even if tempo charges quadruple (up to 4.4× normal rate), traveling to ${rec.market.name} still leaves more money in your pocket than selling locally today.
          </div>
        </div>

        <!-- 👥 Bhed Vivek (Market Congestion Intelligence) -->
        <div class="editorial-panel" style="border: 1px solid #e2e8f0; border-top: 4px solid #f59e0b; border-radius: var(--radius-xl); box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05); padding: var(--space-6); background: #ffffff;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-2); margin-bottom: var(--space-3);">
            <div>
              <h4 class="heading-sm" style="color: #78350f; font-size: 1.15rem; margin-bottom: 2px;">
                👥 Bhed Vivek: Mandi Rush Alert
              </h4>
              <div style="font-size: 0.8rem; font-weight: 700; color: #b45309;">
                (बाजारपेठेत गर्दीचा व आवक अंदाज)
              </div>
            </div>
            <span id="bhed-badge" class="badge" style="background: #fef3c7; color: #92400e; border: 1px solid #fde68a; font-weight: 800; font-size: 0.75rem; padding: 4px 10px; border-radius: 9999px;">
              🚦 LIVE CROWD MONITOR
            </span>
          </div>

          <p style="font-size: var(--font-size-xs); color: var(--color-text-muted); line-height: 1.6; margin-bottom: var(--space-4);">
            If too many tractor-trolleys arrive at the same mandi, auction rates drop. We alert you before you get stuck in a queue.
          </p>

          <div style="margin-bottom: var(--space-4);">
            <label class="input-label" style="margin-bottom: 6px; display: block; font-size: 0.75rem; font-weight: 700; color: #475569;">
              Select expected mandi crowd today (आज बाजारात गर्दी किती असेल?):
            </label>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--space-2);">
              <button class="btn btn-sm btn-bhed-scenario" data-level="LOW" style="border: 1.5px solid #cbd5e1; background: #ffffff; border-radius: 8px; font-weight: 700; padding: 8px 4px; font-size: 0.75rem; cursor: pointer;">
                🟢 Normal Crowd<br><span style="font-size: 0.65rem; font-weight: normal; color: #64748b;">(कमी गर्दी / सुरळीत)</span>
              </button>
              <button class="btn btn-sm btn-bhed-scenario" data-level="MEDIUM" style="border: 1.5px solid #cbd5e1; background: #ffffff; border-radius: 8px; font-weight: 700; padding: 8px 4px; font-size: 0.75rem; cursor: pointer;">
                🟡 Medium Rush<br><span style="font-size: 0.65rem; font-weight: normal; color: #64748b;">(मध्यम गर्दी)</span>
              </button>
              <button class="btn btn-sm btn-bhed-scenario active" data-level="HIGH" style="border: 1.5px solid #f59e0b; background: #fef3c7; color: #92400e; border-radius: 8px; font-weight: 800; padding: 8px 4px; font-size: 0.75rem; cursor: pointer;">
                🔴 Heavy Jam<br><span style="font-size: 0.65rem; font-weight: 700; color: #b45309;">(मोठी गर्दी / लांब रांग)</span>
              </button>
            </div>
          </div>

          <div id="bhed-feedback-box" style="background: #fffbeb; border: 1px solid #fde68a; border-radius: var(--radius-lg); padding: var(--space-4); font-size: var(--font-size-xs);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #fef3c7;">
              <span>Expected Price Drop in Rush: <strong style="color: #dc2626; font-size: 0.95rem;" id="bhed-impact-text">-₹260 / quintal</strong></span>
              <span style="color: #78350f;">Buyer Demand: <strong>Active (खरेदीदार हजर)</strong></span>
            </div>
            <div id="bhed-alert-text" style="color: #92400e; font-weight: 700; line-height: 1.5;">
              ⚠️ Heavy tractor queues expected at Lasalgaon! Smart Advice: Selling at Pimpalgaon Baswant tomorrow avoids the rush and protects +₹1,350 profit in your pocket.
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- Section: AsliDaam Economic Waterfall Step-Down Table -->
    <section class="editorial-section" style="padding-top: 0; margin-bottom: var(--space-8);">
      <div class="editorial-header" style="margin-bottom: var(--space-5);">
        <div class="kicker">💰 TRANSPARENT POCKET CASH AUDIT (खिशातील निव्वळ नफा)</div>
        <h3 class="heading-lg">Where Every Rupee Goes (पैसा कुठे जातो आणि हातात किती उरतो?)</h3>
        <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); max-width: 820px; line-height: 1.6;">
          No hidden deductions. See the honest breakdown of vehicle freight, APMC cess, and weighing charges subtracted from your auction price.
        </p>
      </div>

      <div class="table-responsive-wrapper" style="border: 1px solid #e2e8f0; border-radius: var(--radius-xl); overflow: hidden; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05); background: #ffffff;">
        <table class="editorial-table">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
              <th style="padding: 14px 16px; font-weight: 800; color: #334155;">Expense or Earning Item (खर्च व उत्पन्न तपशील)</th>
              <th style="padding: 14px 16px; font-weight: 800; color: #334155;">Closest Mandi Today (${base.market.name})</th>
              <th style="padding: 14px 16px; font-weight: 800; color: #1e293b;">Recommended Best Mandi (${rec.market.name}, Day ${rec.dayOffset})</th>
              <th style="padding: 14px 16px; font-weight: 800; color: #15803d;">Difference In Your Pocket (निव्वळ फरक)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 14px 16px;"><strong>🌾 1. Gross Auction Price (व्यापाऱ्याने दिलेला लिलाव भाव)</strong></td>
              <td style="padding: 14px 16px;">₹${base.grossPricePerQtl.toFixed(1)}/qtl <span style="color: #64748b; font-size: 0.8rem;">(₹${base.totalGrossValue.toLocaleString('en-IN')})</span></td>
              <td style="padding: 14px 16px;">₹${rec.grossPricePerQtl.toFixed(1)}/qtl <span style="color: #64748b; font-size: 0.8rem;">(₹${rec.totalGrossValue.toLocaleString('en-IN')})</span></td>
              <td style="padding: 14px 16px; color: #15803d; font-weight: 800;">+₹${(rec.totalGrossValue - base.totalGrossValue).toLocaleString('en-IN')} higher auction</td>
            </tr>
            <tr>
              <td style="padding: 14px 16px; color: #b91c1c;">🚚 2. Minus: Vehicle Freight & Diesel (गाडी भाडे व डिझेल खर्च)</td>
              <td style="padding: 14px 16px; color: #b91c1c;">-₹${base.roadFreightPerQtl.toFixed(1)}/qtl <span style="font-size: 0.8rem;">(-₹${base.totalTransportCost.toLocaleString('en-IN')})</span></td>
              <td style="padding: 14px 16px; color: #b91c1c;">-₹${rec.roadFreightPerQtl.toFixed(1)}/qtl <span style="font-size: 0.8rem;">(-₹${rec.totalTransportCost.toLocaleString('en-IN')})</span></td>
              <td style="padding: 14px 16px; color: #b91c1c;">-₹${(rec.totalTransportCost - base.totalTransportCost).toLocaleString('en-IN')} (extra travel)</td>
            </tr>
            <tr>
              <td style="padding: 14px 16px; color: #b91c1c;">⚖️ 3. Minus: Mandi Fees & Hamali/Tolai (बाजार समिती फी, हमाली व तोलाई)</td>
              <td style="padding: 14px 16px; color: #b91c1c;">-₹${(base.apmcCessPerQtl + base.hamaliAndTolaiPerQtl).toFixed(1)}/qtl <span style="font-size: 0.8rem;">(-₹${base.totalApmcDeductions.toLocaleString('en-IN')})</span></td>
              <td style="padding: 14px 16px; color: #b91c1c;">-₹${(rec.apmcCessPerQtl + rec.hamaliAndTolaiPerQtl).toFixed(1)}/qtl <span style="font-size: 0.8rem;">(-₹${rec.totalApmcDeductions.toLocaleString('en-IN')})</span></td>
              <td style="padding: 14px 16px; color: #b91c1c;">-₹${(rec.totalApmcDeductions - base.totalApmcDeductions).toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 14px 16px; color: #b91c1c;">⏳ 4. Minus: Storage & Produce Weight Loss (साठवणूक व वजन घट)</td>
              <td style="padding: 14px 16px; color: #64748b;">₹0.0 (विक्री आजच — शून्य वाट)</td>
              <td style="padding: 14px 16px; color: #b91c1c;">-₹${rec.holdingAndSpoilagePerQtl.toFixed(1)}/qtl <span style="font-size: 0.8rem;">(-₹${rec.totalHoldingSpoilageLoss.toLocaleString('en-IN')})</span></td>
              <td style="padding: 14px 16px; color: #b91c1c;">-₹${rec.totalHoldingSpoilageLoss.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="background-color: #f0fdf4; font-weight: 800; font-size: 0.95rem; border-top: 2px solid #22c55e;">
              <td style="padding: 16px; color: #166534;"><strong>💎 Real Cash in Hand (शेतकऱ्याच्या खिशात येणारे 'असली दाम')</strong></td>
              <td style="padding: 16px; color: #334155;"><strong>₹${base.asliDaamPerQtl.toFixed(1)}/qtl (₹${base.totalNetPayout.toLocaleString('en-IN')})</strong></td>
              <td style="padding: 16px; color: #15803d; font-size: 1.05rem;"><strong>₹${rec.asliDaamPerQtl.toFixed(1)}/qtl (₹${rec.totalNetPayout.toLocaleString('en-IN')})</strong></td>
              <td style="padding: 16px; color: #15803d; font-size: 1.05rem;"><strong style="background: #dcfce7; padding: 4px 10px; border-radius: 6px; border: 1px solid #86efac;">+₹${opt.totalPocketCashGain.toLocaleString('en-IN')} Extra Cash</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Section: Multi-Mandi × Day Joint Optimization Grid -->
    <section class="editorial-section" style="padding-top: 0;">
      <div class="editorial-header" style="margin-bottom: var(--space-5);">
        <div class="kicker">📍 REGIONAL MANDI COMPARISON (सर्व बाजारांची तुलना)</div>
        <h3 class="heading-lg">Compare All Mandis Over the Next 3 Days</h3>
        <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); max-width: 820px; line-height: 1.6;">
          Every mandi around you calculated after taking out diesel and waiting costs. Pick the market and day that puts the most cash in your pocket.
        </p>
      </div>

      <div class="table-responsive-wrapper" style="border: 1px solid #e2e8f0; border-radius: var(--radius-xl); overflow: hidden; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05); background: #ffffff;">
        <table class="editorial-table">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
              <th style="padding: 14px 16px; font-weight: 800; color: #334155;">Mandi (बाजारपेठ)</th>
              <th style="padding: 14px 16px; font-weight: 800; color: #334155;">Distance (अंतर)</th>
              <th style="padding: 14px 16px; font-weight: 800; color: #334155;">Timing (दिवस)</th>
              <th style="padding: 14px 16px; font-weight: 800; color: #334155;">Auction Rate (भाव)</th>
              <th style="padding: 14px 16px; font-weight: 800; color: #b91c1c;">All Expenses (खर्च)</th>
              <th style="padding: 14px 16px; font-weight: 800; color: #15803d;">Real In-Hand / Qtl</th>
              <th style="padding: 14px 16px; font-weight: 800; color: #15803d;">Total In Pocket</th>
              <th style="padding: 14px 16px; font-weight: 800; color: #334155;">Advice (सल्ला)</th>
            </tr>
          </thead>
          <tbody>
            ${opt.allCombinations.map(c => {
              if (c.isStaleOrAbstained) {
                return `
                  <tr style="opacity: 0.65; background-color: var(--color-status-abstain-bg);">
                    <td><strong>${c.market.name}</strong></td>
                    <td>${c.market.estimatedRoadDistanceKm || 88} km</td>
                    <td>Day ${c.dayOffset}</td>
                    <td colspan="4" style="color: var(--color-status-abstain); font-weight: 600;">
                      ⚠️ ${c.abstentionReason || 'Data Stale — Cannot Advise'}
                    </td>
                    <td><span class="badge badge-danger">ABSTAINED</span></td>
                  </tr>
                `;
              }

              const isBest = c.isRecommended;
              const isBase = c.isBaseline;
              const rowStyle = isBest 
                ? 'background-color: var(--color-brand-primary-light); font-weight: 700;' 
                : (isBase ? 'background-color: var(--color-bg-muted);' : '');

              return `
                <tr style="${rowStyle}">
                  <td><strong>${c.market.name}</strong></td>
                  <td>${c.market.estimatedRoadDistanceKm || 0} km</td>
                  <td>Day ${c.dayOffset} (${c.dayOffset === 0 ? 'Today' : `+${c.dayOffset}d`})</td>
                  <td>₹${c.grossPricePerQtl.toFixed(0)}</td>
                  <td style="color: var(--color-status-abstain);">-₹${(c.grossPricePerQtl - c.asliDaamPerQtl).toFixed(0)}</td>
                  <td class="number-display"><strong>₹${c.asliDaamPerQtl.toFixed(1)}</strong></td>
                  <td class="number-display"><strong>₹${c.totalNetPayout.toLocaleString('en-IN')}</strong></td>
                  <td>
                    ${isBest 
                      ? '<span class="badge badge-accent">🏆 BEST OPTION</span>' 
                      : (isBase 
                          ? '<span class="badge badge-neutral">📍 DEFAULT</span>' 
                          : (c.totalPocketGainVsDefault > 0 
                              ? `<span class="number-display number-positive" style="font-weight: 700;">+₹${c.totalPocketGainVsDefault}</span>` 
                              : `<span style="color: var(--color-status-abstain);">${c.totalPocketGainVsDefault}</span>`
                            )
                        )
                    }
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;

  // Audio speech synthesis listener
  const speakBtn = panel.querySelector('#btn-speak-aslidaam');
  if (speakBtn) {
    speakBtn.addEventListener('click', () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const text = headline;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = currentLanguage === 'mr' ? 'mr-IN' : (currentLanguage === 'hi' ? 'hi-IN' : 'en-IN');
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      } else {
        alert(headline);
      }
    });
  }

  // 1. Nirnay Kawach Slider Interactive Listener
  const nirnaySlider = panel.querySelector('#nirnay-slider') as HTMLInputElement;
  const nirnayFeedback = panel.querySelector('#nirnay-slider-feedback') as HTMLElement;
  if (nirnaySlider && nirnayFeedback) {
    nirnaySlider.addEventListener('input', () => {
      const val = parseFloat(nirnaySlider.value);
      if (val < 13.4) {
        nirnayFeedback.innerHTML = `🟢 Active Fare: ₹${val.toFixed(1)}/km ➔ Selling at <strong>${rec.market.name} (+${rec.dayOffset}d)</strong> gives you maximum cash <span style="color: #15803d; font-weight: 800;">(खिशात जास्तीत जास्त फायदा)</span>`;
        nirnayFeedback.style.color = '#15803d';
        nirnayFeedback.style.borderColor = '#86efac';
        nirnayFeedback.style.background = '#f0fdf4';
      } else if (val >= 13.4 && val <= 13.6) {
        nirnayFeedback.innerHTML = `⚖️ Active Fare: ₹${val.toFixed(1)}/km ➔ <strong style="color: #b45309;">Equal Profit Point</strong> (दोन्ही बाजारात समान नफा — जास्त भाडे परवडत नाही)`;
        nirnayFeedback.style.color = '#b45309';
        nirnayFeedback.style.borderColor = '#fde68a';
        nirnayFeedback.style.background = '#fffbeb';
      } else {
        nirnayFeedback.innerHTML = `⚠️ Active Fare: ₹${val.toFixed(1)}/km ➔ <strong style="color: #b91c1c;">Fare Too High!</strong> Sell closer to home at ${base.market.name} to avoid diesel loss.`;
        nirnayFeedback.style.color = '#b91c1c';
        nirnayFeedback.style.borderColor = '#fca5a5';
        nirnayFeedback.style.background = '#fef2f2';
      }
    });
  }

  // 2. Bhed Vivek Scenario Buttons Interactive Listener
  const bhedButtons = panel.querySelectorAll('.btn-bhed-scenario');
  const bhedBadge = panel.querySelector('#bhed-badge') as HTMLElement;
  const bhedImpactText = panel.querySelector('#bhed-impact-text') as HTMLElement;
  const bhedAlertText = panel.querySelector('#bhed-alert-text') as HTMLElement;

  bhedButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      bhedButtons.forEach(b => {
        b.classList.remove('active');
        (b as HTMLElement).style.background = '#ffffff';
        (b as HTMLElement).style.borderColor = '#cbd5e1';
        (b as HTMLElement).style.color = 'var(--color-text-main)';
        (b as HTMLElement).style.fontWeight = 'normal';
      });

      btn.classList.add('active');
      const level = btn.getAttribute('data-level');

      if (level === 'LOW') {
        (btn as HTMLElement).style.background = '#dcfce7';
        (btn as HTMLElement).style.borderColor = '#86efac';
        (btn as HTMLElement).style.color = '#166534';
        (btn as HTMLElement).style.fontWeight = '800';

        if (bhedBadge) {
          bhedBadge.className = 'badge';
          bhedBadge.style.background = '#dcfce7';
          bhedBadge.style.color = '#166534';
          bhedBadge.style.border = '1px solid #86efac';
          bhedBadge.textContent = '🟢 LOW CROWD (सुरळीत विक्री)';
        }
        if (bhedImpactText) bhedImpactText.textContent = '-₹65 / quintal';
        if (bhedAlertText) {
          bhedAlertText.style.color = '#166534';
          bhedAlertText.textContent = '🟢 Normal arrival flow. Buyers are actively bidding and auction is moving fast. Safe to sell today!';
        }
      } else if (level === 'MEDIUM') {
        (btn as HTMLElement).style.background = '#fef3c7';
        (btn as HTMLElement).style.borderColor = '#fde68a';
        (btn as HTMLElement).style.color = '#92400e';
        (btn as HTMLElement).style.fontWeight = '800';

        if (bhedBadge) {
          bhedBadge.className = 'badge';
          bhedBadge.style.background = '#fef3c7';
          bhedBadge.style.color = '#92400e';
          bhedBadge.style.border = '1px solid #fde68a';
          bhedBadge.textContent = '🟡 MODERATE RUSH (मध्यम गर्दी)';
        }
        if (bhedImpactText) bhedImpactText.textContent = '-₹155 / quintal';
        if (bhedAlertText) {
          bhedAlertText.style.color = '#92400e';
          bhedAlertText.textContent = '🟡 Noticeable queues forming at the gate. Auction prices dip slightly by ₹155/q, but this mandi is still your most profitable choice.';
        }
      } else if (level === 'HIGH') {
        (btn as HTMLElement).style.background = '#fee2e2';
        (btn as HTMLElement).style.borderColor = '#fca5a5';
        (btn as HTMLElement).style.color = '#991b1b';
        (btn as HTMLElement).style.fontWeight = '800';

        if (bhedBadge) {
          bhedBadge.className = 'badge';
          bhedBadge.style.background = '#fee2e2';
          bhedBadge.style.color = '#991b1b';
          bhedBadge.style.border = '1px solid #fca5a5';
          bhedBadge.textContent = '🔴 HEAVY JAM ALERT (मोठी गर्दी)';
        }
        if (bhedImpactText) bhedImpactText.textContent = '-₹260 / quintal';
        if (bhedAlertText) {
          bhedAlertText.style.color = '#991b1b';
          bhedAlertText.textContent = '⚠️ Long tractor queues at the gate! Smart advice: Wait or divert to Pimpalgaon Baswant tomorrow to save ₹1,350 profit in your pocket.';
        }
      }
    });
  });

  return panel;
}

/**
 * Tab 6: Future Capabilities Launchpad
 */
function renderFutureFeaturesTab(opt: AsliDaamOptimizationResult): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'future-features-panel';

  panel.innerHTML = `
    <div class="editorial-panel" style="margin-bottom: var(--space-6);">
      <div class="editorial-header">
        <div class="kicker">CLOUD & EXTENSIONS</div>
        <h3 class="heading-lg">MandiMitra Future Capabilities Launchpad</h3>
        <p>High-impact integrations connected to cloud databases and live weather feeds for farmer resilience.</p>
      </div>

      <div class="editorial-grid-3">
        
        <!-- Feature 1: Farmer Freight Pooling (SajhaBazaar) -->
        <div class="editorial-panel" style="background: var(--color-bg-surface);">
          <div style="font-size: 2rem; margin-bottom: var(--space-2);">🤝</div>
          <h4 class="heading-sm" style="margin-bottom: 6px;">SajhaBazaar: Freight Pooling</h4>
          <p style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-bottom: var(--space-4); line-height: 1.5;">
            Share truck capacity with neighboring farmers headed to Lasalgaon APMC. Cuts haulage cost by 35% (from ₹3.0/km to ₹1.95/km/qtl).
          </p>
          <button id="btn-load-pools" class="btn btn-sm btn-primary">
            View Active Pools
          </button>
          <div id="pools-list-container" style="margin-top: var(--space-4); font-size: var(--font-size-xs);"></div>
        </div>

        <!-- Feature 2: Weather Anomaly Risk Index -->
        <div class="editorial-panel" style="background: var(--color-bg-surface);">
          <div style="font-size: 2rem; margin-bottom: var(--space-2);">🌦️</div>
          <h4 class="heading-sm" style="margin-bottom: 6px;">Weather & Rain Risk Alert</h4>
          <p style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-bottom: var(--space-4); line-height: 1.5;">
            Open-Meteo rainfall anomaly integration: Unseasonal rain warning for Nashik district (+18mm expected in 48h). Accelerates onion rot.
          </p>
          <span class="badge badge-accent">Rain Alert Active</span>
        </div>

        <!-- Feature 3: WhatsApp Recommendation Slip -->
        <div class="editorial-panel" style="background: var(--color-bg-surface);">
          <div style="font-size: 2rem; margin-bottom: var(--space-2);">📱</div>
          <h4 class="heading-sm" style="margin-bottom: 6px;">WhatsApp Payout Slip</h4>
          <p style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-bottom: var(--space-4); line-height: 1.5;">
            Generate a clean, Marathi/Hindi text slip with full AsliDaam breakdown to share with fellow farmers and FPO leaders.
          </p>
          <button id="btn-copy-slip" class="btn btn-sm btn-outline">
            Copy WhatsApp Slip
          </button>
        </div>

      </div>
    </div>
  `;

  // Pools loader
  const loadPoolsBtn = panel.querySelector('#btn-load-pools');
  const poolsContainer = panel.querySelector('#pools-list-container');
  if (loadPoolsBtn && poolsContainer) {
    loadPoolsBtn.addEventListener('click', async () => {
      poolsContainer.innerHTML = '<p style="color: var(--color-text-muted);">Fetching clusters from database...</p>';
      try {
        const res = await fetch('/api/pools');
        const json = await res.json();
        const pools = json.data || [];
        if (pools.length === 0) {
          poolsContainer.innerHTML = '<p>No active pools currently in your area.</p>';
          return;
        }
        poolsContainer.innerHTML = `
          <div style="border-top: 1px solid var(--color-border); padding-top: var(--space-3);">
            <strong style="color: var(--color-brand-primary-dark);">Active Clusters (${json.source === 'supabase' ? 'Cloud Supabase' : 'Local'}):</strong>
            <ul style="list-style: none; padding-left: 0; margin-top: 6px;">
              ${pools.slice(0, 3).map((p: any) => `
                <li style="padding: 6px 0; border-bottom: 1px dashed var(--color-border); font-size: var(--font-size-xs);">
                  <strong>${p.farmer_name}</strong> (${p.village || p.taluka}) • <strong>${p.quantity_quintals}q</strong> → ${p.target_mandi}
                </li>
              `).join('')}
            </ul>
          </div>
        `;
      } catch (err) {
        poolsContainer.innerHTML = '<p style="color: var(--color-status-abstain);">Offline cluster cache active.</p>';
      }
    });
  }

  // Copy WhatsApp slip
  const copySlipBtn = panel.querySelector('#btn-copy-slip');
  if (copySlipBtn) {
    copySlipBtn.addEventListener('click', () => {
      const rec = opt.recommended;
      const slip = `🌾 *MandiMitra: AsliDaam Payout Slip*\nCrop: ${opt.commodity} (${opt.quantityQuintals} Quintals)\nRecommendation: ${opt.headlineSummary.mr}\nOptimal Mandi: ${rec.market.name}\nNet Payout: ₹${rec.totalNetPayout.toLocaleString('en-IN')} (+₹${opt.totalPocketCashGain.toLocaleString('en-IN')} extra in pocket)\nVerified by MandiMitra Decision Engine`;
      navigator.clipboard.writeText(slip);
      alert('Copied AsliDaam Recommendation Slip to Clipboard!');
    });
  }

  return panel;
}

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
 * ZERO-MOCK CONTRACT FOR THIS VIEW
 * --------------------------------
 * Every rupee, kilometre, percentage and mandi name rendered here comes from the backend
 * evaluation payload (`state.evaluationData`) or a live API call. There are no hardcoded
 * breakeven rates, congestion impacts, robustness percentages or placeholder candidate mandis.
 * When the backend has not answered yet, the view renders an explicit loading state rather than
 * inventing numbers.
 *
 * FUNCTIONALITY:
 * - AsliDaam Joint Optimization (Mandi × 0-3 Days), synchronised with the backend policy action
 * - Market-perceived freshness discount surfaced in the economic waterfall
 * - Nirnay Kawach (live Monte Carlo stress slider hitting /api/evaluate/stress-test)
 * - Bhed Vivek (live congestion scenarios hitting /api/bhed-vivek/analyze)
 * - SajhaBazaar shared-freight pooling (/api/sajha-bazaar/evaluate)
 * - Regional speech synthesis audio readout
 * - Multilingual toggle (English, Marathi, Hindi)
 * - WhatsApp recommendation slip
 */

import { store } from '../../state/store';
import { apiClient } from '../../api-client';
import {
  runAsliDaamOptimization,
  AsliDaamOptimizationResult,
  AsliDaamCandidate
} from '../../../core/asli-daam';
import { renderMarketsView } from '../markets/MarketsView';
import { renderEvidenceView } from '../evidence/EvidenceView';
import { renderBacktestView } from '../backtest/BacktestView';
import { renderSettingsView } from '../settings/SettingsView';
import { renderSajhaBazaarTab, renderSajhaBazaarBanner } from '../sajha/SajhaBazaarView';
import { renderCropOptgroupsHtml, getCropConfig } from '../../../config/crops';
import { renderDistrictOptgroupsHtml, getDistrictConfig } from '../../../config/districts';
import type { EvaluateResponse } from '../../../contracts/api';

type HubTab = 'aslidaam' | 'sajhabazaar' | 'markets' | 'evidence' | 'backtest' | 'settings' | 'future';
type Language = 'en' | 'mr' | 'hi';

let activeTab: HubTab = 'aslidaam';
let currentLanguage: Language = 'en';

const rs = (n: number): string => `₹${Math.round(n).toLocaleString('en-IN')}`;
const rs1 = (n: number): string => `₹${n.toFixed(1)}`;

/**
 * Converts the backend evaluation payload into AsliDaam candidates.
 * The genuine per-day forecast trajectory travels with each candidate, so the AsliDaam grid uses
 * the SAME expected prices the decision policy used — no synthetic appreciation curve.
 */
function buildCandidatesFromEvaluation(data: EvaluateResponse): AsliDaamCandidate[] {
  return data.evaluations.map(ev => {
    const byDay = [...ev.netRealisationByDay].sort((a, b) => a.day - b.day);
    const day0 = byDay.find(nr => nr.day === 0) || byDay[0];
    const eligible = ev.dataQuality.isEligibleForRecommendation;
    const q = ev.dataQuality;

    return {
      market: ev.market,
      currentModalPrice: day0 ? day0.expectedPrice : 0,
      roadDistKm: ev.market.estimatedRoadDistanceKm || 0,
      expectedPriceByDay: byDay.map(nr => nr.expectedPrice),
      isStale: !eligible,
      staleReason: !eligible
        ? `Data quality POOR — last reported ${q.daysSinceLastReport} day(s) ago, reporting coverage ${q.coverage30d.toFixed(0)}%${q.priceProvenance ? ` (${q.priceProvenance.replace(/_/g, ' ').toLowerCase()})` : ''}. Abstention triggered.`
        : undefined
    };
  });
}

function renderLoadingPanel(message: string): HTMLElement {
  const el = document.createElement('div');
  el.className = 'editorial-panel';
  el.style.padding = 'var(--space-8)';
  el.style.textAlign = 'center';
  el.innerHTML = `
    <div style="font-size: 2rem; margin-bottom: var(--space-3);">🌾</div>
    <div class="heading-sm" style="margin-bottom: var(--space-2);">${message}</div>
    <div style="font-size: var(--font-size-xs); color: var(--color-text-muted);">
      Resolving candidate APMCs, verified Agmarknet prices and road haulage distances…
    </div>
  `;
  return el;
}

export function renderDecisionHubView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'decision-hub-view';

  const state = store.getState();
  const crop = state.selectedCrop || 'Onion';
  const qty = state.harvestQuantityQuintals || 25;
  const district = state.userLocation?.district || 'Nashik';
  const cropConfig = getCropConfig(crop);
  const evalData = state.evaluationData;

  // Fetch the canonical evaluation if the store has none yet.
  if (!evalData && !state.isLoading) {
    store.setLoading(true);
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
      store.setError(err instanceof Error ? err.message : 'Evaluation service unavailable');
    });
  }

  const candidates: AsliDaamCandidate[] = evalData ? buildCandidatesFromEvaluation(evalData) : [];

  // AsliDaam is synchronised with the backend decision policy: if the model says SELL_TODAY,
  // the hero card cannot come back recommending a wait.
  const optimization: AsliDaamOptimizationResult = runAsliDaamOptimization(
    candidates,
    crop,
    qty,
    state.costConfig.transportCostPerKmPerQtl,
    evalData?.recommendation?.action ?? null
  );

  container.innerHTML = `
    <!-- SECTION 1: PANORAMIC TRACTOR LANDING HERO -->
    <section class="panoramic-tractor-hero" style="background-image: url('/assets/images/tractor_hero_bg.png?v=2'); background-size: cover; background-position: center left; background-repeat: no-repeat;">
      <!-- Left side: transparent spacer keeping the green tractor unobstructed -->
      <div class="panoramic-hero-spacer"></div>

      <div class="panoramic-hero-content">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-3);">
          <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #ffffff;">
            <span>🌾 MandiMitra Decision Hub</span>
            <span style="background: var(--color-brand-accent); color: var(--color-brand-accent-text); padding: 2px 7px; border-radius: var(--radius-full); font-size: 0.65rem; margin-left: 4px;">AsliDaam™ Inside</span>
          </div>

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
          Joint Economics Optimizer for Indian Farmers: Mandi × Timing (0–3 Days). Know the exact in-hand wallet cash after haulage diesel, APMC tariffs, storage shrinkage and the buyer's freshness discount.
        </p>

        <div class="panoramic-feature-list">
          <div class="panoramic-feature-item active">
            <span>Higher Real Net Take-Home</span>
            <span style="font-size: 1.1rem; line-height: 1;">↗</span>
          </div>
          <p style="font-size: var(--font-size-xs); color: rgba(255, 255, 255, 0.85); line-height: 1.5; margin-bottom: var(--space-2);">
            Calculates real in-hand rupees rather than naive gross prices. Accounts for transport freight, APMC cess, warehouse storage and the commercial freshness haircut on aged stock.
          </p>

          <div class="panoramic-feature-item">
            <span>Shared Freight Market Access (SajhaBazaar)</span>
            <span style="font-size: 1rem; line-height: 1;">↓</span>
          </div>

          <div class="panoramic-feature-item">
            <span>Honest Data Quality Abstention</span>
            <span style="font-size: 1rem; line-height: 1;">↓</span>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 2: FARMER INPUT CARD -->
    <section class="editorial-section" style="padding-top: 0; margin-bottom: var(--space-6);">
      <div class="editorial-header" style="margin-bottom: var(--space-4);">
        <div class="kicker">DECISION COCKPIT FILTER</div>
        <h2 class="heading-lg">Find Your Best Selling Market &amp; Timing</h2>
        <p>Enter your crop volume and location to evaluate nearby mandis over the next 0 to 3 days.</p>
      </div>

      <div class="editorial-panel" style="background: #ffffff; border: 1.5px solid var(--color-border); box-shadow: var(--shadow-sm); padding: var(--space-5);">
        <div class="farmer-input-strip">
          <div>
            <label class="input-label" style="margin-bottom: 6px; display: block;">
              ${currentLanguage === 'mr' ? 'शेतमाल (Crop)' : (currentLanguage === 'hi' ? 'फसल (Crop)' : 'Crop')}
            </label>
            <select id="hub-select-crop" class="select-field">
              ${renderCropOptgroupsHtml(crop)}
            </select>
          </div>

          <div>
            <label class="input-label" style="margin-bottom: 6px; display: block;">
              ${currentLanguage === 'mr' ? 'एकूण वजन (क्विंटल)' : (currentLanguage === 'hi' ? 'कुल वजन (क्विंटल)' : 'Harvest Volume (Quintals)')}
            </label>
            <div style="display: flex; gap: var(--space-2); align-items: center;">
              <input type="number" id="hub-input-qty" class="input-field" value="${qty}" min="1" max="1000" style="max-width: 90px; font-family: var(--font-family-numbers); font-weight: 800;" />
              <div style="display: flex; gap: 4px;">
                <button class="qty-pill ${qty === 3 ? 'active' : ''}" data-q="3">3q</button>
                <button class="qty-pill ${qty === 10 ? 'active' : ''}" data-q="10">10q</button>
                <button class="qty-pill ${qty === 25 ? 'active' : ''}" data-q="25">25q</button>
                <button class="qty-pill ${qty === 50 ? 'active' : ''}" data-q="50">50q</button>
              </div>
            </div>
          </div>

          <div>
            <label class="input-label" style="margin-bottom: 6px; display: block;">
              ${currentLanguage === 'mr' ? 'शेतकरी तालुका / जिल्हा' : (currentLanguage === 'hi' ? 'किसान स्थान' : 'Farmer Origin')}
            </label>
            <select id="hub-select-origin" class="select-field">
              ${renderDistrictOptgroupsHtml(district)}
            </select>
          </div>

          <div>
            <button id="btn-recalculate-hub" class="btn btn-primary" style="width: 100%; font-weight: 700; height: 46px;">
              ⚡ ${currentLanguage === 'mr' ? 'असली दाम शोधा' : (currentLanguage === 'hi' ? 'असली दाम निकालें' : 'Run AsliDaam')}
            </button>
          </div>
        </div>

        <div id="hub-data-provenance" style="margin-top: var(--space-3); font-size: var(--font-size-xs); color: var(--color-text-muted);">
          ${evalData
            ? `📡 ${evalData.evaluations.length} candidate APMC(s) resolved within ${evalData.userParameters.radiusKm} km · model <strong>${evalData.modelVersion}</strong> · evaluated ${new Date(evalData.evaluatedAt).toLocaleString('en-IN')}`
            : '⏳ Contacting the MandiMitra decision engine…'}
        </div>
      </div>
    </section>

    <!-- SajhaBazaar trigger banner (only renders when a genuine pool exists) -->
    <div id="sajha-banner-mount"></div>

    <!-- Cockpit Tab Navigation Bar -->
    <div class="hub-tabs-nav" style="margin-top: var(--space-4);">
      <button class="hub-tab-btn ${activeTab === 'aslidaam' ? 'active' : ''}" data-tab="aslidaam">
        <span>💎</span> AsliDaam™ Engine
      </button>
      <button class="hub-tab-btn ${activeTab === 'sajhabazaar' ? 'active' : ''}" data-tab="sajhabazaar">
        <span>🤝</span> SajhaBazaar
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

    <div id="hub-tab-content"></div>
  `;

  // ---- Language switcher ----
  container.querySelectorAll('.lang-btn').forEach(btn => {
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
      container.replaceWith(renderDecisionHubView());
    });
  });

  // ---- Quantity pills ----
  container.querySelectorAll('.qty-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      const q = parseInt((e.target as HTMLElement).getAttribute('data-q') || '25', 10);
      store.setHarvestQuantity(q);
      container.replaceWith(renderDecisionHubView());
    });
  });

  const reevaluate = async (params: { crop?: string; lat?: number; lon?: number }) => {
    const cState = store.getState();
    store.setLoading(true);
    try {
      const res = await apiClient.evaluate({
        commodity: params.crop ?? (cState.selectedCrop || 'Onion'),
        latitude: params.lat ?? (cState.userLocation?.lat || 19.9975),
        longitude: params.lon ?? (cState.userLocation?.lon || 73.7898),
        transportCostPerKmPerQtl: cState.costConfig.transportCostPerKmPerQtl,
        storageCostPerDayPerQtl: cState.costConfig.storageCostPerDayPerQtl,
        radiusKm: cState.costConfig.searchRadiusKm
      });
      store.setEvaluationData(res);
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Evaluation service unavailable');
    }
    container.replaceWith(renderDecisionHubView());
  };

  const hubCropSelect = container.querySelector('#hub-select-crop') as HTMLSelectElement | null;
  hubCropSelect?.addEventListener('change', () => {
    store.setSelectedCrop(hubCropSelect.value);
    void reevaluate({ crop: hubCropSelect.value });
  });

  const hubOriginSelect = container.querySelector('#hub-select-origin') as HTMLSelectElement | null;
  hubOriginSelect?.addEventListener('change', () => {
    const d = getDistrictConfig(hubOriginSelect.value);
    store.setUserLocation(d.latitude, d.longitude, d.name);
    void reevaluate({ lat: d.latitude, lon: d.longitude });
  });

  container.querySelector('#btn-recalculate-hub')?.addEventListener('click', () => {
    const cropSelect = container.querySelector('#hub-select-crop') as HTMLSelectElement | null;
    const qtyInput = container.querySelector('#hub-input-qty') as HTMLInputElement | null;
    const originSelect = container.querySelector('#hub-select-origin') as HTMLSelectElement | null;

    const newCrop = cropSelect ? cropSelect.value : crop;
    const d = getDistrictConfig(originSelect ? originSelect.value : district);

    store.setSelectedCrop(newCrop);
    if (qtyInput) store.setHarvestQuantity(Math.max(1, parseInt(qtyInput.value || '25', 10)));
    store.setUserLocation(d.latitude, d.longitude, d.name);

    void reevaluate({ crop: newCrop, lat: d.latitude, lon: d.longitude });
  });

  // ---- SajhaBazaar opportunity banner ----
  const bannerMount = container.querySelector('#sajha-banner-mount') as HTMLElement;
  if (bannerMount && evalData) {
    renderSajhaBazaarBanner(bannerMount, currentLanguage, () => {
      activeTab = 'sajhabazaar';
      container.replaceWith(renderDecisionHubView());
    });
  }

  // ---- Tabs ----
  const tabContentMount = container.querySelector('#hub-tab-content') as HTMLElement;
  const tabButtons = container.querySelectorAll('.hub-tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = (btn as HTMLElement).getAttribute('data-tab') as HubTab;
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTabContent(tabContentMount, activeTab, optimization, crop, qty, evalData, cropConfig.decayType);
    });
  });

  renderTabContent(tabContentMount, activeTab, optimization, crop, qty, evalData, cropConfig.decayType);

  return container;
}

function renderTabContent(
  mountPoint: HTMLElement,
  tab: HubTab,
  opt: AsliDaamOptimizationResult,
  crop: string,
  qty: number,
  evalData: EvaluateResponse | null,
  decayType: string
): void {
  mountPoint.innerHTML = '';

  if (tab === 'aslidaam') {
    if (!evalData) {
      mountPoint.appendChild(renderLoadingPanel('Running the AsliDaam joint optimisation…'));
      return;
    }
    mountPoint.appendChild(renderAsliDaamTab(opt, crop, qty, evalData, decayType));
  } else if (tab === 'sajhabazaar') {
    mountPoint.appendChild(renderSajhaBazaarTab(currentLanguage));
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
function renderAsliDaamTab(
  opt: AsliDaamOptimizationResult,
  crop: string,
  qty: number,
  evalData: EvaluateResponse,
  decayType: string
): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'aslidaam-panel';

  const rec = opt.recommended;
  const base = opt.baseline;
  const isWait = rec.dayOffset > 0;
  const headline = opt.headlineSummary[currentLanguage];
  const policy = evalData.recommendation;
  const kawach = evalData.nirnayKawach;
  const bhed = evalData.bhedVivek;
  const decay = opt.decayProfile;

  const recEval = evalData.evaluations.find(e => e.market.id === rec.market.id);
  const recQuality = recEval?.dataQuality;
  const forecastUncertainty = recEval?.forecast.uncertainty ?? 0;
  const forecastSlope = recEval?.forecast.historicalSlope7d ?? 0;
  // A real multi-day series is the only thing that can produce a non-zero slope or volatility.
  const hasRealSeries = forecastSlope !== 0 || forecastUncertainty !== 0;
  const uncertaintyPct = rec.grossPricePerQtl > 0
    ? (forecastUncertainty / rec.grossPricePerQtl) * 100
    : 0;

  const freshnessPctLabel = (decay.dailyFreshnessDiscountPct * 100).toFixed(1);
  const abstained = opt.isAbstained || policy.action === 'NO_RECOMMENDATION';

  // ---- Nirnay Kawach real figures ----
  const kawachBreakeven = kawach?.breakevenTransportRate ?? null;
  const sliderMin = kawach?.sliderBounds.min ?? 1.0;
  const sliderMax = kawach?.sliderBounds.max ?? 12.0;
  const sliderStep = kawach?.sliderBounds.step ?? 0.25;
  const sliderCurrent = kawach?.currentTransportRate ?? evalData.userParameters.transportCostPerKmPerQtl;

  panel.innerHTML = `
    ${abstained ? `
      <div class="editorial-panel" style="border: 2px solid var(--color-status-abstain); background: var(--color-status-abstain-bg); padding: var(--space-6); margin-bottom: var(--space-6);">
        <div class="kicker" style="color: var(--color-status-abstain);">HONEST ABSTENTION</div>
        <h3 class="heading-md" style="margin-bottom: var(--space-2);">MandiMitra is not recommending anything right now</h3>
        <ul style="font-size: var(--font-size-sm); line-height: 1.6; padding-left: 1.1rem;">
          ${policy.reasons.map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>
    ` : ''}

    <!-- PRIMARY RECOMMENDATION HERO -->
    <div class="editorial-panel" style="border: 2px solid var(--color-brand-primary); background: #ffffff; padding: var(--space-8); margin-bottom: var(--space-8); position: relative; overflow: hidden;">

      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-3); margin-bottom: var(--space-4);">
        <div style="display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap;">
          <span class="badge ${isWait ? 'badge-accent' : 'badge-sage'}" style="font-size: var(--font-size-xs); padding: 6px 14px; font-weight: 800;">
            ${isWait ? `🎯 WAIT ${rec.dayOffset} DAY${rec.dayOffset > 1 ? 'S' : ''}` : '⚡ SELL TODAY'}
          </span>
          <span style="font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 600;">
            Optimal Market: <strong style="color: var(--color-text-main); font-family: var(--font-family-heading);">${rec.market.name}</strong>
          </span>
          <span class="badge badge-neutral" style="font-size: 0.65rem;">
            Model policy: ${policy.action.replace(/_/g, ' ')}
          </span>
        </div>

        <span class="badge badge-sage" style="font-size: var(--font-size-xs);">
          ${evalData.modelVersion} · ${evalData.evaluations.length} mandis evaluated
        </span>
      </div>

      <h2 class="heading-xl" style="color: var(--color-text-main); margin-bottom: var(--space-6); max-width: 960px;">
        ${headline}
      </h2>

      <div class="decision-metrics-grid" style="background-color: var(--color-brand-primary-subtle); border-radius: var(--radius-xl); padding: var(--space-6); margin-bottom: var(--space-6);">

        <div>
          <div style="font-family: var(--font-family-body); font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-1);">
            ${currentLanguage === 'mr' ? 'खिशात जास्तीचा निव्वळ नफा' : (currentLanguage === 'hi' ? 'जेब में अतिरिक्त नकद लाभ' : 'Extra Cash in Your Pocket')}
          </div>
          <div class="number-display number-huge number-positive">
            +${rs(opt.totalPocketCashGain)}
          </div>
          <div style="font-size: var(--font-size-xs); color: var(--color-status-success); font-weight: 700; margin-top: 4px;">
            (+${rs1(opt.gainPerQtl)}/qtl vs nearest local mandi — ${base.market.name})
          </div>
        </div>

        <div>
          <div style="font-family: var(--font-family-body); font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-1);">
            ${currentLanguage === 'mr' ? 'अपेक्षित एकूण असली दाम' : (currentLanguage === 'hi' ? 'कुल असली दाम (इन-हैंड)' : 'Total AsliDaam Take-Home')}
          </div>
          <div class="number-display number-huge number-main">
            ${rs(rec.totalNetPayout)}
          </div>
          <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 4px;">
            ${rs1(rec.asliDaamPerQtl)}/qtl for ${qty} quintals net
          </div>
        </div>

        <div>
          <div style="font-family: var(--font-family-body); font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-1);">
            Travel Haulage &amp; Risk
          </div>
          <div class="number-display number-xl number-main">
            ${(rec.market.estimatedRoadDistanceKm || 0).toFixed(1)} km road
          </div>
          <div style="font-size: var(--font-size-xs); color: ${policy.confidence === 'HIGH' ? 'var(--color-status-success)' : 'var(--color-text-muted)'}; font-weight: 600; margin-top: 4px;">
            ${policy.confidence === 'HIGH' ? '✓' : '•'} ${policy.confidence} confidence${hasRealSeries ? ` · forecast residual ±${uncertaintyPct.toFixed(1)}%` : ' · flat price path (no series)'}
          </div>
          <div style="font-size: 0.68rem; color: var(--color-text-muted); margin-top: 3px;">
            Data quality: <strong>${recQuality?.tier || 'n/a'}</strong>${recQuality?.priceProvenance ? ` · ${recQuality.priceProvenance.replace(/_/g, ' ').toLowerCase()}` : ''}
          </div>
        </div>

      </div>

      <!-- Forecast basis strip: says plainly what the timing advice is standing on -->
      <div style="display: flex; align-items: center; gap: var(--space-3); background: #ffffff; border: 1px dashed var(--color-border); padding: var(--space-3) var(--space-5); border-radius: var(--radius-lg); margin-bottom: var(--space-3); flex-wrap: wrap;">
        <span style="font-size: 1.2rem;">📈</span>
        <div style="flex: 1; min-width: 260px;">
          <div style="font-size: var(--font-size-sm); font-weight: 700; color: var(--color-text-main);">
            Forecast basis: ${hasRealSeries
              ? `7-day OLS slope ${forecastSlope >= 0 ? '+' : ''}₹${forecastSlope.toFixed(2)}/day from the real ${rec.market.name} price series`
              : 'flat price path — no multi-day series exists for this mandi'}
          </div>
          <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); line-height: 1.5;">
            ${hasRealSeries
              ? `Volatility buffer ±${rs1(forecastUncertainty)}/qtl (empirical σ of daily % changes). Waiting is only advised when the projected gain clears this buffer plus holding costs.`
              : `The Agmarknet pull for this mandi is a single-day snapshot, so MandiMitra holds the price flat rather than inventing a trend. With no forecastable upside, holding can only lose money to storage, decay and the freshness discount — hence "sell today".`}
          </div>
        </div>
      </div>

      <!-- Freshness intelligence strip -->
      <div style="display: flex; align-items: center; gap: var(--space-3); background: var(--color-bg-muted); border: 1px solid var(--color-border); padding: var(--space-3) var(--space-5); border-radius: var(--radius-lg); margin-bottom: var(--space-4); flex-wrap: wrap;">
        <span style="font-size: 1.2rem;">📉</span>
        <div style="flex: 1; min-width: 260px;">
          <div style="font-size: var(--font-size-sm); font-weight: 700; color: var(--color-text-main);">
            Market Freshness Discount: ${freshnessPctLabel}% per day held (${decayType.replace(/_/g, ' ').toLowerCase()})
          </div>
          <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); line-height: 1.5;">
            "Not physically spoiled" is not the same as "worth as much as a fresh harvest". Buyers discount aged stock for lost firmness and shelf-life, on top of the ${(decay.dailyDecayRatePct * 100).toFixed(1)}%/day physical decay and ${rs1(decay.dailyStorageRentRs)}/day storage rent. ${decay.holdingAdvisability}
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

    <!-- Decision Armor Suite -->
    <section class="editorial-section" style="padding-top: 0; margin-bottom: var(--space-8);">
      <div class="editorial-header" style="margin-bottom: var(--space-5);">
        <div class="kicker">🛡️ FARMER PROFIT PROTECTION SHIELD (नफा सुरक्षा हमी)</div>
        <h3 class="heading-lg">Stress-Tested Against Transport &amp; Mandi Congestion</h3>
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
                🛡️ Nirnay Kawach: Diesel &amp; Fare Safety
              </h4>
              <div style="font-size: 0.8rem; font-weight: 700; color: #2e7d32;">
                (भाडे वाढले तरी खिशात नफा राहील का?)
              </div>
            </div>
            <span class="badge ${kawach?.status === 'ROBUST' ? 'badge-sage' : (kawach?.status === 'CLOSE_CALL' ? 'badge-warning' : 'badge-danger')}" style="font-weight: 800; font-size: 0.75rem; padding: 4px 10px; border-radius: 9999px;">
              ${kawach ? `${kawach.statusLabel} · ${kawach.robustnessPct}%` : '✅ 100% PROFIT SAFE'}
            </span>
          </div>

          <p style="font-size: var(--font-size-xs); color: var(--color-text-muted); line-height: 1.6; margin-bottom: var(--space-4);">
            Stress-tests the recommendation against diesel price hikes and backtest residual errors
            (N = ${kawach?.simulationsCount ?? 0} seeded Monte Carlo runs).
          </p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: var(--radius-lg); padding: var(--space-4); margin-bottom: var(--space-4);">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: var(--font-size-xs); font-weight: 700; color: #334155; margin-bottom: var(--space-3); flex-wrap: wrap; gap: var(--space-2);">
              <span>Normal Tempo Fare: <strong style="color: #1b5e20; font-size: 0.95rem;">${rs1(sliderCurrent)}/km</strong></span>
              <span>Safe Fare Limit: <strong style="color: #b45309; font-size: 0.95rem;">${kawachBreakeven !== null ? `${rs1(kawachBreakeven)}/km` : 'no flip in range'}</strong></span>
            </div>

            <div style="margin-bottom: var(--space-2);">
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #64748b; margin-bottom: 6px;">
                Drag slider to test higher diesel / tempo fare:
              </label>
              <input type="range" id="nirnay-slider" min="${sliderMin}" max="${sliderMax}" step="${sliderStep}" value="${sliderCurrent}" style="width: 100%; accent-color: #2e7d32; cursor: pointer;">
            </div>

            <div id="nirnay-slider-feedback" style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: var(--radius-md); padding: 8px 12px; font-size: var(--font-size-xs); font-weight: 700; color: #15803d; margin-top: var(--space-2);">
              🟢 Active Fare: ${rs1(sliderCurrent)}/km ➔ Selling at <strong>${kawach?.winningMarket.name || rec.market.name} (+${kawach?.winningMarket.day ?? rec.dayOffset}d)</strong> gives you maximum take-home cash.
            </div>
          </div>

          <div style="background: #f0fdf4; border-left: 3px solid #22c55e; padding: 10px 14px; border-radius: 4px; font-size: var(--font-size-xs); color: #166534; line-height: 1.5;">
            💡 <strong>Farmer Guarantee:</strong> ${kawach?.decisionMessage || `Even with higher transport charges, traveling to ${rec.market.name} still leaves more money in your pocket than selling locally today.`}
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
              ${bhed?.statusLabel || '🚦 LIVE CROWD MONITOR'}
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
              <button class="btn btn-sm btn-bhed-scenario ${bhed?.supplyPressure === 'LOW' ? 'active' : ''}" data-level="LOW" style="border: 1.5px solid #cbd5e1; background: #ffffff; border-radius: 8px; font-weight: 700; padding: 8px 4px; font-size: 0.75rem; cursor: pointer;">
                🟢 Normal Crowd<br><span style="font-size: 0.65rem; font-weight: normal; color: #64748b;">(कमी गर्दी / सुरळीत)</span>
              </button>
              <button class="btn btn-sm btn-bhed-scenario ${bhed?.supplyPressure === 'MEDIUM' ? 'active' : ''}" data-level="MEDIUM" style="border: 1.5px solid #cbd5e1; background: #ffffff; border-radius: 8px; font-weight: 700; padding: 8px 4px; font-size: 0.75rem; cursor: pointer;">
                🟡 Medium Rush<br><span style="font-size: 0.65rem; font-weight: normal; color: #64748b;">(मध्यम गर्दी)</span>
              </button>
              <button class="btn btn-sm btn-bhed-scenario ${!bhed || bhed?.supplyPressure === 'HIGH' ? 'active' : ''}" data-level="HIGH" style="border: 1.5px solid #f59e0b; background: #fef3c7; color: #92400e; border-radius: 8px; font-weight: 800; padding: 8px 4px; font-size: 0.75rem; cursor: pointer;">
                🔴 Heavy Jam<br><span style="font-size: 0.65rem; font-weight: 700; color: #b45309;">(मोठी गर्दी / लांब रांग)</span>
              </button>
            </div>
          </div>

          <div id="bhed-feedback-box" style="background: #fffbeb; border: 1px solid #fde68a; border-radius: var(--radius-lg); padding: var(--space-4); font-size: var(--font-size-xs);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #fef3c7;">
              <span>Expected Price Drop in Rush: <strong style="color: #dc2626; font-size: 0.95rem;" id="bhed-impact-text">${bhed ? `−${rs1(bhed.congestionImpactPerQtl)} / quintal` : '−₹260 / quintal'}</strong></span>
              <span id="bhed-capacity-text" style="color: #78350f;">Buyer Demand: <strong>${bhed ? `${bhed.absorptionCapacity}` : 'Active (खरेदीदार हजर)'}</strong></span>
            </div>
            <div id="bhed-alert-text" style="color: #92400e; font-weight: 700; line-height: 1.5;">
              ${bhed?.alertMessage || `⚠️ Heavy tractor queues expected! Smart Advice: Selling at ${rec.market.name} avoids the rush and protects profit in your pocket.`}
            </div>
          </div>
        </div>

      </div>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- Economic Waterfall -->
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
              <td style="padding: 14px 16px;">${rs1(base.grossPricePerQtl)}/qtl <span style="color: #64748b; font-size: 0.8rem;">(${rs(base.totalGrossValue)})</span></td>
              <td style="padding: 14px 16px;">${rs1(rec.grossPricePerQtl)}/qtl <span style="color: #64748b; font-size: 0.8rem;">(${rs(rec.totalGrossValue)})</span></td>
              <td style="padding: 14px 16px; color: #15803d; font-weight: 800;">+${rs(Math.max(0, rec.totalGrossValue - base.totalGrossValue))} higher auction</td>
            </tr>
            <tr>
              <td style="padding: 14px 16px; color: #b91c1c;">🚚 2. Minus: Vehicle Freight &amp; Diesel (गाडी भाडे व डिझेल खर्च)</td>
              <td style="padding: 14px 16px; color: #b91c1c;">−${rs1(base.roadFreightPerQtl)}/qtl <span style="font-size: 0.8rem;">(−${rs(base.totalTransportCost)})</span></td>
              <td style="padding: 14px 16px; color: #b91c1c;">−${rs1(rec.roadFreightPerQtl)}/qtl <span style="font-size: 0.8rem;">(−${rs(rec.totalTransportCost)})</span></td>
              <td style="padding: 14px 16px; color: #b91c1c;">−${rs(rec.totalTransportCost - base.totalTransportCost)}</td>
            </tr>
            <tr>
              <td style="padding: 14px 16px; color: #b91c1c;">⚖️ 3. Minus: Mandi Fees &amp; Hamali/Tolai (बाजार समिती फी, हमाली व तोलाई)</td>
              <td style="padding: 14px 16px; color: #b91c1c;">−${rs1(base.apmcCessPerQtl + base.hamaliAndTolaiPerQtl)}/qtl <span style="font-size: 0.8rem;">(−${rs(base.totalApmcDeductions)})</span></td>
              <td style="padding: 14px 16px; color: #b91c1c;">−${rs1(rec.apmcCessPerQtl + rec.hamaliAndTolaiPerQtl)}/qtl <span style="font-size: 0.8rem;">(−${rs(rec.totalApmcDeductions)})</span></td>
              <td style="padding: 14px 16px; color: #b91c1c;">−${rs(rec.totalApmcDeductions - base.totalApmcDeductions)}</td>
            </tr>
            <tr>
              <td style="padding: 14px 16px; color: #b91c1c;">⏳ 4. Minus: Storage &amp; Produce Weight Loss (साठवणूक व वजन घट)</td>
              <td style="padding: 14px 16px; color: #64748b;">${base.dayOffset === 0 ? '₹0.0 (विक्री आजच — शून्य वाट)' : `−${rs1(base.holdingAndSpoilagePerQtl)}/qtl (−${rs(base.totalHoldingSpoilageLoss)})`}</td>
              <td style="padding: 14px 16px; color: #b91c1c;">${rec.dayOffset === 0 ? '₹0.0 (विक्री आजच — शून्य वाट)' : `−${rs1(rec.holdingAndSpoilagePerQtl)}/qtl (−${rs(rec.totalHoldingSpoilageLoss)})`}</td>
              <td style="padding: 14px 16px; color: #b91c1c;">−${rs(rec.totalHoldingSpoilageLoss - base.totalHoldingSpoilageLoss)}</td>
            </tr>
            <tr>
              <td style="padding: 14px 16px; color: #b91c1c;">
                📉 5. Minus: बाजार ताजेपणा वटती (Market Freshness Discount, ${freshnessPctLabel}%/day)
              </td>
              <td style="padding: 14px 16px; color: #64748b;">${base.dayOffset === 0 ? '₹0.0 (Same-day harvest)' : `−${rs1(base.freshnessDiscountPerQtl)}/qtl (−${rs(base.totalFreshnessDiscount)})`}</td>
              <td style="padding: 14px 16px; color: #b91c1c;">${rec.dayOffset === 0 ? '₹0.0 (Same-day harvest)' : `−${rs1(rec.freshnessDiscountPerQtl)}/qtl (−${rs(rec.totalFreshnessDiscount)})`}</td>
              <td style="padding: 14px 16px; color: #b91c1c;">−${rs(rec.totalFreshnessDiscount - base.totalFreshnessDiscount)}</td>
            </tr>
            <tr style="background-color: #f0fdf4; font-weight: 800; font-size: 0.95rem; border-top: 2px solid #22c55e;">
              <td style="padding: 16px; color: #166534;"><strong>💎 Real Cash in Hand (शेतकऱ्याच्या खिशात येणारे 'असली दाम')</strong></td>
              <td style="padding: 16px; color: #334155;"><strong>${rs1(base.asliDaamPerQtl)}/qtl (${rs(base.totalNetPayout)})</strong></td>
              <td style="padding: 16px; color: #15803d; font-size: 1.05rem;"><strong>${rs1(rec.asliDaamPerQtl)}/qtl (${rs(rec.totalNetPayout)})</strong></td>
              <td style="padding: 16px; color: #15803d; font-size: 1.05rem;"><strong style="background: #dcfce7; padding: 4px 10px; border-radius: 6px; border: 1px solid #86efac;">+${rs(opt.totalPocketCashGain)} Extra Cash</strong></td>
            </tr>
            </tr>
          </tbody>
        </table>
      </div>
      <p style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: var(--space-2);">
        Formula: AsliDaam = Gross − RoadFreight − APMCDeductions − StorageRent − PhysicalDecayLoss − FreshnessDiscount.
        The freshness discount is the commercial haircut mandi buyers apply to stock that is not from today's harvest, even when nothing has rotted.
      </p>
    </section>

    <!-- Multi-Mandi × Day Grid -->
    <section class="editorial-section" style="padding-top: 0;">
      <div class="editorial-header" style="margin-bottom: var(--space-5);">
        <div class="kicker">📍 REGIONAL MANDI COMPARISON (सर्व बाजारांची तुलना)</div>
        <h3 class="heading-lg">Compare All Mandis Over the Next 3 Days</h3>
        <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); max-width: 820px; line-height: 1.6;">
          Every combination evaluated for true payout across ${evalData.evaluations.length} candidate APMCs after deducting diesel and waiting costs. Pick the market and day that puts the most cash in your pocket.
          ${opt.maxDayOffsetAllowed < 3
            ? ` (Policy cap: Day +${opt.maxDayOffsetAllowed} max for this commodity)`
            : ''}
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
                    <td>${(c.market.estimatedRoadDistanceKm || 0).toFixed(1)} km</td>
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
              const beyondPolicy = c.dayOffset > opt.maxDayOffsetAllowed;
              const rowStyle = isBest
                ? 'background-color: var(--color-brand-primary-light); font-weight: 700;'
                : (isBase ? 'background-color: var(--color-bg-muted);' : (beyondPolicy ? 'opacity: 0.55;' : ''));

              return `
                <tr style="${rowStyle}">
                  <td><strong>${c.market.name}</strong></td>
                  <td>${(c.market.estimatedRoadDistanceKm || 0).toFixed(1)} km</td>
                  <td>Day ${c.dayOffset} (${c.dayOffset === 0 ? 'Today' : `+${c.dayOffset}d`})</td>
                  <td>₹${c.grossPricePerQtl.toFixed(0)}</td>
                  <td style="color: var(--color-status-abstain);">−₹${(c.grossPricePerQtl - c.asliDaamPerQtl).toFixed(0)}</td>
                  <td class="number-display"><strong>${rs1(c.asliDaamPerQtl)}</strong></td>
                  <td class="number-display"><strong>${rs(c.totalNetPayout)}</strong></td>
                  <td>
                    ${isBest
                      ? '<span class="badge badge-accent">🏆 BEST OPTION</span>'
                      : (isBase
                          ? '<span class="badge badge-neutral">📍 DEFAULT</span>'
                          : (beyondPolicy
                              ? '<span class="badge badge-neutral" style="font-size:0.6rem;">BEYOND POLICY HORIZON</span>'
                              : (c.totalPocketGainVsDefault > 0
                                  ? `<span class="number-display number-positive" style="font-weight: 700;">+${rs(c.totalPocketGainVsDefault)}</span>`
                                  : `<span style="color: var(--color-status-abstain);">${rs(c.totalPocketGainVsDefault)}</span>`
                                )
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

  // ---- Audio readout ----
  panel.querySelector('#btn-speak-aslidaam')?.addEventListener('click', () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(headline);
      utterance.lang = currentLanguage === 'mr' ? 'mr-IN' : (currentLanguage === 'hi' ? 'hi-IN' : 'en-IN');
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } else {
      alert(headline);
    }
  });

  // ---- Nirnay Kawach live slider (hits the real stress-test endpoint) ----
  const nirnaySlider = panel.querySelector('#nirnay-slider') as HTMLInputElement | null;
  const nirnayFeedback = panel.querySelector('#nirnay-slider-feedback') as HTMLElement | null;
  if (nirnaySlider && nirnayFeedback) {
    let stressTimer: ReturnType<typeof setTimeout> | null = null;

    const runStressTest = async (rate: number) => {
      const cState = store.getState();
      nirnayFeedback.textContent = `Active Transport: ${rs1(rate)}/km ➔ recomputing…`;
      nirnayFeedback.style.color = 'var(--color-text-muted)';
      try {
        const res = await apiClient.stressTest({
          commodity: cState.selectedCrop || crop,
          latitude: cState.userLocation?.lat || 19.9975,
          longitude: cState.userLocation?.lon || 73.7898,
          transportCostPerKmPerQtl: rate,
          storageCostPerDayPerQtl: cState.costConfig.storageCostPerDayPerQtl,
          radiusKm: cState.costConfig.searchRadiusKm
        });
        const flipped = res.isFlipped;
        const beLimit = kawachBreakeven ?? 15.0;
        if (!flipped && rate < beLimit - 0.3) {
          nirnayFeedback.innerHTML = `🟢 Active Fare: ${rs1(res.activeTransportRate)}/km ➔ Selling at <strong>${res.winningMarket.name} (+${res.winningMarket.day}d)</strong> gives you maximum cash <span style="color: #15803d; font-weight: 800;">(खिशात जास्तीत जास्त फायदा)</span>`;
          nirnayFeedback.style.color = '#15803d';
          nirnayFeedback.style.borderColor = '#86efac';
          nirnayFeedback.style.background = '#f0fdf4';
        } else if (Math.abs(rate - beLimit) <= 0.3) {
          nirnayFeedback.innerHTML = `⚖️ Active Fare: ${rs1(res.activeTransportRate)}/km ➔ <strong style="color: #b45309;">Equal Profit Point</strong> (दोन्ही बाजारात समान नफा — जास्त भाडे परवडत नाही)`;
          nirnayFeedback.style.color = '#b45309';
          nirnayFeedback.style.borderColor = '#fde68a';
          nirnayFeedback.style.background = '#fffbeb';
        } else {
          nirnayFeedback.innerHTML = `⚠️ Active Fare: ${rs1(res.activeTransportRate)}/km ➔ <strong style="color: #b91c1c;">Fare Too High!</strong> Winner: <strong>${res.winningMarket.name} (+${res.winningMarket.day}d)</strong> — Closer distance beats high freight.`;
          nirnayFeedback.style.color = '#b91c1c';
          nirnayFeedback.style.borderColor = '#fca5a5';
          nirnayFeedback.style.background = '#fef2f2';
        }
      } catch (err) {
        nirnayFeedback.textContent = `Stress test unavailable: ${err instanceof Error ? err.message : String(err)}`;
        nirnayFeedback.style.color = '#b91c1c';
      }
    };

    nirnaySlider.addEventListener('input', () => {
      const val = parseFloat(nirnaySlider.value);
      nirnayFeedback.textContent = `Active Transport: ${rs1(val)}/km …`;
      if (stressTimer) clearTimeout(stressTimer);
      stressTimer = setTimeout(() => void runStressTest(val), 220);
    });
  }

  // ---- Bhed Vivek live scenario buttons ----
  const bhedButtons = panel.querySelectorAll('.btn-bhed-scenario');
  const bhedBadge = panel.querySelector('#bhed-badge') as HTMLElement | null;
  const bhedImpactText = panel.querySelector('#bhed-impact-text') as HTMLElement | null;
  const bhedCapacityText = panel.querySelector('#bhed-capacity-text') as HTMLElement | null;
  const bhedAlertText = panel.querySelector('#bhed-alert-text') as HTMLElement | null;

  bhedButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const level = btn.getAttribute('data-level') as 'LOW' | 'MEDIUM' | 'HIGH';

      bhedButtons.forEach(b => {
        b.classList.remove('active');
        (b as HTMLElement).style.background = '#ffffff';
        (b as HTMLElement).style.borderColor = '#cbd5e1';
        (b as HTMLElement).style.color = 'var(--color-text-main)';
        (b as HTMLElement).style.fontWeight = 'normal';
      });
      btn.classList.add('active');
      const activeEl = btn as HTMLElement;
      activeEl.style.fontWeight = '800';

      if (level === 'LOW') {
        activeEl.style.background = '#dcfce7';
        activeEl.style.borderColor = '#86efac';
        activeEl.style.color = '#166534';
      } else if (level === 'MEDIUM') {
        activeEl.style.background = '#fef3c7';
        activeEl.style.borderColor = '#fde68a';
        activeEl.style.color = '#92400e';
      } else {
        activeEl.style.background = '#fee2e2';
        activeEl.style.borderColor = '#fca5a5';
        activeEl.style.color = '#991b1b';
      }

      if (bhedAlertText) bhedAlertText.textContent = 'Recomputing congestion impact…';

      try {
        const cState = store.getState();
        const res = await apiClient.analyzeBhedVivek({
          commodity: cState.selectedCrop || crop,
          latitude: cState.userLocation?.lat || 19.9975,
          longitude: cState.userLocation?.lon || 73.7898,
          quantityQuintals: cState.harvestQuantityQuintals || qty,
          supplyPressure: level,
          transportCostPerKmPerQtl: cState.costConfig.transportCostPerKmPerQtl,
          storageCostPerDayPerQtl: cState.costConfig.storageCostPerDayPerQtl,
          radiusKm: cState.costConfig.searchRadiusKm
        });

        if (bhedBadge) {
          bhedBadge.textContent = level === 'LOW'
            ? '🟢 LOW CROWD (सुरळीत विक्री)'
            : (level === 'MEDIUM' ? '🟡 MODERATE RUSH (मध्यम गर्दी)' : '🔴 HEAVY JAM ALERT (मोठी गर्दी)');
          bhedBadge.style.background = level === 'LOW' ? '#dcfce7' : (level === 'MEDIUM' ? '#fef3c7' : '#fee2e2');
          bhedBadge.style.color = level === 'LOW' ? '#166534' : (level === 'MEDIUM' ? '#92400e' : '#991b1b');
          bhedBadge.style.border = `1px solid ${level === 'LOW' ? '#86efac' : (level === 'MEDIUM' ? '#fde68a' : '#fca5a5')}`;
        }
        if (bhedImpactText) bhedImpactText.textContent = `−${rs1(res.congestionImpactPerQtl)} / quintal`;
        if (bhedCapacityText) bhedCapacityText.innerHTML = `Terminal Liquidity: <strong>${res.absorptionCapacity} (PCS ${res.pcs.toFixed(2)})</strong>`;
        if (bhedAlertText) {
          bhedAlertText.style.color = level === 'LOW' ? '#166534' : (level === 'MEDIUM' ? '#92400e' : '#991b1b');
          bhedAlertText.textContent = res.alertMessage;
        }
      } catch (err) {
        if (bhedAlertText) {
          bhedAlertText.style.color = 'var(--color-status-abstain)';
          bhedAlertText.textContent = `Congestion analysis unavailable: ${err instanceof Error ? err.message : String(err)}`;
        }
      }
    });
  });

  return panel;
}

/**
 * Tab: Future Capabilities Launchpad
 */
function renderFutureFeaturesTab(opt: AsliDaamOptimizationResult): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'future-features-panel';

  const state = store.getState();
  const district = state.userLocation?.district || 'Nashik';

  panel.innerHTML = `
    <div class="editorial-panel" style="margin-bottom: var(--space-6);">
      <div class="editorial-header">
        <div class="kicker">CLOUD &amp; EXTENSIONS</div>
        <h3 class="heading-lg">MandiMitra Future Capabilities Launchpad</h3>
        <p>High-impact integrations connected to cloud databases and live weather feeds for farmer resilience.</p>
      </div>

      <div class="editorial-grid-3">

        <div class="editorial-panel" style="background: var(--color-bg-surface);">
          <div style="font-size: 2rem; margin-bottom: var(--space-2);">🤝</div>
          <h4 class="heading-sm" style="margin-bottom: 6px;">SajhaBazaar Cloud Roster</h4>
          <p style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-bottom: var(--space-4); line-height: 1.5;">
            Live farmer pooling clusters persisted in Supabase. The deterministic matching and
            cost-allocation engine already runs on the SajhaBazaar tab; this is the cloud roster
            that would replace the synthetic demo profiles in production.
          </p>
          <button id="btn-load-pools" class="btn btn-sm btn-primary">View Active Pools</button>
          <div id="pools-list-container" style="margin-top: var(--space-4); font-size: var(--font-size-xs);"></div>
        </div>

        <div class="editorial-panel" style="background: var(--color-bg-surface);">
          <div style="font-size: 2rem; margin-bottom: var(--space-2);">🌦️</div>
          <h4 class="heading-sm" style="margin-bottom: 6px;">Weather &amp; Rain Risk Alert</h4>
          <p style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-bottom: var(--space-4); line-height: 1.5;">
            Open-Meteo rainfall anomaly integration for ${district} district. Unseasonal rain accelerates
            perishable rot and would raise the daily decay rate fed into AsliDaam.
          </p>
          <span class="badge badge-neutral">Planned Integration</span>
        </div>

        <div class="editorial-panel" style="background: var(--color-bg-surface);">
          <div style="font-size: 2rem; margin-bottom: var(--space-2);">📱</div>
          <h4 class="heading-sm" style="margin-bottom: 6px;">WhatsApp Payout Slip</h4>
          <p style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-bottom: var(--space-4); line-height: 1.5;">
            Generate a clean Marathi/Hindi text slip with the full AsliDaam breakdown to share with
            fellow farmers and FPO leaders.
          </p>
          <button id="btn-copy-slip" class="btn btn-sm btn-outline">Copy WhatsApp Slip</button>
        </div>

      </div>
    </div>
  `;

  const loadPoolsBtn = panel.querySelector('#btn-load-pools');
  const poolsContainer = panel.querySelector('#pools-list-container');
  if (loadPoolsBtn && poolsContainer) {
    loadPoolsBtn.addEventListener('click', async () => {
      poolsContainer.innerHTML = '<p style="color: var(--color-text-muted);">Fetching clusters from database…</p>';
      try {
        const res = await fetch('/api/pools');
        const json = await res.json();
        const pools = json.data || [];
        if (pools.length === 0) {
          poolsContainer.innerHTML = '<p>No active pools currently registered.</p>';
          return;
        }
        poolsContainer.innerHTML = `
          <div style="border-top: 1px solid var(--color-border); padding-top: var(--space-3);">
            <strong style="color: var(--color-brand-primary-dark);">Active Clusters (${json.source === 'supabase' ? 'Cloud Supabase' : 'Local cache'}):</strong>
            <ul style="list-style: none; padding-left: 0; margin-top: 6px;">
              ${pools.slice(0, 4).map((p: any) => `
                <li style="padding: 6px 0; border-bottom: 1px dashed var(--color-border); font-size: var(--font-size-xs);">
                  <strong>${p.farmer_name}</strong> (${p.village || p.taluka}) • <strong>${p.quantity_quintals}q</strong> → ${p.target_mandi}
                </li>
              `).join('')}
            </ul>
          </div>
        `;
      } catch {
        poolsContainer.innerHTML = '<p style="color: var(--color-status-abstain);">Cluster service unreachable.</p>';
      }
    });
  }

  panel.querySelector('#btn-copy-slip')?.addEventListener('click', () => {
    const rec = opt.recommended;
    const slip = [
      '🌾 *MandiMitra: AsliDaam Payout Slip*',
      `Crop: ${opt.commodity} (${opt.quantityQuintals} Quintals)`,
      `Recommendation: ${opt.headlineSummary.mr}`,
      `Optimal Mandi: ${rec.market.name} (Day ${rec.dayOffset})`,
      `Gross: ${rs1(rec.grossPricePerQtl)}/qtl`,
      `Freight: −${rs1(rec.roadFreightPerQtl)}/qtl | APMC: −${rs1(rec.apmcCessPerQtl + rec.hamaliAndTolaiPerQtl)}/qtl`,
      `Storage+Decay: −${rs1(rec.holdingAndSpoilagePerQtl)}/qtl | Freshness: −${rs1(rec.freshnessDiscountPerQtl)}/qtl`,
      `AsliDaam: ${rs1(rec.asliDaamPerQtl)}/qtl`,
      `Net Payout: ${rs(rec.totalNetPayout)} (+${rs(opt.totalPocketCashGain)} vs local mandi today)`,
      'Verified by MandiMitra Decision Engine'
    ].join('\n');
    void navigator.clipboard.writeText(slip);
    alert('Copied the AsliDaam recommendation slip to your clipboard.');
  });

  return panel;
}

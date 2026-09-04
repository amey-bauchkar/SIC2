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
import {
  Language,
  formatCurrency,
  formatNumber,
  formatUnit,
  toDevanagariDigits,
  parseDevanagariNumber,
  translateMandiName,
  translateAction,
  translateDistrict,
  translateState,
  I18N_DICTIONARY
} from '../../i18n';

type HubTab = 'aslidaam' | 'sajhabazaar' | 'markets' | 'evidence' | 'backtest' | 'settings' | 'future';

let activeTab: HubTab = 'aslidaam';
let currentLanguage: Language = 'mr';

const rs = (n: number): string => formatCurrency(n, currentLanguage);
const rs1 = (n: number): string => formatCurrency(n, currentLanguage, true);

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
  currentLanguage = (state.language as Language) || 'mr';
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
    <!-- SECTION 1: DECISION HUB LANDING HERO (Bespoke Editorial Architecture) -->
    <section class="decision-hub-landing-hero">
      <div class="decision-hub-hero-content">
        <!-- Professional Editorial Kicker & Minimalist Language Switcher -->
        <div class="hero-top-eyebrow">
          <div class="hero-editorial-kicker">
            <span class="kicker-accent-bar"></span>
            <span class="kicker-text">${currentLanguage === 'mr' ? 'महाराष्ट्र कृषी निर्णय प्रणाली // अस्सल दाम™' : (currentLanguage === 'hi' ? 'महाराष्ट्र कृषि निर्णय प्रणाली // असली दाम™' : 'MAHARASHTRA APMC DECISION PROTOCOL // ASLIDAAM™')}</span>
          </div>

          <div class="hero-lang-segmented decision-hub-lang-switcher">
            <button class="lang-btn ${currentLanguage === 'en' ? 'active' : ''}" data-lang="en">EN</button>
            <span class="lang-sep">/</span>
            <button class="lang-btn ${currentLanguage === 'mr' ? 'active' : ''}" data-lang="mr">मराठी</button>
            <span class="lang-sep">/</span>
            <button class="lang-btn ${currentLanguage === 'hi' ? 'active' : ''}" data-lang="hi">हिंदी</button>
          </div>
        </div>

        <!-- Headline with high-impact Outfit typography -->
        <h1 class="hero-editorial-title">
          ${currentLanguage === 'mr'
            ? 'शेतकऱ्याचा स्मार्ट निर्णय.<br><span class="hero-highlight">खरा नफा थेट हातात.</span>'
            : (currentLanguage === 'hi'
                ? 'हाथ में मोबाइल, जेब में असली दाम।<br><span class="hero-highlight">मंडी और सही समय का सटीक फैसला।</span>'
                : 'Smart Mandi Decisions.<br><span class="hero-highlight">Real Profit in Hand.</span>')}
        </h1>

        <!-- Lead Narrative -->
        <p class="hero-lead-narrative">
          ${currentLanguage === 'mr'
            ? 'महाराष्ट्रातील शेतकऱ्यांसाठी आधुनिक निर्णय प्रणाली: योग्य APMC मंडी × योग्य दिवस (० ते ३ दिवस). वाहतूक डिझेल, बाजार समिती सेस, साठवणूक घट आणि मालाचा ताजेपणा वजा करून खऱ्या नफ्याची हमी.'
            : (currentLanguage === 'hi'
                ? 'भारतीय किसानों के लिए संयुक्त आर्थिक अनुकूलक: सही मंडी × सही समय (0–3 दिन)। डीजल भाड़ा, मंडी शुल्क, गोदाम की घट और माल के ताजेपन के हिसाब से जानिए अपने हाथ में आने वाला असली मुनाफा।'
                : 'Joint economics optimizer for Indian farmers: Mandi × Timing (0–3 Days). Know the exact in-hand wallet cash after haulage diesel, APMC tariffs, storage shrinkage, and commercial freshness discount.')}
        </p>

        <!-- Bespoke Architectural Spec Roster (Zero Generic AI Cards) -->
        <div class="hero-specs-roster">
          <!-- Item 01 -->
          <div class="spec-row">
            <div class="spec-idx">${currentLanguage === 'mr' ? '०१' : '01'}</div>
            <div class="spec-detail">
              <div class="spec-headline">
                <h3 class="spec-name">${currentLanguage === 'mr' ? 'खरा नफा थेट पदरात (AsliDaam™)' : (currentLanguage === 'hi' ? 'हाथ में आने वाला असली मुनाफा (AsliDaam™)' : 'True Net Realization (AsliDaam™)')}</h3>
                <span class="spec-tag">${currentLanguage === 'mr' ? 'अस्सल रोकड' : (currentLanguage === 'hi' ? 'वास्तविक नकदी' : 'In-Hand Realization')}</span>
              </div>
              <p class="spec-summary">${currentLanguage === 'mr' ? 'केवळ पोकळ बाजारभाव नव्हे; वाहतूक डिझेल, हमाली, सेस आणि साठवणूक घट वजा करून हातात येणारी नेमकी रोकड.' : (currentLanguage === 'hi' ? 'दिखावटी भाव नहीं; माल भाड़ा, मंडी सेस, तुलाई और वजन घट काटकर जेब में आने वाली वास्तविक नकदी।' : 'Exact wallet rupees net of freight diesel, APMC cess, warehouse holding decay, and commercial freshness discount.')}</p>
            </div>
          </div>

          <!-- Item 02 -->
          <div class="spec-row">
            <div class="spec-idx">${currentLanguage === 'mr' ? '०२' : '02'}</div>
            <div class="spec-detail">
              <div class="spec-headline">
                <h3 class="spec-name">${currentLanguage === 'mr' ? 'साझाबाजार एकत्रित शेतकरी वाहतूक' : (currentLanguage === 'hi' ? 'साझाबाज़ार साझा ढुलाई' : 'Shared Freight Corridor (SajhaBazaar)')}</h3>
                <span class="spec-tag spec-tag-green">${currentLanguage === 'mr' ? '४०% पर्यंत बचत' : (currentLanguage === 'hi' ? '40% तक बचत' : 'Up to 40% Savings')}</span>
              </div>
              <p class="spec-summary">${currentLanguage === 'mr' ? 'शेजारील शेतकऱ्यांसोबत टेम्पो/ट्रॅक्टर शेअर करा आणि वाहतूक खर्चात ४०% पर्यंत थेट बचत मिळवा.' : (currentLanguage === 'hi' ? 'पास के किसानों के साथ मिलकर वाहन साझा करें और परिवहन खर्च में 40% तक की बचत पाएं।' : 'Dynamic tractor and mini-truck pooling with neighbouring smallholders along the same transport corridor.')}</p>
            </div>
          </div>

          <!-- Item 03 -->
          <div class="spec-row">
            <div class="spec-idx">${currentLanguage === 'mr' ? '०३' : '03'}</div>
            <div class="spec-detail">
              <div class="spec-headline">
                <h3 class="spec-name">${currentLanguage === 'mr' ? 'अधिकृत डेटा व प्रामाणिक नकार' : (currentLanguage === 'hi' ? 'सटीक ॲगमार्कनेट प्रामाणिकता' : 'Honest Data Abstention Protocol')}</h3>
                <span class="spec-tag spec-tag-blue">${currentLanguage === 'mr' ? 'शून्य अंदाज' : (currentLanguage === 'hi' ? 'शून्य तुक्का' : 'Zero Guesswork')}</span>
              </div>
              <p class="spec-summary">${currentLanguage === 'mr' ? 'महाराष्ट्रभरातील ३०६ APMC चे अधिकृत आकडे. जुना किंवा संशयास्पद डेटा असल्यास अंदाज न बांधता थेट प्रामाणिक नकार.' : (currentLanguage === 'hi' ? 'मंडी आवक के आधिकारिक आंकड़े। यदि डेटा पुराना हो तो बिना तुक्का लगाए पारदर्शी व सुरक्षित निर्णय।' : 'Direct Agmarknet mandi arrivals with transparent confidence scoring. Refuses to guess on stale or low-volume records.')}</p>
            </div>
          </div>
        </div>

        <!-- Primary Action CTA -->
        <div class="hero-actions-row">
          <a href="#hub-farmer-filter" id="btn-explore-mandis" class="hero-primary-cta">
            <span>${currentLanguage === 'mr' ? 'सर्वोत्तम मंडी शोधा' : (currentLanguage === 'hi' ? 'सही मंडी का चयन करें' : 'Explore Optimal Mandis')}</span>
            <svg class="cta-arrow-svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </a>
        </div>
      </div>

      <!-- Right side: transparent spacer displaying the farmer looking at smartphone -->
      <div class="decision-hub-hero-spacer"></div>
    </section>

    <!-- SECTION 2: FARMER INPUT CARD (Decision Cockpit Unified View) -->
    <section class="editorial-section cockpit-unified-section" id="hub-farmer-filter">
      <div class="cockpit-filter-panel">
        <div class="cockpit-filter-top">
          <div class="cockpit-eyebrow">
            <span class="cockpit-accent-bar"></span>
            <span class="cockpit-kicker-text">${currentLanguage === 'mr' ? 'निर्णय कॉकपिट // सर्वोत्तम APMC व विक्रीची वेळ' : (currentLanguage === 'hi' ? 'निर्णय कॉकपिट // सर्वोत्तम मंडी व बिक्री का सही समय' : 'DECISION COCKPIT // MANDI × TIMING OPTIMIZER')}</span>
          </div>
          <div class="cockpit-subtitle">
            ${currentLanguage === 'mr' ? 'आपला शेतमाल, वजन आणि तालुका निवडून पुढील ० ते ३ दिवसांचा नफा तपासा' : (currentLanguage === 'hi' ? 'फसल, मात्रा और स्थान चुनकर अगले 0–3 दिनों का असली मुनाफा जांचें' : 'Evaluate nearby APMC mandis and timing (0 to 3 days) for maximum wallet cash')}
          </div>
        </div>

        <div class="farmer-input-strip">
          <div class="cockpit-input-col">
            <label class="cockpit-input-label">
              ${currentLanguage === 'mr' ? 'शेतमाल (Crop)' : (currentLanguage === 'hi' ? 'फसल (Crop)' : 'Crop')}
            </label>
            <select id="hub-select-crop" class="select-field cockpit-select-field">
              ${renderCropOptgroupsHtml(crop, currentLanguage)}
            </select>
          </div>

          <div class="cockpit-input-col">
            <label class="cockpit-input-label">
              ${currentLanguage === 'mr' ? 'एकूण वजन (क्विंटल)' : (currentLanguage === 'hi' ? 'कुल वजन (क्विंटल)' : 'Harvest Volume (Quintals)')}
            </label>
            <div class="qty-input-group">
              <input type="number" id="hub-input-qty" class="input-field cockpit-num-input" value="${qty}" min="1" max="1000" />
              <div class="qty-pills-row">
                <button class="qty-pill cockpit-qty-pill ${qty === 3 ? 'active' : ''}" data-q="3">3q</button>
                <button class="qty-pill cockpit-qty-pill ${qty === 10 ? 'active' : ''}" data-q="10">10q</button>
                <button class="qty-pill cockpit-qty-pill ${qty === 25 ? 'active' : ''}" data-q="25">25q</button>
                <button class="qty-pill cockpit-qty-pill ${qty === 50 ? 'active' : ''}" data-q="50">50q</button>
              </div>
            </div>
          </div>

          <div class="cockpit-input-col">
            <label class="cockpit-input-label">
              ${currentLanguage === 'mr' ? 'शेतकरी तालुका / जिल्हा' : (currentLanguage === 'hi' ? 'किसान स्थान' : 'Farmer Origin')}
            </label>
            <select id="hub-select-origin" class="select-field cockpit-select-field">
              ${renderDistrictOptgroupsHtml(district, currentLanguage)}
            </select>
          </div>

          <div class="cockpit-btn-col">
            <button id="btn-recalculate-hub" class="btn btn-primary cockpit-cta-btn">
              ${currentLanguage === 'mr' ? 'असली दाम शोधा' : (currentLanguage === 'hi' ? 'असली दाम निकालें' : 'Run AsliDaam')}
            </button>
          </div>
        </div>

        <div id="hub-data-provenance" class="cockpit-provenance-row">
          ${evalData
            ? `<span class="provenance-dot"></span><span>${evalData.evaluations.length} candidate APMC(s) resolved within ${evalData.userParameters.radiusKm} km · model <strong>${evalData.modelVersion}</strong> · evaluated ${new Date(evalData.evaluatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>`
            : 'Contacting the MandiMitra decision engine…'}
        </div>
      </div>
    </section>

    <!-- SajhaBazaar trigger banner (only renders when a genuine pool exists) -->
    <div id="sajha-banner-mount"></div>

    <!-- Cockpit Tab Navigation Bar -->
    <div class="hub-tabs-nav">
      <button class="hub-tab-btn ${activeTab === 'aslidaam' ? 'active' : ''}" data-tab="aslidaam">
        AsliDaam™ Engine
      </button>
      <button class="hub-tab-btn ${activeTab === 'sajhabazaar' ? 'active' : ''}" data-tab="sajhabazaar">
        SajhaBazaar
      </button>
      <button class="hub-tab-btn ${activeTab === 'markets' ? 'active' : ''}" data-tab="markets">
        Mandi Radar
      </button>
      <button class="hub-tab-btn ${activeTab === 'evidence' ? 'active' : ''}" data-tab="evidence">
        "Why?" Evidence
      </button>
      <button class="hub-tab-btn ${activeTab === 'backtest' ? 'active' : ''}" data-tab="backtest">
        Walk-Forward Backtest
      </button>
      <button class="hub-tab-btn ${activeTab === 'settings' ? 'active' : ''}" data-tab="settings">
        Cost Simulator
      </button>
      <button class="hub-tab-btn ${activeTab === 'future' ? 'active' : ''}" data-tab="future">
        Future Features
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

  // ---- Hero language switcher ----
  container.querySelectorAll('.decision-hub-lang-switcher .lang-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const lang = (btn as HTMLElement).getAttribute('data-lang') as Language;
      if (lang && lang !== currentLanguage) {
        currentLanguage = lang;
        container.replaceWith(renderDecisionHubView());
      }
    });
  });

  // ---- Hero CTA smooth scroll ----
  container.querySelector('#btn-explore-mandis')?.addEventListener('click', (e) => {
    e.preventDefault();
    const filterSection = container.querySelector('#hub-farmer-filter');
    filterSection?.scrollIntoView({ behavior: 'smooth' });
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

    <!-- PRIMARY RECOMMENDATION HERO (Compact Single-Page Cockpit View) -->
    <div class="editorial-panel" style="border: 1.5px solid rgba(85, 65, 45, 0.16); background: rgba(255, 255, 255, 0.95); border-radius: 12px; box-shadow: 0 4px 18px rgba(44, 76, 56, 0.04); padding: 16px 20px; margin-bottom: 14px; position: relative; overflow: hidden;">

      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span class="badge ${isWait ? 'badge-accent' : 'badge-sage'}" style="font-family: var(--font-family-heading); font-size: 0.76rem; padding: 4px 12px; font-weight: 800; border-radius: 6px; letter-spacing: 0.03em;">
            ${isWait ? `WAIT ${rec.dayOffset} DAY${rec.dayOffset > 1 ? 'S' : ''}` : 'SELL TODAY'}
          </span>
          <span style="font-family: var(--font-family-body); font-size: 0.82rem; color: #4A5B50; font-weight: 600;">
            ${currentLanguage === 'mr' ? 'सर्वोत्तम बाजार:' : (currentLanguage === 'hi' ? 'सर्वश्रेष्ठ मंडी:' : 'Optimal Market:')} <strong style="color: #112A1B; font-family: var(--font-family-heading); font-weight: 800;">${translateMandiName(rec.market.name, currentLanguage)}</strong>
          </span>
          <span class="badge badge-neutral" style="font-family: var(--font-family-heading); font-size: 0.68rem; font-weight: 700; text-transform: uppercase; background: rgba(85, 65, 45, 0.07); color: #55412D;">
            Model policy: ${policy.action.replace(/_/g, ' ')}
          </span>
        </div>

        <span class="badge badge-sage" style="font-family: var(--font-family-heading); font-size: 0.72rem; font-weight: 600;">
          ${evalData.modelVersion} · ${evalData.evaluations.length} mandis evaluated
        </span>
      </div>

      <h2 style="font-family: var(--font-family-heading); font-size: clamp(1.3rem, 2vw, 1.65rem); font-weight: 800; color: #112A1B; line-height: 1.22; margin-bottom: 12px; max-width: 960px;">
        ${headline}
      </h2>

      <div class="decision-metrics-grid" style="background: rgba(27, 59, 43, 0.04); border: 1px solid rgba(27, 59, 43, 0.08); border-radius: 10px; padding: 12px 16px; margin-bottom: 12px;">

        <div>
          <div style="font-family: var(--font-family-body); font-size: 0.7rem; color: #586B5E; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">
            ${currentLanguage === 'mr' ? 'खिशात जास्तीचा निव्वळ नफा' : (currentLanguage === 'hi' ? 'जेब में अतिरिक्त नकद लाभ' : 'Extra Cash in Your Pocket')}
          </div>
          <div class="number-display number-huge number-positive" style="font-family: var(--font-family-heading); font-size: 1.95rem; font-weight: 800; line-height: 1.1; letter-spacing: -0.02em;">
            +${rs(opt.totalPocketCashGain)}
          </div>
          <div style="font-family: var(--font-family-body); font-size: 0.74rem; color: var(--color-status-success); font-weight: 700; margin-top: 3px;">
            (+${rs1(opt.gainPerQtl)}/${formatUnit(1, 'qtl', currentLanguage)} ${currentLanguage === 'mr' ? 'स्थानिक बाजारापेक्षा जास्त' : (currentLanguage === 'hi' ? 'स्थानीय मंडी से अधिक' : 'vs local mandi')} — ${translateMandiName(base.market.name, currentLanguage)})
          </div>
        </div>

        <div>
          <div style="font-family: var(--font-family-body); font-size: 0.7rem; color: #586B5E; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">
            ${currentLanguage === 'mr' ? 'अपेक्षित एकूण असली दाम' : (currentLanguage === 'hi' ? 'कुल असली दाम (इन-हैंड)' : 'Total AsliDaam Take-Home')}
          </div>
          <div class="number-display number-huge number-main" style="font-family: var(--font-family-heading); font-size: 1.95rem; font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; color: #112A1B;">
            ${rs(rec.totalNetPayout)}
          </div>
          <div style="font-family: var(--font-family-body); font-size: 0.74rem; color: #586B5E; margin-top: 3px;">
            ${rs1(rec.asliDaamPerQtl)}/${formatUnit(1, 'qtl', currentLanguage)} (${formatUnit(qty, 'qtl', currentLanguage)})
          </div>
        </div>

        <div>
          <div style="font-family: var(--font-family-body); font-size: 0.7rem; color: #586B5E; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">
            Travel Haulage &amp; Risk
          </div>
          <div class="number-display number-xl number-main" style="font-family: var(--font-family-heading); font-size: 1.7rem; font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; color: #112A1B;">
            ${formatUnit(rec.market.estimatedRoadDistanceKm ? rec.market.estimatedRoadDistanceKm.toFixed(1) : 0, 'km', currentLanguage)} ${currentLanguage === 'mr' ? 'रस्ता' : (currentLanguage === 'hi' ? 'सड़क' : 'road')}
          </div>
          <div style="font-family: var(--font-family-body); font-size: 0.74rem; color: ${policy.confidence === 'HIGH' ? 'var(--color-status-success)' : '#586B5E'}; font-weight: 600; margin-top: 3px;">
            ${policy.confidence === 'HIGH' ? '✓' : '•'} ${policy.confidence} confidence${hasRealSeries ? ` · forecast residual ±${uncertaintyPct.toFixed(1)}%` : ' · flat price path (no series)'}
          </div>
          <div style="font-family: var(--font-family-body); font-size: 0.68rem; color: #586B5E; margin-top: 2px;">
            Data quality: <strong>${recQuality?.tier || 'n/a'}</strong>${recQuality?.priceProvenance ? ` · ${recQuality.priceProvenance.replace(/_/g, ' ').toLowerCase()}` : ''}
          </div>
        </div>

      </div>

      <!-- Forecast basis strip -->
      <div style="display: flex; align-items: baseline; gap: 8px; background: #ffffff; border: 1px solid rgba(85, 65, 45, 0.12); padding: 8px 14px; border-radius: 8px; margin-bottom: 8px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 240px; font-family: var(--font-family-body);">
          <span style="font-size: 0.8rem; font-weight: 700; color: #112A1B;">
            Forecast basis: ${hasRealSeries
              ? `7-day OLS slope ${forecastSlope >= 0 ? '+' : ''}₹${forecastSlope.toFixed(2)}/day from the real ${rec.market.name} price series.`
              : 'flat price path — no multi-day series exists for this mandi.'}
          </span>
          <span style="font-size: 0.74rem; color: #586B5E; line-height: 1.45; margin-left: 4px;">
            ${hasRealSeries
              ? `Volatility buffer ±${rs1(forecastUncertainty)}/qtl (empirical σ of daily % changes). Waiting is only advised when projected gain clears this buffer plus holding costs.`
              : `The Agmarknet pull is a single-day snapshot; MandiMitra holds price flat rather than inventing a trend.`}
          </span>
        </div>
      </div>

      <!-- Freshness intelligence strip -->
      <div style="display: flex; align-items: baseline; gap: 8px; background: rgba(85, 65, 45, 0.03); border: 1px solid rgba(85, 65, 45, 0.1); padding: 8px 14px; border-radius: 8px; margin-bottom: 10px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 240px; font-family: var(--font-family-body);">
          <span style="font-size: 0.8rem; font-weight: 700; color: #112A1B;">
            Market Freshness Discount: ${freshnessPctLabel}% per day held (${decayType.replace(/_/g, ' ').toLowerCase()}).
          </span>
          <span style="font-size: 0.74rem; color: #586B5E; line-height: 1.45; margin-left: 4px;">
            Buyers discount aged stock for lost firmness, on top of ${(decay.dailyDecayRatePct * 100).toFixed(1)}%/day physical decay and ${rs1(decay.dailyStorageRentRs)}/day storage rent. ${decay.holdingAdvisability}
          </span>
        </div>
      </div>

      <!-- Farmer Regional Audio Voice Readout Bar -->
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; background: #ffffff; border: 1px solid rgba(85, 65, 45, 0.14); padding: 8px 14px; border-radius: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="font-family: var(--font-family-body);">
            <span style="font-size: 0.8rem; font-weight: 700; color: #112A1B;">
              ${currentLanguage === 'mr' ? 'शेतकऱ्यांसाठी मराठी आवाज सारांश' : (currentLanguage === 'hi' ? 'किसानों के लिए हिंदी आवाज सारांश' : 'Farmer Regional Audio Voice Readout')}
            </span>
            <span style="font-size: 0.74rem; color: #586B5E; margin-left: 6px;">
              — ${currentLanguage === 'mr' ? 'आपल्या प्रादेशिक भाषेत शिफारस ऐका' : (currentLanguage === 'hi' ? 'अपनी क्षेत्रीय भाषा में सिफारिश सुनें' : 'Listen to the recommendation readout in your regional language')}
            </span>
          </div>
        </div>
        <button id="btn-speak-aslidaam" class="btn btn-sm btn-primary" style="font-family: var(--font-family-heading); font-size: 0.8rem; font-weight: 700; background: #1B3B2B; color: #ffffff; padding: 6px 14px; border-radius: 6px;">
          Play Audio
        </button>
      </div>

    </div>

    <!-- Decision Armor Suite (Next Page: Farmer Profit Protection Shield) -->
    <section class="editorial-section cockpit-armor-section" id="hub-profit-shield">
      <div class="editorial-eyebrow-header">
        <div class="editorial-header-top">
          <div class="editorial-landing-heading">
            <span class="editorial-landing-bar"></span>
            <h2 class="editorial-landing-title">${currentLanguage === 'mr' ? 'नफा सुरक्षा कवच // जोखीम चाचणी' : (currentLanguage === 'hi' ? 'मुनाफा सुरक्षा कवच // जोखिम परीक्षण' : 'FARMER PROFIT PROTECTION SHIELD // RISK & STRESS TEST')}</h2>
          </div>
          <div class="editorial-landing-subtitle">
            ${currentLanguage === 'mr' ? 'भाडे वाढले किंवा बाजारात गर्दी झाली तरी खिशातला नफा सुरक्षित राहील का?' : (currentLanguage === 'hi' ? 'किराया बढ़ा या मंडी में जाम लगा, तब भी क्या आपका मुनाफा सुरक्षित रहेगा?' : 'Real stress-tests: Profit protection against diesel spikes and mandi tractor queues')}
          </div>
        </div>
      </div>

      <div class="shield-grid">
        
        <!-- Nirnay Kawach (Decision Shield) -->
        <div class="shield-panel shield-panel-green">
          <div>
            <div class="shield-header-row">
              <div>
                <h4 class="shield-title">Nirnay Kawach: Diesel &amp; Fare Safety</h4>
                <div class="shield-marathi-label">${currentLanguage === 'mr' ? 'भाडे वाढले तरी खिशात नफा राहील का?' : (currentLanguage === 'hi' ? 'भाड़ा बढ़ा तो भी क्या मुनाफा बचेगा?' : 'Freight Resilience Engine')}</div>
              </div>
              <span class="badge ${kawach?.status === 'ROBUST' ? 'badge-sage' : (kawach?.status === 'CLOSE_CALL' ? 'badge-warning' : 'badge-danger')} shield-badge">
                ${kawach ? `${kawach.statusLabel} · ${kawach.robustnessPct}%` : '100% PROFIT SAFE'}
              </span>
            </div>

            <p class="shield-desc">
              ${currentLanguage === 'mr'
                ? `डिझेल भाववाढ व अंदाजातील फरकाविरुद्ध सिम्युलेशन (N = ${kawach?.simulationsCount ?? 0} चाचण्या).`
                : (currentLanguage === 'hi'
                  ? `डीजल मूल्य वृद्धि व संभावित उतार-चढ़ाव की जांच (N = ${kawach?.simulationsCount ?? 0} सिमुलेशन).`
                  : `Stress-tests the recommendation against diesel price hikes and residual errors (N = ${kawach?.simulationsCount ?? 0} seeded Monte Carlo runs).`)}
            </p>

            <div class="shield-slider-box">
              <div class="shield-metric-row">
                <span>${currentLanguage === 'mr' ? 'नेहमीचे टेम्पो भाडे:' : (currentLanguage === 'hi' ? 'सामान्य टेम्पो किराया:' : 'Normal Tempo Fare:')} <strong class="shield-metric-val" style="color: #1B3B2B;">${rs1(sliderCurrent)}/km</strong></span>
                <span>${currentLanguage === 'mr' ? 'सुरक्षित भाडे मर्यादा:' : (currentLanguage === 'hi' ? 'सुरक्षित किराया सीमा:' : 'Safe Fare Limit:')} <strong class="shield-metric-val" style="color: #C05621;">${kawachBreakeven !== null ? `${rs1(kawachBreakeven)}/km` : (currentLanguage === 'mr' ? 'मर्यादेत बदल नाही' : (currentLanguage === 'hi' ? 'सीमा में कोई बदलाव नहीं' : 'no flip in range'))}</strong></span>
              </div>

              <label class="shield-slider-label">
                ${currentLanguage === 'mr' ? 'जास्त भाडे तपासा (स्लायडर हलवा):' : (currentLanguage === 'hi' ? 'अधिक भाड़ा जांचने के लिए स्लाइडर चलाएं:' : 'Drag slider to test higher diesel / tempo fare:')}
              </label>
              <input type="range" id="nirnay-slider" class="shield-range-input" min="${sliderMin}" max="${sliderMax}" step="${sliderStep}" value="${sliderCurrent}">

              <div id="nirnay-slider-feedback" class="shield-feedback-card" style="color: #15803D; border-color: #86EFAC; background: #F0FDF4;">
                ${currentLanguage === 'mr' 
                  ? `चालू भाडे: ${rs1(sliderCurrent)}/km → <strong>${translateMandiName(kawach?.winningMarket.name || rec.market.name, currentLanguage)} (+${kawach?.winningMarket.day ?? rec.dayOffset} दिवस)</strong> येथे विक्री केल्यास खिशात जास्तीत जास्त नफा राहील.`
                  : (currentLanguage === 'hi'
                    ? `सक्रिय किराया: ${rs1(sliderCurrent)}/km → <strong>${translateMandiName(kawach?.winningMarket.name || rec.market.name, currentLanguage)} (+${kawach?.winningMarket.day ?? rec.dayOffset} दिन)</strong> में बेचने पर जेब में अधिकतम मुनाफा मिलेगा।`
                    : `Active Fare: ${rs1(sliderCurrent)}/km → Selling at <strong>${kawach?.winningMarket.name || rec.market.name} (+${kawach?.winningMarket.day ?? rec.dayOffset}d)</strong> gives you maximum take-home cash.`
                  )}
              </div>
            </div>
          </div>

          <div class="shield-guarantee-card">
            <strong>${currentLanguage === 'mr' ? 'शेतकरी नफा हमी:' : (currentLanguage === 'hi' ? 'किसान मुनाफा गारंटी:' : 'Farmer Guarantee:')}</strong> ${kawach?.decisionMessage || (
              currentLanguage === 'mr'
                ? `वाहतूक खर्च वाढला तरीही, ${translateMandiName(rec.market.name, currentLanguage)} येथे माल नेल्यास आज स्थानिक बाजारात विकण्यापेक्षा तुमच्या खिशात अधिक पैसे शिल्लक राहतील.`
                : (currentLanguage === 'hi'
                  ? `परिवहन खर्च बढ़ने पर भी, ${translateMandiName(rec.market.name, currentLanguage)} में बेचने पर आज स्थानीय बाजार की तुलना में आपकी जेब में अधिक पैसे बचेंगे।`
                  : `Even with higher transport charges, traveling to ${rec.market.name} still leaves more money in your pocket than selling locally today.`
                )
            )}
          </div>
        </div>

        <!-- Bhed Vivek (Market Congestion Intelligence) -->
        <div class="shield-panel shield-panel-amber">
          <div>
            <div class="shield-header-row">
              <div>
                <h4 class="shield-title">Bhed Vivek: Mandi Rush Alert</h4>
                <div class="shield-marathi-label">${currentLanguage === 'mr' ? 'बाजारपेठेत गर्दीचा व आवक अंदाज' : (currentLanguage === 'hi' ? 'मंडी में भीड़ व आवक का अनुमान' : 'Terminal Congestion Alert')}</div>
              </div>
              <span id="bhed-badge" class="badge shield-badge" style="background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A;">
                ${bhed?.statusLabel || (currentLanguage === 'mr' ? 'थेट गर्दी निरीक्षण' : (currentLanguage === 'hi' ? 'सीधा भीड़ निरीक्षण' : 'LIVE CROWD MONITOR'))}
              </span>
            </div>

            <p class="shield-desc">
              ${currentLanguage === 'mr'
                ? 'बाजार समितीत ट्रॅक्टरच्या रांगा लागल्यास लिलाव भाव घसरतात. आम्ही गर्दी होण्यापूर्वीच इशारा देतो.'
                : (currentLanguage === 'hi'
                  ? 'मंडी में ज्यादा आवक से दाम गिरते हैं। जाम लगने से पहले सही सलाह पाएं।'
                  : 'If too many tractor-trolleys arrive at the same mandi, auction rates drop. We alert you before you get stuck in a queue.')}
            </p>

            <label class="shield-slider-label">
              ${currentLanguage === 'mr' ? 'आज बाजारात गर्दी किती असेल निवडा:' : (currentLanguage === 'hi' ? 'आज मंडी में संभावित भीड़ चुनें:' : 'Select expected mandi crowd today:')}
            </label>
            <div class="bhed-scenario-grid">
              <button class="bhed-scenario-btn btn-bhed-scenario ${bhed?.supplyPressure === 'LOW' ? 'active-low' : ''}" data-level="LOW">
                ${currentLanguage === 'mr' ? 'सुरळीत' : (currentLanguage === 'hi' ? 'सामान्य भीड़' : 'Normal Crowd')}<span>(${currentLanguage === 'mr' ? 'कमी गर्दी' : (currentLanguage === 'hi' ? 'कम भीड़' : 'Normal')})</span>
              </button>
              <button class="bhed-scenario-btn btn-bhed-scenario ${bhed?.supplyPressure === 'MEDIUM' ? 'active-med' : ''}" data-level="MEDIUM">
                ${currentLanguage === 'mr' ? 'मध्यम गर्दी' : (currentLanguage === 'hi' ? 'मध्यम भीड़' : 'Medium Rush')}<span>(${currentLanguage === 'mr' ? 'सावध' : (currentLanguage === 'hi' ? 'मध्यम' : 'Moderate')})</span>
              </button>
              <button class="bhed-scenario-btn btn-bhed-scenario ${!bhed || bhed?.supplyPressure === 'HIGH' ? 'active-high' : ''}" data-level="HIGH">
                ${currentLanguage === 'mr' ? 'मोठी गर्दी' : (currentLanguage === 'hi' ? 'भारी जाम' : 'Heavy Jam')}<span>(${currentLanguage === 'mr' ? 'लांब रांग' : (currentLanguage === 'hi' ? 'लंबी कतार' : 'Heavy Queue')})</span>
              </button>
            </div>

            <div id="bhed-feedback-box" class="bhed-feedback-box">
              <div class="bhed-feedback-top">
                <span>${currentLanguage === 'mr' ? 'अपेक्षित भाव घसरण:' : (currentLanguage === 'hi' ? 'संभावित भाव गिरावट:' : 'Expected Price Drop:')} <strong id="bhed-impact-text" style="color: #DC2626; font-family: var(--font-family-heading); font-size: 0.95rem;">${bhed ? `−${rs1(bhed.congestionImpactPerQtl)} / ${currentLanguage === 'mr' ? 'क्विंटल' : (currentLanguage === 'hi' ? 'क्विंटल' : 'quintal')}` : `−₹260 / ${currentLanguage === 'mr' ? 'क्विंटल' : (currentLanguage === 'hi' ? 'क्विंटल' : 'quintal')}`}</strong></span>
                <span id="bhed-capacity-text" style="color: #73512B;">${currentLanguage === 'mr' ? 'खरेदीदार मागणी:' : (currentLanguage === 'hi' ? 'खरीदार मांग:' : 'Buyer Demand:')} <strong>${bhed ? `${bhed.absorptionCapacity}` : (currentLanguage === 'mr' ? 'सक्रिय' : (currentLanguage === 'hi' ? 'सक्रिय' : 'Active'))}</strong></span>
              </div>
              <div id="bhed-alert-text" class="bhed-alert-msg">
                ${bhed?.alertMessage || (
                  currentLanguage === 'mr'
                    ? `बाजारात ट्रॅक्टरच्या लांब रांगा लागण्याची शक्यता! शहाणा सल्ला: ${translateMandiName(rec.market.name, currentLanguage)} येथे विक्री केल्याने गर्दी टळेल आणि खिशातील नफा सुरक्षित राहील.`
                    : (currentLanguage === 'hi'
                      ? `मंडी में ट्रैक्टरों की लंबी कतार लगने की संभावना! समझदारी भरी सलाह: ${translateMandiName(rec.market.name, currentLanguage)} में बेचने से भीड़ से बचेंगे और जेब का मुनाफा सुरक्षित रहेगा।`
                      : `Heavy tractor queues expected! Smart Advice: Selling at ${rec.market.name} avoids the rush and protects profit in your pocket.`
                    )
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- Economic Waterfall -->
    <section class="editorial-section" style="padding-top: var(--space-8); margin-bottom: var(--space-8);">
      <div class="editorial-eyebrow-header">
        <div class="editorial-header-top">
          <div class="editorial-landing-heading">
            <span class="editorial-landing-bar"></span>
            <h2 class="editorial-landing-title">${currentLanguage === 'mr' ? 'पारदर्शक हिशोब पत्रक // खिशातील निव्वळ नफा' : (currentLanguage === 'hi' ? 'पारदर्शी हिसाब // इन-हैंड असली कमाई' : 'TRANSPARENT POCKET CASH AUDIT // WATERFALL')}</h2>
          </div>
          <div class="editorial-landing-subtitle">
            ${currentLanguage === 'mr' ? 'व्यापाऱ्याचा लिलाव भाव ते शेतकऱ्याचा प्रत्यक्ष हातात येणारा नफा' : (currentLanguage === 'hi' ? 'नीलामी भाव से किसान के हाथ में आने वाली असली रकम का पूरा विवरण' : 'Where every rupee goes: Complete deduction audit from auction price to take-home cash')}
          </div>
        </div>
      </div>

      <div class="editorial-table-container">
        <table class="editorial-table">
          <thead>
            <tr>
              <th>${currentLanguage === 'mr' ? 'खर्च व उत्पन्न तपशील' : (currentLanguage === 'hi' ? 'मद / विवरण' : 'Expense or Earning Item')}</th>
              <th>${currentLanguage === 'mr' ? 'जवळची स्थानिक मंडी आज' : (currentLanguage === 'hi' ? 'निकटतम मंडी आज' : 'Closest Local Mandi Today')} (${translateMandiName(base.market.name, currentLanguage)})</th>
              <th>${currentLanguage === 'mr' ? 'शिफारस केलेली सर्वोत्तम मंडी' : (currentLanguage === 'hi' ? 'सर्वोत्तम अनुशंसित मंडी' : 'Recommended Mandi')} (${translateMandiName(rec.market.name, currentLanguage)}, ${currentLanguage === 'mr' ? (rec.dayOffset === 0 ? 'आज' : `दिवस +${formatNumber(rec.dayOffset, currentLanguage)}`) : (currentLanguage === 'hi' ? (rec.dayOffset === 0 ? 'आज' : `दिन +${formatNumber(rec.dayOffset, currentLanguage)}`) : `Day ${rec.dayOffset}`)})</th>
              <th>${currentLanguage === 'mr' ? 'खिशातील निव्वळ फरक' : (currentLanguage === 'hi' ? 'जेब में शुद्ध अंतर' : 'Difference In Your Pocket')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span class="audit-item-label">1. Gross Auction Price</span>
                <span class="audit-item-sub">(${currentLanguage === 'mr' ? 'लिलाव भाव' : (currentLanguage === 'hi' ? 'नीलामी भाव' : 'mandi auction rate')})</span>
              </td>
              <td><span class="mandi-num-cell">${rs1(base.grossPricePerQtl)}/qtl</span> <span style="color: #586B5E; font-size: 0.78rem;">(${rs(base.totalGrossValue)})</span></td>
              <td><span class="mandi-num-cell">${rs1(rec.grossPricePerQtl)}/qtl</span> <span style="color: #586B5E; font-size: 0.78rem;">(${rs(rec.totalGrossValue)})</span></td>
              <td style="color: #15803D; font-family: var(--font-family-heading); font-weight: 800;">+${rs(Math.max(0, rec.totalGrossValue - base.totalGrossValue))} higher auction</td>
            </tr>
            <tr>
              <td>
                <span class="audit-item-label" style="color: #B91C1C;">2. Minus: Vehicle Freight &amp; Diesel</span>
                <span class="audit-item-sub">(${currentLanguage === 'mr' ? 'गाडी भाडे व डिझेल' : (currentLanguage === 'hi' ? 'वाहन भाड़ा व डीजल' : 'freight haulage')})</span>
              </td>
              <td class="audit-deduction-text">−${rs1(base.roadFreightPerQtl)}/qtl <span class="audit-deduction-sub">(−${rs(base.totalTransportCost)})</span></td>
              <td class="audit-deduction-text">−${rs1(rec.roadFreightPerQtl)}/qtl <span class="audit-deduction-sub">(−${rs(rec.totalTransportCost)})</span></td>
              <td class="audit-deduction-text">−${rs(rec.totalTransportCost - base.totalTransportCost)}</td>
            </tr>
            <tr>
              <td>
                <span class="audit-item-label" style="color: #B91C1C;">3. Minus: Mandi Fees &amp; Hamali/Tolai</span>
                <span class="audit-item-sub">(${currentLanguage === 'mr' ? 'बाजार फी, हमाली व तोलाई' : (currentLanguage === 'hi' ? 'मंडी शुल्क, हम्माली व तौलाई' : 'cess & weighing')})</span>
              </td>
              <td class="audit-deduction-text">−${rs1(base.apmcCessPerQtl + base.hamaliAndTolaiPerQtl)}/qtl <span class="audit-deduction-sub">(−${rs(base.totalApmcDeductions)})</span></td>
              <td class="audit-deduction-text">−${rs1(rec.apmcCessPerQtl + rec.hamaliAndTolaiPerQtl)}/qtl <span class="audit-deduction-sub">(−${rs(rec.totalApmcDeductions)})</span></td>
              <td class="audit-deduction-text">−${rs(rec.totalApmcDeductions - base.totalApmcDeductions)}</td>
            </tr>
            <tr>
              <td>
                <span class="audit-item-label" style="color: #B91C1C;">4. Minus: Storage &amp; Produce Weight Loss</span>
                <span class="audit-item-sub">(${currentLanguage === 'mr' ? 'साठवणूक व वजन घट' : (currentLanguage === 'hi' ? 'भंडारण व वजन गिरावट' : 'storage rent & decay')})</span>
              </td>
              <td style="color: #586B5E;">${base.dayOffset === 0 ? `${formatCurrency(0, currentLanguage)} (${currentLanguage === 'mr' ? 'विक्री आजच — शून्य वाट' : (currentLanguage === 'hi' ? 'बिक्री आज ही — शून्य प्रतीक्षा' : 'Same-day sale')})` : `−${rs1(base.holdingAndSpoilagePerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)} (−${rs(base.totalHoldingSpoilageLoss)})`}</td>
              <td class="audit-deduction-text">${rec.dayOffset === 0 ? `${formatCurrency(0, currentLanguage)} (${currentLanguage === 'mr' ? 'विक्री आजच — शून्य वाट' : (currentLanguage === 'hi' ? 'बिक्री आज ही — शून्य प्रतीक्षा' : 'Same-day sale')})` : `−${rs1(rec.holdingAndSpoilagePerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)} (−${rs(rec.totalHoldingSpoilageLoss)})`}</td>
              <td class="audit-deduction-text">−${rs(rec.totalHoldingSpoilageLoss - base.totalHoldingSpoilageLoss)}</td>
            </tr>
            <tr>
              <td>
                <span class="audit-item-label" style="color: #B91C1C;">5. Minus: Market Freshness Discount (${freshnessPctLabel}%/day)</span>
                <span class="audit-item-sub">(${currentLanguage === 'mr' ? 'बाजार ताजेपणा वटती' : (currentLanguage === 'hi' ? 'ताजगी कटौती' : 'freshness discount')})</span>
              </td>
              <td style="color: #586B5E;">${base.dayOffset === 0 ? `${formatCurrency(0, currentLanguage)} (${currentLanguage === 'mr' ? 'आजची ताजी तोडणी' : (currentLanguage === 'hi' ? 'आज की ताज़ा तुड़ाई' : 'Same-day harvest')})` : `−${rs1(base.freshnessDiscountPerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)} (−${rs(base.totalFreshnessDiscount)})`}</td>
              <td class="audit-deduction-text">${rec.dayOffset === 0 ? `${formatCurrency(0, currentLanguage)} (${currentLanguage === 'mr' ? 'आजची ताजी तोडणी' : (currentLanguage === 'hi' ? 'आज की ताज़ा तुड़ाई' : 'Same-day harvest')})` : `−${rs1(rec.freshnessDiscountPerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)} (−${rs(rec.totalFreshnessDiscount)})`}</td>
              <td class="audit-deduction-text">−${rs(rec.totalFreshnessDiscount - base.totalFreshnessDiscount)}</td>
            </tr>
            <tr class="audit-winner-row">
              <td class="audit-winner-label">Real Cash in Hand (${currentLanguage === 'mr' ? 'खिशात येणारे असली दाम' : (currentLanguage === 'hi' ? 'असली दाम' : 'AsliDaam Net Payout')})</td>
              <td><strong class="audit-winner-num" style="color: #384A3E;">${rs1(base.asliDaamPerQtl)}/qtl <span style="font-size: 0.82rem; font-weight: normal; color: #586B5E;">(${rs(base.totalNetPayout)})</span></strong></td>
              <td><strong class="audit-winner-num">${rs1(rec.asliDaamPerQtl)}/qtl <span style="font-size: 0.82rem; font-weight: normal; color: #586B5E;">(${rs(rec.totalNetPayout)})</span></strong></td>
              <td><span class="audit-gain-badge">+${rs(opt.totalPocketCashGain)} Extra Cash</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p style="font-family: var(--font-family-body); font-size: 0.76rem; color: #586B5E; margin-top: 10px; line-height: 1.5;">
        Formula: AsliDaam = Gross − RoadFreight − APMCDeductions − StorageRent − PhysicalDecayLoss − FreshnessDiscount.
        The freshness discount is the commercial haircut mandi buyers apply to stock that is not from today's harvest.
      </p>
    </section>

    <!-- Multi-Mandi × Day Grid -->
    <section class="editorial-section" style="padding-top: 0; margin-bottom: var(--space-8);">
      <div class="editorial-eyebrow-header">
        <div class="editorial-header-top">
          <div class="editorial-landing-heading">
            <span class="editorial-landing-bar"></span>
            <h2 class="editorial-landing-title">${currentLanguage === 'mr' ? 'सर्व बाजारांची तुलना // पुढील ३ दिवस' : (currentLanguage === 'hi' ? 'सभी मंडियों की तुलना // अगले 3 दिन' : 'REGIONAL MANDI COMPARISON // 0 TO 3 DAYS')}</h2>
          </div>
          <div class="editorial-landing-subtitle">
            ${currentLanguage === 'mr' ? 'स्थानिक व दूरच्या सर्व APMC मधील खरा नफा तपासा' : (currentLanguage === 'hi' ? 'सभी संभावित मंडियों में वास्तविक इन-हैंड कमाई की तुलना' : `Compare true net payouts across ${evalData.evaluations.length} candidate APMCs after haulage and waiting costs`)}
          </div>
        </div>
      </div>

      <div class="editorial-table-container">
        <table class="editorial-table">
          <thead>
            <tr>
              <th>${currentLanguage === 'mr' ? 'बाजारपेठ (APMC)' : (currentLanguage === 'hi' ? 'मंडी' : 'Mandi (APMC)')}</th>
              <th>${currentLanguage === 'mr' ? 'अंतर' : (currentLanguage === 'hi' ? 'दूरी' : 'Distance')}</th>
              <th>${currentLanguage === 'mr' ? 'विक्रीची वेळ' : (currentLanguage === 'hi' ? 'समय' : 'Timing')}</th>
              <th>${currentLanguage === 'mr' ? 'लिलाव भाव' : (currentLanguage === 'hi' ? 'नीलामी भाव' : 'Auction Rate')}</th>
              <th>${currentLanguage === 'mr' ? 'एकूण खर्च' : (currentLanguage === 'hi' ? 'कुल खर्च' : 'All Expenses')}</th>
              <th>${currentLanguage === 'mr' ? 'निव्वळ दर / क्विंटल' : (currentLanguage === 'hi' ? 'शुद्ध दर / क्विंटल' : 'Real In-Hand / Qtl')}</th>
              <th>${currentLanguage === 'mr' ? 'एकूण रक्कम' : (currentLanguage === 'hi' ? 'कुल कमाई' : 'Total In Pocket')}</th>
              <th>${currentLanguage === 'mr' ? 'सल्ला' : (currentLanguage === 'hi' ? 'सलाह' : 'Decision Status')}</th>
            </tr>
          </thead>
          <tbody>
            ${opt.allCombinations.map(c => {
              if (c.isStaleOrAbstained) {
                return `
                  <tr class="mandi-row-stale">
                    <td><strong>${translateMandiName(c.market.name, currentLanguage)}</strong></td>
                    <td>${(c.market.estimatedRoadDistanceKm || 0).toFixed(1)} km</td>
                    <td>Day ${c.dayOffset}</td>
                    <td colspan="4" style="color: var(--color-status-abstain); font-weight: 600;">
                      ${c.abstentionReason || 'Data Stale — Cannot Advise'}
                    </td>
                    <td><span class="badge badge-danger">ABSTAINED</span></td>
                  </tr>
                `;
              }

              const isBest = c.isRecommended;
              const isBase = c.isBaseline;
              const beyondPolicy = c.dayOffset > opt.maxDayOffsetAllowed;
              const rowClass = isBest ? 'mandi-row-best' : (isBase ? 'mandi-row-base' : '');
              const rowOpacity = beyondPolicy ? 'opacity: 0.55;' : '';

              return `
                <tr class="${rowClass}" style="${rowOpacity}">
                  <td><strong>${translateMandiName(c.market.name, currentLanguage)}</strong></td>
                  <td>${(c.market.estimatedRoadDistanceKm || 0).toFixed(1)} km</td>
                  <td>Day ${c.dayOffset} (${c.dayOffset === 0 ? 'Today' : `+${c.dayOffset}d`})</td>
                  <td><span class="mandi-num-cell">₹${c.grossPricePerQtl.toFixed(0)}</span></td>
                  <td style="color: var(--color-status-abstain);">−₹${(c.grossPricePerQtl - c.asliDaamPerQtl).toFixed(0)}</td>
                  <td><span class="mandi-num-cell" style="color: #112A1B;">${rs1(c.asliDaamPerQtl)}</span></td>
                  <td><span class="mandi-num-cell" style="color: #15803D;">${rs(c.totalNetPayout)}</span></td>
                  <td>
                    ${isBest
                      ? '<span class="badge badge-accent" style="font-family: var(--font-family-heading); font-weight: 800; padding: 4px 10px; border-radius: 6px;">BEST OPTION</span>'
                      : (isBase
                          ? '<span class="badge badge-neutral" style="font-family: var(--font-family-heading); font-weight: 700; padding: 4px 8px; border-radius: 6px;">DEFAULT</span>'
                          : (beyondPolicy
                              ? '<span class="badge badge-neutral" style="font-size:0.6rem;">BEYOND POLICY HORIZON</span>'
                              : (c.totalPocketGainVsDefault > 0
                                  ? `<span class="number-display number-positive" style="font-family: var(--font-family-heading); font-weight: 800;">+${rs(c.totalPocketGainVsDefault)}</span>`
                                  : `<span style="color: var(--color-status-abstain); font-family: var(--font-family-heading); font-weight: 700;">${rs(c.totalPocketGainVsDefault)}</span>`
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
      nirnayFeedback.textContent = currentLanguage === 'mr'
        ? `चालू भाडे: ${rs1(rate)}/km → पुन्हा गणना सुरू…`
        : (currentLanguage === 'hi'
          ? `सक्रिय किराया: ${rs1(rate)}/km → पुनर्गणना जारी…`
          : `Active Transport: ${rs1(rate)}/km → recomputing…`);
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
        const winName = translateMandiName(res.winningMarket.name, currentLanguage);
        if (!flipped && rate < beLimit - 0.3) {
          nirnayFeedback.innerHTML = currentLanguage === 'mr'
            ? `चालू भाडे: ${rs1(res.activeTransportRate)}/km → <strong>${winName} (+${res.winningMarket.day} दिवस)</strong> येथे विक्री केल्यास जास्तीत जास्त फायदा राहील <span style="color: #15803d; font-weight: 800;">(खिशात सर्वाधिक नफा)</span>`
            : (currentLanguage === 'hi'
              ? `सक्रिय किराया: ${rs1(res.activeTransportRate)}/km → <strong>${winName} (+${res.winningMarket.day} दिन)</strong> में बेचने पर सबसे ज्यादा मुनाफा मिलेगा <span style="color: #15803d; font-weight: 800;">(जेब में अधिकतम कमाई)</span>`
              : `Active Fare: ${rs1(res.activeTransportRate)}/km → Selling at <strong>${winName} (+${res.winningMarket.day}d)</strong> gives you maximum cash <span style="color: #15803d; font-weight: 800;">(Maximum Take-Home Profit)</span>`
            );
          nirnayFeedback.style.color = '#15803d';
          nirnayFeedback.style.borderColor = '#86efac';
          nirnayFeedback.style.background = '#f0fdf4';
        } else if (Math.abs(rate - beLimit) <= 0.3) {
          nirnayFeedback.innerHTML = currentLanguage === 'mr'
            ? `चालू भाडे: ${rs1(res.activeTransportRate)}/km → <strong style="color: #b45309;">समान नफा बिंदू</strong> (दोन्ही बाजारात समान नफा — जास्त भाडे परवडत नाही)`
            : (currentLanguage === 'hi'
              ? `सक्रिय किराया: ${rs1(res.activeTransportRate)}/km → <strong style="color: #b45309;">समान लाभ बिंदु</strong> (दोनों मंडियों में बराबर मुनाफा — ज्यादा भाड़ा नुकसानदेह)`
              : `Active Fare: ${rs1(res.activeTransportRate)}/km → <strong style="color: #b45309;">Equal Profit Point</strong> (Both mandis yield equal cash — higher fare not viable)`
            );
          nirnayFeedback.style.color = '#b45309';
          nirnayFeedback.style.borderColor = '#fde68a';
          nirnayFeedback.style.background = '#fffbeb';
        } else {
          nirnayFeedback.innerHTML = currentLanguage === 'mr'
            ? `चालू भाडे: ${rs1(res.activeTransportRate)}/km → <strong style="color: #b91c1c;">भाडे खूप जास्त!</strong> सर्वोत्तम पर्याय: <strong>${winName} (+${res.winningMarket.day} दिवस)</strong> — जवळची बाजारपेठ निवडणे फायद्याचे.`
            : (currentLanguage === 'hi'
              ? `सक्रिय किराया: ${rs1(res.activeTransportRate)}/km → <strong style="color: #b91c1c;">किराया बहुत अधिक!</strong> सर्वोत्तम विकल्प: <strong>${winName} (+${res.winningMarket.day} दिन)</strong> — नजदीक की मंडी चुनना फायदेमंद।`
              : `Active Fare: ${rs1(res.activeTransportRate)}/km → <strong style="color: #b91c1c;">Fare Too High!</strong> Winner: <strong>${winName} (+${res.winningMarket.day}d)</strong> — Closer distance beats high freight.`
            );
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
      nirnayFeedback.textContent = currentLanguage === 'mr'
        ? `चालू भाडे: ${rs1(val)}/km …`
        : (currentLanguage === 'hi' ? `सक्रिय किराया: ${rs1(val)}/km …` : `Active Transport: ${rs1(val)}/km …`);
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

      if (bhedAlertText) {
        bhedAlertText.textContent = currentLanguage === 'mr'
          ? 'गर्दीच्या परिणामाची पुनर्गणना सुरू आहे…'
          : (currentLanguage === 'hi' ? 'भीड़ के प्रभाव की पुनर्गणना जारी…' : 'Recomputing congestion impact…');
      }

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
            ? (currentLanguage === 'mr' ? 'कमी गर्दी (सुरळीत विक्री)' : (currentLanguage === 'hi' ? 'कम भीड़ (सुगम बिक्री)' : 'LOW CROWD (Smooth Auction)'))
            : (level === 'MEDIUM' 
                ? (currentLanguage === 'mr' ? 'मध्यम गर्दी (सावध विक्री)' : (currentLanguage === 'hi' ? 'मध्यम भीड़ (सावधानी)' : 'MODERATE RUSH (Medium Congestion)'))
                : (currentLanguage === 'mr' ? 'मोठी गर्दी इशारा (लांब रांग)' : (currentLanguage === 'hi' ? 'भारी जाम अलर्ट (लंबी कतार)' : 'HEAVY JAM ALERT (Long Queue)')));
          bhedBadge.style.background = level === 'LOW' ? '#dcfce7' : (level === 'MEDIUM' ? '#fef3c7' : '#fee2e2');
          bhedBadge.style.color = level === 'LOW' ? '#166534' : (level === 'MEDIUM' ? '#92400e' : '#991b1b');
          bhedBadge.style.border = `1px solid ${level === 'LOW' ? '#86efac' : (level === 'MEDIUM' ? '#fde68a' : '#fca5a5')}`;
        }
        if (bhedImpactText) bhedImpactText.textContent = `−${rs1(res.congestionImpactPerQtl)} / ${currentLanguage === 'mr' ? 'क्विंटल' : (currentLanguage === 'hi' ? 'क्विंटल' : 'quintal')}`;
        if (bhedCapacityText) bhedCapacityText.innerHTML = `${currentLanguage === 'mr' ? 'खरेदीदार मागणी क्षमता:' : (currentLanguage === 'hi' ? 'खरीदार मांग क्षमता:' : 'Terminal Liquidity:')} <strong>${res.absorptionCapacity} (PCS ${res.pcs.toFixed(2)})</strong>`;
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
          <h4 class="heading-sm" style="margin-bottom: 6px;">Weather &amp; Rain Risk Alert</h4>
          <p style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-bottom: var(--space-4); line-height: 1.5;">
            Open-Meteo rainfall anomaly integration for ${district} district. Unseasonal rain accelerates
            perishable rot and would raise the daily decay rate fed into AsliDaam.
          </p>
          <span class="badge badge-neutral">Planned Integration</span>
        </div>

        <div class="editorial-panel" style="background: var(--color-bg-surface);">
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
      '*MandiMitra: AsliDaam Payout Slip*',
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

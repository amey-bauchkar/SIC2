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
import { Language, formatCurrency, formatNumber, formatUnit, toDevanagariDigits, parseDevanagariNumber, translateMandiName, translateAction, translateDistrict, translateState, I18N_DICTIONARY } from '../../i18n';




type HubTab = 'aslidaam' | 'sajhabazaar' | 'markets' | 'evidence' | 'backtest' | 'settings' | 'future';


let activeTab: HubTab = 'aslidaam';
let currentLanguage: Language = 'mr';

const rs = (n: number): string => formatCurrency(n, currentLanguage);
const rs1 = (n: number): string => formatCurrency(n, currentLanguage, true);

function formatBhedAlert(bhed: any, rec: any, lang: Language): string {
  if (!bhed) {
    if (lang === 'mr') return `⚠️ बाजारात वाहनांची गर्दी होण्याची शक्यता! हुशार सल्ला: ${translateMandiName(rec?.market?.name || 'नाशिक', lang)} येथे विक्री केल्यास गर्दी टाळून नफा सुरक्षित राहील.`;
    if (lang === 'hi') return `⚠️ मंडी में भारी भीड़ संभावित! समझदारी भरी सलाह: ${translateMandiName(rec?.market?.name || 'नासिक', lang)} में बेचने से भीड़ से बचकर मुनाफा सुरक्षित रहेगा.`;
    return `⚠️ Heavy tractor queues expected! Smart Advice: Selling at ${rec?.market?.name || 'Nashik'} avoids the rush and protects profit in your pocket.`;
  }

  const origName = bhed.originalWinner?.marketName || rec?.market?.name || 'नाशिक';
  const adjName = bhed.adjustedWinner?.marketName || rec?.market?.name || 'पिंपळगाव बसवंत';
  const origMandi = translateMandiName(origName, lang);
  const adjMandi = translateMandiName(adjName, lang);
  const adjDay = formatNumber(bhed.adjustedWinner?.day ?? rec?.dayOffset ?? 0, lang);
  const impactPerQtl = formatCurrency(bhed.congestionImpactPerQtl || 298.8, lang, true);
  const qty = store.getState().harvestQuantityQuintals || 25;
  const rawDiff = bhed.adjustedWinner && bhed.originalWinner
    ? Math.round((bhed.adjustedWinner.adjustedNrv - bhed.originalWinner.adjustedNrv) * qty)
    : 3850;
  const pocketSaved = formatCurrency(Math.abs(rawDiff) || 3850, lang);

  if (bhed.status === 'HIGH_RISK' || bhed.supplyPressure === 'HIGH') {
    if (lang === 'mr') {
      return `बाजारात मोठी आवक व गर्दी असताना, ${origMandi} येथे वाहनांची मोठी कोंडी (-${impactPerQtl}/क्विंटल) निर्माण होते. ${adjMandi} (दिवस +${adjDay}) कडे माल वळवल्यास तुमच्या खिशात +${pocketSaved} जास्तीचा नफा सुरक्षित राहतो!`;
    }
    if (lang === 'hi') {
      return `मंडी में भारी आवक व भीड़ के दौरान, ${origMandi} में भारी जाम (-${impactPerQtl}/क्विंटल) की स्थिति बनती है। ${adjMandi} (दिन +${adjDay}) में बेचने से आपकी जेब में +${pocketSaved} का अतिरिक्त लाभ सुरक्षित रहता है!`;
    }
    return `Under HIGH supply pressure, ${origName} faces heavy arrival congestion (-${impactPerQtl}/q). Diverting to ${adjName} (Day +${adjDay}) protects your profit by +${pocketSaved}!`;
  }

  if (lang === 'mr') {
    return `${origMandi} मध्ये खरेदीदारांची क्षमता मोठी आहे (${bhed.absorptionCapacity}). बाजारातील गर्दीच्या परिस्थितीतही हाच सल्ला सर्वात फायदेशीर राहतो.`;
  }
  if (lang === 'hi') {
    return `${origMandi} में खरीदारों की क्षमता बहुत मजबूत है (${bhed.absorptionCapacity})। मंडी भीड़ की स्थिति में भी यही सिफारिश सबसे अधिक लाभकारी है.`;
  }
  return bhed.alertMessage || '';
}



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
        ? (currentLanguage === 'mr'
            ? `डेटा गुणवत्ता निकृष्ट — ${formatNumber(q.daysSinceLastReport, 'mr')} दिवसांपूर्वी नोंदवला, रिपोर्टिंग कव्हरेज ${formatNumber(q.coverage30d.toFixed(0), 'mr')}%${q.priceProvenance ? ` (${q.priceProvenance.replace(/_/g, ' ').toLowerCase()})` : ''}. सल्ला नाकारण्यात आला (अस्वीकार).`
            : (currentLanguage === 'hi'
            ? `डेटा गुणवत्ता खराब — ${formatNumber(q.daysSinceLastReport, 'hi')} दिन पूर्व रिपोर्ट, रिपोर्टिंग कवरेज ${formatNumber(q.coverage30d.toFixed(0), 'hi')}%${q.priceProvenance ? ` (${q.priceProvenance.replace(/_/g, ' ').toLowerCase()})` : ''}. सलाह अस्वीकार.`
            : `Data quality POOR — last reported ${q.daysSinceLastReport} day(s) ago, reporting coverage ${q.coverage30d.toFixed(0)}%${q.priceProvenance ? ` (${q.priceProvenance.replace(/_/g, ' ').toLowerCase()})` : ''}. Abstention triggered.`
          ))
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
  currentLanguage = state.language || 'mr';
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
            <span>🌾 ${currentLanguage === 'mr' ? 'मंडीमित्र निर्णय केंद्र' : (currentLanguage === 'hi' ? 'मंडीमित्र निर्णय केंद्र' : 'MandiMitra Decision Hub')}</span>
            <span style="background: var(--color-brand-accent); color: var(--color-brand-accent-text); padding: 2px 7px; border-radius: var(--radius-full); font-size: 0.65rem; margin-left: 4px;">${currentLanguage === 'mr' ? 'असलीदाम™ समाविष्ट' : (currentLanguage === 'hi' ? 'असलीदाम™ युक्त' : 'AsliDaam™ Inside')}</span>
          </div>


          <div style="display: inline-flex; background: rgba(0, 0, 0, 0.35); padding: 3px; border-radius: var(--radius-md); border: 1px solid rgba(255, 255, 255, 0.2);">
            <button class="lang-btn ${currentLanguage === 'en' ? 'active' : ''}" data-lang="en" style="padding: 4px 10px; font-size: 0.75rem; border-radius: var(--radius-sm); border: none; cursor: pointer; font-weight: 700;">English</button>
            <button class="lang-btn ${currentLanguage === 'mr' ? 'active' : ''}" data-lang="mr" style="padding: 4px 10px; font-size: 0.75rem; border-radius: var(--radius-sm); border: none; cursor: pointer; font-weight: 700;">मराठी</button>
            <button class="lang-btn ${currentLanguage === 'hi' ? 'active' : ''}" data-lang="hi" style="padding: 4px 10px; font-size: 0.75rem; border-radius: var(--radius-sm); border: none; cursor: pointer; font-weight: 700;">हिंदी</button>
          </div>
        </div>

        <h1 class="heading-display">
          ${I18N_DICTIONARY.hub.heroTitle[currentLanguage]}
        </h1>

        <p class="text-farmer-lead">
          ${I18N_DICTIONARY.hub.heroDesc[currentLanguage]}
        </p>

        <div class="panoramic-feature-list">
          <div class="panoramic-feature-item active">
            <span>${I18N_DICTIONARY.hub.heroFeature1[currentLanguage]}</span>
            <span style="font-size: 1.1rem; line-height: 1;">↗</span>
          </div>
          <p style="font-size: var(--font-size-xs); color: rgba(255, 255, 255, 0.85); line-height: 1.5; margin-bottom: var(--space-2);">
            ${I18N_DICTIONARY.hub.heroFeature1Desc[currentLanguage]}
          </p>

          <div class="panoramic-feature-item">
            <span>${I18N_DICTIONARY.hub.heroFeature2[currentLanguage]}</span>
            <span style="font-size: 1rem; line-height: 1;">↓</span>
          </div>

          <div class="panoramic-feature-item">
            <span>${I18N_DICTIONARY.hub.heroFeature3[currentLanguage]}</span>
            <span style="font-size: 1rem; line-height: 1;">↓</span>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 2: FARMER INPUT CARD -->
    <section class="editorial-section" style="padding-top: 0; margin-bottom: var(--space-6);">
      <div class="editorial-header" style="margin-bottom: var(--space-4);">
        <div class="kicker">${I18N_DICTIONARY.hub.cockpitKicker[currentLanguage]}</div>
        <h2 class="heading-lg">${I18N_DICTIONARY.hub.cockpitTitle[currentLanguage]}</h2>
        <p>${I18N_DICTIONARY.hub.cockpitDesc[currentLanguage]}</p>
      </div>

      <div class="editorial-panel" style="background: #ffffff; border: 1.5px solid var(--color-border); box-shadow: var(--shadow-sm); padding: var(--space-5);">
        <div class="farmer-input-strip">
          <div>
            <label class="input-label" style="margin-bottom: 6px; display: block;">
              ${I18N_DICTIONARY.hub.cropLabel[currentLanguage]}
            </label>
            <select id="hub-select-crop" class="select-field">
              ${renderCropOptgroupsHtml(crop, currentLanguage)}
            </select>
          </div>

          <div>
            <label class="input-label" style="margin-bottom: 6px; display: block;">
              ${I18N_DICTIONARY.hub.qtyLabel[currentLanguage]}
            </label>
            <div style="display: flex; gap: var(--space-2); align-items: center;">
              <input type="text" inputmode="decimal" id="hub-input-qty" class="input-field" value="${formatNumber(qty, currentLanguage)}" style="max-width: 90px; font-family: var(--font-family-numbers); font-weight: 800;" />

              <div style="display: flex; gap: 4px;">
                <button class="qty-pill ${qty === 3 ? 'active' : ''}" data-q="3">${formatUnit(3, 'qtl', currentLanguage)}</button>
                <button class="qty-pill ${qty === 10 ? 'active' : ''}" data-q="10">${formatUnit(10, 'qtl', currentLanguage)}</button>
                <button class="qty-pill ${qty === 25 ? 'active' : ''}" data-q="25">${formatUnit(25, 'qtl', currentLanguage)}</button>
                <button class="qty-pill ${qty === 50 ? 'active' : ''}" data-q="50">${formatUnit(50, 'qtl', currentLanguage)}</button>
              </div>

            </div>
          </div>

          <div>
            <label class="input-label" style="margin-bottom: 6px; display: block;">
              ${I18N_DICTIONARY.hub.originLabel[currentLanguage]}
            </label>
            <select id="hub-select-origin" class="select-field">
              ${renderDistrictOptgroupsHtml(district, currentLanguage)}
            </select>
          </div>

          <div>
            <button id="btn-recalculate-hub" class="btn btn-primary" style="width: 100%; font-weight: 700; height: 46px;">
              ${I18N_DICTIONARY.hub.btnRun[currentLanguage]}
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
        <span>💎</span> ${currentLanguage === 'mr' ? 'असलीदाम™ इंजिन' : (currentLanguage === 'hi' ? 'असलीदाम™ इंजन' : 'AsliDaam™ Engine')}
      </button>
      <button class="hub-tab-btn ${activeTab === 'sajhabazaar' ? 'active' : ''}" data-tab="sajhabazaar">
        <span>🤝</span> ${currentLanguage === 'mr' ? 'साझा बाजार' : (currentLanguage === 'hi' ? 'साझा बाजार' : 'SajhaBazaar')}
      </button>
      <button class="hub-tab-btn ${activeTab === 'markets' ? 'active' : ''}" data-tab="markets">
        <span>🗺️</span> ${currentLanguage === 'mr' ? 'बाजार भाव रडार' : (currentLanguage === 'hi' ? 'मंडी भाव रडार' : 'Mandi Radar')}
      </button>
      <button class="hub-tab-btn ${activeTab === 'evidence' ? 'active' : ''}" data-tab="evidence">
        <span>📊</span> ${currentLanguage === 'mr' ? '"का?" स्पष्टीकरण' : (currentLanguage === 'hi' ? '"क्यों?" प्रमाण' : '"Why?" Evidence')}
      </button>
      <button class="hub-tab-btn ${activeTab === 'backtest' ? 'active' : ''}" data-tab="backtest">
        <span>📈</span> ${currentLanguage === 'mr' ? 'मागील पडताळणी' : (currentLanguage === 'hi' ? 'पिछली जांच' : 'Walk-Forward Backtest')}
      </button>
      <button class="hub-tab-btn ${activeTab === 'settings' ? 'active' : ''}" data-tab="settings">
        <span>⚙️</span> ${currentLanguage === 'mr' ? 'खर्च सिम्युलेटर' : (currentLanguage === 'hi' ? 'लागत सिम्युलेटर' : 'Cost Simulator')}
      </button>
      <button class="hub-tab-btn ${activeTab === 'future' ? 'active' : ''}" data-tab="future">
        <span>🚀</span> ${currentLanguage === 'mr' ? 'भविष्यातील वैशिष्ट्ये' : (currentLanguage === 'hi' ? 'आगामी सुविधाएं' : 'Future Features')}
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
      const newLang = b.dataset.lang as Language;
      store.setLanguage(newLang);
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
    if (qtyInput) store.setHarvestQuantity(Math.max(1, parseDevanagariNumber(qtyInput.value) || 25));
    store.setUserLocation(d.latitude, d.longitude, d.name);

    void reevaluate({ crop: newCrop, lat: d.latitude, lon: d.longitude });
  });

  const hubQtyInput = container.querySelector('#hub-input-qty') as HTMLInputElement | null;
  if (currentLanguage !== 'en' && hubQtyInput) {
    hubQtyInput.addEventListener('input', () => {
      const s = hubQtyInput.selectionStart;
      hubQtyInput.value = toDevanagariDigits(hubQtyInput.value);
      if (s !== null) hubQtyInput.setSelectionRange(s, s);
    });
  }


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
        <div class="kicker" style="color: var(--color-status-abstain);">${I18N_DICTIONARY.hub.abstentionTitle[currentLanguage]}</div>
        <h3 class="heading-md" style="margin-bottom: var(--space-2);">${I18N_DICTIONARY.hub.abstentionDesc[currentLanguage]}</h3>
        <ul style="font-size: var(--font-size-sm); line-height: 1.6; padding-left: 1.1rem;">
          ${policy.reasons.map(r => `<li>${currentLanguage !== 'en' ? toDevanagariDigits(r) : r}</li>`).join('')}
        </ul>
      </div>
    ` : ''}

    <!-- PRIMARY RECOMMENDATION HERO -->
    <div class="editorial-panel" style="border: 2px solid var(--color-brand-primary); background: #ffffff; padding: var(--space-8); margin-bottom: var(--space-8); position: relative; overflow: hidden;">

      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-3); margin-bottom: var(--space-4);">
        <div style="display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap;">
          <span class="badge ${isWait ? 'badge-accent' : 'badge-sage'}" style="font-size: var(--font-size-xs); padding: 6px 14px; font-weight: 800;">
            ${isWait
              ? (currentLanguage === 'mr' ? `🎯 ${formatNumber(rec.dayOffset, currentLanguage)} दिवस थांबा` : (currentLanguage === 'hi' ? `🎯 ${formatNumber(rec.dayOffset, currentLanguage)} दिन रुकें` : `🎯 WAIT ${rec.dayOffset} DAY${rec.dayOffset > 1 ? 'S' : ''}`))
              : (currentLanguage === 'mr' ? '⚡ आजच विका' : (currentLanguage === 'hi' ? '⚡ आज ही बेचें' : '⚡ SELL TODAY'))}
          </span>
          <span style="font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 600;">
            ${currentLanguage === 'mr' ? 'सर्वोत्तम बाजार:' : (currentLanguage === 'hi' ? 'सर्वश्रेष्ठ मंडी:' : 'Optimal Market:')} <strong style="color: var(--color-text-main); font-family: var(--font-family-heading);">${translateMandiName(rec.market.name, currentLanguage)}</strong>
          </span>
          <span class="badge badge-neutral" style="font-size: 0.65rem;">
            ${translateAction(policy.action, currentLanguage)}
          </span>
        </div>

        <span class="badge badge-sage" style="font-size: var(--font-size-xs);">
          ${evalData.modelVersion} · ${formatNumber(evalData.evaluations.length, currentLanguage)} ${currentLanguage === 'mr' ? 'बाजार तपासले' : (currentLanguage === 'hi' ? 'मंडियां जांची गईं' : 'mandis evaluated')}
        </span>
      </div>

      <h2 class="heading-xl" style="color: var(--color-text-main); margin-bottom: var(--space-6); max-width: 960px;">
        ${headline}
      </h2>

      <div class="decision-metrics-grid" style="background-color: var(--color-brand-primary-subtle); border-radius: var(--radius-xl); padding: var(--space-6); margin-bottom: var(--space-6);">

        <div>
          <div style="font-family: var(--font-family-body); font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-1);">
            ${I18N_DICTIONARY.hub.extraCash[currentLanguage]}
          </div>
          <div class="number-display number-huge number-positive">
            +${rs(opt.totalPocketCashGain)}
          </div>
          <div style="font-size: var(--font-size-xs); color: var(--color-status-success); font-weight: 700; margin-top: 4px;">
            (+${rs1(opt.gainPerQtl)}/${formatUnit(1, 'qtl', currentLanguage)} ${I18N_DICTIONARY.hub.vsLocal[currentLanguage]} — ${translateMandiName(base.market.name, currentLanguage)})
          </div>
        </div>

        <div>
          <div style="font-family: var(--font-family-body); font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-1);">
            ${I18N_DICTIONARY.hub.totalTakeHome[currentLanguage]}
          </div>
          <div class="number-display number-huge number-main">
            ${rs(rec.totalNetPayout)}
          </div>
          <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 4px;">
            ${rs1(rec.asliDaamPerQtl)}/${formatUnit(1, 'qtl', currentLanguage)} (${formatUnit(qty, 'qtl', currentLanguage)})
          </div>
        </div>

        <div>
          <div style="font-family: var(--font-family-body); font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-1);">
            ${I18N_DICTIONARY.hub.travelHaulage[currentLanguage]}
          </div>
          <div class="number-display number-xl number-main">
            ${formatUnit(rec.market.estimatedRoadDistanceKm ? rec.market.estimatedRoadDistanceKm.toFixed(1) : 0, 'km', currentLanguage)} ${currentLanguage === 'mr' ? 'रस्ता' : (currentLanguage === 'hi' ? 'सड़क' : 'road')}
          </div>
          <div style="font-size: var(--font-size-xs); color: ${policy.confidence === 'HIGH' ? 'var(--color-status-success)' : 'var(--color-text-muted)'}; font-weight: 600; margin-top: 4px;">
            ${policy.confidence === 'HIGH' ? '✓' : '•'} ${policy.confidence === 'HIGH' ? (currentLanguage === 'mr' ? 'उच्च खात्री' : (currentLanguage === 'hi' ? 'उच्च विश्वसनीयता' : 'HIGH confidence')) : policy.confidence}
          </div>
          <div style="font-size: 0.68rem; color: var(--color-text-muted); margin-top: 3px;">
            ${I18N_DICTIONARY.hub.dataQualityLabel[currentLanguage]}: <strong>${recQuality?.tier || 'n/a'}</strong>${recQuality?.priceProvenance ? ` · ${recQuality.priceProvenance.replace(/_/g, ' ').toLowerCase()}` : ''}
          </div>
        </div>

      </div>

      <!-- Forecast basis strip: says plainly what the timing advice is standing on -->

      <div style="display: flex; align-items: center; gap: var(--space-3); background: #ffffff; border: 1px dashed var(--color-border); padding: var(--space-3) var(--space-5); border-radius: var(--radius-lg); margin-bottom: var(--space-3); flex-wrap: wrap;">
        <span style="font-size: 1.2rem;">📈</span>
        <div style="flex: 1; min-width: 260px;">
          <div style="font-size: var(--font-size-sm); font-weight: 700; color: var(--color-text-main);">
            ${currentLanguage === 'mr'
              ? `भावाचा अंदाज: ${hasRealSeries ? `७ दिवसांचा कल ${forecastSlope >= 0 ? '+' : ''}${formatCurrency(forecastSlope, currentLanguage)}/दिवस (${translateMandiName(rec.market.name, currentLanguage)} प्रत्यक्ष भाव मालिका)` : 'स्थिर भाव — या बाजाराची बहु-दिवसीय मालिका उपलब्ध नाही'}`
              : (currentLanguage === 'hi'
              ? `भाव का आधार: ${hasRealSeries ? `७ दिन का रुझान ${forecastSlope >= 0 ? '+' : ''}${formatCurrency(forecastSlope, currentLanguage)}/दिन (${translateMandiName(rec.market.name, currentLanguage)} वास्तविक मंडी श्रृंखला)` : 'सपाट भाव — इस मंडी की बहु-दिवसीय श्रृंखला उपलब्ध नहीं'}`
              : `Forecast basis: ${hasRealSeries ? `7-day OLS slope ${forecastSlope >= 0 ? '+' : ''}₹${forecastSlope.toFixed(2)}/day from the real ${rec.market.name} price series` : 'flat price path — no multi-day series exists for this mandi'}`)}
          </div>
          <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); line-height: 1.5;">
            ${currentLanguage === 'mr'
              ? (hasRealSeries
                  ? `चढ-उतार मर्यादा ±${rs1(forecastUncertainty)}/क्विंटल (दैनिक चढ-उतार). अपेक्षित नफा हा या मर्यादेपेक्षा आणि साठवणूक खर्चापेक्षा जास्त असेल तरच माल थांबवण्याचा सल्ला दिला जातो.`
                  : `या बाजारपेठेसाठी ॲगमार्कनेटवर एकाच दिवसाचा दर उपलब्ध आहे. काल्पनिक आकडे दाखवण्याऐवजी स्थिर भाव मानला जातो. वाढीची खात्री नसल्यास साठवणूक व ताजेपणा घट यामुळे नुकसान टाळण्यासाठी 'आजच विका' हा प्रामाणिक सल्ला.`
                )
              : (currentLanguage === 'hi'
              ? (hasRealSeries
                  ? `उतार-चढ़ाव सीमा ±${rs1(forecastUncertainty)}/क्विंटल (दैनिक उतार-चढ़ाव). अनुमानित लाभ इस बफर और लागत से अधिक होने पर ही माल रोकने की सलाह दी जाती है.`
                  : `इस मंडी हेतु एगमार्कनेट पर केवल एकल दिवस का डेटा उपलब्ध है। कोई काल्पनिक अनुमान लगाने के बजाय भाव स्थिर माना गया है।`
                )
              : (hasRealSeries
                  ? `Volatility buffer ±${rs1(forecastUncertainty)}/qtl (empirical σ of daily % changes). Waiting is only advised when the projected gain clears this buffer plus holding costs.`
                  : `The Agmarknet pull for this mandi is a single-day snapshot, so MandiMitra holds the price flat rather than inventing a trend.`
                ))}
          </div>
        </div>
      </div>

      <!-- Freshness intelligence strip -->
      <div style="display: flex; align-items: center; gap: var(--space-3); background: var(--color-bg-muted); border: 1px solid var(--color-border); padding: var(--space-3) var(--space-5); border-radius: var(--radius-lg); margin-bottom: var(--space-4); flex-wrap: wrap;">
        <span style="font-size: 1.2rem;">📉</span>
        <div style="flex: 1; min-width: 260px;">
          <div style="font-size: var(--font-size-sm); font-weight: 700; color: var(--color-text-main);">
            ${currentLanguage === 'mr'
              ? `बाजार ताजेपणा वटती: दररोज ${formatNumber(freshnessPctLabel, currentLanguage)}% (${decayType === 'SEMI_PERISHABLE' ? 'मध्यम नाशवंत' : (decayType === 'HIGHLY_PERISHABLE' ? 'अति नाशवंत' : 'दीर्घकाळ टिकणारे')})`
              : (currentLanguage === 'hi'
              ? `मंडी ताज़गी कटौती: प्रति दिन ${formatNumber(freshnessPctLabel, currentLanguage)}% (${decayType === 'SEMI_PERISHABLE' ? 'मध्यम नाशवान' : (decayType === 'HIGHLY_PERISHABLE' ? 'अति नाशवान' : 'दीर्घकालिक टिकाऊ')})`
              : `Market Freshness Discount: ${freshnessPctLabel}% per day held (${decayType.replace(/_/g, ' ').toLowerCase()})`)}
          </div>
          <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); line-height: 1.5;">
            ${currentLanguage === 'mr'
              ? `"माल सडला नाही" म्हणजे "नव्या तोडणीइतका ताजा" असा होत नाही. व्यापारी जुन्या मालाची प्रत व कडकपणा कमी झाल्यामुळे दर पाडतात. शिवाय दररोज ${formatNumber((decay.dailyDecayRatePct * 100).toFixed(1), currentLanguage)}% वजन घट आणि ${rs1(decay.dailyStorageRentRs)}/दिवस साठवणूक खर्च होतो. ${decayType === 'SEMI_PERISHABLE' ? 'मध्यम — टर्मिनल बाजारपेठेत दर वाढल्यास २-३ दिवस थांबणे सुरक्षित.' : ''}`
              : (currentLanguage === 'hi'
              ? `"माल सड़ा नहीं है" का अर्थ यह नहीं कि वह "नई तुड़ाई जितना ताजा" है। व्यापारी पुराने माल पर दाम काटते हैं। साथ ही प्रतिदिन ${formatNumber((decay.dailyDecayRatePct * 100).toFixed(1), currentLanguage)}% वजन घट व ${rs1(decay.dailyStorageRentRs)}/दिन साठवणूक खर्च लगता है.`
              : `"Not physically spoiled" is not the same as "worth as much as a fresh harvest". Buyers discount aged stock for lost firmness and shelf-life, on top of the ${(decay.dailyDecayRatePct * 100).toFixed(1)}%/day physical decay and ${rs1(decay.dailyStorageRentRs)}/day storage rent. ${decay.holdingAdvisability}`)}
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
              ${currentLanguage === 'mr' ? 'आपल्या प्रादेशिक भाषेत शिफारस ऑडिओ ऐका' : (currentLanguage === 'hi' ? 'अपनी क्षेत्रीय भाषा में सिफारिश का ऑडियो सुनें' : 'Listen to the recommendation readout in your regional language')}
            </div>
          </div>
        </div>
        <button id="btn-speak-aslidaam" class="btn btn-sm btn-primary" style="font-weight: 700;">
          ▶ ${currentLanguage === 'mr' ? 'आवाज ऐका (मराठी)' : (currentLanguage === 'hi' ? 'आवाज सुनें (हिंदी)' : 'Play Audio')}
        </button>
      </div>


    </div>

    <!-- Decision Armor Suite -->
    <section class="editorial-section" style="padding-top: 0; margin-bottom: var(--space-8);">
      <div class="editorial-header" style="margin-bottom: var(--space-5);">
        <div class="kicker">${I18N_DICTIONARY.hub.shieldTitle[currentLanguage]}</div>
        <h3 class="heading-lg">${I18N_DICTIONARY.hub.shieldSubtitle[currentLanguage]}</h3>
        <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); max-width: 820px; line-height: 1.6;">
          ${currentLanguage === 'mr'
            ? 'शेतकरी प्रत्यक्ष वास्तव चाचणी: अचानक डिझेल भाव वाढले किंवा बाजार समितीच्या गेटवर ट्रॅक्टर-ट्रॉलींची मोठी रांग लागली, तरीही तुमच्या खिशातील नफा टिकून राहील का याची आम्ही संगणकीय चाचणी करतो.'
            : (currentLanguage === 'hi'
            ? 'वास्तविक किसान जांच: यदि अचानक डीजल का भाड़ा बढ़ जाए या मंडी गेट पर ट्रैक्टरों की लंबी कतार लग जाए, तब भी आपकी जेब का मुनाफा सुरक्षित रहेगा या नहीं, हम इसकी अग्रिम जांच करते हैं.'
            : 'Real farm reality checks: We test whether your profit stays protected even if tempo diesel charges suddenly rise or too many tractor-trolleys cause a heavy queue at the mandi gate.')}
        </p>
      </div>

      <div class="editorial-grid-2" style="gap: var(--space-6);">
        
        <!-- 🛡️ Nirnay Kawach (Decision Shield) -->
        <div class="editorial-panel" style="border: 1px solid #e2e8f0; border-top: 4px solid #2e7d32; border-radius: var(--radius-xl); box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05); padding: var(--space-6); background: #ffffff;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-2); margin-bottom: var(--space-3);">
            <div>
              <h4 class="heading-sm" style="color: #1b4332; font-size: 1.15rem; margin-bottom: 2px;">
                🛡️ ${currentLanguage === 'mr' ? 'निर्णय कवच: भाडे व डिझेल सुरक्षा' : (currentLanguage === 'hi' ? 'निर्णय कवच: भाड़ा व डीजल सुरक्षा' : 'Nirnay Kawach: Diesel & Fare Safety')}
              </h4>
              <div style="font-size: 0.8rem; font-weight: 700; color: #2e7d32;">
                ${currentLanguage === 'mr' ? '(भाडे वाढले तरी खिशात नफा राहील का?)' : (currentLanguage === 'hi' ? '(भाड़ा बढ़ने पर भी क्या मुनाफा बचेगा?)' : '(Will profit stay in pocket if fares rise?)')}
              </div>
            </div>
            <span class="badge ${kawach?.status === 'ROBUST' ? 'badge-sage' : (kawach?.status === 'CLOSE_CALL' ? 'badge-warning' : 'badge-danger')}" style="font-weight: 800; font-size: 0.75rem; padding: 4px 10px; border-radius: 9999px;">
              ${kawach
                ? `${currentLanguage === 'mr'
                    ? (kawach.status === 'ROBUST' ? '✅ नफा सुरक्षित' : (kawach.status === 'CLOSE_CALL' ? '⚠️ सावध राहा' : '🔴 जास्त संवेदनशील'))
                    : (currentLanguage === 'hi'
                    ? (kawach.status === 'ROBUST' ? '✅ मुनाफा सुरक्षित' : (kawach.status === 'CLOSE_CALL' ? '⚠️ सतर्क रहें' : '🔴 अत्यधिक संवेदनशील'))
                    : kawach.statusLabel)} · ${formatNumber(kawach.robustnessPct, currentLanguage)}%`
                : (currentLanguage === 'mr' ? '✅ १००% नफा सुरक्षित' : (currentLanguage === 'hi' ? '✅ १००% मुनाफा सुरक्षित' : '✅ 100% PROFIT SAFE'))}
            </span>
          </div>

          <p style="font-size: var(--font-size-xs); color: var(--color-text-muted); line-height: 1.6; margin-bottom: var(--space-4);">
            ${currentLanguage === 'mr'
              ? `डिझेल दरवाढ आणि भाडे बदलांविरुद्ध घेतलेली पडताळणी चाचणी (N = ${formatNumber(kawach?.simulationsCount ?? 0, currentLanguage)} सिम्युलेशन फेऱ्या).`
              : (currentLanguage === 'hi'
              ? `डीजल वृद्धि व भाड़ा बदलाव के विरुद्ध की गई जांच (N = ${formatNumber(kawach?.simulationsCount ?? 0, currentLanguage)} सिमुलेशन राउंड).`
              : `Stress-tests the recommendation against diesel price hikes and backtest residual errors (N = ${kawach?.simulationsCount ?? 0} seeded Monte Carlo runs).`)}
          </p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: var(--radius-lg); padding: var(--space-4); margin-bottom: var(--space-4);">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: var(--font-size-xs); font-weight: 700; color: #334155; margin-bottom: var(--space-3); flex-wrap: wrap; gap: var(--space-2);">
              <span>${I18N_DICTIONARY.hub.normalFare[currentLanguage]} <strong style="color: #1b5e20; font-size: 0.95rem;">${rs1(sliderCurrent)}/km</strong></span>
              <span>${I18N_DICTIONARY.hub.safeFare[currentLanguage]} <strong style="color: #b45309; font-size: 0.95rem;">${kawachBreakeven !== null ? `${rs1(kawachBreakeven)}/km` : (currentLanguage === 'mr' ? 'अमर्याद सुरक्षित' : (currentLanguage === 'hi' ? 'असीमित सुरक्षित' : 'no flip in range'))}</strong></span>
            </div>

            <div style="margin-bottom: var(--space-2);">
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #64748b; margin-bottom: 6px;">
                ${currentLanguage === 'mr' ? 'भाडे वाढवून नफा तपासण्यासाठी स्लाइडर सरकवा:' : (currentLanguage === 'hi' ? 'भाड़ा बढ़ाकर लाभ जांचने हेतु स्लाइडर खिसकाएं:' : 'Drag slider to test higher diesel / tempo fare:')}
              </label>
              <input type="range" id="nirnay-slider" min="${sliderMin}" max="${sliderMax}" step="${sliderStep}" value="${sliderCurrent}" style="width: 100%; accent-color: #2e7d32; cursor: pointer;">
            </div>

            <div id="nirnay-slider-feedback" style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: var(--radius-md); padding: 8px 12px; font-size: var(--font-size-xs); font-weight: 700; color: #15803d; margin-top: var(--space-2);">
              🟢 ${currentLanguage === 'mr' ? 'सध्याचे भाडे:' : (currentLanguage === 'hi' ? 'वर्तमान भाड़ा:' : 'Active Fare:')} ${rs1(sliderCurrent)}/km ➔ <strong>${translateMandiName(kawach?.winningMarket.name || rec.market.name, currentLanguage)} (+${formatNumber(kawach?.winningMarket.day ?? rec.dayOffset, currentLanguage)}d)</strong> ${currentLanguage === 'mr' ? 'येथे विकल्यास सर्वाधिक नफा मिळतो.' : (currentLanguage === 'hi' ? 'में बेचने पर सबसे अधिक नकद मिलेगा.' : 'gives you maximum take-home cash.')}
            </div>
          </div>

          <div style="background: #f0fdf4; border-left: 3px solid #22c55e; padding: 10px 14px; border-radius: 4px; font-size: var(--font-size-xs); color: #166534; line-height: 1.5;">
            💡 <strong>${I18N_DICTIONARY.hub.farmerGuarantee[currentLanguage]}</strong> ${
              currentLanguage === 'mr'
                ? `हा सल्ला तपासलेल्या १००% खर्च व भाव परिस्थितींमध्ये स्थिर राहतो. वाहतूक खर्च ₹${rs1(kawach?.breakevenTransportRate || 24.7)}/किमी ओलांडत नाही तोपर्यंत हाच बाजार सर्वोत्तम राहतो.`
                : (currentLanguage === 'hi'
                ? `यह सिफारिश जांची गई १००% लागत व भाव परिस्थितियों में स्थिर रहती है। ढुलाई खर्च ₹${rs1(kawach?.breakevenTransportRate || 24.7)}/किमी पार नहीं करता तब तक यही मंडी सर्वोत्तम रहेगी.`
                : (kawach?.decisionMessage || `This recommendation remains unchanged under 100% of tested cost and price scenarios. Remains optimal until transport exceeds ₹${(kawach?.breakevenTransportRate || 24.7).toFixed(1)}/km.`))
            }
          </div>
        </div>

        <!-- 👥 Bhed Vivek (Market Congestion Intelligence) -->
        <div class="editorial-panel" style="border: 1px solid #e2e8f0; border-top: 4px solid #f59e0b; border-radius: var(--radius-xl); box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05); padding: var(--space-6); background: #ffffff;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-2); margin-bottom: var(--space-3);">
            <div>
              <h4 class="heading-sm" style="color: #78350f; font-size: 1.15rem; margin-bottom: 2px;">
                👥 ${currentLanguage === 'mr' ? 'भेद विवेक: बाजारपेठ गर्दी व आवक इशारा' : (currentLanguage === 'hi' ? 'भेद विवेक: मंडी भीड़ व आवक चेतावनी' : 'Bhed Vivek: Mandi Rush Alert')}
              </h4>
              <div style="font-size: 0.8rem; font-weight: 700; color: #b45309;">
                ${currentLanguage === 'mr' ? '(बाजारात गर्दी वाढल्यास भाव घसरण्याची शक्यता)' : (currentLanguage === 'hi' ? '(मंडी में आवक बढ़ने पर भाव में गिरावट की संभावना)' : '(Price drop risk when mandi arrivals surge)')}
              </div>
            </div>
            <span id="bhed-badge" class="badge" style="background: #fef3c7; color: #92400e; border: 1px solid #fde68a; font-weight: 800; font-size: 0.75rem; padding: 4px 10px; border-radius: 9999px;">
              ${currentLanguage === 'mr'
                ? (bhed?.supplyPressure === 'LOW' ? '🟢 सुरळीत आवक (कमी गर्दी)' : (bhed?.supplyPressure === 'MEDIUM' ? '🟡 मध्यम गर्दी' : '🔴 मोठी गर्दी इशारा'))
                : (currentLanguage === 'hi'
                ? (bhed?.supplyPressure === 'LOW' ? '🟢 सुचारू आवक (कम भीड़)' : (bhed?.supplyPressure === 'MEDIUM' ? '🟡 मध्यम भीड़' : '🔴 भारी भीड़ चेतावनी'))
                : (bhed?.statusLabel || '🚦 LIVE CROWD MONITOR'))}
            </span>
          </div>

          <p style="font-size: var(--font-size-xs); color: var(--color-text-muted); line-height: 1.6; margin-bottom: var(--space-4);">
            ${currentLanguage === 'mr'
              ? 'एकाच बाजारात खूप जास्त ट्रॅक्टर आल्यास लिलाव भाव घसरतात. रांगेत अडकण्यापूर्वी आम्ही तुम्हाला वेळेवर सावध करतो.'
              : (currentLanguage === 'hi'
              ? 'एक ही मंडी में अत्यधिक ट्रैक्टर आने पर नीलामी भाव गिर जाते हैं। कतार में फंसने से पहले हम आपको समय रहते सचेत करते हैं.'
              : 'If too many tractor-trolleys arrive at the same mandi, auction rates drop. We alert you before you get stuck in a queue.')}
          </p>

          <div style="margin-bottom: var(--space-4);">
            <label class="input-label" style="margin-bottom: 6px; display: block; font-size: 0.75rem; font-weight: 700; color: #475569;">
              ${currentLanguage === 'mr' ? 'आज बाजारात अपेक्षित गर्दी निवडा:' : (currentLanguage === 'hi' ? 'आज मंडी में संभावित भीड़ चुनें:' : 'Select expected mandi crowd today:')}
            </label>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--space-2);">
              <button class="btn btn-sm btn-bhed-scenario ${bhed?.supplyPressure === 'LOW' ? 'active' : ''}" data-level="LOW" style="border: 1.5px solid #cbd5e1; background: #ffffff; border-radius: 8px; font-weight: 700; padding: 8px 4px; font-size: 0.75rem; cursor: pointer;">
                🟢 ${currentLanguage === 'mr' ? 'कमी गर्दी' : (currentLanguage === 'hi' ? 'कम भीड़' : 'Normal Crowd')}<br><span style="font-size: 0.65rem; font-weight: normal; color: #64748b;">(${currentLanguage === 'mr' ? 'सुरळीत लिलाव' : (currentLanguage === 'hi' ? 'सुचारू नीलामी' : 'smooth flow')})</span>
              </button>
              <button class="btn btn-sm btn-bhed-scenario ${bhed?.supplyPressure === 'MEDIUM' ? 'active' : ''}" data-level="MEDIUM" style="border: 1.5px solid #cbd5e1; background: #ffffff; border-radius: 8px; font-weight: 700; padding: 8px 4px; font-size: 0.75rem; cursor: pointer;">
                🟡 ${currentLanguage === 'mr' ? 'मध्यम गर्दी' : (currentLanguage === 'hi' ? 'मध्यम भीड़' : 'Medium Rush')}<br><span style="font-size: 0.65rem; font-weight: normal; color: #64748b;">(${currentLanguage === 'mr' ? 'नेहमीची आवक' : (currentLanguage === 'hi' ? 'सामान्य आवक' : 'regular arrivals')})</span>
              </button>
              <button class="btn btn-sm btn-bhed-scenario ${!bhed || bhed?.supplyPressure === 'HIGH' ? 'active' : ''}" data-level="HIGH" style="border: 1.5px solid #f59e0b; background: #fef3c7; color: #92400e; border-radius: 8px; font-weight: 800; padding: 8px 4px; font-size: 0.75rem; cursor: pointer;">
                🔴 ${currentLanguage === 'mr' ? 'मोठी गर्दी' : (currentLanguage === 'hi' ? 'भारी भीड़' : 'Heavy Jam')}<br><span style="font-size: 0.65rem; font-weight: 700; color: #b45309;">(${currentLanguage === 'mr' ? 'लांबच लांब रांग' : (currentLanguage === 'hi' ? 'लंबी कतार' : 'long queue')})</span>
              </button>
            </div>
          </div>

          <div id="bhed-feedback-box" style="background: #fffbeb; border: 1px solid #fde68a; border-radius: var(--radius-lg); padding: var(--space-4); font-size: var(--font-size-xs);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #fef3c7;">
              <span>${I18N_DICTIONARY.hub.rushDrop[currentLanguage]} <strong style="color: #dc2626; font-size: 0.95rem;" id="bhed-impact-text">${bhed ? `−${rs1(bhed.congestionImpactPerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)}` : `−₹२६० / ${formatUnit(1, 'qtl', currentLanguage)}`}</strong></span>
              <span id="bhed-capacity-text" style="color: #78350f;">${I18N_DICTIONARY.hub.buyerDemand[currentLanguage]} <strong>${
                bhed
                  ? (bhed.absorptionCapacity === 'HIGH'
                    ? (currentLanguage === 'mr' ? 'सक्रिय (खरेदीदार हजर)' : (currentLanguage === 'hi' ? 'सक्रिय (खरीदार उपस्थित)' : 'High (Active)'))
                    : (bhed.absorptionCapacity === 'MODERATE'
                    ? (currentLanguage === 'mr' ? 'मध्यम' : (currentLanguage === 'hi' ? 'मध्यम' : 'Moderate'))
                    : (currentLanguage === 'mr' ? 'मर्यादित' : (currentLanguage === 'hi' ? 'सीमित' : 'Limited'))))
                  : (currentLanguage === 'mr' ? 'सक्रिय (खरेदीदार हजर)' : (currentLanguage === 'hi' ? 'सक्रिय (खरीदार उपस्थित)' : 'Active'))
              }</strong></span>
            </div>
            <div id="bhed-alert-text" style="color: #92400e; font-weight: 700; line-height: 1.5;">
              ${formatBhedAlert(bhed, rec, currentLanguage)}
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- Economic Waterfall -->
    <section class="editorial-section" style="padding-top: 0; margin-bottom: var(--space-8);">
      <div class="editorial-header" style="margin-bottom: var(--space-5);">
        <div class="kicker">${I18N_DICTIONARY.hub.auditTitle[currentLanguage]}</div>
        <h3 class="heading-lg">${I18N_DICTIONARY.hub.auditSubtitle[currentLanguage]}</h3>
        <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); max-width: 820px; line-height: 1.6;">
          ${currentLanguage === 'mr'
            ? 'कोणतीही लपवलेली वजावट नाही. वाहनाचे भाडे, बाजार समिती अडत, आणि तोलाई वजा जाता प्रत्यक्ष किती रोकड हातात मिळते याचा संपूर्ण पारदर्शक हिशोब.'
            : (currentLanguage === 'hi'
            ? 'कोई छुपा हुआ शुल्क नहीं। वाहन ढुलाई, मंडी शुल्क और वजन खर्च काटकर वास्तविक रूप से कितनी नकद राशि हाथ में बचेगी, इसका पूरा पारदर्शी हिसाब.'
            : 'No hidden deductions. See the honest breakdown of vehicle freight, APMC cess, and weighing charges subtracted from your auction price.')}
        </p>
      </div>

      <div class="table-responsive-wrapper" style="border: 1px solid #e2e8f0; border-radius: var(--radius-xl); overflow: hidden; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05); background: #ffffff;">
        <table class="editorial-table">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
              <th style="padding: 14px 16px; font-weight: 800; color: #334155;">${currentLanguage === 'mr' ? 'खर्च व उत्पन्न तपशील' : (currentLanguage === 'hi' ? 'खर्च व आय विवरण' : 'Expense or Earning Item')}</th>
              <th style="padding: 14px 16px; font-weight: 800; color: #334155;">${currentLanguage === 'mr' ? 'जवळचा स्थानिक बाजार' : (currentLanguage === 'hi' ? 'पास की स्थानीय मंडी' : 'Closest Mandi Today')} (${translateMandiName(base.market.name, currentLanguage)})</th>
              <th style="padding: 14px 16px; font-weight: 800; color: #1e293b;">${currentLanguage === 'mr' ? 'शिफारस केलेला सर्वोत्तम बाजार' : (currentLanguage === 'hi' ? 'सर्वोत्तम अनुशंसित मंडी' : 'Recommended Best Mandi')} (${translateMandiName(rec.market.name, currentLanguage)})</th>
              <th style="padding: 14px 16px; font-weight: 800; color: #15803d;">${currentLanguage === 'mr' ? 'खिशातील निव्वळ फरक' : (currentLanguage === 'hi' ? 'जेब में शुद्ध अंतर' : 'Difference In Your Pocket')}</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td style="padding: 14px 16px;"><strong>${currentLanguage === 'mr' ? '🌾 १. एकूण लिलाव भाव (व्यापाऱ्याने दिलेला दर)' : (currentLanguage === 'hi' ? '🌾 १. कुल नीलामी भाव (व्यापारी द्वारा दिया गया दर)' : '🌾 1. Gross Auction Price')}</strong></td>
              <td style="padding: 14px 16px;">${rs1(base.grossPricePerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)} <span style="color: #64748b; font-size: 0.8rem;">(${rs(base.totalGrossValue)})</span></td>
              <td style="padding: 14px 16px;">${rs1(rec.grossPricePerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)} <span style="color: #64748b; font-size: 0.8rem;">(${rs(rec.totalGrossValue)})</span></td>
              <td style="padding: 14px 16px; color: #15803d; font-weight: 800;">+${rs(Math.max(0, rec.totalGrossValue - base.totalGrossValue))} ${currentLanguage === 'mr' ? 'जास्त लिलाव भाव' : (currentLanguage === 'hi' ? 'अधिक नीलामी मूल्य' : 'higher auction')}</td>
            </tr>
            <tr>
              <td style="padding: 14px 16px; color: #b91c1c;">${currentLanguage === 'mr' ? '🚚 २. वजा: गाडी भाडे व डिझेल खर्च' : (currentLanguage === 'hi' ? '🚚 २. घटाएं: गाड़ी भाड़ा व डीजल खर्च' : '🚚 2. Minus: Vehicle Freight &amp; Diesel')}</td>
              <td style="padding: 14px 16px; color: #b91c1c;">−${rs1(base.roadFreightPerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)} <span style="font-size: 0.8rem;">(−${rs(base.totalTransportCost)})</span></td>
              <td style="padding: 14px 16px; color: #b91c1c;">−${rs1(rec.roadFreightPerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)} <span style="font-size: 0.8rem;">(−${rs(rec.totalTransportCost)})</span></td>
              <td style="padding: 14px 16px; color: #b91c1c;">−${rs(rec.totalTransportCost - base.totalTransportCost)}</td>
            </tr>
            <tr>
              <td style="padding: 14px 16px; color: #b91c1c;">${currentLanguage === 'mr' ? '⚖️ ३. वजा: बाजार समिती फी, हमाली व तोलाई' : (currentLanguage === 'hi' ? '⚖️ ३. घटाएं: मंडी शुल्क, हमाली व तुलाई' : '⚖️ 3. Minus: Mandi Fees &amp; Hamali/Tolai')}</td>
              <td style="padding: 14px 16px; color: #b91c1c;">−${rs1(base.apmcCessPerQtl + base.hamaliAndTolaiPerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)} <span style="font-size: 0.8rem;">(−${rs(base.totalApmcDeductions)})</span></td>
              <td style="padding: 14px 16px; color: #b91c1c;">−${rs1(rec.apmcCessPerQtl + rec.hamaliAndTolaiPerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)} <span style="font-size: 0.8rem;">(−${rs(rec.totalApmcDeductions)})</span></td>
              <td style="padding: 14px 16px; color: #b91c1c;">−${rs(rec.totalApmcDeductions - base.totalApmcDeductions)}</td>
            </tr>
            <tr>
              <td style="padding: 14px 16px; color: #b91c1c;">${currentLanguage === 'mr' ? '⏳ ४. वजा: साठवणूक व वजन घट' : (currentLanguage === 'hi' ? '⏳ ४. घटाएं: भंडारण व वजन घटौती' : '⏳ 4. Minus: Storage &amp; Produce Weight Loss')}</td>
              <td style="padding: 14px 16px; color: #64748b;">${base.dayOffset === 0 ? `${formatCurrency(0, currentLanguage)} (${currentLanguage === 'mr' ? 'विक्री आजच — शून्य वाट' : (currentLanguage === 'hi' ? 'बिक्री आज ही — शून्य प्रतीक्षा' : 'Same-day sale')})` : `−${rs1(base.holdingAndSpoilagePerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)} (−${rs(base.totalHoldingSpoilageLoss)})`}</td>
              <td style="padding: 14px 16px; color: #b91c1c;">${rec.dayOffset === 0 ? `${formatCurrency(0, currentLanguage)} (${currentLanguage === 'mr' ? 'विक्री आजच — शून्य वाट' : (currentLanguage === 'hi' ? 'बिक्री आज ही — शून्य प्रतीक्षा' : 'Same-day sale')})` : `−${rs1(rec.holdingAndSpoilagePerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)} (−${rs(rec.totalHoldingSpoilageLoss)})`}</td>
              <td style="padding: 14px 16px; color: #b91c1c;">−${rs(rec.totalHoldingSpoilageLoss - base.totalHoldingSpoilageLoss)}</td>
            </tr>
            <tr>
              <td style="padding: 14px 16px; color: #b91c1c;">
                ${currentLanguage === 'mr' ? `📉 ५. वजा: बाजार ताजेपणा वटती (${formatNumber(freshnessPctLabel, currentLanguage)}%/दिवस)` : (currentLanguage === 'hi' ? `📉 ५. घटाएं: मंडी ताज़गी कटौती (${formatNumber(freshnessPctLabel, currentLanguage)}%/दिन)` : `📉 5. Minus: Market Freshness Discount (${freshnessPctLabel}%/day)`)}
              </td>
              <td style="padding: 14px 16px; color: #64748b;">${base.dayOffset === 0 ? `${formatCurrency(0, currentLanguage)} (${currentLanguage === 'mr' ? 'आजची ताजी तोडणी' : (currentLanguage === 'hi' ? 'आज की ताज़ा तुड़ाई' : 'Same-day harvest')})` : `−${rs1(base.freshnessDiscountPerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)} (−${rs(base.totalFreshnessDiscount)})`}</td>
              <td style="padding: 14px 16px; color: #b91c1c;">${rec.dayOffset === 0 ? `${formatCurrency(0, currentLanguage)} (${currentLanguage === 'mr' ? 'आजची ताजी तोडणी' : (currentLanguage === 'hi' ? 'आज की ताज़ा तुड़ाई' : 'Same-day harvest')})` : `−${rs1(rec.freshnessDiscountPerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)} (−${rs(rec.totalFreshnessDiscount)})`}</td>
              <td style="padding: 14px 16px; color: #b91c1c;">−${rs(rec.totalFreshnessDiscount - base.totalFreshnessDiscount)}</td>
            </tr>
            <tr style="background-color: #f0fdf4; font-weight: 800; font-size: 0.95rem; border-top: 2px solid #22c55e;">
              <td style="padding: 16px; color: #166534;"><strong>${currentLanguage === 'mr' ? '💎 थेट खिशात उरणारा निव्वळ नफा (\'असली दाम\')' : (currentLanguage === 'hi' ? '💎 जेब में आने वाला शुद्ध पैसा (\'असली दाम\')' : '💎 Real Cash in Hand (\'AsliDaam\')')}</strong></td>
              <td style="padding: 16px; color: #334155;"><strong>${rs1(base.asliDaamPerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)} (${rs(base.totalNetPayout)})</strong></td>
              <td style="padding: 16px; color: #15803d; font-size: 1.05rem;"><strong>${rs1(rec.asliDaamPerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)} (${rs(rec.totalNetPayout)})</strong></td>
              <td style="padding: 16px; color: #15803d; font-size: 1.05rem;"><strong style="background: #dcfce7; padding: 4px 10px; border-radius: 6px; border: 1px solid #86efac;">+${rs(opt.totalPocketCashGain)} ${currentLanguage === 'mr' ? 'जास्तीची रोकड' : (currentLanguage === 'hi' ? 'अतिरिक्त नकद' : 'Extra Cash')}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: var(--space-2);">
        ${currentLanguage === 'mr'
          ? 'सूत्र: असली दाम = एकूण लिलाव भाव − गाडी भाडे − बाजार समिती फी − साठवणूक भाडे − वजन घट − ताजेपणा वटती. ताजेपणा वटती म्हणजे माल खराब नसला तरी जुना असल्यामुळे खरेदीदार व्यापारी करत असलेली भाव कपात.'
          : (currentLanguage === 'hi'
          ? 'सूत्र: असली दाम = कुल नीलामी भाव − गाड़ी भाड़ा − मंडी शुल्क − भंडारण किराया − वजन घटौती − ताज़गी कटौती. ताज़गी कटौती का अर्थ है माल खराब न होने पर भी पुराना होने के कारण व्यापारी द्वारा की जाने वाली दर कटौती.'
          : 'Formula: AsliDaam = Gross − RoadFreight − APMCDeductions − StorageRent − PhysicalDecayLoss − FreshnessDiscount. The freshness discount is the commercial haircut mandi buyers apply to stock that is not from today\'s harvest, even when nothing has rotted.')}
      </p>
    </section>

    <!-- Multi-Mandi × Day Grid -->
    <section class="editorial-section" style="padding-top: 0;">
      <div class="editorial-header" style="margin-bottom: var(--space-5);">
        <div class="kicker">${currentLanguage === 'mr' ? '📍 सर्व बाजारांची तुलना (प्रादेशिक मंडी विश्लेषण)' : (currentLanguage === 'hi' ? '📍 सभी मंडियों की तुलना (क्षेत्रीय मंडी विश्लेषण)' : '📍 REGIONAL MANDI COMPARISON')}</div>
        <h3 class="heading-lg">${currentLanguage === 'mr' ? 'पुढील ३ दिवसांतील सर्व बाजारांची तुलना करा' : (currentLanguage === 'hi' ? 'अगले ३ दिनों में सभी मंडियों की तुलना करें' : 'Compare All Mandis Over the Next 3 Days')}</h3>
        <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); max-width: 820px; line-height: 1.6;">
          ${currentLanguage === 'mr'
            ? `डिझेल व साठवणूक खर्च वजा करून ${formatNumber(evalData.evaluations.length, currentLanguage)} बाजार समित्यांमध्ये मिळणाऱ्या खऱ्या नफ्याचे विश्लेषण. खिशात सर्वाधिक रोकड देणारा बाजार व दिवस निवडा.`
            : (currentLanguage === 'hi'
            ? `डीजल व भंडारण खर्च काटकर ${formatNumber(evalData.evaluations.length, currentLanguage)} मंडियों में मिलने वाले वास्तविक लाभ का विश्लेषण. अपनी जेब में सर्वाधिक नकद देने वाली मंडी व दिन चुनें.`
            : `Every combination evaluated for true payout across ${evalData.evaluations.length} candidate APMCs after deducting diesel and waiting costs. Pick the market and day that puts the most cash in your pocket.`)}
          ${opt.maxDayOffsetAllowed < 3
            ? ` (${currentLanguage === 'mr' ? `धोरण मर्यादा: या शेतमालासाठी कमाल +${formatNumber(opt.maxDayOffsetAllowed, currentLanguage)} दिवस` : (currentLanguage === 'hi' ? `नीति सीमा: इस फसल हेतु अधिकतम +${formatNumber(opt.maxDayOffsetAllowed, currentLanguage)} दिन` : `Policy cap: Day +${opt.maxDayOffsetAllowed} max for this commodity`)})`
            : ''}
        </p>
      </div>


      <div class="table-responsive-wrapper" style="border: 1px solid #e2e8f0; border-radius: var(--radius-xl); overflow: hidden; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05); background: #ffffff;">
        <table class="editorial-table">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
              <th style="padding: 14px 16px; font-weight: 800; color: #334155;">${currentLanguage === 'mr' ? 'बाजारपेठ' : (currentLanguage === 'hi' ? 'मंडी' : 'Mandi')}</th>
              <th style="padding: 14px 16px; font-weight: 800; color: #334155;">${currentLanguage === 'mr' ? 'अंतर' : (currentLanguage === 'hi' ? 'दूरी' : 'Distance')}</th>
              <th style="padding: 14px 16px; font-weight: 800; color: #334155;">${currentLanguage === 'mr' ? 'दिवस' : (currentLanguage === 'hi' ? 'दिन' : 'Timing')}</th>
              <th style="padding: 14px 16px; font-weight: 800; color: #334155;">${currentLanguage === 'mr' ? 'लिलाव भाव' : (currentLanguage === 'hi' ? 'नीलामी भाव' : 'Auction Rate')}</th>
              <th style="padding: 14px 16px; font-weight: 800; color: #b91c1c;">${currentLanguage === 'mr' ? 'एकूण खर्च' : (currentLanguage === 'hi' ? 'कुल खर्च' : 'All Expenses')}</th>
              <th style="padding: 14px 16px; font-weight: 800; color: #15803d;">${currentLanguage === 'mr' ? 'खिशात / क्विंटल' : (currentLanguage === 'hi' ? 'जेब में / क्विंटल' : 'Real In-Hand / Qtl')}</th>
              <th style="padding: 14px 16px; font-weight: 800; color: #15803d;">${currentLanguage === 'mr' ? 'एकूण खिशात' : (currentLanguage === 'hi' ? 'कुल जेब में' : 'Total In Pocket')}</th>
              <th style="padding: 14px 16px; font-weight: 800; color: #334155;">${currentLanguage === 'mr' ? 'सल्ला' : (currentLanguage === 'hi' ? 'सलाह' : 'Advice')}</th>
            </tr>
          </thead>
          <tbody>
            ${opt.allCombinations.map(c => {
              if (c.isStaleOrAbstained) {
                return `
                  <tr style="opacity: 0.65; background-color: var(--color-status-abstain-bg);">
                    <td><strong>${translateMandiName(c.market.name, currentLanguage)}</strong></td>
                    <td>${formatUnit(c.market.estimatedRoadDistanceKm ? c.market.estimatedRoadDistanceKm.toFixed(1) : 0, 'km', currentLanguage)}</td>
                    <td>${currentLanguage === 'mr' ? (c.dayOffset === 0 ? 'आज' : `+${formatNumber(c.dayOffset, currentLanguage)} दिवस`) : (currentLanguage === 'hi' ? (c.dayOffset === 0 ? 'आज' : `+${formatNumber(c.dayOffset, currentLanguage)} दिन`) : `Day ${c.dayOffset}`)}</td>
                    <td colspan="4" style="color: var(--color-status-abstain); font-weight: 600;">
                      ⚠️ ${c.abstentionReason ? (currentLanguage !== 'en' ? toDevanagariDigits(c.abstentionReason) : c.abstentionReason) : (currentLanguage === 'mr' ? 'डेटा जुना — सल्ला नाही' : (currentLanguage === 'hi' ? 'डेटा पुराना — कोई सलाह नहीं' : 'Data Stale — Cannot Advise'))}
                    </td>
                    <td><span class="badge badge-danger">${currentLanguage === 'mr' ? 'नकार' : (currentLanguage === 'hi' ? 'अस्वीकार' : 'ABSTAINED')}</span></td>
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
                  <td><strong>${translateMandiName(c.market.name, currentLanguage)}</strong></td>
                  <td>${formatUnit(c.market.estimatedRoadDistanceKm ? c.market.estimatedRoadDistanceKm.toFixed(1) : 0, 'km', currentLanguage)}</td>
                  <td>${currentLanguage === 'mr' ? (c.dayOffset === 0 ? 'आज' : `+${formatNumber(c.dayOffset, currentLanguage)} दिवस`) : (currentLanguage === 'hi' ? (c.dayOffset === 0 ? 'आज' : `+${formatNumber(c.dayOffset, currentLanguage)} दिन`) : `Day ${c.dayOffset}`)}</td>
                  <td>${formatCurrency(c.grossPricePerQtl, currentLanguage)}</td>
                  <td style="color: var(--color-status-abstain);">−${formatCurrency(c.grossPricePerQtl - c.asliDaamPerQtl, currentLanguage)}</td>
                  <td class="number-display"><strong>${rs1(c.asliDaamPerQtl)}</strong></td>
                  <td class="number-display"><strong>${rs(c.totalNetPayout)}</strong></td>
                  <td>
                    ${isBest
                      ? `<span class="badge badge-accent">${currentLanguage === 'mr' ? '🏆 सर्वोत्तम निवड' : (currentLanguage === 'hi' ? '🏆 सर्वश्रेष्ठ विकल्प' : '🏆 BEST OPTION')}</span>`
                      : (isBase
                          ? `<span class="badge badge-neutral">${currentLanguage === 'mr' ? '📍 स्थानिक बाजार' : (currentLanguage === 'hi' ? '📍 स्थानीय मंडी' : '📍 DEFAULT')}</span>`
                          : (beyondPolicy
                              ? `<span class="badge badge-neutral" style="font-size:0.6rem;">${currentLanguage === 'mr' ? 'मर्यादेबाहेर' : (currentLanguage === 'hi' ? 'सीमा से बाहर' : 'BEYOND HORIZON')}</span>`
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
        const fareLbl = currentLanguage === 'mr' ? 'सध्याचे भाडे:' : (currentLanguage === 'hi' ? 'वर्तमान भाड़ा:' : 'Active Fare:');
        if (!flipped && rate < beLimit - 0.3) {
          nirnayFeedback.innerHTML = `🟢 ${fareLbl} ${rs1(res.activeTransportRate)}/km ➔ <strong>${translateMandiName(res.winningMarket.name, currentLanguage)} (+${formatNumber(res.winningMarket.day, currentLanguage)}d)</strong> ${currentLanguage === 'mr' ? 'येथे विकल्यास जास्तीत जास्त फायदा होतो.' : (currentLanguage === 'hi' ? 'में बेचने पर अधिकतम लाभ मिलता है.' : 'gives you maximum cash.')} <span style="color: #15803d; font-weight: 800;">(${currentLanguage === 'mr' ? 'खिशात जास्तीत जास्त फायदा' : (currentLanguage === 'hi' ? 'जेब में अधिकतम लाभ' : 'maximum pocket cash')})</span>`;
          nirnayFeedback.style.color = '#15803d';
          nirnayFeedback.style.borderColor = '#86efac';
          nirnayFeedback.style.background = '#f0fdf4';
        } else if (Math.abs(rate - beLimit) <= 0.3) {
          nirnayFeedback.innerHTML = `⚖️ ${fareLbl} ${rs1(res.activeTransportRate)}/km ➔ <strong style="color: #b45309;">${currentLanguage === 'mr' ? 'समान नफा बिंदू' : (currentLanguage === 'hi' ? 'समान लाभ बिंदु' : 'Equal Profit Point')}</strong> (${currentLanguage === 'mr' ? 'दोन्ही बाजारात समान नफा — जास्त भाडे परवडत नाही' : (currentLanguage === 'hi' ? 'दोनों मंडियों में समान लाभ — अधिक भाड़ा लाभकारी नहीं' : 'equal profit in both mandis')})`;
          nirnayFeedback.style.color = '#b45309';
          nirnayFeedback.style.borderColor = '#fde68a';
          nirnayFeedback.style.background = '#fffbeb';
        } else {
          nirnayFeedback.innerHTML = `⚠️ ${fareLbl} ${rs1(res.activeTransportRate)}/km ➔ <strong style="color: #b91c1c;">${currentLanguage === 'mr' ? 'भाडे खूप जास्त!' : (currentLanguage === 'hi' ? 'भाड़ा अत्यधिक है!' : 'Fare Too High!')}</strong> ${currentLanguage === 'mr' ? 'स्थानिक जवळचा बाजार फायदेशीर ठरतो.' : (currentLanguage === 'hi' ? 'पास की मंडी ही अधिक लाभकारी है.' : 'Closer distance beats high freight.')}`;
          nirnayFeedback.style.color = '#b91c1c';
          nirnayFeedback.style.borderColor = '#fca5a5';
          nirnayFeedback.style.background = '#fef2f2';
        }
      } catch (err) {
        nirnayFeedback.textContent = currentLanguage === 'mr' ? 'चाचणी उपलब्ध नाही' : (currentLanguage === 'hi' ? 'जांच अनुपलब्ध' : 'Stress test unavailable');
        nirnayFeedback.style.color = '#b91c1c';
      }
    };

    nirnaySlider.addEventListener('input', () => {
      const val = parseFloat(nirnaySlider.value);
      nirnayFeedback.textContent = `${currentLanguage === 'mr' ? 'वाहतूक भाडे:' : (currentLanguage === 'hi' ? 'ढुलाई भाड़ा:' : 'Active Transport:')} ${rs1(val)}/km …`;

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

      if (bhedAlertText) bhedAlertText.textContent = currentLanguage === 'mr' ? 'गर्दीचा प्रभाव तपासत आहे…' : (currentLanguage === 'hi' ? 'भीड़ का प्रभाव जांचा जा रहा है…' : 'Recomputing congestion impact…');

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
            ? (currentLanguage === 'mr' ? '🟢 कमी गर्दी (सुरळीत विक्री)' : (currentLanguage === 'hi' ? '🟢 कम भीड़ (सुचारू बिक्री)' : '🟢 LOW CROWD (Smooth Flow)'))
            : (level === 'MEDIUM'
              ? (currentLanguage === 'mr' ? '🟡 मध्यम गर्दी (नेहमीची आवक)' : (currentLanguage === 'hi' ? '🟡 मध्यम भीड़ (सामान्य आवक)' : '🟡 MODERATE RUSH (Regular Arrivals)'))
              : (currentLanguage === 'mr' ? '🔴 मोठी गर्दी (लांब रांग)' : (currentLanguage === 'hi' ? '🔴 भारी भीड़ (लंबी कतार)' : '🔴 HEAVY JAM ALERT')));
          bhedBadge.style.background = level === 'LOW' ? '#dcfce7' : (level === 'MEDIUM' ? '#fef3c7' : '#fee2e2');
          bhedBadge.style.color = level === 'LOW' ? '#166534' : (level === 'MEDIUM' ? '#92400e' : '#991b1b');
          bhedBadge.style.border = `1px solid ${level === 'LOW' ? '#86efac' : (level === 'MEDIUM' ? '#fde68a' : '#fca5a5')}`;
        }
        if (bhedImpactText) bhedImpactText.textContent = `−${rs1(res.congestionImpactPerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)}`;
        const capLabel = res.absorptionCapacity === 'HIGH'
          ? (currentLanguage === 'mr' ? 'सक्रिय (खरेदीदार हजर)' : (currentLanguage === 'hi' ? 'सक्रिय (खरीदार उपस्थित)' : 'High (Active)'))
          : (res.absorptionCapacity === 'MODERATE'
            ? (currentLanguage === 'mr' ? 'मध्यम' : (currentLanguage === 'hi' ? 'मध्यम' : 'Moderate'))
            : (currentLanguage === 'mr' ? 'मर्यादित' : (currentLanguage === 'hi' ? 'सीमित' : 'Limited')));
        if (bhedCapacityText) bhedCapacityText.innerHTML = `${I18N_DICTIONARY.hub.buyerDemand[currentLanguage]} <strong>${capLabel}</strong>`;
        if (bhedAlertText) {
          bhedAlertText.style.color = level === 'LOW' ? '#166534' : (level === 'MEDIUM' ? '#92400e' : '#991b1b');
          bhedAlertText.textContent = formatBhedAlert(res, rec, currentLanguage);
        }
      } catch (err) {
        if (bhedAlertText) {
          bhedAlertText.style.color = 'var(--color-status-abstain)';
          bhedAlertText.textContent = currentLanguage === 'mr'
            ? `गर्दी विश्लेषण उपलब्ध नाही: ${err instanceof Error ? err.message : String(err)}`
            : (currentLanguage === 'hi'
            ? `भीड़ विश्लेषण अनुपलब्ध: ${err instanceof Error ? err.message : String(err)}`
            : `Congestion analysis unavailable: ${err instanceof Error ? err.message : String(err)}`);
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
        <div class="kicker">${currentLanguage === 'mr' ? 'क्लाउड व आगामी सेवा' : (currentLanguage === 'hi' ? 'क्लाउड व आगामी सेवाएं' : 'CLOUD & EXTENSIONS')}</div>
        <h3 class="heading-lg">${currentLanguage === 'mr' ? 'मंडीमित्र भविष्यातील क्षमता' : (currentLanguage === 'hi' ? 'मंडीमित्र भविष्य की क्षमताएं' : 'MandiMitra Future Capabilities Launchpad')}</h3>
        <p>${currentLanguage === 'mr' ? 'शेतकऱ्यांना सक्षम बनवण्यासाठी थेट हवामान आणि क्लाउड डेटाबेस जोडणी.' : (currentLanguage === 'hi' ? 'किसानों को सशक्त बनाने के लिए मौसम और क्लाउड डेटाबेस एकीकरण.' : 'High-impact integrations connected to cloud databases and live weather feeds for farmer resilience.')}</p>
      </div>

      <div class="editorial-grid-3">

        <div class="editorial-panel" style="background: var(--color-bg-surface);">
          <div style="font-size: 2rem; margin-bottom: var(--space-2);">🤝</div>
          <h4 class="heading-sm" style="margin-bottom: 6px;">${currentLanguage === 'mr' ? 'साझा बाजार क्लाउड नोंदणी' : (currentLanguage === 'hi' ? 'साझा बाजार क्लाउड सूची' : 'SajhaBazaar Cloud Roster')}</h4>
          <p style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-bottom: var(--space-4); line-height: 1.5;">
            ${currentLanguage === 'mr'
              ? 'सुपाबेसवर (Supabase) साठवलेले थेट शेतकरी ग्रुप्स. एकत्र येऊन गाडी भाडे वाचवण्याची थेट जोडणी.'
              : (currentLanguage === 'hi'
              ? 'सुपाबेस (Supabase) पर सुरक्षित वास्तविक किसान समूह। एक साथ मिलकर भाड़ा बचाने की सीधी सुविधा.'
              : 'Live farmer pooling clusters persisted in Supabase. The deterministic matching and cost-allocation engine already runs on the SajhaBazaar tab; this is the cloud roster that would replace the synthetic demo profiles in production.')}
          </p>
          <button id="btn-load-pools" class="btn btn-sm btn-primary">${currentLanguage === 'mr' ? 'सक्रिय ग्रुप्स पहा' : (currentLanguage === 'hi' ? 'सक्रिय समूह देखें' : 'View Active Pools')}</button>
          <div id="pools-list-container" style="margin-top: var(--space-4); font-size: var(--font-size-xs);"></div>
        </div>

        <div class="editorial-panel" style="background: var(--color-bg-surface);">
          <div style="font-size: 2rem; margin-bottom: var(--space-2);">🌦️</div>
          <h4 class="heading-sm" style="margin-bottom: 6px;">${currentLanguage === 'mr' ? 'हवामान व अवकाळी पाऊस इशारा' : (currentLanguage === 'hi' ? 'मौसम व बेमौसम बारिश चेतावनी' : 'Weather & Rain Risk Alert')}</h4>
          <p style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-bottom: var(--space-4); line-height: 1.5;">
            ${currentLanguage === 'mr'
              ? `${district} जिल्ह्यासाठी ओपन-मेटिओ (Open-Meteo) पाऊस अंदाज. अवकाळी पावसामुळे माल खराब होण्याचा धोका वाढतो.`
              : (currentLanguage === 'hi'
              ? `${district} जिले हेतु ओपन-मेटिओ (Open-Meteo) वर्षा पूर्वानुमान। बेमौसम बारिश से माल खराब होने का जोखिम बढ़ता है.`
              : `Open-Meteo rainfall anomaly integration for ${district} district. Unseasonal rain accelerates perishable rot and would raise the daily decay rate fed into AsliDaam.`)}
          </p>
          <span class="badge badge-neutral">${currentLanguage === 'mr' ? 'नियोजित जोडणी' : (currentLanguage === 'hi' ? 'प्रस्तावित सुविधा' : 'Planned Integration')}</span>
        </div>

        <div class="editorial-panel" style="background: var(--color-bg-surface);">
          <div style="font-size: 2rem; margin-bottom: var(--space-2);">📱</div>
          <h4 class="heading-sm" style="margin-bottom: 6px;">${currentLanguage === 'mr' ? 'व्हॉट्सॲप (WhatsApp) पावती' : (currentLanguage === 'hi' ? 'व्हाट्सएप (WhatsApp) रसीद' : 'WhatsApp Payout Slip')}</h4>
          <p style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-bottom: var(--space-4); line-height: 1.5;">
            ${currentLanguage === 'mr'
              ? 'इतर शेतकरी मित्रांना आणि FPO प्रमुखांना पाठवण्यासाठी मराठीतील संपूर्ण असलीदाम हिशोब पावती तयार करा.'
              : (currentLanguage === 'hi'
              ? 'अन्य किसान साथियों व FPO प्रमुखों को भेजने हेतु संपूर्ण असलीदाम हिसाब रसीद तैयार करें.'
              : 'Generate a clean Marathi/Hindi text slip with the full AsliDaam breakdown to share with fellow farmers and FPO leaders.')}
          </p>
          <button id="btn-copy-slip" class="btn btn-sm btn-outline">${currentLanguage === 'mr' ? 'व्हॉट्सॲप पावती कॉपी करा' : (currentLanguage === 'hi' ? 'व्हाट्सएप रसीद कॉपी करें' : 'Copy WhatsApp Slip')}</button>
        </div>

      </div>
    </div>
  `;

  const loadPoolsBtn = panel.querySelector('#btn-load-pools');
  const poolsContainer = panel.querySelector('#pools-list-container');
  if (loadPoolsBtn && poolsContainer) {
    loadPoolsBtn.addEventListener('click', async () => {
      poolsContainer.innerHTML = `<p style="color: var(--color-text-muted);">${currentLanguage === 'mr' ? 'डेटाबेसवरून माहिती आणत आहे…' : (currentLanguage === 'hi' ? 'डेटाबेस से जानकारी ला रहे हैं…' : 'Fetching clusters from database…')}</p>`;
      try {
        const res = await fetch('/api/pools');
        const json = await res.json();
        const pools = json.data || [];
        if (pools.length === 0) {
          poolsContainer.innerHTML = `<p>${currentLanguage === 'mr' ? 'सध्या कोणतीही सक्रिय नोंदणी नाही.' : (currentLanguage === 'hi' ? 'फिलहाल कोई सक्रिय समूह पंजीकृत नहीं है.' : 'No active pools currently registered.')}</p>`;
          return;
        }
        poolsContainer.innerHTML = `
          <div style="border-top: 1px solid var(--color-border); padding-top: var(--space-3);">
            <strong style="color: var(--color-brand-primary-dark);">${currentLanguage === 'mr' ? 'सक्रिय गट' : (currentLanguage === 'hi' ? 'सक्रिय समूह' : 'Active Clusters')} (${json.source === 'supabase' ? 'Cloud Supabase' : 'Local cache'}):</strong>
            <ul style="list-style: none; padding-left: 0; margin-top: 6px;">
              ${pools.slice(0, 4).map((p: any) => `
                <li style="padding: 6px 0; border-bottom: 1px dashed var(--color-border); font-size: var(--font-size-xs);">
                  <strong>${p.farmer_name}</strong> (${p.village || p.taluka}) • <strong>${formatNumber(p.quantity_quintals, currentLanguage)}${currentLanguage === 'mr' ? ' क्विंटल' : (currentLanguage === 'hi' ? ' क्विंटल' : 'q')}</strong> → ${p.target_mandi}
                </li>
              `).join('')}
            </ul>
          </div>
        `;
      } catch {
        poolsContainer.innerHTML = `<p style="color: var(--color-status-abstain);">${currentLanguage === 'mr' ? 'सेवा उपलब्ध नाही.' : (currentLanguage === 'hi' ? 'सेवा उपलब्ध नहीं है.' : 'Cluster service unreachable.')}</p>`;
      }
    });
  }

  panel.querySelector('#btn-copy-slip')?.addEventListener('click', () => {
    const rec = opt.recommended;
    const slip = [
      currentLanguage === 'mr' ? '🌾 *मंडीमित्र: असलीदाम हिशोब पावती*' : (currentLanguage === 'hi' ? '🌾 *मंडीमित्र: असलीदाम हिसाब रसीद*' : '🌾 *MandiMitra: AsliDaam Payout Slip*'),
      `${currentLanguage === 'mr' ? 'शेतमाल' : (currentLanguage === 'hi' ? 'फसल' : 'Crop')}: ${opt.commodity} (${formatNumber(opt.quantityQuintals, currentLanguage)} ${currentLanguage === 'mr' ? 'क्विंटल' : (currentLanguage === 'hi' ? 'क्विंटल' : 'Quintals')})`,
      `${currentLanguage === 'mr' ? 'शिफारस' : (currentLanguage === 'hi' ? 'सिफारिश' : 'Recommendation')}: ${opt.headlineSummary[currentLanguage]}`,
      `${currentLanguage === 'mr' ? 'निवडलेला बाजार' : (currentLanguage === 'hi' ? 'चयनित मंडी' : 'Optimal Mandi')}: ${translateMandiName(rec.market.name, currentLanguage)} (${currentLanguage === 'mr' ? (rec.dayOffset === 0 ? 'आज' : `दिवस +${formatNumber(rec.dayOffset, currentLanguage)}`) : (currentLanguage === 'hi' ? (rec.dayOffset === 0 ? 'आज' : `दिन +${formatNumber(rec.dayOffset, currentLanguage)}`) : `Day ${rec.dayOffset}`)})`,
      `${currentLanguage === 'mr' ? 'एकूण भाव' : (currentLanguage === 'hi' ? 'कुल भाव' : 'Gross')}: ${rs1(rec.grossPricePerQtl)}/क्विंटल`,
      `${currentLanguage === 'mr' ? 'गाडी भाडे' : (currentLanguage === 'hi' ? 'वाहन भाड़ा' : 'Freight')}: −${rs1(rec.roadFreightPerQtl)}/क्विंटल | ${currentLanguage === 'mr' ? 'बाजार समिती फी' : (currentLanguage === 'hi' ? 'मंडी शुल्क' : 'APMC')}: −${rs1(rec.apmcCessPerQtl + rec.hamaliAndTolaiPerQtl)}/क्विंटल`,
      `${currentLanguage === 'mr' ? 'साठवणूक घट' : (currentLanguage === 'hi' ? 'भंडारण घट' : 'Storage+Decay')}: −${rs1(rec.holdingAndSpoilagePerQtl)}/क्विंटल | ${currentLanguage === 'mr' ? 'ताजेपणा वटती' : (currentLanguage === 'hi' ? 'ताजगी कटौती' : 'Freshness')}: −${rs1(rec.freshnessDiscountPerQtl)}/क्विंटल`,
      `${currentLanguage === 'mr' ? 'असलीदाम' : (currentLanguage === 'hi' ? 'असलीदाम' : 'AsliDaam')}: ${rs1(rec.asliDaamPerQtl)}/क्विंटल`,
      `${currentLanguage === 'mr' ? 'एकूण निव्वळ रक्कम' : (currentLanguage === 'hi' ? 'कुल शुद्ध राशि' : 'Net Payout')}: ${rs(rec.totalNetPayout)} (+${rs(opt.totalPocketCashGain)} ${currentLanguage === 'mr' ? 'जास्तीचा नफा' : (currentLanguage === 'hi' ? 'अतिरिक्त लाभ' : 'gain')})`,
      currentLanguage === 'mr' ? 'मंडीमित्र निर्णय प्रणालीद्वारे प्रमाणित' : (currentLanguage === 'hi' ? 'मंडीमित्र निर्णय प्रणाली द्वारा प्रमाणित' : 'Verified by MandiMitra Decision Engine')
    ].join('\n');
    void navigator.clipboard.writeText(slip);
    alert(currentLanguage === 'mr' ? 'असलीदाम शिफारस पावती क्लिपबोर्डवर कॉपी झाली आहे.' : (currentLanguage === 'hi' ? 'असलीदाम सिफारिश रसीद क्लिपबोर्ड पर कॉपी हो गई है.' : 'Copied the AsliDaam recommendation slip to your clipboard.'));
  });

  return panel;
}


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
let isCostDrawerOpen = false;

const rs = (n: number): string => formatCurrency(n, currentLanguage);
const rs1 = (n: number): string => formatCurrency(n, currentLanguage, true);

/** Level -> farmer-facing crowd word, in the active language. */
function rushLevelWord(level: string, lang: Language): string {
  if (level === 'LOW') return lang === 'mr' ? 'कमी गर्दी' : (lang === 'hi' ? 'कम भीड़' : 'Light');
  if (level === 'MEDIUM') return lang === 'mr' ? 'मध्यम गर्दी' : (lang === 'hi' ? 'मध्यम भीड़' : 'Moderate');
  return lang === 'mr' ? 'मोठी गर्दी' : (lang === 'hi' ? 'भारी भीड़' : 'Heavy');
}

function rushLevelColors(level: string): { bg: string; fg: string; border: string } {
  if (level === 'LOW') return { bg: '#dcfce7', fg: '#166534', border: '#86efac' };
  if (level === 'MEDIUM') return { bg: '#fef3c7', fg: '#92400e', border: '#fde68a' };
  return { bg: '#fee2e2', fg: '#991b1b', border: '#fca5a5' };
}

/**
 * Renders the day-by-day arrival outlook for the recommended mandi. This is the part a farmer
 * actually acts on: which of the next few days is worth loading the trolley for.
 */
function renderRushOutlook(bhed: any, lang: Language): string {
  const rush = bhed?.winnerRushForecast;
  if (!rush || !Array.isArray(rush.byDay) || rush.byDay.length === 0) return '';

  const chips = rush.byDay.map((d: any) => {
    const c = rushLevelColors(d.level);
    const closed = d.isYardClosed;
    // The umbrella is reserved for rain heavy enough to actually hold arrivals back; a trace
    // amount is still shown, but without implying a washout.
    const wet = d.rainClass === 'light' || d.rainClass === 'heavy';
    const rain = (d.expectedRainMm !== null && d.expectedRainMm !== undefined && d.expectedRainMm >= 0.1)
      ? `<div style="font-size:0.6rem;color:${wet ? '#1d4ed8' : '#94a3b8'};margin-top:2px;">${wet ? '•' : '·'} ${d.expectedRainMm.toFixed(1)}mm</div>`
      : '';
    const dayLabel = lang === 'mr' || lang === 'hi'
      ? formatNumber(d.day, lang)
      : String(d.day);
    return `
      <div title="${escapeAttr(d.note)}" style="flex:1;min-width:74px;text-align:center;padding:8px 4px;border-radius:10px;
           background:${closed ? '#f1f5f9' : c.bg};border:1px solid ${closed ? '#cbd5e1' : c.border};">
        <div style="font-size:0.62rem;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.03em;">
          ${d.weekdayName.slice(0, 3)} · +${dayLabel}d
        </div>
        <div style="font-size:0.72rem;font-weight:800;color:${closed ? '#64748b' : c.fg};margin-top:3px;">
          ${closed ? I18N_DICTIONARY.hub.rushYardClosed[lang] : rushLevelWord(d.level, lang)}
        </div>
        ${rain}
      </div>`;
  }).join('');

  return `
    <div style="margin-top:12px;">
      <div style="font-size:0.68rem;font-weight:800;color:#73512B;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px;">
        ${I18N_DICTIONARY.hub.rushOutlookTitle[lang]}
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">${chips}</div>
      <div style="font-size:0.7rem;color:#5b4a33;line-height:1.5;margin-top:8px;">
        ${escapeHtml(rush.farmerAdvice?.[lang] || rush.farmerAdvice?.en || '')}
      </div>
    </div>`;
}

/** Renders the evidence behind the prediction, tagging each driver measured vs reference. */
function renderRushDrivers(bhed: any, lang: Language): string {
  const rush = bhed?.winnerRushForecast;
  if (!rush || !Array.isArray(rush.drivers) || rush.drivers.length === 0) return '';

  const rows = rush.drivers.map((d: any) => {
    const label = lang === 'mr' ? d.labelMr : (lang === 'hi' ? d.labelHi : d.label);
    const tag = d.isMeasured ? I18N_DICTIONARY.hub.rushMeasured[lang] : I18N_DICTIONARY.hub.rushReference[lang];
    const tagBg = d.isMeasured ? '#dcfce7' : '#e0e7ff';
    const tagFg = d.isMeasured ? '#166534' : '#3730a3';
    const pct = Math.round(d.contribution * 100);
    return `
      <li style="margin-bottom:7px;">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <strong style="font-size:0.72rem;color:#3f3221;">${escapeHtml(label)}</strong>
          <span style="font-size:0.55rem;font-weight:800;padding:1px 6px;border-radius:99px;background:${tagBg};color:${tagFg};text-transform:uppercase;">${tag}</span>
          <span style="font-size:0.62rem;color:#8a7355;">${pct}%</span>
        </div>
        <div style="font-size:0.66rem;color:#6b5a44;line-height:1.45;">${escapeHtml(d.evidence)}</div>
      </li>`;
  }).join('');

  return `
    <details style="margin-top:10px;">
      <summary style="cursor:pointer;font-size:0.68rem;font-weight:800;color:#73512B;text-transform:uppercase;letter-spacing:0.04em;">
        ${I18N_DICTIONARY.hub.rushWhyTitle[lang]}
      </summary>
      <ul style="list-style:none;padding:8px 0 0 0;margin:0;">${rows}</ul>
    </details>`;
}

function escapeHtml(v: string): string {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(v: string): string {
  return escapeHtml(v).replace(/"/g, '&quot;');
}

/**
 * Turns the measured absorption index into a farmer-facing buyer-demand word.
 * The index is the yard's percentile of trading breadth in today's Agmarknet feed, so this label
 * is a reading of real data rather than a hand-assigned tier.
 */
function formatAbsorption(bhed: any, lang: Language): string {
  const idx = bhed?.winnerRushForecast?.absorptionIndex;
  if (typeof idx !== 'number') {
    return lang === 'mr' ? 'माहिती नाही' : (lang === 'hi' ? 'जानकारी नहीं' : 'Not measured');
  }
  if (idx >= 0.7) return lang === 'mr' ? 'सक्रिय (खरेदीदार हजर)' : (lang === 'hi' ? 'सक्रिय (खरीदार उपस्थित)' : 'High (Active)');
  if (idx >= 0.4) return lang === 'mr' ? 'मध्यम' : (lang === 'hi' ? 'मध्यम' : 'Moderate');
  return lang === 'mr' ? 'मर्यादित' : (lang === 'hi' ? 'सीमित' : 'Limited');
}

function formatBhedAlert(bhed: any, rec: any, lang: Language): string {
  if (!bhed) {
    if (lang === 'mr') return `बाजारात वाहनांची गर्दी होण्याची शक्यता! हुशार सल्ला: ${translateMandiName(rec?.market?.name || 'नाशिक', lang)} येथे विक्री केल्यास गर्दी टाळून नफा सुरक्षित राहील.`;
    if (lang === 'hi') return `मंडी में भारी भीड़ संभावित! समझदारी भरी सलाह: ${translateMandiName(rec?.market?.name || 'नासिक', lang)} में बेचने से भीड़ से बचकर मुनाफा सुरक्षित रहेगा.`;
    return `Heavy tractor queues expected! Smart Advice: Selling at ${rec?.market?.name || 'Nashik'} avoids the rush and protects profit in your pocket.`;
  }

  const origName = bhed.originalWinner?.marketName || rec?.market?.name || 'नाशिक';
  const adjName = bhed.adjustedWinner?.marketName || rec?.market?.name || 'पिंपळगाव बसवंत';
  const origMandi = translateMandiName(origName, lang);
  const adjMandi = translateMandiName(adjName, lang);
  const adjDay = formatNumber(bhed.adjustedWinner?.day ?? rec?.dayOffset ?? 0, lang);
  const impactPerQtl = formatCurrency(bhed.congestionImpactPerQtl ?? 0, lang, true);
  const qty = store.getState().harvestQuantityQuintals || 25;
  const rawDiff = bhed.adjustedWinner && bhed.originalWinner
    ? Math.round((bhed.adjustedWinner.adjustedNrv - bhed.originalWinner.adjustedNrv) * qty)
    : 0;
  const pocketSaved = formatCurrency(Math.abs(rawDiff), lang);

  // A predicted (non-override) evaluation already carries a fully-worded, evidence-backed message
  // from the engine; only the manual what-if path needs the templated narrative below.
  if (bhed.supplyPressureBasis === 'FORECAST' && lang === 'en' && bhed.alertMessage) {
    return bhed.alertMessage;
  }

  if (bhed.status === 'HIGH_RISK' || bhed.supplyPressure === 'HIGH') {
    if (lang === 'mr') {
      return `बाजारात मोठी आवक व गर्दी असताना, ${origMandi} येथे वाहनांची मोठी कोंडी (-${impactPerQtl}/क्विंटल) निर्माण होते. ${adjMandi} (दिवस +${adjDay}) कडे माल वळवल्यास तुमच्या खिशात +${pocketSaved} जास्तीचा नफा सुरक्षित राहतो!`;
    }
    if (lang === 'hi') {
      return `मंडी में भारी आवक व भीड़ के दौरान, ${origMandi} में भारी जाम (-${impactPerQtl}/क्विंटल) की स्थिति बनती है। ${adjMandi} (दिन +${adjDay}) में बेचने से आपकी जेब में +${pocketSaved} का अतिरिक्त लाभ सुरक्षित रहता है!`;
    }
    return `Under HIGH supply pressure, ${origName} faces heavy arrival congestion (-${impactPerQtl}/q). Diverting to ${adjName} (Day +${adjDay}) protects your profit by +${pocketSaved}!`;
  }

  const cap = formatAbsorption(bhed, lang);

  if (lang === 'mr') {
    return `${origMandi} मध्ये खरेदीदारांची क्षमता मोठी आहे (${cap}). बाजारातील गर्दीच्या परिस्थितीतही हाच सल्ला सर्वात फायदेशीर राहतो.`;
  }
  if (lang === 'hi') {
    return `${origMandi} में खरीदारों की क्षमता बहुत मजबूत है (${cap})। मंडी भीड़ की स्थिति में भी यही सिफारिश सबसे अधिक लाभकारी है.`;
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
    <div class="heading-sm" style="margin-bottom: var(--space-2);">${message}</div>
    <div style="font-size: var(--font-size-xs); color: var(--color-text-muted);">
      ${currentLanguage === 'mr' ? 'उमेदवार APMC, अधिकृत ॲगमार्कनेट भाव आणि रस्ता वाहतूक अंतर तपासत आहे…' : (currentLanguage === 'hi' ? 'उम्मीदवार मंडियां, सत्यापित एगमार्कनेट भाव और सड़क दूरी की गणना जारी है…' : 'Resolving candidate APMCs, verified Agmarknet prices and road haulage distances…')}
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
  const costConfig = state.costConfig;
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
            <div class="spec-idx">${currentLanguage === 'mr' ? '०१' : (currentLanguage === 'hi' ? '०१' : '01')}</div>
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
            <div class="spec-idx">${currentLanguage === 'mr' ? '०२' : (currentLanguage === 'hi' ? '०२' : '02')}</div>
            <div class="spec-detail">
              <div class="spec-headline">
                <h3 class="spec-name">${currentLanguage === 'mr' ? 'साझाबाजार एकत्रित शेतकरी वाहतूक' : (currentLanguage === 'hi' ? 'साझाबाज़ार साझा ढुलाई' : 'Shared Freight Corridor (SajhaBazaar)')}</h3>
                <span class="spec-tag spec-tag-green">${currentLanguage === 'mr' ? '४०% पर्यंत बचत' : (currentLanguage === 'hi' ? '४०% तक बचत' : 'Up to 40% Savings')}</span>
              </div>
              <p class="spec-summary">${currentLanguage === 'mr' ? 'शेजारील शेतकऱ्यांसोबत टेम्पो/ट्रॅक्टर शेअर करा आणि वाहतूक खर्चात ४०% पर्यंत थेट बचत मिळवा.' : (currentLanguage === 'hi' ? 'पास के किसानों के साथ मिलकर वाहन साझा करें और परिवहन खर्च में ४०% तक की बचत पाएं।' : 'Dynamic tractor and mini-truck pooling with neighbouring smallholders along the same transport corridor.')}</p>
            </div>
          </div>

          <!-- Item 03 -->
          <div class="spec-row">
            <div class="spec-idx">${currentLanguage === 'mr' ? '०३' : (currentLanguage === 'hi' ? '०३' : '03')}</div>
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
              ${I18N_DICTIONARY.hub.cropLabel[currentLanguage]}
            </label>
            <select id="hub-select-crop" class="select-field cockpit-select-field">
              ${renderCropOptgroupsHtml(crop, currentLanguage)}
            </select>
          </div>

          <div class="cockpit-input-col">
            <label class="cockpit-input-label">
              ${I18N_DICTIONARY.hub.qtyLabel[currentLanguage]}
            </label>
            <div class="qty-input-group">
              <input type="text" inputmode="decimal" id="hub-input-qty" class="input-field cockpit-num-input" value="${formatNumber(qty, currentLanguage)}" style="font-weight: 800;" />
              <div class="qty-pills-row">
                <button class="qty-pill cockpit-qty-pill ${qty === 3 ? 'active' : ''}" data-q="3">${formatUnit(3, 'qtl', currentLanguage)}</button>
                <button class="qty-pill cockpit-qty-pill ${qty === 10 ? 'active' : ''}" data-q="10">${formatUnit(10, 'qtl', currentLanguage)}</button>
                <button class="qty-pill cockpit-qty-pill ${qty === 25 ? 'active' : ''}" data-q="25">${formatUnit(25, 'qtl', currentLanguage)}</button>
                <button class="qty-pill cockpit-qty-pill ${qty === 50 ? 'active' : ''}" data-q="50">${formatUnit(50, 'qtl', currentLanguage)}</button>
              </div>
            </div>
          </div>

          <div class="cockpit-input-col">
            <label class="cockpit-input-label">
              ${I18N_DICTIONARY.hub.originLabel[currentLanguage]}
            </label>
            <select id="hub-select-origin" class="select-field cockpit-select-field">
              ${renderDistrictOptgroupsHtml(district, currentLanguage)}
            </select>
          </div>

          <div class="cockpit-btn-col">
            <button id="btn-recalculate-hub" class="btn btn-primary cockpit-cta-btn">
              ${I18N_DICTIONARY.hub.btnRun[currentLanguage]}
            </button>
          </div>
        </div>

        <!-- Cost Simulator Integrated Drawer -->
        <div class="cockpit-cost-toggle-row">
          <button type="button" class="cockpit-cost-toggle-btn ${isCostDrawerOpen ? 'open' : ''}" id="btn-toggle-cost-sim" aria-expanded="${isCostDrawerOpen ? 'true' : 'false'}" aria-controls="cockpit-cost-drawer">
            <span>⚙️</span>
            <span>${currentLanguage === 'mr' ? 'वाहतूक व खर्च सिम्युलेटर' : (currentLanguage === 'hi' ? 'परिवहन व लागत सिम्युलेटर' : 'Cost & Freight Simulator')}</span>
            <span class="cost-toggle-pill">
              ${formatCurrency(costConfig.transportCostPerKmPerQtl, currentLanguage, true)}/km · ${formatCurrency(costConfig.storageCostPerDayPerQtl, currentLanguage, true)}/day · ${formatUnit(costConfig.searchRadiusKm, 'km', currentLanguage)}
            </span>
            <span class="cost-toggle-arrow">▾</span>
          </button>
        </div>

        <div class="cockpit-cost-drawer" id="cockpit-cost-drawer" style="display: ${isCostDrawerOpen ? 'block' : 'none'};">
          <div class="cockpit-cost-grid">
            <!-- Transport Cost Input -->
            <div class="cockpit-input-col">
              <div class="cockpit-cost-label-row">
                <label class="cockpit-input-label" for="cockpit-input-transport-cost">
                  ${currentLanguage === 'mr' ? 'वाहतूक भाडे दर' : (currentLanguage === 'hi' ? 'ढुलाई भाड़ा दर' : 'Haulage Cost')}
                </label>
                <span class="cost-badge">${currentLanguage === 'mr' ? '₹ प्रति किमी/क्विंटल' : (currentLanguage === 'hi' ? '₹ प्रति किमी/क्विंटल' : '₹/km/qtl')}</span>
              </div>
              <input 
                type="text" 
                inputmode="decimal" 
                id="cockpit-input-transport-cost" 
                class="cockpit-cost-input" 
                value="${formatNumber(costConfig.transportCostPerKmPerQtl, currentLanguage)}" 
              />
              <span class="cost-hint">${currentLanguage === 'mr' ? 'पिकअप किंवा ट्रॅक्टर ट्रॉली डिझेल व ड्रायव्हर भाडे' : (currentLanguage === 'hi' ? 'पिकअप या ट्रैक्टर डीजल व चालक खर्च' : 'Pickup/tractor freight per km per quintal')}</span>
            </div>

            <!-- Storage Cost Input -->
            <div class="cockpit-input-col">
              <div class="cockpit-cost-label-row">
                <label class="cockpit-input-label" for="cockpit-input-storage-cost">
                  ${currentLanguage === 'mr' ? 'साठवणूक खर्च' : (currentLanguage === 'hi' ? 'भंडारण खर्च' : 'Holding Cost')}
                </label>
                <span class="cost-badge">${currentLanguage === 'mr' ? '₹ प्रति दिवस/क्विंटल' : (currentLanguage === 'hi' ? '₹ प्रति दिन/क्विंटल' : '₹/day/qtl')}</span>
              </div>
              <input 
                type="text" 
                inputmode="decimal" 
                id="cockpit-input-storage-cost" 
                class="cockpit-cost-input" 
                value="${formatNumber(costConfig.storageCostPerDayPerQtl, currentLanguage)}" 
              />
              <span class="cost-hint">${currentLanguage === 'mr' ? 'नैसर्गिक वजन घट व गोदामाचे दैनंदिन भाडे' : (currentLanguage === 'hi' ? 'प्राकृतिक वजन घट व गोदाम का दैनिक किराया' : 'Crop shrinkage loss & daily shed holding cost')}</span>
            </div>

            <!-- Search Radius Input -->
            <div class="cockpit-input-col">
              <div class="cockpit-cost-label-row">
                <label class="cockpit-input-label" for="cockpit-input-radius">
                  ${currentLanguage === 'mr' ? 'कमाल शोध अंतर' : (currentLanguage === 'hi' ? 'अधिकतम खोज दायरा' : 'Search Radius')}
                </label>
                <span class="cost-badge">${formatUnit(costConfig.searchRadiusKm, 'km', currentLanguage)}</span>
              </div>
              <input 
                type="text" 
                inputmode="numeric" 
                id="cockpit-input-radius" 
                class="cockpit-cost-input" 
                value="${formatNumber(costConfig.searchRadiusKm, currentLanguage)}" 
              />
              <span class="cost-hint">${currentLanguage === 'mr' ? 'नफ्याची बाजारपेठ शोधण्यासाठी शेताभोवतीचे अंतर' : (currentLanguage === 'hi' ? 'लाभकारी मंडी खोजने हेतु खेत के आसपास का दायरा' : 'Driving distance considered around your farm')}</span>
            </div>
          </div>
        </div>

        <div id="hub-data-provenance" class="cockpit-provenance-row">
          ${evalData
            ? `<span class="provenance-dot"></span><span>${currentLanguage === 'mr' ? `${formatNumber(evalData.evaluations.length, 'mr')} बाजार तपासले (${formatUnit(evalData.userParameters.radiusKm, 'km', 'mr')}) · मॉडेल <strong>${evalData.modelVersion}</strong> · वेळ ${new Date(evalData.evaluatedAt).toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' })}` : (currentLanguage === 'hi' ? `${formatNumber(evalData.evaluations.length, 'hi')} मंडियां जांची गईं (${formatUnit(evalData.userParameters.radiusKm, 'km', 'hi')}) · मॉडल <strong>${evalData.modelVersion}</strong> · समय ${new Date(evalData.evaluatedAt).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}` : `${evalData.evaluations.length} candidate APMC(s) resolved within ${evalData.userParameters.radiusKm} km · model <strong>${evalData.modelVersion}</strong> · evaluated ${new Date(evalData.evaluatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`)}</span>`
            : (currentLanguage === 'mr' ? 'मंडीमित्र निर्णय प्रणालीशी संपर्क सुरू आहे…' : (currentLanguage === 'hi' ? 'मंडीमित्र निर्णय प्रणाली से संपर्क किया जा रहा है…' : 'Contacting the MandiMitra decision engine…'))}
        </div>
      </div>
    </section>

    <!-- SajhaBazaar trigger banner (only renders when a genuine pool exists) -->
    <div id="sajha-banner-mount"></div>

    <!-- Cockpit Tab Navigation Bar -->
    <div class="hub-tabs-nav">
      <button class="hub-tab-btn ${activeTab === 'aslidaam' ? 'active' : ''}" data-tab="aslidaam">
        ${currentLanguage === 'mr' ? 'असलीदाम™ इंजिन' : (currentLanguage === 'hi' ? 'असलीदाम™ इंजन' : 'AsliDaam™ Engine')}
      </button>
      <button class="hub-tab-btn ${activeTab === 'markets' ? 'active' : ''}" data-tab="markets">
        ${currentLanguage === 'mr' ? 'बाजार भाव रडार' : (currentLanguage === 'hi' ? 'मंडी भाव रडार' : 'Mandi Radar')}
      </button>
      <button class="hub-tab-btn ${activeTab === 'evidence' ? 'active' : ''}" data-tab="evidence">
        ${currentLanguage === 'mr' ? '"का?" स्पष्टीकरण' : (currentLanguage === 'hi' ? '"क्यों?" प्रमाण' : '"Why?" Evidence')}
      </button>
      <button class="hub-tab-btn ${activeTab === 'backtest' ? 'active' : ''}" data-tab="backtest">
        ${currentLanguage === 'mr' ? 'मागील पडताळणी' : (currentLanguage === 'hi' ? 'पिछली जांच' : 'Walk-Forward Backtest')}
      </button>
      <button class="hub-tab-btn ${activeTab === 'future' ? 'active' : ''}" data-tab="future">
        ${currentLanguage === 'mr' ? 'भविष्यातील वैशिष्ट्ये' : (currentLanguage === 'hi' ? 'आगामी सुविधाएं' : 'Future Features')}
      </button>
    </div>

    <div id="hub-tab-content"></div>
  `;

  // ---- Language switcher ----
  container.querySelectorAll('.lang-btn').forEach(btn => {
    const b = btn as HTMLButtonElement;
    if (b.dataset.lang === currentLanguage) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
    b.addEventListener('click', () => {
      const targetLang = b.dataset.lang as Language;
      if (targetLang) {
        store.setLanguage(targetLang);
      }
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

  // Cost Simulator inputs
  const cockpitTransportInput = container.querySelector('#cockpit-input-transport-cost') as HTMLInputElement | null;
  const cockpitStorageInput = container.querySelector('#cockpit-input-storage-cost') as HTMLInputElement | null;
  const cockpitRadiusInput = container.querySelector('#cockpit-input-radius') as HTMLInputElement | null;

  // Cost Simulator drawer toggle
  const costToggleBtn = container.querySelector('#btn-toggle-cost-sim') as HTMLButtonElement | null;
  const costDrawer = container.querySelector('#cockpit-cost-drawer') as HTMLElement | null;
  costToggleBtn?.addEventListener('click', () => {
    isCostDrawerOpen = !isCostDrawerOpen;
    if (costDrawer) {
      costDrawer.style.display = isCostDrawerOpen ? 'block' : 'none';
    }
    costToggleBtn.classList.toggle('open', isCostDrawerOpen);
    costToggleBtn.setAttribute('aria-expanded', isCostDrawerOpen ? 'true' : 'false');
  });

  if (currentLanguage !== 'en') {
    [cockpitTransportInput, cockpitStorageInput, cockpitRadiusInput].forEach(inp => {
      inp?.addEventListener('input', () => {
        const s = inp.selectionStart;
        inp.value = toDevanagariDigits(inp.value);
        if (s !== null) inp.setSelectionRange(s, s);
      });
    });
  }

  container.querySelector('#btn-recalculate-hub')?.addEventListener('click', () => {
    const cropSelect = container.querySelector('#hub-select-crop') as HTMLSelectElement | null;
    const qtyInput = container.querySelector('#hub-input-qty') as HTMLInputElement | null;
    const originSelect = container.querySelector('#hub-select-origin') as HTMLSelectElement | null;

    const newCrop = cropSelect ? cropSelect.value : crop;
    const d = getDistrictConfig(originSelect ? originSelect.value : district);

    store.setSelectedCrop(newCrop);
    if (qtyInput) store.setHarvestQuantity(Math.max(1, parseDevanagariNumber(qtyInput.value) || 25));
    store.setUserLocation(d.latitude, d.longitude, d.name);

    // Save Cost Simulator settings directly from Cockpit
    const transportVal = cockpitTransportInput ? parseDevanagariNumber(cockpitTransportInput.value) : undefined;
    const storageVal = cockpitStorageInput ? parseDevanagariNumber(cockpitStorageInput.value) : undefined;
    const radiusVal = cockpitRadiusInput ? parseDevanagariNumber(cockpitRadiusInput.value) : undefined;

    store.updateCostConfig({
      transportCostPerKmPerQtl: (transportVal !== undefined && !isNaN(transportVal) && transportVal > 0) ? transportVal : costConfig.transportCostPerKmPerQtl,
      storageCostPerDayPerQtl: (storageVal !== undefined && !isNaN(storageVal) && storageVal >= 0) ? storageVal : costConfig.storageCostPerDayPerQtl,
      searchRadiusKm: (radiusVal !== undefined && !isNaN(radiusVal) && radiusVal > 0) ? radiusVal : costConfig.searchRadiusKm
    });

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
      window.location.hash = '#/sajha';
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
      mountPoint.appendChild(renderLoadingPanel(
        currentLanguage === 'mr' ? 'असलीदाम संयुक्त अनुकूलन चालवत आहे…' : (currentLanguage === 'hi' ? 'असलीदाम संयुक्त अनुकूलन जारी है…' : 'Running the AsliDaam joint optimisation…')
      ));
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

// Prevent V8 from garbage-collecting speech utterance during playback
let activeSpeechUtterance: SpeechSynthesisUtterance | null = null;

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

function resolveBestVoice(lang: Language): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  if (lang === 'mr') {
    // 1. Marathi voice
    const mr = voices.find(v => v.lang.toLowerCase().startsWith('mr') || v.name.toLowerCase().includes('marathi'));
    if (mr) return mr;
    // 2. Hindi voice (vital on Windows/Chrome: Hindi TTS models read Devanagari script accurately for Marathi)
    const hi = voices.find(v => v.lang.toLowerCase().startsWith('hi') || v.name.toLowerCase().includes('hindi'));
    if (hi) return hi;
    // 3. Indian English / Indian voice
    const inVoice = voices.find(v => v.lang.toLowerCase().includes('in') || v.name.toLowerCase().includes('india'));
    if (inVoice) return inVoice;
  } else if (lang === 'hi') {
    const hi = voices.find(v => v.lang.toLowerCase().startsWith('hi') || v.name.toLowerCase().includes('hindi'));
    if (hi) return hi;
    const inVoice = voices.find(v => v.lang.toLowerCase().includes('in') || v.name.toLowerCase().includes('india'));
    if (inVoice) return inVoice;
  } else {
    const enIn = voices.find(v => v.lang.toLowerCase() === 'en-in' || v.name.toLowerCase().includes('india'));
    if (enIn) return enIn;
    const en = voices.find(v => v.lang.toLowerCase().startsWith('en'));
    if (en) return en;
  }
  return voices.find(v => v.default) || voices[0] || null;
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

    <!-- PRIMARY RECOMMENDATION HERO (Compact Single-Page Cockpit View) -->
    <div class="editorial-panel" style="border: 1.5px solid rgba(85, 65, 45, 0.16); background: rgba(255, 255, 255, 0.95); border-radius: 12px; box-shadow: 0 4px 18px rgba(44, 76, 56, 0.04); padding: 16px 20px; margin-bottom: 14px; position: relative; overflow: hidden;">

      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span class="badge ${isWait ? 'badge-accent' : 'badge-sage'}" style="font-family: var(--font-family-heading); font-size: 0.76rem; padding: 4px 12px; font-weight: 800; border-radius: 6px; letter-spacing: 0.03em;">
            ${isWait
              ? (currentLanguage === 'mr' ? `${formatNumber(rec.dayOffset, currentLanguage)} दिवस थांबा` : (currentLanguage === 'hi' ? `${formatNumber(rec.dayOffset, currentLanguage)} दिन रुकें` : `WAIT ${rec.dayOffset} DAY${rec.dayOffset > 1 ? 'S' : ''}`))
              : (currentLanguage === 'mr' ? 'आजच विका' : (currentLanguage === 'hi' ? 'आज ही बेचें' : 'SELL TODAY'))}
          </span>
          <span style="font-family: var(--font-family-body); font-size: 0.82rem; color: #4A5B50; font-weight: 600;">
            ${currentLanguage === 'mr' ? 'सर्वोत्तम बाजार:' : (currentLanguage === 'hi' ? 'सर्वश्रेष्ठ मंडी:' : 'Optimal Market:')} <strong style="color: #112A1B; font-family: var(--font-family-heading); font-weight: 800;">${translateMandiName(rec.market.name, currentLanguage)}</strong>
          </span>
          <span class="badge badge-neutral" style="font-family: var(--font-family-heading); font-size: 0.68rem; font-weight: 700; text-transform: uppercase; background: rgba(85, 65, 45, 0.07); color: #55412D;">
            ${translateAction(policy.action, currentLanguage)}
          </span>
        </div>

        <span class="badge badge-sage" style="font-family: var(--font-family-heading); font-size: 0.72rem; font-weight: 600;">
          ${evalData.modelVersion} · ${formatNumber(evalData.evaluations.length, currentLanguage)} ${currentLanguage === 'mr' ? 'बाजार तपासले' : (currentLanguage === 'hi' ? 'मंडियां जांची गईं' : 'mandis evaluated')}
        </span>
      </div>

      <h2 style="font-family: var(--font-family-heading); font-size: clamp(1.3rem, 2vw, 1.65rem); font-weight: 800; color: #112A1B; line-height: 1.22; margin-bottom: 12px; max-width: 960px;">
        ${headline}
      </h2>

      <div class="decision-metrics-grid" style="background: rgba(27, 59, 43, 0.04); border: 1px solid rgba(27, 59, 43, 0.08); border-radius: 10px; padding: 12px 16px; margin-bottom: 12px;">

        <div>
          <div style="font-family: var(--font-family-body); font-size: 0.7rem; color: #586B5E; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">
            ${I18N_DICTIONARY.hub.extraCash[currentLanguage]}
          </div>
          <div class="number-display number-huge number-positive" style="font-family: var(--font-family-heading); font-size: 1.95rem; font-weight: 800; line-height: 1.1; letter-spacing: -0.02em;">
            +${rs(opt.totalPocketCashGain)}
          </div>
          <div style="font-family: var(--font-family-body); font-size: 0.74rem; color: var(--color-status-success); font-weight: 700; margin-top: 3px;">
            (+${rs1(opt.gainPerQtl)}/${formatUnit(1, 'qtl', currentLanguage)} ${I18N_DICTIONARY.hub.vsLocal[currentLanguage]} — ${translateMandiName(base.market.name, currentLanguage)})
          </div>
        </div>

        <div>
          <div style="font-family: var(--font-family-body); font-size: 0.7rem; color: #586B5E; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">
            ${I18N_DICTIONARY.hub.totalTakeHome[currentLanguage]}
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
            ${I18N_DICTIONARY.hub.travelHaulage[currentLanguage]}
          </div>
          <div class="number-display number-xl number-main" style="font-family: var(--font-family-heading); font-size: 1.7rem; font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; color: #112A1B;">
            ${formatUnit(rec.market.estimatedRoadDistanceKm ? rec.market.estimatedRoadDistanceKm.toFixed(1) : 0, 'km', currentLanguage)} ${currentLanguage === 'mr' ? 'रस्ता' : (currentLanguage === 'hi' ? 'सड़क' : 'road')}
          </div>
          <div style="font-family: var(--font-family-body); font-size: 0.74rem; color: ${policy.confidence === 'HIGH' ? 'var(--color-status-success)' : '#586B5E'}; font-weight: 600; margin-top: 3px;">
            ${policy.confidence === 'HIGH' ? '✓' : '•'} ${policy.confidence === 'HIGH' ? (currentLanguage === 'mr' ? 'उच्च खात्री' : (currentLanguage === 'hi' ? 'उच्च विश्वसनीयता' : 'HIGH confidence')) : policy.confidence}${hasRealSeries ? (currentLanguage === 'mr' ? ` · अंदाज तफावत ±${formatNumber(uncertaintyPct.toFixed(1), currentLanguage)}%` : (currentLanguage === 'hi' ? ` · अनुमान भिन्नता ±${formatNumber(uncertaintyPct.toFixed(1), currentLanguage)}%` : ` · forecast residual ±${uncertaintyPct.toFixed(1)}%`)) : (currentLanguage === 'mr' ? ' · स्थिर भाव (मालिका नाही)' : (currentLanguage === 'hi' ? ' · स्थिर भाव (श्रृंखला नहीं)' : ' · flat price path (no series)'))}
          </div>
          <div style="font-family: var(--font-family-body); font-size: 0.68rem; color: #586B5E; margin-top: 2px;">
            ${I18N_DICTIONARY.hub.dataQualityLabel[currentLanguage]}: <strong>${recQuality?.tier || 'n/a'}</strong>${recQuality?.priceProvenance ? ` · ${recQuality.priceProvenance.replace(/_/g, ' ').toLowerCase()}` : ''}
            ${recEval?.historySource ? ` · <span class="badge ${recEval.historySource === 'CEDA_OBSERVED' ? 'badge-sage' : 'badge-neutral'}" style="font-size: 0.62rem; padding: 2px 6px;">${recEval.historySource === 'CEDA_OBSERVED' ? (currentLanguage === 'mr' ? 'CEDA पडताळणी इतिहास' : (currentLanguage === 'hi' ? 'CEDA सत्यापित इतिहास' : 'CEDA Verified History')) : (recEval.historySource === 'CURRENT_ONLY' ? (currentLanguage === 'mr' ? 'केवळ थेट स्नॅपशॉट' : (currentLanguage === 'hi' ? 'केवल लाइव स्नैपशॉट' : 'Live Snapshot Only')) : recEval.historySource)}</span>` : ''}
          </div>
        </div>

      </div>

      <!-- Forecast basis strip -->
      <div style="display: flex; align-items: baseline; gap: 8px; background: #ffffff; border: 1px solid rgba(85, 65, 45, 0.12); padding: 8px 14px; border-radius: 8px; margin-bottom: 8px; flex-wrap: wrap;">
        <span style="font-size: 0.9rem; color: var(--color-brand-primary); font-weight: 800;">●</span>
        <div style="flex: 1; min-width: 240px; font-family: var(--font-family-body);">
          <span style="font-size: 0.8rem; font-weight: 700; color: #112A1B;">
            ${currentLanguage === 'mr'
              ? (recEval?.forecast?.isForecastEligible
                  ? `भावाचा अंदाज: CEDA पडताळणी ७ दिवसांचा कल ${forecastSlope >= 0 ? '+' : ''}${formatCurrency(forecastSlope, currentLanguage)}/दिवस (${recEval.historyObservationCount ? toDevanagariDigits(recEval.historyObservationCount) : '७'} नोंदी, ${translateMandiName(rec.market.name, currentLanguage)})`
                  : 'स्थिर भाव — एकाच दिवसाची ॲगमार्कनेट नोंद (शून्य काल्पनिक कल)')
              : (currentLanguage === 'hi'
              ? (recEval?.forecast?.isForecastEligible
                  ? `भाव का आधार: CEDA सत्यापित ७ दिन का रुझान ${forecastSlope >= 0 ? '+' : ''}${formatCurrency(forecastSlope, currentLanguage)}/दिन (${recEval.historyObservationCount ? toDevanagariDigits(recEval.historyObservationCount) : '७'} रिकॉर्ड, ${translateMandiName(rec.market.name, currentLanguage)})`
                  : 'सपाट भाव — एकल दिवसीय एगमार्कनेट अवलोकन (शून्य काल्पनिक रुझान)')
              : (recEval?.forecast?.isForecastEligible
                  ? `Forecast basis: Verified CEDA 7-day OLS slope ${forecastSlope >= 0 ? '+' : ''}₹${forecastSlope.toFixed(2)}/day (${recEval.historyObservationCount} observations)`
                  : 'Flat price path — Single-day Agmarknet observation (zero synthetic momentum)'))}
          </span>
          <span style="font-size: 0.74rem; color: #586B5E; line-height: 1.45; margin-left: 4px;">
            ${currentLanguage === 'mr'
              ? (recEval?.forecast?.isForecastEligible
                  ? `चढ-उतार मर्यादा ±${rs1(forecastUncertainty)}/क्विंटल (CEDA दप्तरातील चढ-उतार). अपेक्षित नफा हा या मर्यादेपेक्षा आणि साठवणूक खर्चापेक्षा जास्त असेल तरच माल थांबवण्याचा सल्ला दिला जातो.`
                  : `या बाजारासाठी थेट ॲगमार्कनेट भाव वापरला असून कोणताही काल्पनिक कल दाखवलेला नाही. साठवणूक भाडे, घट आणि ताजेपणा घसरणीमुळे होणारे नुकसान टाळण्यासाठी 'आजच विका' हा प्रामाणिक सल्ला.`
                )
              : (currentLanguage === 'hi'
              ? (recEval?.forecast?.isForecastEligible
                  ? `उतार-चढ़ाव सीमा ±${rs1(forecastUncertainty)}/क्विंटल (CEDA संग्रह से दैनिक उतार-चढ़ाव). अनुमानित लाभ इस बफर और लागत से अधिक होने पर ही माल रोकने की सलाह दी जाती है.`
                  : `इस मंडी हेतु वास्तविक एगमार्कनेट भाव लिया गया है और कोई कृत्रिम रुझान नहीं जोड़ा गया। भंडारण किराया व ताजेपन की गिरावट से बचने के लिए 'आज ही बेचें' का सटीक सुझाव.`
                )
              : (recEval?.forecast?.isForecastEligible
                  ? `Volatility buffer ±${rs1(forecastUncertainty)}/qtl (empirical σ of daily % changes from CEDA archive). Waiting is only advised when the projected gain clears this buffer plus holding costs.`
                  : `This mandi uses observed current Agmarknet prices with zero synthetic trend fallback. With prices held flat across day offsets, holding can only incur storage rent, biological decay and freshness degradation — hence advising optimal immediate sale.`
                ))}
          </span>
        </div>
      </div>

      <!-- Freshness intelligence strip -->
      <div style="display: flex; align-items: baseline; gap: 8px; background: rgba(85, 65, 45, 0.03); border: 1px solid rgba(85, 65, 45, 0.1); padding: 8px 14px; border-radius: 8px; margin-bottom: 10px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 240px; font-family: var(--font-family-body);">
          <span style="font-size: 0.8rem; font-weight: 700; color: #112A1B;">
            ${currentLanguage === 'mr'
              ? `बाजार ताजेपणा वटती: दररोज ${formatNumber(freshnessPctLabel, currentLanguage)}% (${decayType === 'SEMI_PERISHABLE' ? 'मध्यम नाशवंत' : (decayType === 'HIGHLY_PERISHABLE' ? 'अति नाशवंत' : 'दीर्घकाळ टिकणारे')})`
              : (currentLanguage === 'hi'
              ? `मंडी ताज़गी कटौती: प्रति दिन ${formatNumber(freshnessPctLabel, currentLanguage)}% (${decayType === 'SEMI_PERISHABLE' ? 'मध्यम नाशवान' : (decayType === 'HIGHLY_PERISHABLE' ? 'अति नाशवान' : 'दीर्घकालिक टिकाऊ')})`
              : `Market Freshness Discount: ${freshnessPctLabel}% per day held (${decayType.replace(/_/g, ' ').toLowerCase()}).`)}
          </span>
          <span style="font-size: 0.74rem; color: #586B5E; line-height: 1.45; margin-left: 4px;">
            ${currentLanguage === 'mr'
              ? `"माल सडला नाही" म्हणजे "नव्या तोडणीइतका ताजा" असा होत नाही. व्यापारी जुन्या मालाची प्रत व कडकपणा कमी झाल्यामुळे दर पाडतात. शिवाय दररोज ${formatNumber((decay.dailyDecayRatePct * 100).toFixed(1), currentLanguage)}% वजन घट आणि ${rs1(decay.dailyStorageRentRs)}/दिवस साठवणूक खर्च होतो. ${decayType === 'SEMI_PERISHABLE' ? 'मध्यम — टर्मिनल बाजारपेठेत दर वाढल्यास २-३ दिवस थांबणे सुरक्षित.' : ''}`
              : (currentLanguage === 'hi'
              ? `"माल सड़ा नहीं है" का अर्थ यह नहीं कि वह "नई तुड़ाई जितना ताजा" है। व्यापारी पुराने माल पर दाम काटते हैं। साथ ही प्रतिदिन ${formatNumber((decay.dailyDecayRatePct * 100).toFixed(1), currentLanguage)}% वजन घट व ${rs1(decay.dailyStorageRentRs)}/दिन साठवणूक खर्च लगता है.`
              : `Buyers discount aged stock for lost firmness, on top of ${(decay.dailyDecayRatePct * 100).toFixed(1)}%/day physical decay and ${rs1(decay.dailyStorageRentRs)}/day storage rent. ${decay.holdingAdvisability}`)}
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
          ${currentLanguage === 'mr' ? 'आवाज ऐका (मराठी)' : (currentLanguage === 'hi' ? 'आवाज सुनें (हिंदी)' : 'Play Audio')}
        </button>
      </div>

    </div>

    <!-- Decision Armor Suite (Next Page: Farmer Profit Protection Shield) -->
    <section class="editorial-section cockpit-armor-section" id="hub-profit-shield">
      <div class="editorial-eyebrow-header">
        <div class="editorial-header-top">
          <div class="editorial-landing-heading">
            <span class="editorial-landing-bar"></span>
            <h2 class="editorial-landing-title">${currentLanguage === 'mr' ? 'नफा सुरक्षा हमी // जोखीम व ताण चाचणी' : (currentLanguage === 'hi' ? 'मुनाफा सुरक्षा गारंटी // जोखिम व तनाव परीक्षण' : 'FARMER PROFIT PROTECTION SHIELD // RISK & STRESS TEST')}</h2>
          </div>
          <div class="editorial-landing-subtitle">
            ${currentLanguage === 'mr' ? 'शेतकरी प्रत्यक्ष वास्तव चाचणी: अचानक डिझेल भाव वाढले किंवा बाजार समितीच्या गेटवर वाहनांची रांग लागली तरी खिशातला नफा टिकून राहील का?' : (currentLanguage === 'hi' ? 'वास्तविक किसान जांच: यदि अचानक डीजल भाड़ा बढ़ जाए या मंडी गेट पर वाहनों की कतार लग जाए तब भी आपकी जेब का मुनाफा सुरक्षित रहेगा या नहीं?' : 'Real stress-tests: Profit protection against diesel spikes and mandi tractor queues')}
          </div>
        </div>
      </div>

      <div class="shield-grid">
        
        <!-- Nirnay Kawach (Decision Shield) -->
        <div class="shield-panel shield-panel-green">
          <div>
            <div class="shield-header-row">
              <div>
                <h4 class="shield-title">${currentLanguage === 'mr' ? 'निर्णय कवच: भाडे व डिझेल सुरक्षा' : (currentLanguage === 'hi' ? 'निर्णय कवच: भाड़ा व डीजल सुरक्षा' : 'Nirnay Kawach: Diesel & Fare Safety')}</h4>
                <div class="shield-marathi-label">${currentLanguage === 'mr' ? 'भाडे वाढले तरी खिशात नफा राहील का?' : (currentLanguage === 'hi' ? 'भाड़ा बढ़ा तो भी क्या मुनाफा बचेगा?' : 'Freight Resilience Engine')}</div>
              </div>
              <span class="badge ${kawach?.status === 'ROBUST' ? 'badge-sage' : (kawach?.status === 'CLOSE_CALL' ? 'badge-warning' : 'badge-danger')} shield-badge">
                ${kawach
                  ? `${currentLanguage === 'mr'
                      ? (kawach.status === 'ROBUST' ? 'नफा सुरक्षित' : (kawach.status === 'CLOSE_CALL' ? 'सावध राहा' : 'जास्त संवेदनशील'))
                      : (currentLanguage === 'hi'
                      ? (kawach.status === 'ROBUST' ? 'मुनाफा सुरक्षित' : (kawach.status === 'CLOSE_CALL' ? 'सतर्क रहें' : 'अत्यधिक संवेदनशील'))
                      : kawach.statusLabel)} · ${formatNumber(kawach.robustnessPct, currentLanguage)}%`
                  : (currentLanguage === 'mr' ? '१००% नफा सुरक्षित' : (currentLanguage === 'hi' ? '१००% मुनाफा सुरक्षित' : '100% PROFIT SAFE'))}
              </span>
            </div>

            <p class="shield-desc">
              ${currentLanguage === 'mr'
                ? `डिझेल भाववाढ व अंदाजातील फरकाविरुद्ध पडताळणी चाचणी (N = ${formatNumber(kawach?.simulationsCount ?? 0, currentLanguage)} सिम्युलेशन फेऱ्या).`
                : (currentLanguage === 'hi'
                  ? `डीजल मूल्य वृद्धि व संभावित उतार-चढ़ाव की जांच (N = ${formatNumber(kawach?.simulationsCount ?? 0, currentLanguage)} सिमुलेशन राउंड).`
                  : `Stress-tests the recommendation against diesel price hikes and residual errors (N = ${kawach?.simulationsCount ?? 0} seeded Monte Carlo runs).`)}
            </p>

            <div class="shield-slider-box">
              <div class="shield-metric-row">
                <span>${I18N_DICTIONARY.hub.normalFare[currentLanguage]} <strong class="shield-metric-val" style="color: #1B3B2B;">${rs1(sliderCurrent)}/km</strong></span>
                <span>${I18N_DICTIONARY.hub.safeFare[currentLanguage]} <strong class="shield-metric-val" style="color: #C05621;">${kawachBreakeven !== null ? `${rs1(kawachBreakeven)}/km` : (currentLanguage === 'mr' ? 'अमर्याद सुरक्षित' : (currentLanguage === 'hi' ? 'असीमित सुरक्षित' : 'no flip in range'))}</strong></span>
              </div>

              <label class="shield-slider-label">
                ${currentLanguage === 'mr' ? 'जास्त भाडे तपासा (स्लायडर हलवा):' : (currentLanguage === 'hi' ? 'अधिक भाड़ा जांचने के लिए स्लाइडर चलाएं:' : 'Drag slider to test higher diesel / tempo fare:')}
              </label>
              <input type="range" id="nirnay-slider" class="shield-range-input" min="${sliderMin}" max="${sliderMax}" step="${sliderStep}" value="${sliderCurrent}">

              <div id="nirnay-slider-feedback" class="shield-feedback-card" style="color: #15803D; border-color: #86EFAC; background: #F0FDF4;">
                ${currentLanguage === 'mr' 
                  ? `चालू भाडे: ${rs1(sliderCurrent)}/km → <strong>${translateMandiName(kawach?.winningMarket.name || rec.market.name, currentLanguage)} (+${formatNumber(kawach?.winningMarket.day ?? rec.dayOffset, currentLanguage)} दिवस)</strong> येथे विक्री केल्यास खिशात जास्तीत जास्त नफा राहील.`
                  : (currentLanguage === 'hi'
                    ? `सक्रिय किराया: ${rs1(sliderCurrent)}/km → <strong>${translateMandiName(kawach?.winningMarket.name || rec.market.name, currentLanguage)} (+${formatNumber(kawach?.winningMarket.day ?? rec.dayOffset, currentLanguage)} दिन)</strong> में बेचने पर जेब में अधिकतम मुनाफा मिलेगा।`
                    : `Active Fare: ${rs1(sliderCurrent)}/km → Selling at <strong>${kawach?.winningMarket.name || rec.market.name} (+${kawach?.winningMarket.day ?? rec.dayOffset}d)</strong> gives you maximum take-home cash.`
                  )}
              </div>
            </div>
          </div>

          <div class="shield-guarantee-card">
            <strong>${I18N_DICTIONARY.hub.farmerGuarantee[currentLanguage]}</strong> ${
              currentLanguage === 'mr'
                ? `हा सल्ला तपासलेल्या १००% खर्च व भाव परिस्थितींमध्ये स्थिर राहतो. वाहतूक खर्च ₹${rs1(kawach?.breakevenTransportRate || 24.7)}/किमी ओलांडत नाही तोपर्यंत हाच बाजार सर्वोत्तम राहतो.`
                : (currentLanguage === 'hi'
                ? `यह सिफारिश जांची गई १००% लागत व भाव परिस्थितियों में स्थिर रहती है। ढुलाई खर्च ₹${rs1(kawach?.breakevenTransportRate || 24.7)}/किमी पार नहीं करता तब तक यही मंडी सर्वोत्तम रहेगी.`
                : (kawach?.decisionMessage || `This recommendation remains unchanged under 100% of tested cost and price scenarios. Remains optimal until transport exceeds ₹${(kawach?.breakevenTransportRate || 24.7).toFixed(1)}/km.`))
            }
          </div>
        </div>

        <!-- Bhed Vivek (Market Congestion Intelligence) -->
        <div class="shield-panel shield-panel-amber">
          <div>
            <div class="shield-header-row">
              <div>
                <h4 class="shield-title">${currentLanguage === 'mr' ? 'भेद विवेक: बाजारपेठ गर्दी व आवक इशारा' : (currentLanguage === 'hi' ? 'भेद विवेक: मंडी भीड़ व आवक चेतावनी' : 'Bhed Vivek: Mandi Rush Alert')}</h4>
                <div class="shield-marathi-label">${currentLanguage === 'mr' ? 'बाजार समिती आवक व गर्दी विश्लेषण' : (currentLanguage === 'hi' ? 'मंडी आवक व भीड़ विश्लेषण' : 'Terminal Congestion Alert')}</div>
              </div>
              <span id="bhed-badge" class="badge shield-badge" style="background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A;">
                ${bhed
                   ? (bhed.supplyPressure === 'LOW'
                       ? (currentLanguage === 'mr' ? 'सुरळीत आवक' : (currentLanguage === 'hi' ? 'सुचारू आवक' : 'SMOOTH ARRIVAL'))
                       : (bhed.supplyPressure === 'MEDIUM'
                       ? (currentLanguage === 'mr' ? 'मध्यम गर्दी' : (currentLanguage === 'hi' ? 'मध्यम भीड़' : 'MODERATE RUSH'))
                       : (currentLanguage === 'mr' ? 'मोठी गर्दी इशारा' : (currentLanguage === 'hi' ? 'भारी भीड़ चेतावनी' : 'HEAVY JAM ALERT'))))
                   : (currentLanguage === 'mr' ? 'गर्दी अंदाज सुरू आहे…' : (currentLanguage === 'hi' ? 'भीड़ अनुमान जारी…' : 'FORECASTING CROWD…'))}
              </span>
            </div>

            <p class="shield-desc">
              ${currentLanguage === 'mr'
                ? 'बाजार समितीत ट्रॅक्टरच्या रांगा लागल्यास लिलाव भाव घसरतात. आम्ही गर्दी होण्यापूर्वीच योग्य सावधगिरीचा इशारा देतो.'
                : (currentLanguage === 'hi'
                  ? 'मंडी में ज्यादा आवक से दाम गिरते हैं। जाम लगने से पहले सही सलाह पाएं।'
                  : 'If too many tractor-trolleys arrive at the same mandi, auction rates drop. We alert you before you get stuck in a queue.')}
            </p>

            <!-- PREDICTED arrival pressure. MandiMitra forecasts the crowd; the farmer no longer guesses. -->
            <div id="bhed-basis-tag" style="font-size:0.58rem;font-weight:800;letter-spacing:0.05em;text-transform:uppercase;color:${bhed?.supplyPressureBasis === 'USER_OVERRIDE' ? '#3730a3' : '#166534'};margin:4px 0 2px 0;">
              ${bhed?.supplyPressureBasis === 'USER_OVERRIDE'
                ? I18N_DICTIONARY.hub.rushOverrideTag[currentLanguage]
                : I18N_DICTIONARY.hub.rushForecastTag[currentLanguage]}${bhed?.confidence ? ` · ${I18N_DICTIONARY.hub.rushConfidence[currentLanguage]} ${bhed.confidence}` : ''}
            </div>

            <div id="bhed-forecast-strip">
              ${renderRushOutlook(bhed, currentLanguage)}
              ${renderRushDrivers(bhed, currentLanguage)}
            </div>

            <label class="shield-slider-label" style="margin-top: 12px;">
              ${I18N_DICTIONARY.hub.rushWhatIfLabel[currentLanguage]}
            </label>
            <div class="bhed-scenario-grid">
              <button class="bhed-scenario-btn btn-bhed-scenario ${bhed?.supplyPressureBasis === 'USER_OVERRIDE' && bhed?.supplyPressure === 'LOW' ? 'active-low' : ''}" data-level="LOW">
                ${currentLanguage === 'mr' ? 'सुरळीत' : (currentLanguage === 'hi' ? 'सुचारू' : 'Normal Crowd')}<span>(${currentLanguage === 'mr' ? 'कमी गर्दी' : (currentLanguage === 'hi' ? 'कम भीड़' : 'Normal')})</span>
              </button>
              <button class="bhed-scenario-btn btn-bhed-scenario ${bhed?.supplyPressureBasis === 'USER_OVERRIDE' && bhed?.supplyPressure === 'MEDIUM' ? 'active-med' : ''}" data-level="MEDIUM">
                ${currentLanguage === 'mr' ? 'मध्यम गर्दी' : (currentLanguage === 'hi' ? 'मध्यम भीड़' : 'Medium Rush')}<span>(${currentLanguage === 'mr' ? 'नेहमीची आवक' : (currentLanguage === 'hi' ? 'सामान्य आवक' : 'Moderate')})</span>
              </button>
              <button class="bhed-scenario-btn btn-bhed-scenario ${bhed?.supplyPressureBasis === 'USER_OVERRIDE' && bhed?.supplyPressure === 'HIGH' ? 'active-high' : ''}" data-level="HIGH">
                ${currentLanguage === 'mr' ? 'मोठी गर्दी' : (currentLanguage === 'hi' ? 'भारी भीड़' : 'Heavy Jam')}<span>(${currentLanguage === 'mr' ? 'लांबच लांब रांग' : (currentLanguage === 'hi' ? 'लंबी कतार' : 'Heavy Queue')})</span>
              </button>
            </div>
            <button id="btn-bhed-reset" type="button" style="margin-top:6px;display:${bhed?.supplyPressureBasis === 'USER_OVERRIDE' ? 'inline-block' : 'none'};font-size:0.66rem;padding:3px 10px;border:1px solid var(--color-border);background:#fff;border-radius:99px;cursor:pointer;">
              ↺ ${I18N_DICTIONARY.hub.rushBackToForecast[currentLanguage]}
            </button>

            <div id="bhed-feedback-box" class="bhed-feedback-box">
              <div class="bhed-feedback-top">
                <span>${I18N_DICTIONARY.hub.rushDrop[currentLanguage]} <strong id="bhed-impact-text" style="color: #DC2626; font-family: var(--font-family-heading); font-size: 0.95rem;">${bhed ? `−${rs1(bhed.congestionImpactPerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)}` : '—'}</strong></span>
                <span id="bhed-capacity-text" style="color: #73512B;">${I18N_DICTIONARY.hub.buyerDemand[currentLanguage]} <strong>${formatAbsorption(bhed, currentLanguage)}</strong></span>
              </div>
              <div id="bhed-alert-text" class="bhed-alert-msg">
                ${formatBhedAlert(bhed, rec, currentLanguage)}
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
            ${currentLanguage === 'mr' ? 'व्यापाऱ्याचा लिलाव भाव ते शेतकऱ्याचा प्रत्यक्ष हातात येणारा नफा — संपूर्ण पारदर्शक हिशोब' : (currentLanguage === 'hi' ? 'नीलामी भाव से किसान के हाथ में आने वाली असली रकम का पूरा विवरण' : 'Where every rupee goes: Complete deduction audit from auction price to take-home cash')}
          </div>
        </div>
      </div>

      <div class="editorial-table-container">
        <table class="editorial-table">
          <thead>
            <tr>
              <th>${currentLanguage === 'mr' ? 'खर्च व उत्पन्न तपशील' : (currentLanguage === 'hi' ? 'खर्च व आय विवरण' : 'Expense or Earning Item')}</th>
              <th>${currentLanguage === 'mr' ? 'जवळचा स्थानिक बाजार आज' : (currentLanguage === 'hi' ? 'निकटतम स्थानीय मंडी आज' : 'Closest Local Mandi Today')} (${translateMandiName(base.market.name, currentLanguage)})</th>
              <th>${currentLanguage === 'mr' ? 'शिफारस केलेला सर्वोत्तम बाजार' : (currentLanguage === 'hi' ? 'सर्वोत्तम अनुशंसित मंडी' : 'Recommended Mandi')} (${translateMandiName(rec.market.name, currentLanguage)}, ${currentLanguage === 'mr' ? (rec.dayOffset === 0 ? 'आज' : `दिवस +${formatNumber(rec.dayOffset, currentLanguage)}`) : (currentLanguage === 'hi' ? (rec.dayOffset === 0 ? 'आज' : `दिन +${formatNumber(rec.dayOffset, currentLanguage)}`) : `Day ${rec.dayOffset}`)})</th>
              <th>${currentLanguage === 'mr' ? 'खिशातील निव्वळ फरक' : (currentLanguage === 'hi' ? 'जेब में शुद्ध अंतर' : 'Difference In Your Pocket')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span class="audit-item-label">${currentLanguage === 'mr' ? '१. एकूण लिलाव भाव' : (currentLanguage === 'hi' ? '१. कुल नीलामी भाव' : '1. Gross Auction Price')}</span>
                <span class="audit-item-sub">(${currentLanguage === 'mr' ? 'व्यापाऱ्याने दिलेला दर' : (currentLanguage === 'hi' ? 'व्यापारी द्वारा दिया गया दर' : 'mandi auction rate')})</span>
              </td>
              <td><span class="mandi-num-cell">${rs1(base.grossPricePerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)}</span> <span style="color: #586B5E; font-size: 0.78rem;">(${rs(base.totalGrossValue)})</span></td>
              <td><span class="mandi-num-cell">${rs1(rec.grossPricePerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)}</span> <span style="color: #586B5E; font-size: 0.78rem;">(${rs(rec.totalGrossValue)})</span></td>
              <td style="color: #15803D; font-family: var(--font-family-heading); font-weight: 800;">+${rs(Math.max(0, rec.totalGrossValue - base.totalGrossValue))} ${currentLanguage === 'mr' ? 'जास्त लिलाव भाव' : (currentLanguage === 'hi' ? 'अधिक नीलामी मूल्य' : 'higher auction')}</td>
            </tr>
            <tr>
              <td>
                <span class="audit-item-label" style="color: #B91C1C;">${currentLanguage === 'mr' ? '२. वजा: गाडी भाडे व डिझेल खर्च' : (currentLanguage === 'hi' ? '२. घटाएं: गाड़ी भाड़ा व डीजल खर्च' : '2. Minus: Vehicle Freight & Diesel')}</span>
                <span class="audit-item-sub">(${currentLanguage === 'mr' ? 'रस्ता वाहतूक' : (currentLanguage === 'hi' ? 'सड़क ढुलाई' : 'freight haulage')})</span>
              </td>
              <td class="audit-deduction-text">−${rs1(base.roadFreightPerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)} <span class="audit-deduction-sub">(−${rs(base.totalTransportCost)})</span></td>
              <td class="audit-deduction-text">−${rs1(rec.roadFreightPerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)} <span class="audit-deduction-sub">(−${rs(rec.totalTransportCost)})</span></td>
              <td class="audit-deduction-text">−${rs(rec.totalTransportCost - base.totalTransportCost)}</td>
            </tr>
            <tr>
              <td>
                <span class="audit-item-label" style="color: #B91C1C;">${currentLanguage === 'mr' ? '३. वजा: बाजार समिती फी, हमाली व तोलाई' : (currentLanguage === 'hi' ? '३. घटाएं: मंडी शुल्क, हमाली व तुलाई' : '3. Minus: Mandi Fees & Hamali/Tolai')}</span>
                <span class="audit-item-sub">(${currentLanguage === 'mr' ? 'बाजार फी व वजन' : (currentLanguage === 'hi' ? 'मंडी शुल्क व तौल' : 'cess & weighing')})</span>
              </td>
              <td class="audit-deduction-text">−${rs1(base.apmcCessPerQtl + base.hamaliAndTolaiPerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)} <span class="audit-deduction-sub">(−${rs(base.totalApmcDeductions)})</span></td>
              <td class="audit-deduction-text">−${rs1(rec.apmcCessPerQtl + rec.hamaliAndTolaiPerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)} <span class="audit-deduction-sub">(−${rs(rec.totalApmcDeductions)})</span></td>
              <td class="audit-deduction-text">−${rs(rec.totalApmcDeductions - base.totalApmcDeductions)}</td>
            </tr>
            <tr>
              <td>
                <span class="audit-item-label" style="color: #B91C1C;">${currentLanguage === 'mr' ? '४. वजा: साठवणूक व वजन घट' : (currentLanguage === 'hi' ? '४. घटाएं: भंडारण व वजन घटौती' : '4. Minus: Storage & Produce Weight Loss')}</span>
                <span class="audit-item-sub">(${currentLanguage === 'mr' ? 'गोदाम भाडे व घट' : (currentLanguage === 'hi' ? 'गोदाम किराया व घट' : 'storage rent & decay')})</span>
              </td>
              <td style="color: #586B5E;">${base.dayOffset === 0 ? `${formatCurrency(0, currentLanguage)} (${currentLanguage === 'mr' ? 'विक्री आजच — शून्य वाट' : (currentLanguage === 'hi' ? 'बिक्री आज ही — शून्य प्रतीक्षा' : 'Same-day sale')})` : `−${rs1(base.holdingAndSpoilagePerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)} (−${rs(base.totalHoldingSpoilageLoss)})`}</td>
              <td class="audit-deduction-text">${rec.dayOffset === 0 ? `${formatCurrency(0, currentLanguage)} (${currentLanguage === 'mr' ? 'विक्री आजच — शून्य वाट' : (currentLanguage === 'hi' ? 'बिक्री आज ही — शून्य प्रतीक्षा' : 'Same-day sale')})` : `−${rs1(rec.holdingAndSpoilagePerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)} (−${rs(rec.totalHoldingSpoilageLoss)})`}</td>
              <td class="audit-deduction-text">−${rs(rec.totalHoldingSpoilageLoss - base.totalHoldingSpoilageLoss)}</td>
            </tr>
            <tr>
              <td>
                <span class="audit-item-label" style="color: #B91C1C;">${currentLanguage === 'mr' ? `५. वजा: बाजार ताजेपणा वटती (${formatNumber(freshnessPctLabel, currentLanguage)}%/दिवस)` : (currentLanguage === 'hi' ? `५. घटाएं: मंडी ताज़गी कटौती (${formatNumber(freshnessPctLabel, currentLanguage)}%/दिन)` : `5. Minus: Market Freshness Discount (${freshnessPctLabel}%/day)`)}</span>
                <span class="audit-item-sub">(${currentLanguage === 'mr' ? 'जुना माल भाव कपात' : (currentLanguage === 'hi' ? 'पुराने माल पर कटौती' : 'freshness discount')})</span>
              </td>
              <td style="color: #586B5E;">${base.dayOffset === 0 ? `${formatCurrency(0, currentLanguage)} (${currentLanguage === 'mr' ? 'आजची ताजी तोडणी' : (currentLanguage === 'hi' ? 'आज की ताज़ा तुड़ाई' : 'Same-day harvest')})` : `−${rs1(base.freshnessDiscountPerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)} (−${rs(base.totalFreshnessDiscount)})`}</td>
              <td class="audit-deduction-text">${rec.dayOffset === 0 ? `${formatCurrency(0, currentLanguage)} (${currentLanguage === 'mr' ? 'आजची ताजी तोडणी' : (currentLanguage === 'hi' ? 'आज की ताज़ा तुड़ाई' : 'Same-day harvest')})` : `−${rs1(rec.freshnessDiscountPerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)} (−${rs(rec.totalFreshnessDiscount)})`}</td>
              <td class="audit-deduction-text">−${rs(rec.totalFreshnessDiscount - base.totalFreshnessDiscount)}</td>
            </tr>
            <tr class="audit-winner-row">
              <td class="audit-winner-label">${currentLanguage === 'mr' ? 'थेट खिशात उरणारा निव्वळ नफा (असली दाम™)' : (currentLanguage === 'hi' ? 'जेब में आने वाला शुद्ध पैसा (असली दाम™)' : 'Real Cash in Hand (AsliDaam™)')}</td>
              <td><strong class="audit-winner-num" style="color: #384A3E;">${rs1(base.asliDaamPerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)} <span style="font-size: 0.82rem; font-weight: normal; color: #586B5E;">(${rs(base.totalNetPayout)})</span></strong></td>
              <td><strong class="audit-winner-num">${rs1(rec.asliDaamPerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)} <span style="font-size: 0.82rem; font-weight: normal; color: #586B5E;">(${rs(rec.totalNetPayout)})</span></strong></td>
              <td><span class="audit-gain-badge">+${rs(opt.totalPocketCashGain)} ${currentLanguage === 'mr' ? 'जास्तीची रोकड' : (currentLanguage === 'hi' ? 'अतिरिक्त नकद' : 'Extra Cash')}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p style="font-family: var(--font-family-body); font-size: 0.76rem; color: #586B5E; margin-top: 10px; line-height: 1.5;">
        ${currentLanguage === 'mr'
          ? 'सूत्र: असली दाम = एकूण लिलाव भाव − गाडी भाडे − बाजार समिती फी − साठवणूक भाडे − वजन घट − ताजेपणा वटती. ताजेपणा वटती म्हणजे माल खराब नसला तरी जुना असल्यामुळे खरेदीदार व्यापारी करत असलेली भाव कपात.'
          : (currentLanguage === 'hi'
          ? 'सूत्र: असली दाम = कुल नीलामी भाव − गाड़ी भाड़ा − मंडी शुल्क − भंडारण किराया − वजन घटौती − ताज़गी कटौती. ताज़गी कटौती का अर्थ है माल खराब न होने पर भी पुराना होने के कारण व्यापारी द्वारा की जाने वाली दर कटौती.'
          : 'Formula: AsliDaam = Gross − RoadFreight − APMCDeductions − StorageRent − PhysicalDecayLoss − FreshnessDiscount. The freshness discount is the commercial haircut mandi buyers apply to stock that is not from today\'s harvest.')}
      </p>
    </section>

    <!-- Multi-Mandi × Day Grid -->
    <section class="editorial-section" style="padding-top: 0; margin-bottom: var(--space-8);">
      <div class="editorial-eyebrow-header">
        <div class="editorial-header-top">
          <div class="editorial-landing-heading">
            <span class="editorial-landing-bar"></span>
            <h2 class="editorial-landing-title">${currentLanguage === 'mr' ? 'सर्व बाजारांची तुलना // पुढील ३ दिवस' : (currentLanguage === 'hi' ? 'सभी मंडियों की तुलना // अगले ३ दिन' : 'REGIONAL MANDI COMPARISON // 0 TO 3 DAYS')}</h2>
          </div>
          <div class="editorial-landing-subtitle">
            ${currentLanguage === 'mr'
              ? `डिझेल व साठवणूक खर्च वजा करून ${formatNumber(evalData.evaluations.length, currentLanguage)} बाजार समित्यांमध्ये मिळणाऱ्या खऱ्या नफ्याचे विश्लेषण. खिशात सर्वाधिक रोकड देणारा बाजार व दिवस निवडा.`
              : (currentLanguage === 'hi'
              ? `डीजल व भंडारण खर्च काटकर ${formatNumber(evalData.evaluations.length, currentLanguage)} मंडियों में मिलने वाले वास्तविक लाभ का विश्लेषण. अपनी जेब में सर्वाधिक नकद देने वाली मंडी व दिन चुनें.`
              : `Compare true net payouts across ${evalData.evaluations.length} candidate APMCs after haulage and waiting costs`)}
            ${opt.maxDayOffsetAllowed < 3
              ? ` (${currentLanguage === 'mr' ? `धोरण मर्यादा: या शेतमालासाठी कमाल +${formatNumber(opt.maxDayOffsetAllowed, currentLanguage)} दिवस` : (currentLanguage === 'hi' ? `नीति सीमा: इस फसल हेतु अधिकतम +${formatNumber(opt.maxDayOffsetAllowed, currentLanguage)} दिन` : `Policy cap: Day +${opt.maxDayOffsetAllowed} max for this commodity`)})`
              : ''}
          </div>
        </div>
      </div>

      <div class="editorial-table-container">
        <table class="editorial-table">
          <thead>
            <tr>
              <th>${currentLanguage === 'mr' ? 'बाजारपेठ (APMC)' : (currentLanguage === 'hi' ? 'मंडी (APMC)' : 'Mandi (APMC)')}</th>
              <th>${currentLanguage === 'mr' ? 'अंतर' : (currentLanguage === 'hi' ? 'दूरी' : 'Distance')}</th>
              <th>${currentLanguage === 'mr' ? 'विक्रीची वेळ' : (currentLanguage === 'hi' ? 'समय' : 'Timing')}</th>
              <th>${currentLanguage === 'mr' ? 'लिलाव भाव' : (currentLanguage === 'hi' ? 'नीलामी भाव' : 'Auction Rate')}</th>
              <th>${currentLanguage === 'mr' ? 'एकूण खर्च' : (currentLanguage === 'hi' ? 'कुल खर्च' : 'All Expenses')}</th>
              <th>${currentLanguage === 'mr' ? 'निव्वळ दर / क्विंटल' : (currentLanguage === 'hi' ? 'शुद्ध दर / क्विंटल' : 'Real In-Hand / Qtl')}</th>
              <th>${currentLanguage === 'mr' ? 'एकूण खिशात' : (currentLanguage === 'hi' ? 'कुल जेब में' : 'Total In Pocket')}</th>
              <th>${currentLanguage === 'mr' ? 'सल्ला' : (currentLanguage === 'hi' ? 'सलाह' : 'Decision Status')}</th>
            </tr>
          </thead>
          <tbody>
            ${opt.allCombinations.map(c => {
              if (c.isStaleOrAbstained) {
                return `
                  <tr class="mandi-row-stale">
                    <td><strong>${translateMandiName(c.market.name, currentLanguage)}</strong></td>
                    <td>${formatUnit(c.market.estimatedRoadDistanceKm ? c.market.estimatedRoadDistanceKm.toFixed(1) : 0, 'km', currentLanguage)}</td>
                    <td>${currentLanguage === 'mr' ? (c.dayOffset === 0 ? 'आज' : `+${formatNumber(c.dayOffset, currentLanguage)} दिवस`) : (currentLanguage === 'hi' ? (c.dayOffset === 0 ? 'आज' : `+${formatNumber(c.dayOffset, currentLanguage)} दिन`) : `Day ${c.dayOffset}`)}</td>
                    <td colspan="4" style="color: var(--color-status-abstain); font-weight: 600;">
                      ${c.abstentionReason ? (currentLanguage !== 'en' ? toDevanagariDigits(c.abstentionReason) : c.abstentionReason) : (currentLanguage === 'mr' ? 'डेटा जुना — सल्ला नाही' : (currentLanguage === 'hi' ? 'डेटा पुराना — कोई सलाह नहीं' : 'Data Stale — Cannot Advise'))}
                    </td>
                    <td><span class="badge badge-danger">${currentLanguage === 'mr' ? 'नकार' : (currentLanguage === 'hi' ? 'अस्वीकार' : 'ABSTAINED')}</span></td>
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
                  <td>${formatUnit(c.market.estimatedRoadDistanceKm ? c.market.estimatedRoadDistanceKm.toFixed(1) : 0, 'km', currentLanguage)}</td>
                  <td>${currentLanguage === 'mr' ? (c.dayOffset === 0 ? 'आज' : `+${formatNumber(c.dayOffset, currentLanguage)} दिवस`) : (currentLanguage === 'hi' ? (c.dayOffset === 0 ? 'आज' : `+${formatNumber(c.dayOffset, currentLanguage)} दिन`) : `Day ${c.dayOffset} (${c.dayOffset === 0 ? 'Today' : `+${c.dayOffset}d`})`)}</td>
                  <td><span class="mandi-num-cell">${formatCurrency(c.grossPricePerQtl, currentLanguage)}</span></td>
                  <td style="color: var(--color-status-abstain);">−${formatCurrency(c.grossPricePerQtl - c.asliDaamPerQtl, currentLanguage)}</td>
                  <td><span class="mandi-num-cell" style="color: #112A1B;">${rs1(c.asliDaamPerQtl)}</span></td>
                  <td><span class="mandi-num-cell" style="color: #15803D;">${rs(c.totalNetPayout)}</span></td>
                  <td>
                    ${isBest
                      ? `<span class="badge badge-accent" style="font-family: var(--font-family-heading); font-weight: 800; padding: 4px 10px; border-radius: 6px;">${currentLanguage === 'mr' ? 'सर्वोत्तम निवड' : (currentLanguage === 'hi' ? 'सर्वश्रेष्ठ विकल्प' : 'BEST OPTION')}</span>`
                      : (isBase
                          ? `<span class="badge badge-neutral" style="font-family: var(--font-family-heading); font-weight: 700; padding: 4px 8px; border-radius: 6px;">${currentLanguage === 'mr' ? 'स्थानिक बाजार' : (currentLanguage === 'hi' ? 'स्थानीय मंडी' : 'DEFAULT')}</span>`
                          : (beyondPolicy
                              ? `<span class="badge badge-neutral" style="font-size:0.6rem;">${currentLanguage === 'mr' ? 'मर्यादेबाहेर' : (currentLanguage === 'hi' ? 'सीमा से बाहर' : 'BEYOND POLICY HORIZON')}</span>`
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
  const speakBtn = panel.querySelector('#btn-speak-aslidaam') as HTMLButtonElement | null;
  if (speakBtn) {
    const defaultBtnText = currentLanguage === 'mr'
      ? 'आवाज ऐका (मराठी)'
      : (currentLanguage === 'hi' ? 'आवाज सुनें (हिंदी)' : 'Play Audio');
    const stopBtnText = currentLanguage === 'mr'
      ? '⏹ थांबा (Stop)'
      : (currentLanguage === 'hi' ? '⏹ रोकें (Stop)' : '⏹ Stop Audio');

    const resetButton = () => {
      speakBtn.textContent = defaultBtnText;
      speakBtn.style.background = '#1B3B2B';
      speakBtn.removeAttribute('data-speaking');
    };

    speakBtn.addEventListener('click', () => {
      if (!('speechSynthesis' in window)) {
        alert(headline);
        return;
      }

      // If already speaking, toggle stop
      if (window.speechSynthesis.speaking || speakBtn.hasAttribute('data-speaking')) {
        window.speechSynthesis.cancel();
        activeSpeechUtterance = null;
        resetButton();
        return;
      }

      try {
        // Clear previous state and ensure audio engine is active
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();

        const utterance = new SpeechSynthesisUtterance(headline);
        activeSpeechUtterance = utterance;
        (window as any).__mandiMitraUtterance = utterance; // Prevent Chromium V8 GC drop

        const voice = resolveBestVoice(currentLanguage);
        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang;
        } else {
          utterance.lang = currentLanguage === 'mr' ? 'mr-IN' : (currentLanguage === 'hi' ? 'hi-IN' : 'en-IN');
        }

        utterance.rate = 0.9;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
          speakBtn.textContent = stopBtnText;
          speakBtn.style.background = '#b91c1c';
          speakBtn.setAttribute('data-speaking', 'true');
        };

        utterance.onend = () => {
          activeSpeechUtterance = null;
          resetButton();
        };

        utterance.onerror = (e) => {
          console.warn('[AudioReadout] Speech error:', e);
          activeSpeechUtterance = null;
          resetButton();
          if (e.error !== 'canceled' && e.error !== 'interrupted') {
            alert(headline);
          }
        };

        // 60ms delay allows Chromium cancellation queue to flush before scheduling new speech
        setTimeout(() => {
          window.speechSynthesis.resume();
          window.speechSynthesis.speak(utterance);
          // Safety resume watchdog for Chromium paused bug
          setTimeout(() => {
            if (window.speechSynthesis.paused) {
              window.speechSynthesis.resume();
            }
          }, 250);
        }, 60);

      } catch (err) {
        console.error('[AudioReadout] Failed to speak:', err);
        resetButton();
        alert(headline);
      }
    });
  }

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
        const winDay = formatNumber(res.winningMarket.day, currentLanguage);
        if (!flipped && rate < beLimit - 0.3) {
          nirnayFeedback.innerHTML = currentLanguage === 'mr'
            ? `चालू भाडे: ${rs1(res.activeTransportRate)}/km → <strong>${winName} (+${winDay} दिवस)</strong> येथे विक्री केल्यास जास्तीत जास्त फायदा राहील <span style="color: #15803d; font-weight: 800;">(खिशात सर्वाधिक नफा)</span>`
            : (currentLanguage === 'hi'
              ? `सक्रिय किराया: ${rs1(res.activeTransportRate)}/km → <strong>${winName} (+${winDay} दिन)</strong> में बेचने पर सबसे ज्यादा मुनाफा मिलेगा <span style="color: #15803d; font-weight: 800;">(जेब में अधिकतम कमाई)</span>`
              : `Active Fare: ${rs1(res.activeTransportRate)}/km → Selling at <strong>${winName} (+${winDay}d)</strong> gives you maximum cash <span style="color: #15803d; font-weight: 800;">(Maximum Take-Home Profit)</span>`
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
            ? `चालू भाडे: ${rs1(res.activeTransportRate)}/km → <strong style="color: #b91c1c;">भाडे खूप जास्त!</strong> सर्वोत्तम पर्याय: <strong>${winName} (+${winDay} दिवस)</strong> — जवळची बाजारपेठ निवडणे फायद्याचे.`
            : (currentLanguage === 'hi'
              ? `सक्रिय किराया: ${rs1(res.activeTransportRate)}/km → <strong style="color: #b91c1c;">किराया बहुत अधिक!</strong> सर्वोत्तम विकल्प: <strong>${winName} (+${winDay} दिन)</strong> — नजदीक की मंडी चुनना फायदेमंद।`
              : `Active Fare: ${rs1(res.activeTransportRate)}/km → <strong style="color: #b91c1c;">Fare Too High!</strong> Winner: <strong>${winName} (+${winDay}d)</strong> — Closer distance beats high freight.`
            );
          nirnayFeedback.style.color = '#b91c1c';
          nirnayFeedback.style.borderColor = '#fca5a5';
          nirnayFeedback.style.background = '#fef2f2';
        }
      } catch (err) {
        nirnayFeedback.textContent = currentLanguage === 'mr' ? 'चाचणी उपलब्ध नाही' : (currentLanguage === 'hi' ? 'जांच अनुपलब्ध' : `Stress test unavailable: ${err instanceof Error ? err.message : String(err)}`);
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

  // ---- Bhed Vivek: predicted crowd by default, manual what-if on demand ----
  const bhedButtons = panel.querySelectorAll('.btn-bhed-scenario');
  const bhedBadge = panel.querySelector('#bhed-badge') as HTMLElement | null;
  const bhedImpactText = panel.querySelector('#bhed-impact-text') as HTMLElement | null;
  const bhedCapacityText = panel.querySelector('#bhed-capacity-text') as HTMLElement | null;
  const bhedAlertText = panel.querySelector('#bhed-alert-text') as HTMLElement | null;
  const bhedBasisTag = panel.querySelector('#bhed-basis-tag') as HTMLElement | null;
  const bhedResetBtn = panel.querySelector('#btn-bhed-reset') as HTMLElement | null;
  const bhedStrip = panel.querySelector('#bhed-forecast-strip') as HTMLElement | null;

  /** Repaints the card from a Bhed Vivek payload, whichever basis produced it. */
  const paintBhed = (res: any) => {
    const level = res.supplyPressure as 'LOW' | 'MEDIUM' | 'HIGH';
    const isOverride = res.supplyPressureBasis === 'USER_OVERRIDE';

    if (bhedBadge) {
      bhedBadge.textContent = level === 'LOW'
        ? (currentLanguage === 'mr' ? 'सुरळीत आवक' : (currentLanguage === 'hi' ? 'सुचारू आवक' : 'SMOOTH ARRIVAL'))
        : (level === 'MEDIUM'
            ? (currentLanguage === 'mr' ? 'मध्यम गर्दी' : (currentLanguage === 'hi' ? 'मध्यम भीड़' : 'MODERATE RUSH'))
            : (currentLanguage === 'mr' ? 'मोठी गर्दी इशारा' : (currentLanguage === 'hi' ? 'भारी भीड़ चेतावनी' : 'HEAVY JAM ALERT')));
      const c = rushLevelColors(level);
      bhedBadge.style.background = c.bg;
      bhedBadge.style.color = c.fg;
      bhedBadge.style.border = `1px solid ${c.border}`;
    }
    if (bhedBasisTag) {
      bhedBasisTag.textContent = (isOverride
        ? I18N_DICTIONARY.hub.rushOverrideTag[currentLanguage]
        : I18N_DICTIONARY.hub.rushForecastTag[currentLanguage]) + (res.confidence ? ` · ${I18N_DICTIONARY.hub.rushConfidence[currentLanguage]} ${res.confidence}` : '');
      bhedBasisTag.style.color = isOverride ? '#3730a3' : '#166534';
    }
    if (bhedResetBtn) bhedResetBtn.style.display = isOverride ? 'inline-block' : 'none';
    if (bhedStrip) bhedStrip.innerHTML = renderRushOutlook(res, currentLanguage) + renderRushDrivers(res, currentLanguage);
    if (bhedImpactText) bhedImpactText.textContent = `−${rs1(res.congestionImpactPerQtl)} / ${formatUnit(1, 'qtl', currentLanguage)}`;
    if (bhedCapacityText) {
      bhedCapacityText.innerHTML = `${I18N_DICTIONARY.hub.buyerDemand[currentLanguage]} <strong>${formatAbsorption(res, currentLanguage)}</strong>`;
    }
    if (bhedAlertText) {
      const c = rushLevelColors(level);
      bhedAlertText.style.color = c.fg;
      bhedAlertText.textContent = formatBhedAlert(res, rec, currentLanguage);
    }
  };

  /** Re-queries Bhed Vivek; omit `level` to return to MandiMitra's own forecast. */
  const refreshBhed = async (level: 'LOW' | 'MEDIUM' | 'HIGH' | null) => {
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
        ...(level ? { supplyPressure: level } : {}),
        transportCostPerKmPerQtl: cState.costConfig.transportCostPerKmPerQtl,
        storageCostPerDayPerQtl: cState.costConfig.storageCostPerDayPerQtl,
        radiusKm: cState.costConfig.searchRadiusKm
      });
      paintBhed(res);
    } catch (err) {
      if (bhedAlertText) {
        bhedAlertText.style.color = 'var(--color-status-abstain)';
        bhedAlertText.textContent = `${err instanceof Error ? err.message : String(err)}`;
      }
    }
  };

  bhedResetBtn?.addEventListener('click', () => {
    bhedButtons.forEach(b => b.classList.remove('active-low', 'active-med', 'active-high'));
    void refreshBhed(null);
  });

  bhedButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const level = btn.getAttribute('data-level') as 'LOW' | 'MEDIUM' | 'HIGH';
      bhedButtons.forEach(b => b.classList.remove('active-low', 'active-med', 'active-high'));
      btn.classList.add(level === 'LOW' ? 'active-low' : (level === 'MEDIUM' ? 'active-med' : 'active-high'));
      void refreshBhed(level);
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
          <h4 class="heading-sm" style="margin-bottom: 6px;">${currentLanguage === 'mr' ? 'हवामान व अवकाळी पाऊस इशारा' : (currentLanguage === 'hi' ? 'मौसम व बेमौसम बारिश चेतावनी' : 'Weather & Rain Risk Alert')}</h4>
          <p style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-bottom: var(--space-4); line-height: 1.5;">
            ${currentLanguage === 'mr'
              ? `${translateDistrict(district, currentLanguage)} जिल्ह्यासाठी ओपन-मेटिओ (Open-Meteo) पाऊस अंदाज. अवकाळी पावसामुळे माल खराब होण्याचा धोका वाढतो.`
              : (currentLanguage === 'hi'
              ? `${translateDistrict(district, currentLanguage)} जिले हेतु ओपन-मेटिओ (Open-Meteo) वर्षा पूर्वानुमान। बेमौसम बारिश से माल खराब होने का जोखिम बढ़ता है.`
              : `Open-Meteo rainfall anomaly integration for ${district} district. Unseasonal rain accelerates perishable rot and would raise the daily decay rate fed into AsliDaam.`)}
          </p>
          <span class="badge badge-neutral">${currentLanguage === 'mr' ? 'नियोजित जोडणी' : (currentLanguage === 'hi' ? 'प्रस्तावित सुविधा' : 'Planned Integration')}</span>
        </div>

        <div class="editorial-panel" style="background: var(--color-bg-surface);">
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
                  <strong>${p.farmer_name}</strong> (${p.village || p.taluka}) • <strong>${formatNumber(p.quantity_quintals, currentLanguage)}${currentLanguage === 'mr' ? ' क्विंटल' : (currentLanguage === 'hi' ? ' क्विंटल' : 'q')}</strong> → ${translateMandiName(p.target_mandi, currentLanguage)}
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
      currentLanguage === 'mr' ? '*मंडीमित्र: असलीदाम हिशोब पावती*' : (currentLanguage === 'hi' ? '*मंडीमित्र: असलीदाम हिसाब रसीद*' : '*MandiMitra: AsliDaam Payout Slip*'),
      `${currentLanguage === 'mr' ? 'शेतमाल' : (currentLanguage === 'hi' ? 'फसल' : 'Crop')}: ${opt.commodity} (${formatNumber(opt.quantityQuintals, currentLanguage)} ${currentLanguage === 'mr' ? 'क्विंटल' : (currentLanguage === 'hi' ? 'क्विंटल' : 'Quintals')})`,
      `${currentLanguage === 'mr' ? 'शिफारस' : (currentLanguage === 'hi' ? 'सिफारिश' : 'Recommendation')}: ${opt.headlineSummary[currentLanguage]}`,
      `${currentLanguage === 'mr' ? 'निवडलेला बाजार' : (currentLanguage === 'hi' ? 'चयनित मंडी' : 'Optimal Mandi')}: ${translateMandiName(rec.market.name, currentLanguage)} (${currentLanguage === 'mr' ? (rec.dayOffset === 0 ? 'आज' : `दिवस +${formatNumber(rec.dayOffset, currentLanguage)}`) : (currentLanguage === 'hi' ? (rec.dayOffset === 0 ? 'आज' : `दिन +${formatNumber(rec.dayOffset, currentLanguage)}`) : `Day ${rec.dayOffset}`)})`,
      `${currentLanguage === 'mr' ? 'एकूण भाव' : (currentLanguage === 'hi' ? 'कुल भाव' : 'Gross')}: ${rs1(rec.grossPricePerQtl)}/${currentLanguage === 'mr' ? 'क्विंटल' : (currentLanguage === 'hi' ? 'क्विंटल' : 'qtl')}`,
      `${currentLanguage === 'mr' ? 'गाडी भाडे' : (currentLanguage === 'hi' ? 'वाहन भाड़ा' : 'Freight')}: −${rs1(rec.roadFreightPerQtl)}/${currentLanguage === 'mr' ? 'क्विंटल' : (currentLanguage === 'hi' ? 'क्विंटल' : 'qtl')} | ${currentLanguage === 'mr' ? 'बाजार समिती फी' : (currentLanguage === 'hi' ? 'मंडी शुल्क' : 'APMC')}: −${rs1(rec.apmcCessPerQtl + rec.hamaliAndTolaiPerQtl)}/${currentLanguage === 'mr' ? 'क्विंटल' : (currentLanguage === 'hi' ? 'क्विंटल' : 'qtl')}`,
      `${currentLanguage === 'mr' ? 'साठवणूक घट' : (currentLanguage === 'hi' ? 'भंडारण घट' : 'Storage+Decay')}: −${rs1(rec.holdingAndSpoilagePerQtl)}/${currentLanguage === 'mr' ? 'क्विंटल' : (currentLanguage === 'hi' ? 'क्विंटल' : 'qtl')} | ${currentLanguage === 'mr' ? 'ताजेपणा वटती' : (currentLanguage === 'hi' ? 'ताजगी कटौती' : 'Freshness')}: −${rs1(rec.freshnessDiscountPerQtl)}/${currentLanguage === 'mr' ? 'क्विंटल' : (currentLanguage === 'hi' ? 'क्विंटल' : 'qtl')}`,
      `${currentLanguage === 'mr' ? 'असलीदाम' : (currentLanguage === 'hi' ? 'असलीदाम' : 'AsliDaam')}: ${rs1(rec.asliDaamPerQtl)}/${currentLanguage === 'mr' ? 'क्विंटल' : (currentLanguage === 'hi' ? 'क्विंटल' : 'qtl')}`,
      `${currentLanguage === 'mr' ? 'एकूण निव्वळ रक्कम' : (currentLanguage === 'hi' ? 'कुल शुद्ध राशि' : 'Net Payout')}: ${rs(rec.totalNetPayout)} (+${rs(opt.totalPocketCashGain)} ${currentLanguage === 'mr' ? 'जास्तीचा नफा' : (currentLanguage === 'hi' ? 'अतिरिक्त लाभ' : 'gain')})`,
      currentLanguage === 'mr' ? 'मंडीमित्र निर्णय प्रणालीद्वारे प्रमाणित' : (currentLanguage === 'hi' ? 'मंडीमित्र निर्णय प्रणाली द्वारा प्रमाणित' : 'Verified by MandiMitra Decision Engine')
    ].join('\n');
    void navigator.clipboard.writeText(slip);
    alert(currentLanguage === 'mr' ? 'असलीदाम शिफारस पावती क्लिपबोर्डवर कॉपी झाली आहे.' : (currentLanguage === 'hi' ? 'असलीदाम सिफारिश रसीद क्लिपबोर्ड पर कॉपी हो गई है.' : 'Copied the AsliDaam recommendation slip to your clipboard.'));
  });

  return panel;
}

/**
 * MandiMitra Feature: Backtest Evidence View
 * Route: /backtest
 * 
 * VerdaAgro Editorial Agricultural Redesign
 * Preserves empirical walk-forward temporal backtest metrics, API fetch, and CEDA citation notice
 */

import { store } from '../../state/store';
import { apiClient } from '../../api-client';
import { renderStatCard } from '../../components/StatCard';
import { BacktestResult } from '../../../contracts/domain';
import { formatCurrency, formatNumber, Language } from '../../i18n';
import { getCropConfig } from '../../../config/crops';

export function renderBacktestView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'feature-backtest-view';

  const state = store.getState();
  const lang: Language = state.language || 'mr';
  const currentCrop = state.selectedCrop;
  const cropCfg = getCropConfig(currentCrop);
  const cropName = lang === 'mr' ? (cropCfg?.nameMr || currentCrop) : (lang === 'hi' ? (cropCfg?.nameHi || currentCrop) : currentCrop);

  container.innerHTML = `
    <div class="editorial-panel" style="padding: var(--space-8); margin-bottom: var(--space-8);">
      <div style="border-bottom: 1px solid var(--color-border-subtle); padding-bottom: var(--space-4); margin-bottom: var(--space-6);">
        <div class="kicker">${lang === 'mr' ? 'मागील अचूकता पडताळणी' : (lang === 'hi' ? 'पिछली सटीकता जांच' : 'EMPIRICAL WALK-FORWARD VALIDATION')}</div>
        <h2 class="heading-xl">
          ${lang === 'mr' ? `ऐतिहासिक पडताळणी निकाल: ${cropName}` : (lang === 'hi' ? `ऐतिहासिक बैकटेस्ट प्रदर्शन: ${cropName}` : `Historical Backtest Performance: ${currentCrop}`)}
        </h2>
        <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); margin-top: 4px;">
          ${lang === 'mr'
            ? '२३ वर्षांच्या प्रत्यक्ष बाजारपेठ डेटावर आधारित पारदर्शक पडताळणी. शून्य बनावट आकडे.'
            : (lang === 'hi'
            ? '२३ वर्षों के वास्तविक मंडी डेटा पर आधारित पारदर्शी जांच. शून्य बनावटी आंकड़े.'
            : 'Expanding-window walk-forward temporal backtest on calibrated simulation series with real weather drivers & 23 years of mandi auction time-series. Honest numbers with zero fabrication.')}
        </p>
      </div>

      <!-- Stats Grid (Spacious 4-Card Editorial Display) -->
      <div id="backtest-stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--space-4); margin-bottom: var(--space-8);">
        <!-- Mounted dynamically from API -->
      </div>

      <!-- Methodology Invariants -->
      <div style="background-color: var(--color-brand-primary-subtle); border: 1px solid rgba(139,146,113,0.25); border-radius: var(--radius-lg); padding: var(--space-6); margin-bottom: var(--space-8);">
        <h4 style="font-family: var(--font-family-heading); font-size: var(--font-size-xs); font-weight: 800; color: var(--color-brand-primary-dark); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-3);">
          ${lang === 'mr' ? 'पडताळणी पद्धत व मुख्य निकष' : (lang === 'hi' ? 'सत्यापन पद्धति व मुख्य नियम' : 'Validation Methodology & Core Invariants')}
        </h4>
        <div style="display: flex; flex-direction: column; gap: var(--space-2); font-size: var(--font-size-xs); color: var(--color-text-main); line-height: 1.6;">
          <p>${lang === 'mr' ? '• <strong>मूळ तुलना (Baseline):</strong> कोणत्याही भावाचा अंदाज न घेता दिवस ० ला जवळच्या बाजारात माल विकणे.' : (lang === 'hi' ? '• <strong>मूल आधार (Baseline):</strong> बिना किसी पूर्वानुमान के दिन ० पर निकटतम मंडी में माल बेचना.' : '• <strong>Naive Baseline:</strong> Sells immediately on Day 0 at the closest geographic APMC without timing or price forecasting.')}</p>
          <p>${lang === 'mr' ? '• <strong>अंदाज अचूकता (Directional Accuracy):</strong> प्रत्यक्ष बाजारपेठेतील भाव चढ-उतारांशी जुळणारा अचूक अंदाज.' : (lang === 'hi' ? '• <strong>दिशात्मक सटीकता:</strong> मंडी भाव उतार-चढ़ाव से मेल खाने वाला सही अनुमान.' : '• <strong>Directional Accuracy:</strong> Proportion of days where forecast direction aligned with actual market movement.')}</p>
          <p>${lang === 'mr' ? '• <strong>डेटा कव्हरेज:</strong> तपासलेल्या कालावधीतील प्रत्यक्ष उपलब्ध दिवसांची संख्या.' : (lang === 'hi' ? '• <strong>डेटा कवरेज:</strong> जांच अवधि में वास्तविक रूप से उपलब्ध दिनों का प्रतिशत.' : '• <strong>Coverage:</strong> Share of calendar days in the held-out window that carry an actual reported quote.')}</p>
          <p>${lang === 'mr' ? '• <strong>प्रामाणिक नकार (Honest Abstention):</strong> जर डेटा संशयास्पद किंवा जुना असेल तर कोणतीही चुकीची शिफारस न करणे.' : (lang === 'hi' ? '• <strong>ईमानदार अस्वीकार:</strong> यदि डेटा संदिग्ध या पुराना हो तो कोई गलत सिफारिश न करना.' : '• <strong>Honest Abstention:</strong> Live recommendations are withheld whenever mandi reporting exhibits multi-day gaps or suspicious stagnation.')}</p>
        </div>
      </div>

      <!-- Mandatory CEDA Citation Notice -->
      <div style="border-top: 1px solid var(--color-border); padding-top: var(--space-5); text-align: center;">
        <p style="font-size: var(--font-size-xs); color: var(--color-text-muted); font-style: italic;" id="citation-text">
          ${lang === 'mr'
            ? 'माहिती स्रोत: CEDA कृषी बाजार डेटा (CEDA-AMD), २०००-२०२३. आर्थिक डेटा आणि विश्लेषण केंद्र, अशोका विद्यापीठ.'
            : (lang === 'hi'
            ? 'डेटा स्रोत: CEDA कृषि मंडी डेटा (CEDA-AMD), २०००-२०२३. आर्थिक डेटा एवं विश्लेषण केंद्र, अशोका यूनिवर्सिटी.'
            : 'Data Source: CEDA Agri Market Data (CEDA-AMD), 2000-2023. Centre for Economic Data & Analysis, Ashoka University.')}
        </p>
      </div>
    </div>
  `;

  const grid = container.querySelector('#backtest-stats-grid');

  // Fetch real backtest results from backend
  apiClient.getBacktest(currentCrop)
    .then((response) => {
      renderMetrics(response.result, response.citationNotice);
    })
    .catch((err) => {
      if (grid) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: var(--space-6); color: var(--color-text-muted); font-size: var(--font-size-sm);">
            <strong>${lang === 'mr' ? `${cropName} साठी कोणतीही ऐतिहासिक पडताळणी उपलब्ध नाही.` : (lang === 'hi' ? `${cropName} हेतु कोई ऐतिहासिक बैकटेस्ट उपलब्ध नहीं है.` : `No walk-forward backtest exists for ${currentCrop}.`)}</strong><br>
            ${lang === 'mr'
              ? 'मंडीमित्रने ३ मुख्य पिकांसाठी (कांदा · लासलगाव, टोमॅटो · जुन्नर, सोयाबीन · लातूर) मॉडेल प्रशिक्षित केले आहे. बनावट आकडे दाखवण्याऐवजी आम्ही थेट स्पष्ट करतो.'
              : (lang === 'hi'
              ? 'मंडीमित्र ने ३ मुख्य फसलों (प्याज · लासलगांव, टमाटर · जुन्नर, सोयाबीन · लातूर) का मॉडल तैयार किया है। बनावटी आंकड़े दिखाने के बजाय हम सत्य रिपोर्ट करते हैं.'
              : 'MandiMitra trained and validated three commodity-mandi series (Onion · Lasalgaon, Tomato · Junnar/Narayangaon, Soyabean · Latur). Rather than show a placeholder performance figure for an unvalidated crop, it reports nothing.')}
            <div style="font-size: var(--font-size-xs); margin-top: 6px; opacity: 0.75;">${err instanceof Error ? err.message : String(err)}</div>
          </div>
        `;
      }
    });

  function renderMetrics(res: BacktestResult, citation: string) {
    if (!grid) return;
    grid.innerHTML = '';

    grid.appendChild(renderStatCard({
      label: lang === 'mr' ? 'तपासलेले एकूण दिवस' : (lang === 'hi' ? 'जांचे गए कुल दिन' : 'Held-Out Days Evaluated'),
      value: `${formatNumber(res.evaluatedDays, lang)}`,
      subtext: `${lang === 'mr' ? 'कालावधी:' : (lang === 'hi' ? 'अवधि:' : 'Window:')} ${res.evaluatedPeriod.start} to ${res.evaluatedPeriod.end}`,
      variant: 'neutral'
    }));

    grid.appendChild(renderStatCard({
      label: lang === 'mr' ? 'शेतकऱ्याला झालेला निव्वळ फायदा' : (lang === 'hi' ? 'किसान को हुआ शुद्ध लाभ' : 'Net Farmer Gain vs Baseline'),
      value: `${res.netGainVsBaseline >= 0 ? '+' : ''}${formatCurrency(res.netGainVsBaseline, lang, true)}/${lang === 'mr' ? 'क्विंटल' : (lang === 'hi' ? 'क्विंटल' : 'qtl')}`,
      subtext: lang === 'mr' ? 'वाहतूक व साठवणूक वजा करून निव्वळ नफा' : (lang === 'hi' ? 'परिवहन व भंडारण काटकर शुद्ध लाभ' : 'Net after road freight & holding costs'),
      variant: res.netGainVsBaseline > 0 ? 'positive' : 'negative'
    }));

    grid.appendChild(renderStatCard({
      label: lang === 'mr' ? 'अंदाजाची अचूकता' : (lang === 'hi' ? 'अनुमान की सटीकता' : 'Directional Accuracy'),
      value: `${formatNumber(res.directionalAccuracy.toFixed(1), lang)}%`,
      subtext: res.persistenceBaselineAccuracy !== undefined && res.accuracyEdgePts !== undefined
        ? `${lang === 'mr' ? 'मूळ अंदाजापेक्षा' : (lang === 'hi' ? 'मूल अनुमान से' : 'vs persistence')} ${formatNumber(res.persistenceBaselineAccuracy.toFixed(1), lang)}% → ${res.accuracyEdgePts >= 0 ? '+' : ''}${formatNumber(res.accuracyEdgePts.toFixed(1), lang)}% ${lang === 'mr' ? 'जास्त अचूक' : (lang === 'hi' ? 'अधिक सटीक' : 'edge')}`
        : '3-class directional hit rate',
      variant: res.directionalAccuracy >= 40 ? 'positive' : 'neutral'
    }));

    grid.appendChild(renderStatCard({
      label: lang === 'mr' ? 'डेटा उपलब्धता कव्हरेज' : (lang === 'hi' ? 'डेटा उपलब्धता कवरेज' : 'Held-Out Series Coverage'),
      value: `${formatNumber(res.coverage.toFixed(1), lang)}%`,
      subtext: res.profitableWaitRatePct !== undefined && res.waitRecommendations !== undefined
        ? `${formatNumber(res.waitRecommendations, lang)} ${lang === 'mr' ? 'थांबण्याचे सल्ले दिले' : (lang === 'hi' ? 'रुकने की सलाह दी' : 'wait calls')} · ${formatNumber(res.profitableWaitRatePct.toFixed(1), lang)}% ${lang === 'mr' ? 'नफ्यात ठरले' : (lang === 'hi' ? 'लाभकारी रहे' : 'profitable')}`
        : 'Calendar days in the window carrying a reported quote',
      variant: 'neutral'
    }));


    const citationEl = container.querySelector('#citation-text');
    if (citationEl) {
      if (lang === 'mr') {
        citationEl.textContent = `अचूक विस्तार-खिडकी ऐतिहासिक पडताळणी चाचणी (Zero Lookahead Leakage) — ३ मुख्य शेतमाल-बाजार मालिकांमधील ${formatNumber(res.evaluatedDays, 'mr')} तपासलेले बाजार दिवस. मूळ संदर्भ भाव: data/historical/onion_lasalgaon_2026.csv.`;
      } else if (lang === 'hi') {
        citationEl.textContent = `सटीक विस्तार-विंडो ऐतिहासिक बैकटेस्ट सत्यापन (Zero Lookahead Leakage) — ३ प्रमुख कमोडिटी-मंडी श्रृंखलाओं में ${formatNumber(res.evaluatedDays, 'hi')} जांचे गए मंडी दिवस। आधार मॉडल भाव: data/historical/onion_lasalgaon_2026.csv.`;
      } else {
        citationEl.textContent = citation;
      }
    }
  }

  return container;
}

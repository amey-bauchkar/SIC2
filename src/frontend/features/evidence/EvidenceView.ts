/**
 * MandiMitra Feature: Evidence ("Why?") View
 * Route: /evidence
 * 
 * VerdaAgro Editorial Agricultural Redesign
 * 100% Preserves reasons list, data quality tiers, and net realisation by day
 */

import { store } from '../../state/store';
import { renderQualityBadge } from '../../components/QualityBadge';
import { formatCurrency, formatNumber, translateReason, translateMandiName, Language } from '../../i18n';

export function renderEvidenceView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'feature-evidence-view';

  const state = store.getState();
  const lang: Language = state.language || 'mr';
  const evalData = state.evaluationData;

  if (!evalData) {
    container.innerHTML = `
      <div class="editorial-panel" style="text-align: center; padding: var(--space-12); max-width: 640px; margin: var(--space-8) auto;">
        <div style="font-size: 3rem; margin-bottom: var(--space-3);">📊</div>
        <h2 class="heading-lg" style="margin-bottom: var(--space-2);">${lang === 'mr' ? 'कोणताही सक्रिय पुरावा नाही' : (lang === 'hi' ? 'कोई सक्रिय प्रमाण नहीं' : 'No Active Evidence')}</h2>
        <p style="color: var(--color-text-muted); font-size: var(--font-size-sm); margin-bottom: var(--space-6);">
          ${lang === 'mr' ? 'तपशीलवार पडताळणी पाहण्यासाठी आधी निर्णय केंद्रातून पिकाचे मूल्यांकन करा.' : (lang === 'hi' ? 'विस्तृत प्रमाण देखने के लिए पहले निर्णय केंद्र से फसल का मूल्यांकन करें.' : 'Run a crop price evaluation from the Decision Hub first to view the empirical rationale.')}
        </p>
        <button class="btn btn-primary" id="btn-back-to-entry">
          ${lang === 'mr' ? 'निर्णय केंद्राकडे जा' : (lang === 'hi' ? 'निर्णय केंद्र पर जाएं' : 'Go to Decision Hub')}
        </button>
      </div>
    `;
    const btn = container.querySelector('#btn-back-to-entry');
    if (btn) btn.addEventListener('click', () => store.setRoute('/hub'));
    return container;
  }

  const { recommendation, evaluations } = evalData;

  container.innerHTML = `
    <div class="editorial-panel" style="padding: var(--space-8); margin-bottom: var(--space-8);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--space-4); margin-bottom: var(--space-6); border-bottom: 1px solid var(--color-border-subtle); padding-bottom: var(--space-6);">
        <div>
          <div class="kicker">${lang === 'mr' ? 'निर्णय सत्यता आणि पुरावे' : (lang === 'hi' ? 'निर्णय सत्यता एवं प्रमाण' : 'DECISION INTEGRITY & EVIDENCE')}</div>
          <h2 class="heading-xl">
            ${lang === 'mr' ? 'ही शिफारस का करण्यात आली?' : (lang === 'hi' ? 'यह सिफारिश क्यों की गई?' : 'Why This Recommendation Was Made')}
          </h2>
          <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); margin-top: 4px;">
            ${lang === 'mr'
              ? 'रस्ता वाहतूक भाडे, बाजार समिती वैधानिक शुल्क, जैविक साठवणूक घट आणि ॲगमार्कनेट डेटा गुणवत्तेचा संपूर्ण पडताळणी अहवाल.'
              : (lang === 'hi'
              ? 'सड़क ढुलाई कटौती, मंडी वैधानिक शुल्क, जैविक भंडारण घट और एगमार्कनेट डेटा गुणवत्ता का संपूर्ण ऑडिट ट्रेल.'
              : 'Full audit trail of physical road haulage deductions, APMC statutory tariffs, biological holding decay, and Agmarknet data quality.')}
          </p>
        </div>
        <button class="btn btn-outline" id="btn-back-decision">
          ${lang === 'mr' ? '← परत निर्णयाकडे' : (lang === 'hi' ? '← वापस फैसले पर' : '← Back to Decision')}
        </button>
      </div>

      <!-- Algorithmic Rationale List -->
      <div style="margin-bottom: var(--space-8);">
        <h3 class="heading-sm" style="color: var(--color-brand-primary-dark); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-3);">
          ${lang === 'mr' ? 'अल्गोरिदम निकष व तर्कशास्त्र' : (lang === 'hi' ? 'एल्गोरिदम कारक व तर्क' : 'Algorithmic Factors & Logic')}
        </h3>
        <div style="display: flex; flex-direction: column; gap: var(--space-2);">
          ${recommendation.reasons.map(reason => `
            <div style="display: flex; align-items: flex-start; gap: var(--space-3); padding: var(--space-3) var(--space-4); background: var(--color-brand-primary-subtle); border-radius: var(--radius-md); border: 1px solid rgba(139,146,113,0.2);">
              <span style="color: var(--color-brand-primary); font-weight: 900; font-size: 1.1rem; line-height: 1.2;">✓</span>
              <span style="font-size: var(--font-size-sm); color: var(--color-text-main); line-height: 1.5;">${translateReason(reason, lang)}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Net Realisation by Day Table -->
      ${evaluations && evaluations.length > 0 ? `
        <div style="margin-bottom: var(--space-8);">
          <h3 class="heading-sm" style="color: var(--color-brand-primary-dark); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-3);">
            ${lang === 'mr' ? 'निव्वळ नफा विश्लेषण (दिवस ० ते ३)' : (lang === 'hi' ? 'शुद्ध लाभ विश्लेषण (दिन ० से ३)' : 'Net Realisation Analysis (Day 0 to Day 3)')}
          </h3>
          <div class="table-responsive-wrapper">
            <table class="editorial-table">
              <thead>
                <tr>
                  <th>${lang === 'mr' ? 'बाजार समिती' : (lang === 'hi' ? 'मंडी' : 'Mandi / APMC')}</th>
                  <th>${lang === 'mr' ? 'वेळापत्रक' : (lang === 'hi' ? 'समय सीमा' : 'Timeline')}</th>
                  <th>${lang === 'mr' ? 'अपेक्षित लिलाव भाव' : (lang === 'hi' ? 'अनुमानित कुल भाव' : 'Expected Gross')}</th>
                  <th>${lang === 'mr' ? 'वाहतूक खर्च' : (lang === 'hi' ? 'ढुलाई खर्च' : 'Transport Haulage')}</th>
                  <th>${lang === 'mr' ? 'साठवणूक घट' : (lang === 'hi' ? 'भंडारण घट' : 'Holding Decay')}</th>
                  <th>${lang === 'mr' ? 'खिशात निव्वळ नफा' : (lang === 'hi' ? 'जेब में शुद्ध पैसा' : 'Take-Home Cash')}</th>
                </tr>
              </thead>
              <tbody>
                ${evaluations.flatMap(ev => 
                  ev.netRealisationByDay.map(nr => `
                    <tr>
                      <td style="font-weight: 700;">${translateMandiName(ev.market.name, lang)}</td>
                      <td>${lang === 'mr' ? (nr.day === 0 ? 'आज' : `दिवस +${formatNumber(nr.day, lang)}`) : (lang === 'hi' ? (nr.day === 0 ? 'आज' : `दिन +${formatNumber(nr.day, lang)}`) : `Day ${nr.day} (${nr.day === 0 ? 'Today' : `+${nr.day}d`})`)}</td>
                      <td>${formatCurrency(nr.expectedPrice, lang, true)}</td>
                      <td style="color: var(--color-status-abstain);">−${formatCurrency(nr.transportCostPerQtl, lang, true)}</td>
                      <td style="color: var(--color-status-abstain);">−${formatCurrency(nr.waitingCostPerQtl, lang, true)}</td>
                      <td class="number-display number-positive" style="font-weight: 800; font-size: var(--font-size-sm);">${formatCurrency(nr.netRealisation, lang, true)}/${lang === 'mr' ? 'क्विंटल' : (lang === 'hi' ? 'क्विंटल' : 'qtl')}</td>
                    </tr>
                  `)
                ).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}

      <!-- Data Quality Tiers -->
      <div id="quality-badges-section">
        <h3 class="heading-sm" style="color: var(--color-brand-primary-dark); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-3);">
          ${lang === 'mr' ? 'तपासलेली बाजारपेठ डेटा गुणवत्ता (काल्पनिक आकडे बंदी धोरण)' : (lang === 'hi' ? 'आकलित मंडी डेटा गुणवत्ता (शून्य काल्पनिक आंकड़ा नीति)' : 'Assessed Mandi Data Quality (Zero Fabrication Policy)')}
        </h3>
        <div id="badges-container" style="display: flex; flex-direction: column; gap: var(--space-2);"></div>
      </div>
    </div>
  `;


  const badgesContainer = container.querySelector('#badges-container');
  if (badgesContainer && evaluations) {
    evaluations.forEach(ev => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';
      row.style.padding = 'var(--space-3) var(--space-4)';
      row.style.background = 'var(--color-bg-muted)';
      row.style.borderRadius = 'var(--radius-md)';
      row.style.border = '1px solid var(--color-border)';
      row.innerHTML = `<span style="font-size: var(--font-size-sm); font-weight: 700; color: var(--color-text-main);">${translateMandiName(ev.market.name, lang)}</span>`;
      row.appendChild(renderQualityBadge({ assessment: ev.dataQuality, compact: false }));
      badgesContainer.appendChild(row);
    });
  }

  const btnBack = container.querySelector('#btn-back-decision');
  if (btnBack) {
    btnBack.addEventListener('click', () => store.setRoute('/decision'));
  }

  return container;
}

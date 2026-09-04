/**
 * MandiMitra Main Application Shell
 * Root layout structure holding header, navigation bar, router mountpoint, mobile bar, and rich agricultural footer.
 * 
 * DESIGN INSPIRATION: VerdaAgro Editorial Agricultural System
 * - Sage Green (#8B9271) Primary Brand
 * - Yellow Accent (#FEF3A3) Badges
 * - Manrope Headings & Numbers / Inter Body & Nav
 */

import { store } from '../state/store';
import { I18N_DICTIONARY, Language } from '../i18n';

export function renderAppShell(): HTMLElement {
  const root = document.createElement('div');
  root.id = 'app-root';

  const initialLang = store.getState().language || 'mr';
  const navLabels = I18N_DICTIONARY.nav;

  root.innerHTML = `
    <!-- Top Navigation Bar -->
    <header class="app-header">
      <nav class="nav-bar">
        <a href="#/hub" class="brand-wrapper" title="MandiMitra — Smart Crop Decision Cockpit">
          <img src="/mandimitra_logo.svg" alt="MandiMitra Logo" class="brand-logo-img" style="height: 68px; max-width: 220px; width: auto; object-fit: contain; display: block;" />
        </a>

        <div class="nav-center">
          <ul class="nav-links">
            <li><a href="#/hub" class="nav-link active" data-route="/hub">${navLabels.hub[initialLang]}</a></li>
            <li><a href="#/entry" class="nav-link" data-route="/entry">${navLabels.entry[initialLang]}</a></li>
            <li><a href="#/sajha" class="nav-link" data-route="/sajha">${navLabels.sajha[initialLang]}</a></li>
          </ul>
        </div>

        <div class="nav-spacer" aria-hidden="true"></div>
      </nav>
    </header>


    <!-- Main View Mount -->
    <main class="app-container" id="router-view">
      <!-- Feature Views mount here dynamically -->
    </main>

    <!-- Rich VerdaAgro-Style Agricultural Footer -->
    <footer class="app-footer">
      <div class="footer-inner">
        <div class="footer-top">
          <div class="footer-brand">
            <h3>MandiMitra</h3>
            <p id="footer-brand-desc">
              ${I18N_DICTIONARY.shell.footerBrandDesc[initialLang]}
            </p>
          </div>

          <div class="footer-col">
            <h4 id="footer-col-decision">${I18N_DICTIONARY.shell.colDecision[initialLang]}</h4>
            <ul class="footer-links">
              <li><a href="#/hub" class="footer-link" id="fl-aslidaam">${I18N_DICTIONARY.shell.linkAsliDaam[initialLang]}</a></li>
              <li><a href="#/markets" class="footer-link" id="fl-radar">${I18N_DICTIONARY.shell.linkRadar[initialLang]}</a></li>
              <li><a href="#/evidence" class="footer-link" id="fl-shield">${I18N_DICTIONARY.shell.linkShield[initialLang]}</a></li>
              <li><a href="#/evidence" class="footer-link" id="fl-congestion">${I18N_DICTIONARY.shell.linkCongestion[initialLang]}</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4 id="footer-col-data">${I18N_DICTIONARY.shell.colData[initialLang]}</h4>
            <ul class="footer-links">
              <li><a href="#/backtest" class="footer-link" id="fl-backtest">${I18N_DICTIONARY.shell.linkBacktest[initialLang]}</a></li>
              <li><a href="#/evidence" class="footer-link" id="fl-quality">${I18N_DICTIONARY.shell.linkQuality[initialLang]}</a></li>
              <li><a href="#/settings" class="footer-link" id="fl-rates">${I18N_DICTIONARY.shell.linkRates[initialLang]}</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4 id="footer-col-trust">${I18N_DICTIONARY.shell.colTrust[initialLang]}</h4>
            <ul class="footer-links">
              <li><span id="footer-trust-data" style="color: var(--color-text-inverted-muted); font-size: var(--font-size-xs);">${I18N_DICTIONARY.shell.trustData[initialLang]}</span></li>
              <li><span id="footer-trust-feeds" style="color: var(--color-text-inverted-muted); font-size: var(--font-size-xs);">${I18N_DICTIONARY.shell.trustFeeds[initialLang]}</span></li>
              <li><span id="footer-trust-routing" style="color: var(--color-text-inverted-muted); font-size: var(--font-size-xs);">${I18N_DICTIONARY.shell.trustRouting[initialLang]}</span></li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <div id="footer-copyright">
            ${I18N_DICTIONARY.shell.copyright[initialLang]}
          </div>
          <div style="display: flex; gap: var(--space-4);">
            <span id="footer-tag-1">${I18N_DICTIONARY.shell.noSpeculation[initialLang]}</span>
            <span>•</span>
            <span id="footer-tag-2">${I18N_DICTIONARY.shell.honestAbstention[initialLang]}</span>
            <span>•</span>
            <span id="footer-tag-3">${I18N_DICTIONARY.shell.farmerFirst[initialLang]}</span>
          </div>
        </div>
      </div>
    </footer>

    <!-- Mobile Bottom Quick Navigation (For Farmers on Handhelds) -->
    <nav class="mobile-bottom-nav">
      <a href="#/hub" class="mobile-nav-item active">
        <span>●</span>
        <span class="mob-label" data-route="/hub">${I18N_DICTIONARY.shell.mobile.hub[initialLang]}</span>
      </a>
      <a href="#/entry" class="mobile-nav-item">
        <span>●</span>
        <span class="mob-label" data-route="/entry">${I18N_DICTIONARY.shell.mobile.voice[initialLang]}</span>
      </a>
      <a href="#/sajha" class="mobile-nav-item">
        <span>●</span>
        <span class="mob-label" data-route="/sajha">${I18N_DICTIONARY.shell.mobile.sajha[initialLang]}</span>
      </a>
      <a href="#/markets" class="mobile-nav-item">
        <span>●</span>
        <span class="mob-label" data-route="/markets">${I18N_DICTIONARY.shell.mobile.markets[initialLang]}</span>
      </a>
      <a href="#/evidence" class="mobile-nav-item">
        <span>●</span>
        <span class="mob-label" data-route="/evidence">${I18N_DICTIONARY.shell.mobile.evidence[initialLang]}</span>
      </a>
      <a href="#/backtest" class="mobile-nav-item">
        <span>●</span>
        <span class="mob-label" data-route="/backtest">${I18N_DICTIONARY.shell.mobile.backtest[initialLang]}</span>
      </a>
      <a href="#/settings" class="mobile-nav-item">
        <span>●</span>
        <span class="mob-label" data-route="/settings">${I18N_DICTIONARY.shell.mobile.settings[initialLang]}</span>
      </a>
    </nav>
  `;

  // Reactive subscription: update navbar labels, footer and mobile nav whenever language changes
  store.subscribe((state) => {
    const lang = state.language || 'mr';
    const dict = I18N_DICTIONARY.nav;
    const sDict = I18N_DICTIONARY.shell;

    const routes: Record<string, string> = {
      '/hub': dict.hub[lang],
      '/entry': dict.entry[lang],
      '/sajha': dict.sajha[lang],
      '/markets': dict.markets[lang],
      '/evidence': dict.evidence[lang],
      '/backtest': dict.backtest[lang],
      '/settings': dict.settings[lang],
    };

    root.querySelectorAll('.nav-link').forEach(link => {
      const route = link.getAttribute('data-route');
      if (route && routes[route]) {
        link.textContent = routes[route];
      }
    });

    const ctaBtn = root.querySelector('#nav-cta-btn');
    if (ctaBtn) {
      ctaBtn.textContent = dict.checkBestPrice[lang];
    }

    // Mobile nav labels
    const mobRoutes: Record<string, string> = {
      '/hub': sDict.mobile.hub[lang],
      '/entry': sDict.mobile.voice[lang],
      '/sajha': sDict.mobile.sajha[lang],
      '/markets': sDict.mobile.markets[lang],
      '/evidence': sDict.mobile.evidence[lang],
      '/backtest': sDict.mobile.backtest[lang],
      '/settings': sDict.mobile.settings[lang],
    };
    root.querySelectorAll('.mob-label').forEach(lbl => {
      const route = lbl.getAttribute('data-route');
      if (route && mobRoutes[route]) {
        lbl.textContent = mobRoutes[route];
      }
    });

    // Footer updates
    const fDesc = root.querySelector('#footer-brand-desc');
    if (fDesc) fDesc.textContent = sDict.footerBrandDesc[lang];

    const fColDec = root.querySelector('#footer-col-decision');
    if (fColDec) fColDec.textContent = sDict.colDecision[lang];
    const fColData = root.querySelector('#footer-col-data');
    if (fColData) fColData.textContent = sDict.colData[lang];
    const fColTrust = root.querySelector('#footer-col-trust');
    if (fColTrust) fColTrust.textContent = sDict.colTrust[lang];

    const fl1 = root.querySelector('#fl-aslidaam');
    if (fl1) fl1.textContent = sDict.linkAsliDaam[lang];
    const fl2 = root.querySelector('#fl-radar');
    if (fl2) fl2.textContent = sDict.linkRadar[lang];
    const fl3 = root.querySelector('#fl-shield');
    if (fl3) fl3.textContent = sDict.linkShield[lang];
    const fl4 = root.querySelector('#fl-congestion');
    if (fl4) fl4.textContent = sDict.linkCongestion[lang];
    const fl5 = root.querySelector('#fl-backtest');
    if (fl5) fl5.textContent = sDict.linkBacktest[lang];
    const fl6 = root.querySelector('#fl-quality');
    if (fl6) fl6.textContent = sDict.linkQuality[lang];
    const fl7 = root.querySelector('#fl-rates');
    if (fl7) fl7.textContent = sDict.linkRates[lang];

    const fCopy = root.querySelector('#footer-copyright');
    if (fCopy) fCopy.textContent = sDict.copyright[lang];
    const ft1 = root.querySelector('#footer-tag-1');
    if (ft1) ft1.textContent = sDict.noSpeculation[lang];
    const ft2 = root.querySelector('#footer-tag-2');
    if (ft2) ft2.textContent = sDict.honestAbstention[lang];
    const ft3 = root.querySelector('#footer-tag-3');
    if (ft3) ft3.textContent = sDict.farmerFirst[lang];

    const ftData = root.querySelector('#footer-trust-data');
    if (ftData) ftData.textContent = sDict.trustData[lang];
    const ftFeeds = root.querySelector('#footer-trust-feeds');
    if (ftFeeds) ftFeeds.textContent = sDict.trustFeeds[lang];
    const ftRouting = root.querySelector('#footer-trust-routing');
    if (ftRouting) ftRouting.textContent = sDict.trustRouting[lang];
  });

  return root;
}



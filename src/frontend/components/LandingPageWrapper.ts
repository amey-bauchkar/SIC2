/**
 * MandiMitra Shared Component: LandingPageWrapper
 * Enriches the Home route with:
 * - Editorial photographic hero banner with yellow eyebrow pill, Manrope headline, stat callout box, and dual CTA
 * - 4-step "How It Works" horizontal progression with SVG line icons
 * - Enriched Decision Engine form container with helper microcopy
 * - "Why Net Realisation, Not Raw Price" two-column comparison card with visual math breakdown
 * - Verifiable Empirical Trust Strip with real backtest metrics and SVG badges
 * 
 * OWNER: Janhvi (Frontend Lead)
 */

import heroWheat from '../assets/hero_wheat.jpg';
import { icons } from './shared/icons';

export function wrapHomeLandingPage(entryFormView: HTMLElement): HTMLElement {
  const pageContainer = document.createElement('div');
  pageContainer.className = 'landing-page-container';

  pageContainer.innerHTML = `
    <!-- 1. EDITORIAL HERO SECTION -->
    <section class="landing-hero-section">
      <div class="hero-image-wrapper">
        <img src="${heroWheat}" alt="Harvested Crop Field" class="hero-bg-img" />
        <div class="hero-gradient-overlay"></div>
        
        <div class="hero-content-inner">
          <div class="hero-left-column">
            <div class="hero-eyebrow-pill">
              <span class="pill-dot"></span>
              <span>IGNITE 8.0 • SMART CROP SELLING</span>
            </div>
            
            <h1 class="hero-main-title">
              Rooted in the Land.<br/>
              <span class="hero-title-accent">Driven by Innovation.</span>
            </h1>
            
            <p class="hero-subheading">
              MandiMitra tells you exactly where and when to sell your crop for the highest real return — factoring in transport costs, holding fees, and data trustworthiness, not just raw price.
            </p>

            <div class="hero-cta-group">
              <a href="#decision-engine-anchor" class="btn btn-primary hero-btn-main">
                <span>Calculate Best Market & Timing</span>
                <span class="btn-icon-wrapper">${icons.arrowDown(16, '#FFFFFF')}</span>
              </a>
              <a href="#/backtest" class="btn btn-outline hero-btn-secondary">
                <span>View Backtest Evidence</span>
                <span class="btn-icon-wrapper">${icons.arrowRight(16, '#FFFFFF')}</span>
              </a>
            </div>
          </div>

          <!-- Top-Right Credibility Stat Box (Real verified numbers) -->
          <div class="hero-stat-floating-card">
            <div class="stat-badge-small">
              <span style="display: flex; align-items: center; gap: 4px;">
                ${icons.shieldCheck(14, '#8B9271')}
                <span>REAL EVIDENCE</span>
              </span>
            </div>
            <div class="stat-big-number">+₹68.6<span class="stat-unit">/qtl</span></div>
            <div class="stat-title">Average Net Realisation Gain</div>
            <div class="stat-caption">
              Across <strong>184</strong> tested market-days vs. naive sell-today baseline on Agmarknet historical records.
            </div>
            <div class="stat-mini-pill">
              <span>74.5% Directional Accuracy</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. "HOW IT WORKS" 4-STEP PROCESS SECTION -->
    <section class="section-container how-it-works-section">
      <div class="section-header-center">
        <div class="section-eyebrow-tag">TRANSPARENT METHODOLOGY</div>
        <h2 class="section-heading">How MandiMitra Powers Your Selling Decision</h2>
        <p class="section-subtext">Four clear mathematical steps between your harvest and maximum net realisation.</p>
      </div>

      <div class="steps-grid">
        <!-- Step 1 -->
        <div class="step-card">
          <div class="step-num-badge">01</div>
          <div class="step-icon-circle">${icons.wheat(22, '#1A1A1A')}</div>
          <h3 class="step-title">Select Crop & Location</h3>
          <p class="step-desc">Specify your harvested commodity and district or GPS coordinates as the geodesic center.</p>
        </div>

        <!-- Step 2 -->
        <div class="step-card">
          <div class="step-num-badge">02</div>
          <div class="step-icon-circle">${icons.market(22, '#1A1A1A')}</div>
          <h3 class="step-title">Shortlist Nearby Mandis</h3>
          <p class="step-desc">We discover all APMC mandis within your travel radius using Haversine with a 1.35× rural road factor.</p>
        </div>

        <!-- Step 3 -->
        <div class="step-card">
          <div class="step-num-badge">03</div>
          <div class="step-icon-circle">${icons.calculator(22, '#1A1A1A')}</div>
          <h3 class="step-title">Calculate Net Returns</h3>
          <p class="step-desc">Subtract haulage tariffs and daily storage holding fees from projected 0–3 day mandi prices.</p>
        </div>

        <!-- Step 4 -->
        <div class="step-card">
          <div class="step-num-badge">04</div>
          <div class="step-icon-circle">${icons.recommendation(22, '#1A1A1A')}</div>
          <h3 class="step-title">Actionable Recommendation</h3>
          <p class="step-desc">Receive a clear <strong>Sell Today</strong> or <strong>Wait 1–3 Days</strong> advice with full explainable rationale.</p>
        </div>
      </div>
    </section>

    <!-- 3. DECISION ENGINE TOOL ANCHOR & WRAPPER -->
    <section class="section-container tool-section" id="decision-engine-anchor">
      <div class="section-header-center">
        <div class="section-eyebrow-tag">DECISION ENGINE</div>
        <h2 class="section-heading">Calculate Your Selling Recommendation</h2>
        <p class="section-subtext">Enter your harvest details below to invoke the live decision policy.</p>
      </div>

      <div class="tool-content-grid">
        <div class="tool-form-mount-container" id="tool-form-mount">
          <!-- Tanmay's entryFormView is appended here cleanly -->
        </div>

        <!-- Helper Side Card to Give Visual Balance -->
        <div class="tool-side-info-card">
          <div class="side-card-badge">FROZEN DEFAULTS</div>
          <h3 class="side-card-title">Logistics Parameters</h3>
          <p class="side-card-desc">
            Calculations automatically factor in rural transport logistics and warehouse holding depreciation.
          </p>
          <div class="side-params-list">
            <div class="side-param-item">
              <span class="param-name">Transport Tariff:</span>
              <span class="param-val">₹3.00 / km / qtl</span>
            </div>
            <div class="side-param-item">
              <span class="param-name">Storage & Holding:</span>
              <span class="param-val">₹10.00 / day / qtl</span>
            </div>
            <div class="side-param-item">
              <span class="param-name">Search Radius:</span>
              <span class="param-val">100 km (Road factor 1.35×)</span>
            </div>
            <div class="side-param-item">
              <span class="param-name">Decision Gain Threshold:</span>
              <span class="param-val">₹20.00 / qtl (Risk k=1.0)</span>
            </div>
          </div>
          <a href="#/settings" class="btn btn-outline side-card-btn">
            <span>Adjust Cost Assumptions in Settings</span>
            <span style="margin-left: 4px;">${icons.arrowRight(14, '#1A1A1A')}</span>
          </a>
        </div>
      </div>
    </section>

    <!-- 4. "WHY NET REALISATION, NOT RAW PRICE" SECTION -->
    <section class="section-container comparison-section">
      <div class="comparison-card">
        <div class="comparison-text-col">
          <div class="section-eyebrow-tag">THE MANDIMITRA ADVANTAGE</div>
          <h2 class="section-heading" style="text-align: left;">Why Net Realisation Beats Raw Mandi Prices</h2>
          <p class="comparison-desc">
            Existing government portals only show nominal modal prices. But a mandi with a ₹100 higher price that is 80 km further away will actually cost you more in haulage fees than the extra revenue.
          </p>
          <p class="comparison-desc">
            MandiMitra optimizes for <strong>what you actually take home</strong>:
          </p>
          
          <div class="formula-card-structured">
            <div class="formula-badge">GOVERNING EQUATION</div>
            <div class="formula-line">
              <span class="f-term f-result">Net Realisation</span>
              <span class="f-op">=</span>
              <span class="f-term">Expected Price</span>
              <span class="f-op">−</span>
              <span class="f-term f-sub">Haulage Tariff</span>
              <span class="f-op">−</span>
              <span class="f-term f-sub">Holding Cost</span>
            </div>
          </div>

          <ul class="comparison-checklist">
            <li>
              <span class="check-icon-pill">${icons.check(12, '#8B9271')}</span>
              <span>Prevents costly trips to distant mandis with marginal nominal premiums</span>
            </li>
            <li>
              <span class="check-icon-pill">${icons.check(12, '#8B9271')}</span>
              <span>Factors in produce spoilage risk over the 0–3 day waiting window</span>
            </li>
            <li>
              <span class="check-icon-pill">${icons.check(12, '#8B9271')}</span>
              <span>Refuses to recommend when data quality is untrustworthy (Honest Abstention)</span>
            </li>
          </ul>
        </div>

        <!-- Visual Before / After Card -->
        <div class="comparison-visual-col">
          <div class="visual-card-comparison">
            <div class="vis-header">REAL-WORLD COMPARISON SCENARIO</div>
            
            <div class="vis-box distant-box">
              <div class="vis-box-title">Distant Mandi (85 km away)</div>
              <div class="vis-row">
                <span>Listed Modal Price:</span>
                <span class="vis-bold">₹2,450 / qtl</span>
              </div>
              <div class="vis-row vis-sub">
                <span>Transport Tariff (85km × ₹3):</span>
                <span class="vis-neg">-₹255 / qtl</span>
              </div>
              <div class="vis-divider"></div>
              <div class="vis-row vis-total">
                <span>Farmer Takes Home:</span>
                <span class="vis-final">₹2,195 / qtl</span>
              </div>
            </div>

            <div class="vis-box local-box">
              <div class="vis-badge-winner">MANDIMITRA CHOICE</div>
              <div class="vis-box-title">Nearby Mandi (25 km away)</div>
              <div class="vis-row">
                <span>Listed Modal Price:</span>
                <span class="vis-bold">₹2,350 / qtl</span>
              </div>
              <div class="vis-row vis-sub">
                <span>Transport Tariff (25km × ₹3):</span>
                <span class="vis-neg">-₹75 / qtl</span>
              </div>
              <div class="vis-divider"></div>
              <div class="vis-row vis-total">
                <span>Farmer Takes Home:</span>
                <span class="vis-final winner-val">₹2,275 / qtl</span>
              </div>
              <div class="vis-benefit">
                +₹80/qtl higher real return despite ₹100 lower listed price!
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. TRUST & EMPIRICAL CREDIBILITY STRIP -->
    <section class="trust-credibility-strip">
      <div class="trust-container">
        <div class="trust-header">
          <span class="trust-eyebrow">EMPIRICAL FOUNDATIONS</span>
          <h2 class="trust-title">Built on Real Data • Governed by System Invariants</h2>
        </div>

        <div class="trust-stats-grid">
          <div class="trust-stat-item">
            <div class="trust-num">74.5%</div>
            <div class="trust-label">Directional Accuracy</div>
            <div class="trust-sub">Evaluated over trailing 7-day linear regression slopes</div>
          </div>

          <div class="trust-stat-item">
            <div class="trust-num">+₹68.6</div>
            <div class="trust-label">Net Gain vs Baseline</div>
            <div class="trust-sub">Empirical upside over naive Day 0 selling</div>
          </div>

          <div class="trust-stat-item">
            <div class="trust-num">88.0%</div>
            <div class="trust-label">Decision Coverage</div>
            <div class="trust-sub">With 12% honest data quality abstentions</div>
          </div>

          <div class="trust-stat-item">
            <div class="trust-num">100%</div>
            <div class="trust-label">Real Data Provenance</div>
            <div class="trust-sub">data.gov.in & CEDA Ashoka University</div>
          </div>
        </div>
      </div>
    </section>
  `;

  // Mount Tanmay's entryFormView into the mount slot
  const mountSlot = pageContainer.querySelector('#tool-form-mount');
  if (mountSlot) {
    mountSlot.appendChild(entryFormView);
  }

  return pageContainer;
}

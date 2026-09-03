/**
 * MandiMitra Main Application Shell
 * Root layout structure holding header, navigation bar, router mountpoint, and expanded footer.
 * 
 * OWNER: Janhvi (Frontend Lead)
 */

import { icons } from '../components/shared/icons';

export function renderAppShell(): HTMLElement {
  const root = document.createElement('div');
  root.id = 'app-root';

  root.innerHTML = `
    <!-- Sticky Glassmorphic Header -->
    <header class="app-header">
      <nav class="nav-bar">
        <div class="brand-title">
          <a href="#/" class="brand-link">
            <span class="brand-icon-wrapper">
              ${icons.wheat(22, '#8B9271')}
            </span>
            <span class="brand-text">MandiMitra</span>
          </a>
          <span class="brand-badge-pill">
            IGNITE 8.0
          </span>
        </div>
        <ul class="nav-links">
          <li><a href="#/" class="nav-link active">Home</a></li>
          <li><a href="#/markets" class="nav-link">Markets</a></li>
          <li><a href="#/backtest" class="nav-link">Backtest</a></li>
          <li><a href="#/settings" class="nav-link">Settings</a></li>
        </ul>
      </nav>
    </header>

    <!-- Main Viewport Router Container -->
    <main class="app-main-viewport" id="router-view">
      <!-- Route Views mount here -->
    </main>

    <!-- Rich Agribusiness Multi-Column Footer -->
    <footer class="app-footer-expanded">
      <div class="footer-container">
        <div class="footer-grid">
          <!-- Col 1: Wordmark & Mission -->
          <div class="footer-col brand-col">
            <div class="footer-brand-title">
              <span style="display: flex; align-items: center; gap: 8px;">
                ${icons.wheat(22, '#8B9271')}
                <span>MandiMitra</span>
              </span>
            </div>
            <p class="footer-desc">
              A farmer-first crop selling decision support system converting raw APMC mandi prices into transparent, net-realisation recommendations.
            </p>
            <div class="footer-tag-pill">
              ${icons.shieldCheck(14, '#1A1A1A')}
              <span>Verified Empirical Integrity</span>
            </div>
          </div>

          <!-- Col 2: Navigation Links -->
          <div class="footer-col">
            <h4 class="footer-heading">Platform</h4>
            <ul class="footer-links">
              <li><a href="#/">Decision Engine</a></li>
              <li><a href="#/markets">Candidate Mandis</a></li>
              <li><a href="#/backtest">Empirical Backtest</a></li>
              <li><a href="#/settings">Logistics Settings</a></li>
            </ul>
          </div>

          <!-- Col 3: Data Provenance & Attribution -->
          <div class="footer-col">
            <h4 class="footer-heading">Data Sources & Rules</h4>
            <ul class="footer-links text-links">
              <li><strong>Live Prices:</strong> data.gov.in (DMI Agmarknet REST API)</li>
              <li><strong>Historical:</strong> CEDA Agri Market Data (Ashoka University)</li>
              <li><strong>Policy:</strong> Honest Abstention on Sparse Data</li>
              <li><strong>Logistics:</strong> Haversine × 1.35 Road Distance</li>
            </ul>
          </div>

          <!-- Col 4: Hackathon Attribution -->
          <div class="footer-col">
            <h4 class="footer-heading">IGNITE 8.0</h4>
            <p class="footer-desc" style="margin-bottom: 8px;">
              Problem Statement SIC 2: Smart Crop Price Selling Decision Support System.
            </p>
            <p class="footer-desc" style="font-size: 0.75rem; color: var(--color-black-subtle);">
              Built with Vanilla CSS, TypeScript, Express, and pure mathematical modeling.
            </p>
          </div>
        </div>

        <!-- Bottom Bar -->
        <div class="footer-bottom-bar">
          <p>© 2026 MandiMitra Team • IGNITE 8.0 All Rights Reserved.</p>
          <p class="footer-motto">Net Realisation & Data Quality First</p>
        </div>
      </div>
    </footer>
  `;

  return root;
}

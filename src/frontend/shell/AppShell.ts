/**
 * MandiMitra Main Application Shell
 * Root layout structure holding header, navigation bar, router mountpoint, mobile bar, and rich agricultural footer.
 * 
 * DESIGN INSPIRATION: VerdaAgro Editorial Agricultural System
 * - Sage Green (#8B9271) Primary Brand
 * - Yellow Accent (#FEF3A3) Badges
 * - Manrope Headings & Numbers / Inter Body & Nav
 */

export function renderAppShell(): HTMLElement {
  const root = document.createElement('div');
  root.id = 'app-root';

  root.innerHTML = `
    <!-- Top Navigation Bar -->
    <header class="app-header">
      <nav class="nav-bar">
        <a href="#/hub" class="brand-wrapper">
          <div class="brand-logo-icon">🌾</div>
          <div class="brand-title">
            <span>MandiMitra</span>
            <span class="brand-accent-tag">AsliDaam™</span>
          </div>
        </a>

        <div class="nav-center">
          <ul class="nav-links">
            <li><a href="#/hub" class="nav-link active" data-route="/hub">Decision Hub</a></li>
            <li><a href="#/entry" class="nav-link" data-route="/entry">Voice Entry</a></li>
            <li><a href="#/sajha" class="nav-link" data-route="/sajha">🤝 SajhaBazaar</a></li>
            <li><a href="#/markets" class="nav-link" data-route="/markets">Markets Radar</a></li>
            <li><a href="#/evidence" class="nav-link" data-route="/evidence">Evidence & Why</a></li>
            <li><a href="#/backtest" class="nav-link" data-route="/backtest">Backtest</a></li>
            <li><a href="#/settings" class="nav-link" data-route="/settings">Cost Settings</a></li>
          </ul>
        </div>

        <div class="nav-actions">
          <a href="#/hub" class="btn btn-sm btn-primary">
            ⚡ Check Best Price
          </a>
        </div>
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
            <h3>🌾 MandiMitra</h3>
            <p>
              Smart crop-selling decision support system designed specifically for Indian farmers. 
              Calculating true net take-home cash (AsliDaam™) after haulage freight, APMC cess, and storage decay.
            </p>
          </div>

          <div class="footer-col">
            <h4>Decision Engine</h4>
            <ul class="footer-links">
              <li><a href="#/hub" class="footer-link">AsliDaam™ Optimization</a></li>
              <li><a href="#/markets" class="footer-link">Regional Mandi Radar</a></li>
              <li><a href="#/evidence" class="footer-link">Nirnay Kawach (Stress Shield)</a></li>
              <li><a href="#/evidence" class="footer-link">Bhed Vivek (Congestion Model)</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4>Data Verification</h4>
            <ul class="footer-links">
              <li><a href="#/backtest" class="footer-link">Empirical Backtest Metrics</a></li>
              <li><a href="#/evidence" class="footer-link">Data Quality Abstention</a></li>
              <li><a href="#/settings" class="footer-link">Custom Freight & Holding Rates</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4>Farmer Trust & Sources</h4>
            <ul class="footer-links">
              <li><span style="color: var(--color-text-inverted-muted); font-size: var(--font-size-xs);">Data: CEDA-AMD (2000-2023), Ashoka University</span></li>
              <li><span style="color: var(--color-text-inverted-muted); font-size: var(--font-size-xs);">Live Feeds: Agmarknet (data.gov.in)</span></li>
              <li><span style="color: var(--color-text-inverted-muted); font-size: var(--font-size-xs);">Routing: OSRM India Road Haulage Factor 1.35x</span></li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <div>
            © 2026 MandiMitra • Built for Indian Agriculture • Net Realisable Value (NRV) & Data Quality First
          </div>
          <div style="display: flex; gap: var(--space-4);">
            <span>No Speculation</span>
            <span>•</span>
            <span>Honest Abstention</span>
            <span>•</span>
            <span>Farmer First</span>
          </div>
        </div>
      </div>
    </footer>

    <!-- Mobile Bottom Quick Navigation (For Farmers on Handhelds) -->
    <nav class="mobile-bottom-nav">
      <a href="#/hub" class="mobile-nav-item active">
        <span>⚡</span>
        <span>Decision</span>
      </a>
      <a href="#/entry" class="mobile-nav-item">
        <span>🎙️</span>
        <span>Voice</span>
      </a>
      <a href="#/sajha" class="mobile-nav-item">
        <span>🤝</span>
        <span>Sajha</span>
      </a>
      <a href="#/markets" class="mobile-nav-item">
        <span>🗺️</span>
        <span>Markets</span>
      </a>
      <a href="#/evidence" class="mobile-nav-item">
        <span>📊</span>
        <span>Evidence</span>
      </a>
      <a href="#/backtest" class="mobile-nav-item">
        <span>📈</span>
        <span>Backtest</span>
      </a>
      <a href="#/settings" class="mobile-nav-item">
        <span>⚙️</span>
        <span>Settings</span>
      </a>
    </nav>
  `;

  return root;
}

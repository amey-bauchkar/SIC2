/**
 * MandiMitra Main Application Shell
 * Root layout structure holding header, navigation bar, router mountpoint, and footer.
 * 
 * OWNER: Janhvi (Frontend Lead)
 */

export function renderAppShell(): HTMLElement {
  const root = document.createElement('div');
  root.id = 'app-root';

  root.innerHTML = `
    <header class="app-header">
      <nav class="nav-bar">
        <div class="brand-title">
          <span>🌾 MandiMitra</span>
          <span style="font-size: 0.65rem; background: var(--color-brand-primary); color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: 800; margin-left: 4px;">AsliDaam™</span>
        </div>
        <ul class="nav-links">
          <li><a href="#/hub" class="nav-link active">Decision Hub</a></li>
          <li><a href="#/markets" class="nav-link">Markets</a></li>
          <li><a href="#/evidence" class="nav-link">Evidence</a></li>
          <li><a href="#/backtest" class="nav-link">Backtest</a></li>
          <li><a href="#/settings" class="nav-link">Settings</a></li>
        </ul>
      </nav>
    </header>

    <main class="app-container" id="router-view">
      <!-- Feature Views mount here -->
    </main>

    <footer style="border-top: 1px solid var(--color-border); padding: var(--space-4); text-align: center; font-size: var(--font-size-xs); color: var(--color-text-muted); background: var(--color-bg-surface);">
      <p>MandiMitra • IGNITE 8.0 Decision Support System • Powered by AsliDaam™ Engine</p>
      <p style="margin-top: var(--space-1);">Net Realizable Value (NRV) & Data Quality First</p>
    </footer>
  `;

  return root;
}

/**
 * MandiMitra Feature: Farmer Logistics Settings View
 * Route: /settings
 * 
 * OWNER: Purva (Frontend Feature Engineer - Markets & Trust Vertical)
 * Structural placeholder - updates user-editable transport, storage, and search radius values.
 */

import { store } from '../../state/store';
import { icons } from '../../components/shared/icons';

export function renderSettingsView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'feature-settings-view';

  const state = store.getState();
  const config = state.costConfig;

  container.innerHTML = `
    <!-- Explanatory Context Card -->
    <div style="background: var(--color-white); border: 1px solid var(--color-black-border); border-radius: var(--radius-xl); padding: var(--space-6); margin-bottom: var(--space-5); box-shadow: var(--shadow-sm);">
      <span style="font-size: var(--font-size-xs); font-weight: 800; text-transform: uppercase; color: var(--color-sage); letter-spacing: 0.08em; display: flex; align-items: center; gap: 6px;">
        ${icons.sliders(16, '#8B9271')}
        <span>LOGISTICS & COST CONFIGURATION</span>
      </span>
      <h2 style="font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-text-main); margin-top: var(--space-1);">
        Farm Logistics Parameters
      </h2>
      <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); margin-top: 4px; line-height: 1.5;">
        Net Realisation is calculated by subtracting your true haulage tariffs and daily storage costs from projected market prices. Adjust these parameters to match your vehicle type, travel radius, and holding facilities.
      </p>
    </div>

    <div class="card">
      <div style="border-bottom: 1px solid var(--color-border); padding-bottom: var(--space-3); margin-bottom: var(--space-5);">
        <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--color-text-main);">
          Cost & Travel Assumptions
        </h3>
        <p style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 2px;">
          Parameters are applied in real-time across all candidate APMC mandis.
        </p>
      </div>

      <form id="settings-form">
        <div style="margin-bottom: var(--space-5);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label style="font-size: var(--font-size-sm); font-weight: 700;">
              Transport Tariff (₹ per km per quintal)
            </label>
            <span style="font-size: 0.75rem; font-weight: 700; background: var(--color-yellow); color: var(--color-black); padding: 2px 8px; border-radius: var(--radius-full);">
              Default: ₹3.00
            </span>
          </div>
          <input 
            type="number" 
            step="0.5" 
            min="0.5" 
            max="20" 
            id="input-transport-cost" 
            value="${config.transportCostPerKmPerQtl}" 
          />
          <span style="display: block; font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 6px;">
            Covers diesel, truck/tempo rental, and loading fees calculated via Haversine × 1.35 road factor.
          </span>
        </div>

        <div style="margin-bottom: var(--space-5);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label style="font-size: var(--font-size-sm); font-weight: 700;">
              Storage & Holding Cost (₹ per day per quintal)
            </label>
            <span style="font-size: 0.75rem; font-weight: 700; background: var(--color-yellow); color: var(--color-black); padding: 2px 8px; border-radius: var(--radius-full);">
              Default: ₹10.00
            </span>
          </div>
          <input 
            type="number" 
            step="1" 
            min="1" 
            max="50" 
            id="input-storage-cost" 
            value="${config.storageCostPerDayPerQtl}" 
          />
          <span style="display: block; font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 6px;">
            Accounts for warehouse rent, moisture shrinkage, and spoilage risk during the 1–3 day waiting window.
          </span>
        </div>

        <div style="margin-bottom: var(--space-6);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label style="font-size: var(--font-size-sm); font-weight: 700;">
              Search Radius (km)
            </label>
            <span style="font-size: 0.75rem; font-weight: 700; background: var(--color-yellow); color: var(--color-black); padding: 2px 8px; border-radius: var(--radius-full);">
              Default: 100 km
            </span>
          </div>
          <input 
            type="number" 
            step="10" 
            min="20" 
            max="300" 
            id="input-radius" 
            value="${config.searchRadiusKm}" 
          />
          <span style="display: block; font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 6px;">
            Maximum practical road distance from your farm center to candidate APMC markets.
          </span>
        </div>

        <div style="border-top: 1px solid var(--color-border); padding-top: var(--space-5); display: flex; gap: var(--space-3); flex-wrap: wrap;">
          <button type="submit" class="btn btn-primary" id="btn-save-settings" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
            <span>${icons.check(14, '#FFFFFF')}</span>
            <span>Save Settings & Recalculate</span>
          </button>
          <button type="button" class="btn btn-outline" id="btn-reset-defaults" style="width: auto; padding: 14px 20px;">
            Reset to Defaults
          </button>
        </div>
      </form>
    </div>
  `;

  const form = container.querySelector('#settings-form') as HTMLFormElement;
  const btnReset = container.querySelector('#btn-reset-defaults') as HTMLButtonElement;

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const transportInput = container.querySelector('#input-transport-cost') as HTMLInputElement;
      const storageInput = container.querySelector('#input-storage-cost') as HTMLInputElement;
      const radiusInput = container.querySelector('#input-radius') as HTMLInputElement;

      store.updateCostConfig({
        transportCostPerKmPerQtl: parseFloat(transportInput.value) || 3.0,
        storageCostPerDayPerQtl: parseFloat(storageInput.value) || 10.0,
        searchRadiusKm: parseFloat(radiusInput.value) || 100.0
      });

      // Navigate back to entry or decision
      store.setRoute('/');
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      const transportInput = container.querySelector('#input-transport-cost') as HTMLInputElement;
      const storageInput = container.querySelector('#input-storage-cost') as HTMLInputElement;
      const radiusInput = container.querySelector('#input-radius') as HTMLInputElement;

      transportInput.value = '3.0';
      storageInput.value = '10.0';
      radiusInput.value = '100';

      store.updateCostConfig({
        transportCostPerKmPerQtl: 3.0,
        storageCostPerDayPerQtl: 10.0,
        searchRadiusKm: 100.0
      });
    });
  }

  return container;
}

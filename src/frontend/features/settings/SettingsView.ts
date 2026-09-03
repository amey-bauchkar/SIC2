/**
 * MandiMitra Feature: Farmer Logistics Settings View
 * Route: /settings
 * 
 * OWNER: Purva (Frontend Feature Engineer - Markets & Trust Vertical)
 * Structural placeholder - updates user-editable transport, storage, and search radius values.
 */

import { store } from '../../state/store';

export function renderSettingsView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'feature-settings-view';

  const state = store.getState();
  const config = state.costConfig;

  container.innerHTML = `
    <div class="card">
      <h2 style="font-size: var(--font-size-xl); font-weight: 800; margin-bottom: var(--space-2);">
        Logistics & Cost Settings
      </h2>
      <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); margin-bottom: var(--space-6);">
        Adjust transport and holding assumptions to tailor Net Realisation calculations to your farm.
      </p>

      <form id="settings-form">
        <div style="margin-bottom: var(--space-4);">
          <label style="display: block; font-size: var(--font-size-sm); font-weight: 600; margin-bottom: var(--space-1);">
            Transport Cost (₹ per km per quintal)
          </label>
          <input 
            type="number" 
            step="0.5" 
            min="0.5" 
            max="20" 
            id="input-transport-cost" 
            value="${config.transportCostPerKmPerQtl}" 
            style="width: 100%; padding: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-base);"
          />
          <span style="font-size: var(--font-size-xs); color: var(--color-text-muted);">Standard regional default: ₹3.00/km/qtl</span>
        </div>

        <div style="margin-bottom: var(--space-4);">
          <label style="display: block; font-size: var(--font-size-sm); font-weight: 600; margin-bottom: var(--space-1);">
            Storage & Holding Cost (₹ per day per quintal)
          </label>
          <input 
            type="number" 
            step="1" 
            min="1" 
            max="50" 
            id="input-storage-cost" 
            value="${config.storageCostPerDayPerQtl}" 
            style="width: 100%; padding: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-base);"
          />
          <span style="font-size: var(--font-size-xs); color: var(--color-text-muted);">Includes farm storage shrinkage/spoilage risk. Default: ₹10.00/day/qtl</span>
        </div>

        <div style="margin-bottom: var(--space-6);">
          <label style="display: block; font-size: var(--font-size-sm); font-weight: 600; margin-bottom: var(--space-1);">
            Search Radius (km)
          </label>
          <input 
            type="number" 
            step="10" 
            min="20" 
            max="300" 
            id="input-radius" 
            value="${config.searchRadiusKm}" 
            style="width: 100%; padding: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-base);"
          />
          <span style="font-size: var(--font-size-xs); color: var(--color-text-muted);">Maximum driving radius considered. Default: 100 km</span>
        </div>

        <button type="submit" class="btn btn-primary" id="btn-save-settings">
          Save Settings & Recalculate
        </button>
      </form>
    </div>
  `;

  const form = container.querySelector('#settings-form') as HTMLFormElement;
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

  return container;
}

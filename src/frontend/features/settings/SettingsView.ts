/**
 * MandiMitra Feature: Farmer Logistics Settings View
 * Route: /settings
 * 
 * VerdaAgro Editorial Agricultural Redesign
 * 100% Preserves user cost updates, inputs, and form submission
 */

import { store } from '../../state/store';

export function renderSettingsView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'feature-settings-view';

  const state = store.getState();
  const config = state.costConfig;

  container.innerHTML = `
    <div class="editorial-panel" style="padding: var(--space-8); max-width: 800px; margin: 0 auto;">
      <div style="border-bottom: 1px solid var(--color-border-subtle); padding-bottom: var(--space-4); margin-bottom: var(--space-6);">
        <div class="kicker">LOGISTICS & COST SIMULATOR</div>
        <h2 class="heading-xl">
          Farm Logistics Assumptions
        </h2>
        <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); margin-top: 4px;">
          Tailor transport freight and crop holding costs to your local vehicle and storage arrangements.
        </p>
      </div>

      <form id="settings-form">
        
        <!-- Transport Cost Input -->
        <div class="form-group" style="margin-bottom: var(--space-5);">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
            <label class="input-label" for="input-transport-cost">
              Transport Haulage Cost (₹ per km per quintal)
            </label>
            <span style="font-size: var(--font-size-xs); color: var(--color-brand-primary-dark); font-weight: 700;">Regional Default: ₹3.00</span>
          </div>
          <input 
            type="number" 
            step="0.5" 
            min="0.5" 
            max="20" 
            id="input-transport-cost" 
            class="input-field"
            value="${config.transportCostPerKmPerQtl}" 
          />
          <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 4px;">
            Covers pickup truck or tractor trolley fuel and driver cost per kilometer per quintal of produce.
          </div>
        </div>

        <!-- Storage & Holding Cost Input -->
        <div class="form-group" style="margin-bottom: var(--space-5);">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
            <label class="input-label" for="input-storage-cost">
              Holding & Storage Cost (₹ per day per quintal)
            </label>
            <span style="font-size: var(--font-size-xs); color: var(--color-brand-primary-dark); font-weight: 700;">Default: ₹10.00</span>
          </div>
          <input 
            type="number" 
            step="1" 
            min="1" 
            max="50" 
            id="input-storage-cost" 
            class="input-field"
            value="${config.storageCostPerDayPerQtl}" 
          />
          <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 4px;">
            Models biological crop shrinkage, weight loss, and daily shed holding expenses.
          </div>
        </div>

        <!-- Search Radius Input -->
        <div class="form-group" style="margin-bottom: var(--space-8);">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
            <label class="input-label" for="input-radius">
              Maximum Search Radius (Kilometers)
            </label>
            <span style="font-size: var(--font-size-xs); color: var(--color-brand-primary-dark); font-weight: 700;">Default: 100 km</span>
          </div>
          <input 
            type="number" 
            step="10" 
            min="20" 
            max="300" 
            id="input-radius" 
            class="input-field"
            value="${config.searchRadiusKm}" 
          />
          <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 4px;">
            Maximum driving distance considered around your farm for finding profitable APMCs.
          </div>
        </div>

        <button type="submit" class="btn btn-primary btn-lg" id="btn-save-settings" style="width: 100%;">
          ✓ Save Settings & Recalculate Payouts
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

      // Navigate back to hub
      store.setRoute('/hub');
    });
  }

  return container;
}

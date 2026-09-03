/**
 * MandiMitra Feature: Crop & Location Entry View
 * Route: /entry
 * 
 * VerdaAgro Editorial Agricultural Redesign
 * 100% Functionality & Form Submission Preserved
 */

import { store } from '../../state/store';
import { apiClient } from '../../api-client';

export function renderEntryView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'feature-entry-view';

  const state = store.getState();

  container.innerHTML = `
    <div class="editorial-grid-2" style="align-items: center; margin: var(--space-6) 0;">
      
      <!-- Left Column: Editorial Crop Selection Form -->
      <div class="editorial-panel" style="padding: var(--space-8); border: 1.5px solid var(--color-border);">
        <div class="kicker">
          🌾 MANDIMITRA DECISION ENGINE
        </div>
        <h1 class="heading-xl" style="color: var(--color-text-main); margin-bottom: var(--space-3);">
          Where & When Should You Sell?
        </h1>
        <p class="text-farmer-lead" style="font-size: var(--font-size-sm); margin-bottom: var(--space-6);">
          Enter your harvested crop and location. We calculate the true net take-home cash across all nearby mandis over the next 0 to 3 days.
        </p>

        <form id="entry-form">
          <div class="form-group">
            <label class="input-label" for="select-crop">
              Select Crop (शेतमाल / फसल)
            </label>
            <select id="select-crop" class="select-field">
              <option value="Onion" ${state.selectedCrop === 'Onion' ? 'selected' : ''}>Onion (कांदा / प्याज)</option>
              <option value="Tomato" ${state.selectedCrop === 'Tomato' ? 'selected' : ''}>Tomato (टोमॅटो / टमाटर)</option>
              <option value="Soyabean" ${state.selectedCrop === 'Soyabean' ? 'selected' : ''}>Soyabean (सोयाबीन)</option>
              <option value="Wheat" ${state.selectedCrop === 'Wheat' ? 'selected' : ''}>Wheat (गहू / गेहूं)</option>
              <option value="Gram" ${state.selectedCrop === 'Gram' ? 'selected' : ''}>Gram / Chana (हरभरा / चना)</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: var(--space-6);">
            <label class="input-label" for="input-location">
              Farmer District / Taluka (शेतकरी ठिकाण)
            </label>
            <input 
              type="text" 
              id="input-location" 
              class="input-field"
              value="${state.userLocation ? state.userLocation.district : 'Nashik'}" 
              placeholder="e.g. Nashik, Maharashtra" 
            />
            <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 6px;">
              📍 Center: Nashik Region (19.9975° N, 73.7898° E) • 100km Mandi Radius
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-lg" id="btn-submit-entry" style="width: 100%;">
            ⚡ Calculate Best Market & Timing
          </button>
        </form>
      </div>

      <!-- Right Column: Agricultural Visual Inspiration -->
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div class="editorial-image-frame" style="height: 320px;">
          <img src="/assets/images/hero_wheat.jpg" alt="Agricultural Fields" onerror="this.src='https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1000&q=80'" />
          <div style="position: absolute; bottom: 16px; left: 16px; right: 16px; background: rgba(24, 32, 20, 0.85); backdrop-filter: blur(8px); padding: var(--space-4); border-radius: var(--radius-lg); color: #fff;">
            <div class="badge badge-accent" style="margin-bottom: 6px;">AsliDaam™ Guarantee</div>
            <div style="font-family: var(--font-family-heading); font-weight: 700; font-size: var(--font-size-sm); color: #ffffff;">
              "Highest gross mandi price doesn't mean highest cash in hand. Always factor in road freight and holding decay."
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
          <div class="editorial-panel" style="padding: var(--space-4); background: #ffffff;">
            <div style="font-size: 1.25rem; margin-bottom: 4px;">🚚</div>
            <div style="font-family: var(--font-family-heading); font-weight: 800; font-size: var(--font-size-sm); color: var(--color-text-main);">Real Road Haulage</div>
            <div style="font-size: var(--font-size-xs); color: var(--color-text-muted);">OSRM driving km calibrated at 1.35× road factor</div>
          </div>
          <div class="editorial-panel" style="padding: var(--space-4); background: #ffffff;">
            <div style="font-size: 1.25rem; margin-bottom: 4px;">🛡️</div>
            <div style="font-family: var(--font-family-heading); font-weight: 800; font-size: var(--font-size-sm); color: var(--color-text-main);">Zero Guesswork</div>
            <div style="font-size: var(--font-size-xs); color: var(--color-text-muted);">Honest abstention when data is stale or unreliable</div>
          </div>
        </div>
      </div>

    </div>
  `;

  const form = container.querySelector('#entry-form') as HTMLFormElement;
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const cropSelect = container.querySelector('#select-crop') as HTMLSelectElement;
      const crop = cropSelect.value;
      store.setSelectedCrop(crop);
      store.setLoading(true);

      try {
        const currentState = store.getState();
        const response = await apiClient.evaluate({
          commodity: crop,
          latitude: currentState.userLocation ? currentState.userLocation.lat : 19.9975,
          longitude: currentState.userLocation ? currentState.userLocation.lon : 73.7898,
          transportCostPerKmPerQtl: currentState.costConfig.transportCostPerKmPerQtl,
          storageCostPerDayPerQtl: currentState.costConfig.storageCostPerDayPerQtl,
          radiusKm: currentState.costConfig.searchRadiusKm
        });
        store.setEvaluationData(response);
        store.setRoute('/decision');
      } catch (err) {
        store.setError(err instanceof Error ? err.message : 'Evaluation service unavailable');
      }
    });
  }

  return container;
}

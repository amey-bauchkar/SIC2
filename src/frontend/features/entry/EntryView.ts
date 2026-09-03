/**
 * MandiMitra Feature: Crop & Location Entry View
 * Route: /
 * 
 * OWNER: Tanmay (Frontend Feature Engineer - Decision & Evidence Vertical)
 * Structural placeholder only - wires user input into store and triggers evaluation.
 */

import { store } from '../../state/store';
import { apiClient } from '../../api-client';

export function renderEntryView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'feature-entry-view';

  const state = store.getState();

  container.innerHTML = `
    <div class="card">
      <h1 style="font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-brand-primary); margin-bottom: var(--space-2);">
        MandiMitra Decision Engine
      </h1>
      <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); margin-bottom: var(--space-6);">
        Enter your crop and location to calculate optimal net market returns and selling timing.
      </p>

      <form id="entry-form">
        <div style="margin-bottom: var(--space-4);">
          <label style="display: block; font-size: var(--font-size-sm); font-weight: 600; margin-bottom: var(--space-2);">
            Select Commodity
          </label>
          <select id="select-crop" style="width: 100%; padding: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-base); background: var(--color-bg-surface);">
            <option value="Onion" ${state.selectedCrop === 'Onion' ? 'selected' : ''}>Onion (कांदा / प्याज)</option>
            <option value="Tomato" ${state.selectedCrop === 'Tomato' ? 'selected' : ''}>Tomato (टोमॅटो / टमाटर)</option>
            <option value="Soyabean" ${state.selectedCrop === 'Soyabean' ? 'selected' : ''}>Soyabean (सोयाबीन)</option>
            <option value="Wheat" ${state.selectedCrop === 'Wheat' ? 'selected' : ''}>Wheat (गहू / गेहूं)</option>
            <option value="Gram" ${state.selectedCrop === 'Gram' ? 'selected' : ''}>Gram / Chana (हरभरा / चना)</option>
          </select>
        </div>

        <div style="margin-bottom: var(--space-6);">
          <label style="display: block; font-size: var(--font-size-sm); font-weight: 600; margin-bottom: var(--space-2);">
            Farmer District / Taluka
          </label>
          <input 
            type="text" 
            id="input-location" 
            value="${state.userLocation ? state.userLocation.district : 'Nashik'}" 
            placeholder="e.g. Nashik, Maharashtra" 
            style="width: 100%; padding: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-base);" 
          />
          <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: var(--space-1);">
            Geodesic center: Nashik (19.9975° N, 73.7898° E)
          </div>
        </div>

        <button type="submit" class="btn btn-primary" id="btn-submit-entry">
          Calculate Best Market & Timing
        </button>
      </form>
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

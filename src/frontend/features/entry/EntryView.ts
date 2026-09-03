/**
 * MandiMitra Feature: Crop & Location Entry View
 * Route: /entry
 * 
 * VerdaAgro Editorial Agricultural Redesign
 * 100% Functionality & Form Submission Preserved
 * Integrated with 99 Maharashtra Commodities & 36 Origin Districts
 */

import { store } from '../../state/store';
import { apiClient } from '../../api-client';
import { renderCropOptgroupsHtml, renderCropDatalistHtml, getCropConfig } from '../../../config/crops';
import { renderDistrictOptgroupsHtml, renderDistrictDatalistHtml, getDistrictConfig, ALL_DISTRICTS } from '../../../config/districts';

export const MAHARASHTRA_DISTRICT_COORDS: Record<string, { lat: number; lon: number }> = Object.fromEntries(
  ALL_DISTRICTS.map(d => [d.name.toLowerCase(), { lat: d.latitude, lon: d.longitude }])
);
MAHARASHTRA_DISTRICT_COORDS['ahmednagar'] = MAHARASHTRA_DISTRICT_COORDS['ahilyanagar'] || { lat: 19.0952, lon: 74.7480 };
MAHARASHTRA_DISTRICT_COORDS['aurangabad'] = MAHARASHTRA_DISTRICT_COORDS['chhatrapati sambhajinagar'] || { lat: 19.8762, lon: 75.3433 };
MAHARASHTRA_DISTRICT_COORDS['osmanabad'] = MAHARASHTRA_DISTRICT_COORDS['dharashiv'] || { lat: 18.1861, lon: 76.0419 };

export function renderEntryView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'feature-entry-view';

  const state = store.getState();
  const initialDistrictName = state.userLocation?.district || 'Nashik';
  const initialDistrict = getDistrictConfig(initialDistrictName);

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
          <div class="form-group" style="margin-bottom: var(--space-4);">
            <label class="input-label" for="select-crop">
              Select Commodity (शेतमाल / फसल निवडा)
            </label>
            <div style="margin-bottom: var(--space-2);">
              <input 
                type="text" 
                id="input-crop-search" 
                class="input-field"
                list="crop-datalist" 
                placeholder="🔍 Quick search crop (e.g. Wheat, Chana, Aalu, Pomegranate)..."
                style="width: 100%; padding: var(--space-2) var(--space-3); font-size: var(--font-size-sm); background: var(--color-bg-subtle);"
              />
              ${renderCropDatalistHtml('crop-datalist')}
            </div>
            <select id="select-crop" class="select-field" style="width: 100%;">
              ${renderCropOptgroupsHtml(state.selectedCrop || 'Onion')}
            </select>
          </div>

          <div class="form-group" style="margin-bottom: var(--space-6);">
            <label class="input-label" for="select-district">
              Farmer Origin District (शेतकरी जिल्हा / मूळ स्थान निवडा)
            </label>
            <div style="margin-bottom: var(--space-2);">
              <input 
                type="text" 
                id="input-district-search" 
                class="input-field"
                list="district-datalist" 
                placeholder="🔍 Quick search district (e.g. Nashik, Pune, Latur, Solapur, Kolhapur)..."
                style="width: 100%; padding: var(--space-2) var(--space-3); font-size: var(--font-size-sm); background: var(--color-bg-subtle);"
              />
              ${renderDistrictDatalistHtml('district-datalist')}
            </div>
            <select id="select-district" class="select-field" style="width: 100%;">
              ${renderDistrictOptgroupsHtml(initialDistrictName)}
            </select>
            <input type="hidden" id="input-location" value="${initialDistrict.name}" />
            <div id="district-coords-preview" style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 6px;">
              📍 Geodesic origin: ${initialDistrict.displayName} (${initialDistrict.latitude.toFixed(4)}° N, ${initialDistrict.longitude.toFixed(4)}° E) • ${initialDistrict.divisionLabel}
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

  const cropSelect = container.querySelector('#select-crop') as HTMLSelectElement;
  const cropSearchInput = container.querySelector('#input-crop-search') as HTMLInputElement;

  if (cropSelect && cropSearchInput) {
    cropSearchInput.addEventListener('input', () => {
      const val = cropSearchInput.value.trim();
      if (!val) return;
      const matched = getCropConfig(val);
      if (matched) {
        cropSelect.value = matched.id;
      }
    });

    cropSelect.addEventListener('change', () => {
      const opt = cropSelect.selectedOptions[0];
      if (opt) {
        cropSearchInput.value = opt.textContent || '';
      }
    });
  }

  const districtSelect = container.querySelector('#select-district') as HTMLSelectElement;
  const districtSearchInput = container.querySelector('#input-district-search') as HTMLInputElement;
  const locInput = container.querySelector('#input-location') as HTMLInputElement;
  const coordsPreview = container.querySelector('#district-coords-preview') as HTMLElement;

  function updateDistrictSelection(dName: string) {
    const config = getDistrictConfig(dName);
    if (districtSelect) districtSelect.value = config.name;
    if (districtSearchInput) districtSearchInput.value = config.displayName;
    if (locInput) locInput.value = config.name;
    if (coordsPreview) {
      coordsPreview.textContent = `📍 Geodesic origin: ${config.displayName} (${config.latitude.toFixed(4)}° N, ${config.longitude.toFixed(4)}° E) • ${config.divisionLabel}`;
    }
  }

  if (districtSelect && districtSearchInput) {
    districtSearchInput.addEventListener('input', () => {
      const val = districtSearchInput.value.trim();
      if (!val) return;
      const matched = getDistrictConfig(val);
      if (matched) {
        if (districtSelect) districtSelect.value = matched.name;
        if (locInput) locInput.value = matched.name;
        if (coordsPreview) {
          coordsPreview.textContent = `📍 Geodesic origin: ${matched.displayName} (${matched.latitude.toFixed(4)}° N, ${matched.longitude.toFixed(4)}° E) • ${matched.divisionLabel}`;
        }
      }
    });

    districtSelect.addEventListener('change', () => {
      updateDistrictSelection(districtSelect.value);
    });
  }

  const form = container.querySelector('#entry-form') as HTMLFormElement;
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const crop = cropSelect ? cropSelect.value : 'Onion';
      store.setSelectedCrop(crop);

      const dVal = districtSelect ? districtSelect.value : (locInput ? locInput.value : 'Nashik');
      const distConfig = getDistrictConfig(dVal);
      const targetLat = distConfig.latitude;
      const targetLon = distConfig.longitude;
      const districtRaw = distConfig.name;

      store.setUserLocation(targetLat, targetLon, districtRaw);
      store.setLoading(true);

      try {
        const currentState = store.getState();
        const response = await apiClient.evaluate({
          commodity: crop,
          latitude: targetLat,
          longitude: targetLon,
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

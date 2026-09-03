/**
 * MandiMitra Feature: Crop & Location Entry View
 * Route: /
 * 
 * OWNER: Tanmay (Frontend Feature Engineer - Decision & Evidence Vertical)
 * Structural placeholder only - wires user input into store and triggers evaluation.
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
            Select Commodity (शेतमाल निवडा)
          </label>
          <div style="margin-bottom: var(--space-2);">
            <input 
              type="text" 
              id="input-crop-search" 
              list="crop-datalist" 
              placeholder="🔍 Quick search crop (e.g. Wheat, Chana, Aalu, Pomegranate)..."
              style="width: 100%; padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-sm); background: var(--color-bg-subtle);"
            />
            ${renderCropDatalistHtml('crop-datalist')}
          </div>
          <select id="select-crop" style="width: 100%; padding: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-base); background: var(--color-bg-surface);">
            ${renderCropOptgroupsHtml(state.selectedCrop || 'Onion')}
          </select>
        </div>

        <div style="margin-bottom: var(--space-6);">
          <label style="display: block; font-size: var(--font-size-sm); font-weight: 600; margin-bottom: var(--space-2);">
            Farmer Origin District (शेतकरी जिल्हा / मूळ स्थान निवडा)
          </label>
          <div style="margin-bottom: var(--space-2);">
            <input 
              type="text" 
              id="input-district-search" 
              list="district-datalist" 
              placeholder="🔍 Quick search district (e.g. Nashik, Pune, Latur, Solapur, Kolhapur)..."
              style="width: 100%; padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-sm); background: var(--color-bg-subtle);"
            />
            ${renderDistrictDatalistHtml('district-datalist')}
          </div>
          <select id="select-district" style="width: 100%; padding: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-base); background: var(--color-bg-surface);">
            ${renderDistrictOptgroupsHtml(initialDistrictName)}
          </select>
          <input type="hidden" id="input-location" value="${initialDistrict.name}" />
          <div id="district-coords-preview" style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: var(--space-1);">
            Geodesic origin: ${initialDistrict.displayName} (${initialDistrict.latitude.toFixed(4)}° N, ${initialDistrict.longitude.toFixed(4)}° E) • ${initialDistrict.divisionLabel}
          </div>
        </div>

        <button type="submit" class="btn btn-primary" id="btn-submit-entry">
          Calculate Best Market & Timing
        </button>
      </form>
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
      coordsPreview.textContent = `Geodesic origin: ${config.displayName} (${config.latitude.toFixed(4)}° N, ${config.longitude.toFixed(4)}° E) • ${config.divisionLabel}`;
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
          coordsPreview.textContent = `Geodesic origin: ${matched.displayName} (${matched.latitude.toFixed(4)}° N, ${matched.longitude.toFixed(4)}° E) • ${matched.divisionLabel}`;
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

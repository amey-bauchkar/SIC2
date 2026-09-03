/**
 * MandiMitra Feature: SajhaBazaar ("साझा बाज़ार") Cockpit
 *
 * "AsliDaam tells you where the economics are better;
 *  SajhaBazaar gives you the scale required to act on that advice."
 *
 * Everything rendered here — every rupee, every kilometre, every transport share — comes from
 * POST /api/sajha-bazaar/evaluate. Nothing on this screen is hardcoded, including the bar chart,
 * which is drawn from the three net-realisation figures the backend returned.
 */

import { store } from '../../state/store';
import { apiClient, SajhaRosterResponse } from '../../api-client';
import { renderCropOptgroupsHtml } from '../../../config/crops';
import type { SajhaBazaarResult, SajhaParticipant } from '../../../core/sajha-bazaar';

type Language = 'en' | 'mr' | 'hi';

const rs = (n: number): string => `₹${Math.round(n).toLocaleString('en-IN')}`;
const rs1 = (n: number): string => `₹${n.toFixed(1)}`;
const rs2 = (n: number): string => `₹${n.toFixed(2)}`;

let rosterCache: SajhaRosterResponse | null = null;

/** Origin override chosen from a cluster chip; null means "use my district". */
let originOverride: { lat: number; lon: number; label: string; district: string } | null = null;
let quantityOverride: number | null = null;

function currentRequest() {
  const state = store.getState();
  const district = originOverride?.district || state.userLocation?.district || 'Nashik';
  return {
    commodity: state.selectedCrop || 'Onion',
    latitude: originOverride?.lat ?? (state.userLocation?.lat || 19.9975),
    longitude: originOverride?.lon ?? (state.userLocation?.lon || 73.7898),
    district,
    quantityQuintals: quantityOverride ?? (state.harvestQuantityQuintals || 25),
    radiusKm: state.costConfig.searchRadiusKm,
    transportCostPerKmPerQtl: state.costConfig.transportCostPerKmPerQtl,
    storageCostPerDayPerQtl: state.costConfig.storageCostPerDayPerQtl,
    requesterName: 'You',
    requesterVillage: originOverride?.label || district
  };
}

// ============================================================================
// Trigger banner
// ============================================================================

/**
 * Renders the SajhaBazaar opportunity banner into `mount` when — and only when — the backend
 * reports a genuine pool where every participant clears the materiality threshold.
 */
export function renderSajhaBazaarBanner(
  mount: HTMLElement,
  language: Language,
  onView: () => void
): void {
  mount.innerHTML = '';

  apiClient.evaluateSajhaBazaar(currentRequest())
    .then(result => {
      if (result.status !== 'POOL_AVAILABLE' || !result.pooled || result.requesterGainPerQtl <= 0) return;

      const others = result.pooled.participantCount - 1;
      const dest = result.destinationMandi?.name || 'the better mandi';

      const banner = document.createElement('div');
      banner.className = 'editorial-panel';
      banner.style.cssText = `
        border: 2px solid var(--color-brand-primary);
        background: var(--color-brand-primary-subtle);
        padding: var(--space-4) var(--space-5);
        margin-bottom: var(--space-4);
        display: flex; align-items: center; justify-content: space-between;
        gap: var(--space-4); flex-wrap: wrap;
      `;
      banner.innerHTML = `
        <div style="display: flex; align-items: center; gap: var(--space-3); flex: 1; min-width: 280px;">
          <span style="font-size: 1.8rem;">🤝</span>
          <div>
            <div style="font-family: var(--font-family-heading); font-weight: 800; font-size: var(--font-size-sm); color: var(--color-text-main);">
              ${language === 'mr'
                ? `साझा बाज़ार संधी: जवळचे ${others} शेतकरी ${result.commodity} घेऊन तयार आहेत. एकत्र वाहतुकीने ${dest} परवडते (+${rs(result.requesterGainPerQtl)}/क्विंटल निव्वळ फायदा)!`
                : language === 'hi'
                ? `साझा बाज़ार अवसर: पास के ${others} किसान ${result.commodity} के साथ तैयार हैं. ढुलाई साझा करने से ${dest} फायदेमंद बनता है (+${rs(result.requesterGainPerQtl)}/क्विंटल शुद्ध लाभ)!`
                : `SajhaBazaar Opportunity: ${others} nearby farmers have compatible ${result.commodity}. Pooling makes ${dest} viable (+${rs(result.requesterGainPerQtl)}/q net gain)!`}
            </div>
            <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 3px;">
              ${result.pooled.totalQuintals}q combined load · freight falls from
              ${rs2(result.soloAtDestination?.transportPerQtl ?? 0)}/q to ${rs2(result.pooled.transportPerQtl)}/q ·
              ${rs(result.requesterGainTotal)} extra in your pocket
            </div>
          </div>
        </div>
        <button id="btn-view-pool" class="btn btn-primary btn-sm" style="font-weight: 800; white-space: nowrap;">
          ${language === 'mr' ? 'समूह पहा' : (language === 'hi' ? 'समूह देखें' : 'View Pool')} →
        </button>
      `;
      mount.appendChild(banner);
      banner.querySelector('#btn-view-pool')?.addEventListener('click', onView);
    })
    .catch(() => {
      // Silent: the banner is an opportunistic upsell, never an error surface.
    });
}

// ============================================================================
// Full cockpit tab
// ============================================================================

export function renderSajhaBazaarTab(language: Language): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'sajha-bazaar-panel';

  const state = store.getState();
  const qty = quantityOverride ?? (state.harvestQuantityQuintals || 25);

  panel.innerHTML = `
    <section class="editorial-section" style="padding-top: 0; margin-bottom: var(--space-5);">
      <div class="editorial-header">
        <div class="kicker">SHARED FREIGHT &amp; MARKET ACCESS</div>
        <h2 class="heading-lg">SajhaBazaar: Shared Transport. Better Market Access.</h2>
        <p style="max-width: 760px;">
          AsliDaam tells you <em>where</em> the economics are better. SajhaBazaar gives you the
          <strong>scale</strong> required to act on that advice. A transporter will not dispatch a vehicle
          below a minimum trip charge, so a 3-quintal load carries the whole cost of the trip. Pooling
          spreads that fixed cost across the combined load — the mandi price never changes, only the
          freight the farmer pays.
        </p>
      </div>

      <div class="editorial-panel" style="background: #ffffff; border: 1.5px solid var(--color-border); padding: var(--space-5); margin-bottom: var(--space-5);">
        <div class="farmer-input-strip">
          <div>
            <label class="input-label" style="margin-bottom: 6px; display: block;">Crop to pool</label>
            <select id="sajha-crop" class="select-field">${renderCropOptgroupsHtml(state.selectedCrop || 'Onion')}</select>
          </div>
          <div>
            <label class="input-label" style="margin-bottom: 6px; display: block;">Your load (quintals)</label>
            <input type="number" id="sajha-qty" class="input-field" value="${qty}" min="0.5" step="0.5" style="max-width: 110px; font-family: var(--font-family-numbers); font-weight: 800;" />
          </div>
          <div>
            <label class="input-label" style="margin-bottom: 6px; display: block;">Your farm location</label>
            <div id="sajha-cluster-chips" style="display: flex; gap: 6px; flex-wrap: wrap;">
              <span style="font-size: var(--font-size-xs); color: var(--color-text-muted);">Loading clusters…</span>
            </div>
          </div>
          <div>
            <button id="sajha-run" class="btn btn-primary" style="width: 100%; font-weight: 700; height: 46px;">
              🤝 Find My Pool
            </button>
          </div>
        </div>
        <div id="sajha-origin-note" style="margin-top: var(--space-3); font-size: var(--font-size-xs); color: var(--color-text-muted);">
          Origin: ${originOverride ? `${originOverride.label} (${originOverride.lat.toFixed(4)}° N, ${originOverride.lon.toFixed(4)}° E)` : `${state.userLocation?.district || 'Nashik'} district centroid`}
        </div>
      </div>
    </section>

    <div id="sajha-result-mount"></div>
  `;

  const resultMount = panel.querySelector('#sajha-result-mount') as HTMLElement;
  const chipsMount = panel.querySelector('#sajha-cluster-chips') as HTMLElement;
  const cropSelect = panel.querySelector('#sajha-crop') as HTMLSelectElement;
  const qtyInput = panel.querySelector('#sajha-qty') as HTMLInputElement;
  const originNote = panel.querySelector('#sajha-origin-note') as HTMLElement;

  const refresh = () => {
    quantityOverride = Math.max(0.5, parseFloat(qtyInput.value || String(qty)));
    store.setSelectedCrop(cropSelect.value);
    originNote.textContent = originOverride
      ? `Origin: ${originOverride.label} (${originOverride.lat.toFixed(4)}° N, ${originOverride.lon.toFixed(4)}° E)`
      : `Origin: ${store.getState().userLocation?.district || 'Nashik'} district centroid`;
    loadAndRender(resultMount, language);
  };

  cropSelect.addEventListener('change', refresh);
  panel.querySelector('#sajha-run')?.addEventListener('click', refresh);

  // Cluster quick-select chips, built from the real synthetic roster metadata.
  const buildChips = (roster: SajhaRosterResponse) => {
    chipsMount.innerHTML = '';

    const districtChip = document.createElement('button');
    districtChip.className = 'qty-pill' + (originOverride === null ? ' active' : '');
    districtChip.textContent = `📍 My district`;
    districtChip.addEventListener('click', () => { originOverride = null; refresh(); buildChips(roster); });
    chipsMount.appendChild(districtChip);

    for (const c of roster.clusters) {
      const chip = document.createElement('button');
      chip.className = 'qty-pill' + (originOverride?.label === c.label ? ' active' : '');
      chip.title = c.narrative;
      chip.textContent = `📍 ${c.taluka} (${c.crop}, ${c.farmerCount})`;
      chip.addEventListener('click', () => {
        originOverride = {
          lat: c.centroidLatitude,
          lon: c.centroidLongitude,
          label: `${c.taluka}, ${c.district}`,
          district: c.district
        };
        cropSelect.value = c.crop;
        store.setSelectedCrop(c.crop);
        refresh();
        buildChips(roster);
      });
      chipsMount.appendChild(chip);
    }
  };

  if (rosterCache) {
    buildChips(rosterCache);
  } else {
    apiClient.getSajhaRoster()
      .then(r => { rosterCache = r; buildChips(r); })
      .catch(() => { chipsMount.innerHTML = '<span style="font-size: var(--font-size-xs); color: var(--color-status-abstain);">Roster unavailable.</span>'; });
  }

  loadAndRender(resultMount, language);
  return panel;
}

function loadAndRender(mount: HTMLElement, language: Language): void {
  mount.innerHTML = `
    <div class="editorial-panel" style="padding: var(--space-8); text-align: center;">
      <div style="font-size: 2rem; margin-bottom: var(--space-2);">🤝</div>
      <div class="heading-sm">Matching compatible neighbours…</div>
      <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 6px;">
        Filtering by crop, 10 km radius, sell-window overlap and mandi data quality.
      </div>
    </div>
  `;

  apiClient.evaluateSajhaBazaar(currentRequest())
    .then(result => {
      mount.innerHTML = '';
      mount.appendChild(result.status === 'POOL_AVAILABLE' ? renderPoolResult(result, language) : renderNoPool(result));
    })
    .catch(err => {
      mount.innerHTML = `
        <div class="editorial-panel" style="border: 1.5px solid var(--color-status-abstain); background: var(--color-status-abstain-bg); padding: var(--space-6);">
          <div class="heading-sm" style="margin-bottom: 6px;">SajhaBazaar service unavailable</div>
          <div style="font-size: var(--font-size-xs);">${err instanceof Error ? err.message : String(err)}</div>
        </div>
      `;
    });
}

function renderNoPool(result: SajhaBazaarResult): HTMLElement {
  const el = document.createElement('div');
  el.className = 'editorial-panel';
  el.style.cssText = 'border: 1.5px solid var(--color-border); padding: var(--space-6);';
  el.innerHTML = `
    <div class="kicker">${result.statusLabel}</div>
    <h3 class="heading-md" style="margin-bottom: var(--space-3);">No pool worth joining right now</h3>
    <ul style="font-size: var(--font-size-sm); line-height: 1.65; padding-left: 1.1rem; margin-bottom: var(--space-4);">
      ${result.reasons.map(r => `<li>${r}</li>`).join('')}
    </ul>
    ${result.participants.length > 0 ? `
      <div class="table-responsive-wrapper">
        ${renderCostSplitTable(result)}
      </div>
      <p style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: var(--space-2);">
        The evaluated pool is shown above for transparency. SajhaBazaar only surfaces a pool as
        actionable when <strong>every</strong> participant clears ${rs(result.materialityThresholdPerQtl)}/qtl of net gain.
      </p>
    ` : ''}
    ${renderSyntheticNotice(result)}
  `;
  return el;
}

function renderSyntheticNotice(result: SajhaBazaarResult): string {
  return `
    <div style="margin-top: var(--space-4); padding: var(--space-3) var(--space-4); background: var(--color-bg-muted); border-left: 3px solid var(--color-brand-accent-text); border-radius: var(--radius-sm);">
      <div style="font-size: var(--font-size-xs); font-weight: 800; margin-bottom: 4px;">⚠️ SYNTHETIC ROSTER (HACKATHON MVP)</div>
      <div style="font-size: 0.7rem; color: var(--color-text-muted); line-height: 1.5;">${result.syntheticNotice}</div>
    </div>
  `;
}

function renderCostSplitTable(result: SajhaBazaarResult): string {
  return `
    <table class="editorial-table">
      <thead>
        <tr>
          <th>Farmer</th>
          <th>Village</th>
          <th>Quantity (q)</th>
          <th>Transport Share (₹)</th>
          <th>Share / qtl</th>
          <th>Pooled AsliDaam (₹/q)</th>
          <th>Best Individual (₹/q)</th>
          <th>Net Extra Gain</th>
        </tr>
      </thead>
      <tbody>
        ${result.participants.map((p: SajhaParticipant) => {
          const bestIndividual = Math.max(p.localNrvPerQtl, p.soloNrvPerQtl);
          return `
            <tr style="${p.isRequester ? 'background-color: var(--color-brand-primary-light); font-weight: 700;' : ''}">
              <td><strong>${p.displayName}</strong>${p.isRequester ? ' <span class="badge badge-accent" style="font-size:0.6rem;">YOU</span>' : ''}</td>
              <td>${p.village}${p.isRequester ? '' : ` <span style="color: var(--color-text-muted);">(${p.distanceFromRequesterKm} km)</span>`}</td>
              <td class="number-display">${p.quantityQuintals}</td>
              <td class="number-display">${rs2(p.pooledTransportShareTotal)}</td>
              <td class="number-display">${rs2(p.pooledTransportSharePerQtl)}</td>
              <td class="number-display"><strong>${rs1(p.pooledNrvPerQtl)}</strong></td>
              <td class="number-display">${rs1(bestIndividual)}</td>
              <td class="number-display ${p.netGainPerQtl > 0 ? 'number-positive' : ''}">
                <strong>+${rs1(p.netGainPerQtl)}/q</strong>
                <span style="font-size: 0.68rem; color: var(--color-text-muted); display: block;">(+${rs(p.netGainTotal)} total)</span>
              </td>
            </tr>
          `;
        }).join('')}
        <tr style="border-top: 2px solid var(--color-brand-primary); font-weight: 800;">
          <td colspan="2">TOTAL (conservation check)</td>
          <td class="number-display">${result.allocationAudit.sumOfFarmerQuintals}</td>
          <td class="number-display">${rs2(result.allocationAudit.sumOfFarmerSharesRs)}</td>
          <td colspan="3" style="font-size: var(--font-size-xs); color: var(--color-text-muted);">
            Pooled trip cost ${rs2(result.allocationAudit.totalPooledTripCostRs)} ·
            residual ${rs2(result.allocationAudit.allocationResidualRs)} ·
            <strong style="color: ${result.allocationAudit.conserves ? 'var(--color-status-success)' : 'var(--color-status-abstain)'};">
              ${result.allocationAudit.conserves ? '✓ EXACT' : '✗ MISMATCH'}
            </strong>
          </td>
          <td class="number-display number-positive"><strong>+${rs(result.collectiveGainTotal)}</strong></td>
        </tr>
      </tbody>
    </table>
  `;
}

/**
 * Client-rendered comparison bar chart. Heights are derived from the three net-realisation
 * figures the backend returned — nothing is hardcoded.
 */
function renderComparisonChart(result: SajhaBazaarResult): string {
  const local = result.localMandi?.nrvPerQtl ?? 0;
  const solo = result.soloAtDestination?.nrvPerQtl ?? 0;
  const pooled = result.pooled?.requesterNrvPerQtl ?? 0;

  const bars = [
    { label: 'Sell Locally', sub: result.localMandi?.name || '', value: local, color: 'var(--color-text-muted)' },
    { label: 'Distant Alone', sub: result.destinationMandi?.name || '', value: solo, color: 'var(--color-status-abstain)' },
    { label: 'With Pooling', sub: result.destinationMandi?.name || '', value: pooled, color: 'var(--color-brand-primary)' }
  ];

  const max = Math.max(...bars.map(b => b.value), 1);
  const chartH = 190;
  const barW = 88;
  const gap = 56;
  const leftPad = 60;
  const width = leftPad + bars.length * barW + (bars.length - 1) * gap + 30;
  const height = chartH + 76;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(f => {
    const y = 20 + chartH - f * chartH;
    return `
      <line x1="${leftPad - 8}" y1="${y}" x2="${width - 15}" y2="${y}" stroke="var(--color-border)" stroke-width="1" stroke-dasharray="3 4" />
      <text x="${leftPad - 14}" y="${y + 4}" text-anchor="end" font-size="10" fill="var(--color-text-muted)">${Math.round(max * f)}</text>
    `;
  }).join('');

  const barShapes = bars.map((b, i) => {
    const h = Math.max(2, (b.value / max) * chartH);
    const x = leftPad + i * (barW + gap);
    const y = 20 + chartH - h;
    return `
      <rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="6" fill="${b.color}" />
      <text x="${x + barW / 2}" y="${y - 8}" text-anchor="middle" font-size="13" font-weight="800" fill="var(--color-text-main)">₹${b.value.toFixed(0)}</text>
      <text x="${x + barW / 2}" y="${20 + chartH + 20}" text-anchor="middle" font-size="11.5" font-weight="700" fill="var(--color-text-main)">${b.label}</text>
      <text x="${x + barW / 2}" y="${20 + chartH + 36}" text-anchor="middle" font-size="9.5" fill="var(--color-text-muted)">${b.sub}</text>
    `;
  }).join('');

  return `
    <div style="overflow-x: auto;">
      <svg viewBox="0 0 ${width} ${height}" width="100%" style="max-width: ${width}px; min-width: 420px;" role="img" aria-label="Net realisation comparison: local, solo, pooled">
        <text x="4" y="12" font-size="10" fill="var(--color-text-muted)">AsliDaam ₹/quintal</text>
        ${gridLines}
        ${barShapes}
      </svg>
    </div>
  `;
}

/**
 * Route and pickup-waypoint schematic. Farmer pins are placed from their real coordinates,
 * normalised into the SVG viewport; the destination APMC anchors the right edge.
 */
function renderRouteMap(result: SajhaBazaarResult): string {
  const pts = result.participants.map(p => ({ lat: p.latitude, lon: p.longitude, p }));
  if (pts.length === 0) return '';

  const lats = pts.map(x => x.lat);
  const lons = pts.map(x => x.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const spanLat = Math.max(maxLat - minLat, 0.01);
  const spanLon = Math.max(maxLon - minLon, 0.01);

  const W = 640;
  const H = 260;
  const padX = 40;
  const padY = 40;
  const fieldW = 330;

  const project = (lat: number, lon: number) => ({
    x: padX + ((lon - minLon) / spanLon) * fieldW,
    // Latitude increases northwards, SVG y increases downwards.
    y: padY + ((maxLat - lat) / spanLat) * (H - 2 * padY)
  });

  const destX = W - 70;
  const destY = H / 2;

  const pins = pts.map(({ lat, lon, p }) => {
    const { x, y } = project(lat, lon);
    return `
      <line x1="${x}" y1="${y}" x2="${destX}" y2="${destY}" stroke="var(--color-brand-primary)" stroke-width="1" stroke-dasharray="2 5" opacity="0.45" />
      <circle cx="${x}" cy="${y}" r="${p.isRequester ? 9 : 6}" fill="${p.isRequester ? 'var(--color-brand-accent)' : 'var(--color-brand-primary)'}" stroke="#ffffff" stroke-width="2" />
      <text x="${x}" y="${y - 13}" text-anchor="middle" font-size="9.5" font-weight="700" fill="var(--color-text-main)">${p.village}</text>
      <text x="${x}" y="${y + 20}" text-anchor="middle" font-size="9" fill="var(--color-text-muted)">${p.quantityQuintals}q</text>
    `;
  }).join('');

  const corridorPath = pts
    .map(({ lat, lon }) => project(lat, lon))
    .sort((a, b) => a.x - b.x)
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ') + ` L ${destX} ${destY}`;

  return `
    <div style="overflow-x: auto;">
      <svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width: ${W}px; min-width: 420px;" role="img" aria-label="Pickup corridor route map">
        <rect x="0" y="0" width="${W}" height="${H}" rx="10" fill="var(--color-bg-muted)" />
        <path d="${corridorPath}" fill="none" stroke="var(--color-brand-primary)" stroke-width="3" stroke-linejoin="round" opacity="0.85" />
        ${pins}
        <rect x="${destX - 46}" y="${destY - 24}" width="96" height="48" rx="8" fill="var(--color-brand-primary)" />
        <text x="${destX + 2}" y="${destY - 6}" text-anchor="middle" font-size="10.5" font-weight="800" fill="#ffffff">${result.destinationMandi?.name || 'APMC'}</text>
        <text x="${destX + 2}" y="${destY + 9}" text-anchor="middle" font-size="9" fill="#ffffff" opacity="0.9">APMC · ${(result.destinationMandi?.directDistanceKm ?? 0).toFixed(0)} km</text>
        <text x="${destX + 2}" y="${destY + 22}" text-anchor="middle" font-size="8.5" fill="#ffffff" opacity="0.8">${result.pooled?.totalQuintals ?? 0}q arriving</text>
        <text x="12" y="16" font-size="9.5" fill="var(--color-text-muted)">Pickup corridor: ${(result.destinationMandi?.pickupCorridorDistanceKm ?? 0).toFixed(1)} km driven (direct leg ${(result.destinationMandi?.directDistanceKm ?? 0).toFixed(1)} km + collection detours)</text>
      </svg>
    </div>
  `;
}

function renderPoolResult(result: SajhaBazaarResult, language: Language): HTMLElement {
  const el = document.createElement('div');
  const local = result.localMandi;
  const solo = result.soloAtDestination;
  const pooled = result.pooled;
  const trip = pooled?.tripCost;
  const soloTrip = solo?.tripCost;
  const qty = result.requestedQuantityQuintals;

  el.innerHTML = `
    <!-- Headline -->
    <div class="editorial-panel" style="border: 2px solid var(--color-brand-primary); background: #ffffff; padding: var(--space-6); margin-bottom: var(--space-5);">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-3);">
        <span class="badge badge-sage" style="font-weight: 800;">🤝 ${result.statusLabel}</span>
        <span style="font-size: var(--font-size-xs); color: var(--color-text-muted);">
          ${result.pooled?.participantCount} farmers · ${result.pooled?.totalQuintals}q · within ${result.matchRadiusKm} km · sell window ±${result.sellWindowToleranceDays} day
        </span>
      </div>
      <h3 class="heading-xl" style="margin-bottom: var(--space-4);">${result.headline[language]}</h3>

      <!-- Before vs After -->
      <div class="editorial-grid-3" style="margin-bottom: var(--space-5);">
        <div class="editorial-panel" style="background: var(--color-bg-muted); border: 1px solid var(--color-border);">
          <div class="kicker" style="margin-bottom: 4px;">OPTION A · SELL LOCALLY</div>
          <div class="number-display number-xl number-main">${rs1(local?.nrvPerQtl ?? 0)}/q</div>
          <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 4px;">
            ${local?.name} · ${(local?.distanceKm ?? 0).toFixed(1)} km<br>
            Net wallet for ${qty}q: <strong>${rs(local?.netPayout ?? 0)}</strong>
          </div>
        </div>

        <div class="editorial-panel" style="background: var(--color-status-abstain-bg); border: 1px solid var(--color-status-abstain);">
          <div class="kicker" style="margin-bottom: 4px; color: var(--color-status-abstain);">OPTION B · DISTANT MANDI ALONE</div>
          <div class="number-display number-xl" style="color: var(--color-status-abstain);">${rs1(solo?.nrvPerQtl ?? 0)}/q</div>
          <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 4px;">
            ${result.destinationMandi?.name} alone · freight ${rs2(solo?.transportPerQtl ?? 0)}/q<br>
            Net wallet for ${qty}q: <strong>${rs(solo?.netPayout ?? 0)}</strong>
            ${solo && !solo.isEconomical ? '<br><strong style="color: var(--color-status-abstain);">Uneconomical — sub-scale freight</strong>' : ''}
          </div>
        </div>

        <div class="editorial-panel" style="background: var(--color-brand-primary-light); border: 2px solid var(--color-brand-primary);">
          <div class="kicker" style="margin-bottom: 4px;">OPTION C · WITH SAJHABAZAAR POOLING</div>
          <div class="number-display number-xl number-positive">${rs1(pooled?.requesterNrvPerQtl ?? 0)}/q</div>
          <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 4px;">
            Shared ${trip?.vehicle.name} · freight ${rs2(pooled?.transportPerQtl ?? 0)}/q<br>
            Net wallet for ${qty}q: <strong>${rs(pooled?.requesterNetPayout ?? 0)}</strong>
          </div>
          <div class="number-display number-positive" style="font-weight: 900; margin-top: 8px;">
            ➔ Net Pocket Gain: +${rs(result.requesterGainTotal)}
          </div>
        </div>
      </div>

      ${renderComparisonChart(result)}
    </div>

    <!-- Why this works -->
    <div class="editorial-panel" style="margin-bottom: var(--space-5); padding: var(--space-5);">
      <div class="kicker">WHY POOLING CREATES REAL MONEY</div>
      <ul style="font-size: var(--font-size-sm); line-height: 1.7; padding-left: 1.1rem;">
        ${result.reasons.map(r => `<li>${r}</li>`).join('')}
      </ul>

      <div class="table-responsive-wrapper" style="margin-top: var(--space-4);">
        <table class="editorial-table">
          <thead>
            <tr><th>Vehicle Dispatch Cost Component</th><th>Alone (${qty}q)</th><th>Pooled (${pooled?.totalQuintals}q)</th></tr>
          </thead>
          <tbody>
            <tr><td>Vehicle</td><td>${soloTrip?.vehicle.name || '—'} (${soloTrip?.vehicle.capacityQuintals || 0}q cap)</td><td>${trip?.vehicle.name || '—'} (${trip?.vehicle.capacityQuintals || 0}q cap)</td></tr>
            <tr><td>Road distance driven</td><td>${(soloTrip?.distanceKm ?? 0).toFixed(1)} km</td><td>${(trip?.distanceKm ?? 0).toFixed(1)} km (incl. pickup detours)</td></tr>
            <tr><td>Diesel rate used</td><td colspan="2">${rs2(trip?.dieselPricePerLitre ?? 0)}/litre (${result.participants[0]?.district || ''} district retail price)</td></tr>
            <tr><td>Running rate per km (round trip)</td><td>${rs2(soloTrip?.ratePerKmRs ?? 0)}/km</td><td>${rs2(trip?.ratePerKmRs ?? 0)}/km</td></tr>
            <tr><td>Fixed vehicle base</td><td>${rs2(soloTrip?.fixedComponentRs ?? 0)}</td><td>${rs2(trip?.fixedComponentRs ?? 0)}</td></tr>
            <tr><td>Distance component</td><td>${rs2(soloTrip?.distanceComponentRs ?? 0)}</td><td>${rs2(trip?.distanceComponentRs ?? 0)}</td></tr>
            <tr><td>Payload component</td><td>${rs2(soloTrip?.payloadComponentRs ?? 0)}</td><td>${rs2(trip?.payloadComponentRs ?? 0)}</td></tr>
            <tr><td>Minimum trip charge floor</td><td>${rs2(soloTrip?.minTripChargeRs ?? 0)} ${soloTrip?.minTripChargeApplied ? '<strong>(APPLIED — this is the scale trap)</strong>' : '(not binding)'}</td><td>${rs2(trip?.minTripChargeRs ?? 0)} ${trip?.minTripChargeApplied ? '(applied)' : '(not binding)'}</td></tr>
            <tr style="background-color: var(--color-brand-primary-light); font-weight: 800;">
              <td>Total trip cost</td>
              <td>${rs2(soloTrip?.totalTripCostRs ?? 0)} → <strong>${rs2(soloTrip?.costPerQuintalRs ?? 0)}/qtl</strong></td>
              <td>${rs2(trip?.totalTripCostRs ?? 0)} → <strong>${rs2(trip?.costPerQuintalRs ?? 0)}/qtl</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Route map -->
    <div class="editorial-panel" style="margin-bottom: var(--space-5); padding: var(--space-5);">
      <div class="kicker">ROUTE &amp; PICKUP WAYPOINTS</div>
      <h4 class="heading-sm" style="margin-bottom: var(--space-3);">Participating farms → pickup corridor → destination APMC</h4>
      ${renderRouteMap(result)}
    </div>

    <!-- Cost split table -->
    <div class="editorial-panel" style="padding: var(--space-5);">
      <div class="kicker">INTERACTIVE COST SPLIT</div>
      <h4 class="heading-sm" style="margin-bottom: var(--space-3);">Who pays what, and what each farmer gains</h4>
      <div class="table-responsive-wrapper">
        ${renderCostSplitTable(result)}
      </div>
      <p style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: var(--space-3);">
        Allocation rule: <code>FarmerShare_i = TotalPooledTripCost × q_i / Q_pool</code>, settled to the paise with
        largest-remainder rounding so the shares sum <em>exactly</em> to the invoice. Every participant must clear
        ${rs(result.materialityThresholdPerQtl)}/qtl of net gain over their own best individual option, or the pool is not offered at all.
      </p>
      ${renderSyntheticNotice(result)}
    </div>
  `;

  return el;
}

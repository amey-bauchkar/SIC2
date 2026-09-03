/**
 * MandiMitra Feature: SajhaBazaar ("साझा बाज़ार") Ultra-Clean Farmer Cockpit
 *
 * Re-architected for maximum farmer comprehension:
 * - 3-Card Mental Model:
 *   1. 🚚 Shared Vehicle Status & Visual Capacity Meter (गावचा शेअर टेम्पो)
 *   2. 💰 In-Pocket Cash Savings Card (खिशात जास्तीची रोख बचत)
 *   3. 👥 Co-Farmers List (सोबत असणारे शेतकरी)
 * - Zero raw GPS coordinates or academic jargon.
 * - Seamless automatic sync with AsliDaam and user store.
 */

import { store } from '../../state/store';
import { apiClient, SajhaRosterResponse } from '../../api-client';
import { renderCropOptgroupsHtml } from '../../../config/crops';
import type { SajhaBazaarResult, SajhaParticipant } from '../../../core/sajha-bazaar';

type Language = 'en' | 'mr' | 'hi';

const rs = (n: number): string => `₹${Math.round(n).toLocaleString('en-IN')}`;
const rs1 = (n: number): string => `₹${n.toFixed(1)}`;

let rosterCache: SajhaRosterResponse | null = null;
let originOverride: { lat: number; lon: number; label: string; district: string } | null = null;
let quantityOverride: number | null = null;

const i18n = {
  en: {
    title: 'SajhaBazaar: Shared Transport, Better Returns',
    subtitle: 'Share a pickup with nearby farmers and reach high-paying terminal markets together.',
    cropLabel: 'Crop to Pool',
    qtyLabel: 'Your Load (Quintals)',
    locLabel: 'Your Village / Taluka',
    findPool: '🤝 Find Matching Pool',
    vehicleTitle: 'Shared Vehicle Status',
    route: 'Route',
    filled: 'loaded',
    spaceLeft: 'quintals space left!',
    capacity: 'Capacity',
    savingsTitle: 'Your In-Pocket Cash Savings',
    savingsSub: 'Extra cash in your wallet after transport',
    soloFare: 'Solo Trip Fare',
    pooledFare: 'Your Pooled Share',
    fareSaved: 'Freight Saved',
    farmersTitle: 'Co-Traveling Farmers',
    youBadge: 'YOU',
    noPoolTitle: 'No Matching Pool Right Now',
    noPoolDesc: 'No nearby farmers found with compatible crop volume for this destination today. You can dispatch solo or check back soon.',
    demoNote: '* Demo MVP synthetic roster used for evaluation.'
  },
  mr: {
    title: 'साझा बाज़ार: एकत्र वाहतूक, जास्तीचा नफा',
    subtitle: 'जवळच्या शेतकऱ्यांसोबत टेम्पो शेअर करा आणि मोठ्या बाजारात जास्त दराने माल विका.',
    cropLabel: 'शेतमाल',
    qtyLabel: 'तुमचा माल (क्विंटल)',
    locLabel: 'तुमचा परिसर / तालुका',
    findPool: '🤝 शेअर टेम्पो शोधा',
    vehicleTitle: 'गावचा शेअर टेम्पो',
    route: 'मार्ग',
    filled: 'भरला',
    spaceLeft: 'क्विंटल जागा शिल्लक आहे!',
    capacity: 'एकूण क्षमता',
    savingsTitle: 'तुमची निव्वळ रोख बचत',
    savingsSub: 'वाहतूक खर्च वजा जाता खिशात जास्तीचे पैसे',
    soloFare: 'एकट्याने गेलात तर भाडे',
    pooledFare: 'शेअर टेम्पोतील तुमचे भाडे',
    fareSaved: 'भाड्यातील थेट बचत',
    farmersTitle: 'सोबत असणारे शेतकरी',
    youBadge: 'तुम्ही',
    noPoolTitle: 'सध्या कोणताही शेअर टेम्पो उपलब्ध नाही',
    noPoolDesc: 'तुमच्या परिसरात आज या बाजारासाठी इतर शेतकरी उपलब्ध नाहीत. तुम्ही एकट्याने जाऊ शकता किंवा थोड्या वेळाने पुन्हा तपासा.',
    demoNote: '* प्रात्यक्षिकासाठी (Demo MVP) शेतकरी समूह मॉडेल वापरले आहे.'
  },
  hi: {
    title: 'साझा बाज़ार: साझा ढुलाई, अधिक मुनाफा',
    subtitle: 'आसपास के किसानों के साथ पिकअप शेयर करें और बड़ी मंडियों में बेहतर दाम पाएं।',
    cropLabel: 'फसल',
    qtyLabel: 'आपकी उपज (क्विंटल)',
    locLabel: 'आपका इलाका / तहसील',
    findPool: '🤝 साझा टेम्पो खोजें',
    vehicleTitle: 'साझा किसान वाहन',
    route: 'रूट',
    filled: 'भरा',
    spaceLeft: 'क्विंटल जगह बाकी है!',
    capacity: 'कुल क्षमता',
    savingsTitle: 'आपकी शुद्ध जेब बचत',
    savingsSub: 'भाड़ा काटकर जेब में अतिरिक्त शुद्ध नकद',
    soloFare: 'अकेले जाने पर भाड़ा',
    pooledFare: 'साझा टेम्पो में आपका हिस्सा',
    fareSaved: 'सीधी भाड़ा बचत',
    farmersTitle: 'साथ चलने वाले किसान',
    youBadge: 'आप',
    noPoolTitle: 'फिलहाल कोई साझा टेम्पो उपलब्ध नहीं है',
    noPoolDesc: 'आपके इलाके में आज इस मंडी के लिए कोई अन्य किसान नहीं मिला। आप अकेले जा सकते हैं या थोड़ी देर बाद देखें।',
    demoNote: '* डेमो MVP के लिए किसान समूह मॉडल उपयोग किया गया है।'
  }
};

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
// Trigger banner for Decision Hub integration
// ============================================================================

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
        border-radius: var(--radius-md);
      `;
      banner.innerHTML = `
        <div style="display: flex; align-items: center; gap: var(--space-3); flex: 1; min-width: 260px;">
          <span style="font-size: 2rem;">🤝</span>
          <div>
            <div style="font-family: var(--font-family-heading); font-weight: 800; font-size: var(--font-size-sm); color: var(--color-text-main);">
              ${language === 'mr'
                ? `साझा बाज़ार संधी: जवळचे ${others} शेतकरी तयार आहेत. एकत्र टेम्पोने ${dest} येथे जा (+${rs(result.requesterGainTotal)} खिशात बचत)!`
                : language === 'hi'
                ? `साझा बाज़ार अवसर: पास के ${others} किसान तैयार हैं। साझा वाहन से ${dest} में बेचें (+${rs(result.requesterGainTotal)} जेब में बचत)!`
                : `SajhaBazaar Opportunity: ${others} nearby farmers ready. Pool to ${dest} (+${rs(result.requesterGainTotal)} extra pocket cash)!`}
            </div>
            <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 3px;">
              ${result.pooled.totalQuintals}q combined load · ${dest} · ${rs(result.requesterGainPerQtl)}/q net advantage
            </div>
          </div>
        </div>
        <button id="btn-view-pool" class="btn btn-primary btn-sm" style="font-weight: 800; white-space: nowrap;">
          ${language === 'mr' ? 'टेम्पो पहा' : (language === 'hi' ? 'टेम्पो देखें' : 'View Pool')} →
        </button>
      `;
      mount.appendChild(banner);
      banner.querySelector('#btn-view-pool')?.addEventListener('click', onView);
    })
    .catch(() => {
      // Silent fail on opportunistic banner
    });
}

// ============================================================================
// Full Cockpit Tab (Simplified 3-Card Design)
// ============================================================================

export function renderSajhaBazaarTab(language: Language): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'sajha-bazaar-panel';

  const state = store.getState();
  const qty = quantityOverride ?? (state.harvestQuantityQuintals || 25);
  const labels = i18n[language] || i18n.en;

  panel.innerHTML = `
    <!-- Simple Editorial Header -->
    <section class="editorial-section" style="padding-top: 0; margin-bottom: var(--space-4);">
      <div class="editorial-header" style="margin-bottom: var(--space-3);">
        <div class="kicker" style="color: var(--color-brand-primary);">🤝 ${language === 'mr' ? 'गावाचा शेअर टेम्पो' : (language === 'hi' ? 'साझा किसान वाहन' : 'SHARED FREIGHT & ACCESS')}</div>
        <h2 class="heading-lg" style="margin-top: 4px; margin-bottom: 6px;">${labels.title}</h2>
        <p style="max-width: 680px; font-size: var(--font-size-sm); color: var(--color-text-muted);">
          ${labels.subtitle}
        </p>
      </div>

      <!-- Farmer Controls Strip (No coordinates, clean and clear) -->
      <div class="sajha-card" style="padding: var(--space-4); margin-bottom: var(--space-4);">
        <div class="farmer-input-strip" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--space-3); align-items: end;">
          <div>
            <label class="input-label" style="font-weight: 700; margin-bottom: 4px; display: block; font-size: var(--font-size-xs);">${labels.cropLabel}</label>
            <select id="sajha-crop" class="select-field" style="width: 100%; padding: 8px 10px; border-radius: var(--radius-md); border: 1.5px solid var(--color-border); font-size: var(--font-size-sm); font-weight: 600;">
              ${renderCropOptgroupsHtml(state.selectedCrop || 'Onion')}
            </select>
          </div>
          <div>
            <label class="input-label" style="font-weight: 700; margin-bottom: 4px; display: block; font-size: var(--font-size-xs);">${labels.qtyLabel}</label>
            <input type="number" id="sajha-qty" class="input-field" value="${qty}" min="0.5" step="0.5" style="width: 100%; padding: 8px 10px; border-radius: var(--radius-md); border: 1.5px solid var(--color-border); font-size: var(--font-size-sm); font-weight: 800;" />
          </div>
          <div>
            <label class="input-label" style="font-weight: 700; margin-bottom: 4px; display: block; font-size: var(--font-size-xs);">${labels.locLabel}</label>
            <div id="sajha-cluster-chips" style="display: flex; gap: 6px; flex-wrap: wrap;">
              <span style="font-size: var(--font-size-xs); color: var(--color-text-muted);">...</span>
            </div>
          </div>
          <div>
            <button id="sajha-run" class="btn btn-primary" style="width: 100%; font-weight: 800; height: 42px; font-size: var(--font-size-sm);">
              ${labels.findPool}
            </button>
          </div>
        </div>
        <div id="sajha-origin-note" style="margin-top: var(--space-2); font-size: var(--font-size-xs); color: var(--color-brand-primary); font-weight: 600;">
          📍 ${originOverride ? `${originOverride.label}` : `${state.userLocation?.district || 'Nashik'} परिसर`}
        </div>
      </div>
    </section>

    <!-- Mount for 3-Card Result -->
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
      ? `📍 ${originOverride.label}`
      : `📍 ${store.getState().userLocation?.district || 'Nashik'} परिसर`;
    loadAndRender(resultMount, language);
  };

  cropSelect.addEventListener('change', refresh);
  panel.querySelector('#sajha-run')?.addEventListener('click', refresh);

  // Cluster chips with clear labels across all major crops
  const buildChips = (roster: SajhaRosterResponse) => {
    chipsMount.innerHTML = '';

    for (const c of (roster.clusters || [])) {
      const isSelected = originOverride?.label === `${c.taluka}, ${c.district}`;

      const chip = document.createElement('button');
      chip.className = 'qty-pill' + (isSelected ? ' active' : '');
      
      let cropLabel = c.crop;
      if (c.crop === 'Onion') cropLabel = language === 'mr' ? 'कांदा' : (language === 'hi' ? 'प्याज' : 'Onion');
      else if (c.crop === 'Tomato') cropLabel = language === 'mr' ? 'टोमॅटो' : (language === 'hi' ? 'टमाटर' : 'Tomato');
      else if (c.crop === 'Soyabean') cropLabel = language === 'mr' ? 'सोयाबीन' : (language === 'hi' ? 'सोयाबीन' : 'Soyabean');
      else if (c.crop === 'Wheat') cropLabel = language === 'mr' ? 'गहू' : (language === 'hi' ? 'गेहूं' : 'Wheat');
      else if (c.crop.includes('Gram')) cropLabel = language === 'mr' ? 'हरभरा' : (language === 'hi' ? 'चना' : 'Gram');
      else if (c.crop === 'Pomegranate') cropLabel = language === 'mr' ? 'डाळिंब' : (language === 'hi' ? 'अनार' : 'Pomegranate');
        
      chip.textContent = `📍 ${c.taluka} (${cropLabel})`;
      chip.title = `${c.taluka}, ${c.district} · ${c.crop} Pool (${c.farmerCount} farmers)`;
      
      chip.addEventListener('click', () => {
        originOverride = {
          lat: c.centroidLatitude,
          lon: c.centroidLongitude,
          label: `${c.taluka}, ${c.district}`,
          district: c.district
        };
        cropSelect.value = c.crop;
        store.setSelectedCrop(c.crop);
        
        // Auto-set a smallholder demo quantity (5q) so the pool matches effortlessly
        qtyInput.value = '5';
        quantityOverride = 5;
        store.setHarvestQuantity(5);
        
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
      .catch(() => { chipsMount.innerHTML = '<span style="font-size: var(--font-size-xs); color: var(--color-status-abstain);">Roster offline</span>'; });
  }

  loadAndRender(resultMount, language);
  return panel;
}

function loadAndRender(mount: HTMLElement, language: Language): void {
  mount.innerHTML = `
    <div class="sajha-card" style="padding: var(--space-6); text-align: center;">
      <div style="font-size: 2.2rem; margin-bottom: var(--space-2);">🚚</div>
      <div class="heading-sm" style="font-weight: 800;">
        ${language === 'mr' ? 'जवळचे शेतकरी टेम्पो शोधत आहोत...' : (language === 'hi' ? 'पास के किसान टेम्पो खोज रहे हैं...' : 'Finding matching farmer pools...')}
      </div>
    </div>
  `;

  apiClient.evaluateSajhaBazaar(currentRequest())
    .then(result => {
      mount.innerHTML = '';
      mount.appendChild(result.status === 'POOL_AVAILABLE' ? render3CardPoolResult(result, language) : renderSimpleNoPool(result, language));
    })
    .catch(err => {
      mount.innerHTML = `
        <div class="sajha-card" style="border: 1.5px solid var(--color-status-abstain); background: var(--color-status-abstain-bg); padding: var(--space-4);">
          <div class="heading-sm" style="font-size: var(--font-size-sm); color: var(--color-status-abstain); font-weight: 700;">Service temporarily offline</div>
          <div style="font-size: var(--font-size-xs); color: var(--color-text-muted);">${err instanceof Error ? err.message : String(err)}</div>
        </div>
      `;
    });
}

// ============================================================================
// 3-Card Ultra-Clean Result Rendering
// ============================================================================

function render3CardPoolResult(result: SajhaBazaarResult, language: Language): HTMLElement {
  const el = document.createElement('div');
  el.className = 'sajha-card-grid';

  const labels = i18n[language] || i18n.en;
  const pooled = result.pooled;
  const trip = pooled?.tripCost;
  const soloTrip = result.soloAtDestination?.tripCost;
  const dest = result.destinationMandi;
  const originLabel = originOverride?.label || `${store.getState().userLocation?.district || 'Nashik'}`;

  const vehicleName = language === 'mr' ? (trip?.vehicle.nameMr || trip?.vehicle.name || 'Bolero Maxi Truck')
    : language === 'hi' ? (trip?.vehicle.nameHi || trip?.vehicle.name || 'Bolero Maxi Truck')
    : (trip?.vehicle.name || 'Bolero Maxi Truck');

  const capacity = trip?.vehicle.capacityQuintals || 50;
  const loaded = pooled?.totalQuintals || 0;
  const fillPct = Math.min(100, Math.round((loaded / capacity) * 100));
  const spaceRemaining = Math.max(0, capacity - loaded);

  // Solo vs Pooled cost calculation for the user
  const userSoloTripCost = soloTrip?.totalTripCostRs ?? 1500;
  const userPooledShare = result.participants.find(p => p.isRequester)?.pooledTransportShareTotal ?? 450;
  const userFreightSaved = Math.max(0, userSoloTripCost - userPooledShare);

  el.innerHTML = `
    <!-- CARD 1: 🚚 SHARED VEHICLE & CAPACITY BAR -->
    <div class="sajha-card">
      <div class="sajha-card-header">
        <div class="sajha-card-title">
          <span>🚚</span>
          <span>${labels.vehicleTitle}: ${vehicleName}</span>
        </div>
        <span class="badge badge-sage" style="font-weight: 800; font-size: 0.75rem;">
          ${pooled?.participantCount} ${language === 'mr' ? 'शेतकरी एकत्र' : (language === 'hi' ? 'किसान साथ' : 'Farmers Pooled')}
        </span>
      </div>

      <div style="font-size: var(--font-size-sm); color: var(--color-text-main); font-weight: 700; margin-bottom: var(--space-2);">
        ${labels.route}: 📍 ${originLabel} ➔ ${dest?.name || 'Terminal Mandi'} (${dest?.directDistanceKm.toFixed(0) || 0} km)
      </div>

      <!-- Capacity Progress Meter -->
      <div class="sajha-capacity-wrapper">
        <div class="sajha-capacity-track">
          <div class="sajha-capacity-fill" style="width: ${fillPct}%;"></div>
        </div>
        <div class="sajha-capacity-stats">
          <span style="color: var(--color-brand-primary); font-weight: 800;">
            ${loaded} / ${capacity} qtl ${labels.filled} (${fillPct}%)
          </span>
          ${spaceRemaining > 0 ? `
            <span class="sajha-space-alert">
              ⚡ ${spaceRemaining} ${labels.spaceLeft}
            </span>
          ` : `
            <span style="color: var(--color-status-success); font-weight: 800;">✓ Full</span>
          `}
        </div>
      </div>
    </div>

    <!-- CARD 2: 💰 IN-POCKET CASH SAVINGS (PLAIN RUPEES) -->
    <div class="sajha-card" style="border: 2px solid #15803d;">
      <div class="sajha-card-header">
        <div class="sajha-card-title" style="color: #15803d;">
          <span>💰</span>
          <span>${labels.savingsTitle}</span>
        </div>
      </div>

      <div class="sajha-savings-hero">
        <div>
          <div style="font-size: var(--font-size-xs); opacity: 0.9; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">
            ${labels.savingsSub}
          </div>
          <div class="sajha-savings-val">
            +${rs(result.requesterGainTotal)}
          </div>
          <div style="font-size: var(--font-size-xs); color: #86efac; font-weight: 700; margin-top: 2px;">
            (+${rs1(result.requesterGainPerQtl)}/qtl net advantage)
          </div>
        </div>
        <div style="background: rgba(255,255,255,0.15); padding: 8px 14px; border-radius: var(--radius-md); font-size: var(--font-size-xs); font-weight: 700;">
          ✓ Verified by MandiMitra
        </div>
      </div>

      <!-- Clear comparison breakdown -->
      <div class="sajha-comparison-row">
        <div class="sajha-comparison-box">
          <div style="font-size: 0.72rem; color: var(--color-text-muted); font-weight: 700;">${labels.soloFare}</div>
          <div style="font-size: var(--font-size-base); font-weight: 900; color: var(--color-status-abstain); margin-top: 2px;">
            ${rs(userSoloTripCost)}
          </div>
        </div>
        <div class="sajha-comparison-box" style="border-color: #22c55e; background: var(--color-brand-primary-light);">
          <div style="font-size: 0.72rem; color: var(--color-brand-primary); font-weight: 700;">${labels.pooledFare}</div>
          <div style="font-size: var(--font-size-base); font-weight: 900; color: var(--color-brand-primary); margin-top: 2px;">
            ${rs(userPooledShare)}
          </div>
        </div>
        <div class="sajha-comparison-box" style="border-color: #16a34a; background: #dcfce7;">
          <div style="font-size: 0.72rem; color: #166534; font-weight: 700;">${labels.fareSaved}</div>
          <div style="font-size: var(--font-size-base); font-weight: 900; color: #15803d; margin-top: 2px;">
            +${rs(userFreightSaved)}
          </div>
        </div>
      </div>
    </div>

    <!-- CARD 3: 👥 CO-FARMERS LIST -->
    <div class="sajha-card">
      <div class="sajha-card-header">
        <div class="sajha-card-title">
          <span>👥</span>
          <span>${labels.farmersTitle} (${result.participants.length})</span>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: var(--space-2);">
        ${result.participants.map((p: SajhaParticipant) => `
          <div class="sajha-farmer-row ${p.isRequester ? 'is-user' : ''}">
            <div style="display: flex; align-items: center; gap: var(--space-3);">
              <div class="sajha-farmer-avatar">
                ${p.isRequester ? '⭐' : '🌾'}
              </div>
              <div>
                <div style="font-size: var(--font-size-sm); font-weight: 800; color: var(--color-text-main);">
                  ${p.displayName} ${p.isRequester ? `<span class="badge badge-accent" style="font-size: 0.6rem; padding: 1px 6px;">${labels.youBadge}</span>` : ''}
                </div>
                <div style="font-size: var(--font-size-xs); color: var(--color-text-muted);">
                  📍 ${p.village}${p.isRequester ? '' : ` (${p.distanceFromRequesterKm.toFixed(1)} km)`}
                </div>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-family: var(--font-family-numbers); font-size: var(--font-size-base); font-weight: 900; color: var(--color-brand-primary);">
                ${p.quantityQuintals} qtl
              </div>
              <div style="font-size: 0.68rem; color: var(--color-status-success); font-weight: 700;">
                +${rs(p.netGainTotal)} gain
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Small footer note for demo transparency -->
    <div style="text-align: center; margin-top: var(--space-3); font-size: 0.7rem; color: var(--color-text-muted); font-style: italic;">
      ${labels.demoNote}
    </div>
  `;

  return el;
}

function renderSimpleNoPool(result: SajhaBazaarResult, language: Language): HTMLElement {
  const el = document.createElement('div');
  el.className = 'sajha-card';
  el.style.textAlign = 'center';
  el.style.padding = 'var(--space-6)';

  const labels = i18n[language] || i18n.en;
  const qty = result.requestedQuantityQuintals;
  const isLargeLoad = qty >= 20;

  el.innerHTML = `
    <div style="font-size: 2.2rem; margin-bottom: var(--space-2);">🤝</div>
    <h3 class="heading-md" style="margin-bottom: var(--space-2);">${labels.noPoolTitle}</h3>
    <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); max-width: 520px; margin: 0 auto var(--space-3);">
      ${isLargeLoad
        ? (language === 'mr'
          ? `तुमचे वजन ${qty} क्विंटल (मोठा भार) आहे. तुमच्याकडे आधीच पूर्ण वाहनाइतका माल असल्याने एकट्याने जाणे परवडणारे आहे. साझा बाजार ३ ते १० क्विंटलच्या अल्पभूधारक शेतकऱ्यांसाठी बनवला आहे.`
          : language === 'hi'
          ? `आपकी उपज ${qty} क्विंटल (बड़ा भार) है। आपके पास पहले से पूरी गाड़ी जितना माल है, इसलिए अकेले जाना ही सही है। साझा बाजार ३ से १० क्विंटल के छोटे किसानों के लिए है।`
          : `Your load of ${qty} quintals is already large enough for a dedicated solo vehicle. SajhaBazaar is designed to pool smallholders with 2 to 10 quintals.`)
        : labels.noPoolDesc}
    </p>

    ${result.reasons && result.reasons.length > 0 ? `
      <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); background: var(--color-bg-canvas); padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); max-width: 560px; margin: 0 auto var(--space-4); border: 1px solid var(--color-border); text-align: left;">
        <strong style="color: var(--color-brand-primary);">ℹ️ ${language === 'mr' ? 'तांत्रिक कारण' : 'Engine Reason'}:</strong>
        <ul style="margin: 4px 0 0 16px; padding: 0;">
          ${result.reasons.map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>
    ` : ''}

    <div style="display: flex; justify-content: center; gap: var(--space-2); flex-wrap: wrap;">
      <button id="btn-try-smallholder" class="btn btn-outline btn-sm" style="font-weight: 700;">
        ⚡ ${language === 'mr' ? 'लहान भार (५ क्विंटल) वापरून पहा' : (language === 'hi' ? 'छोटा भार (५ क्विंटल) आजमाएं' : 'Try Smallholder Load (5q)')}
      </button>
    </div>
  `;

  el.querySelector('#btn-try-smallholder')?.addEventListener('click', () => {
    const qtyInput = document.querySelector('#sajha-qty') as HTMLInputElement;
    if (qtyInput) {
      qtyInput.value = '5';
      qtyInput.dispatchEvent(new Event('change'));
    }
    const runBtn = document.querySelector('#sajha-run') as HTMLButtonElement;
    if (runBtn) runBtn.click();
  });

  return el;
}


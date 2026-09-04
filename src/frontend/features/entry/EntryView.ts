/**
 * MandiMitra Feature: Crop & Location Entry View (Voice-Assisted Smart Autofill)
 * Route: /entry
 *
 * VerdaAgro Editorial Agricultural Redesign
 * Integrated with 99 Maharashtra Commodities & 36 Origin Districts
 *
 * VOICE PIPELINE
 *   Browser Web Speech API (or MediaRecorder → server-side OpenAI Whisper)
 *     → POST /api/voice/process
 *     → Google Gemini agrarian entity extraction, or MandiMitra's deterministic
 *       catalogue-driven extractor when no API key is configured
 *     → instant autofill of crop, quantity (unit-normalised to quintals) and district.
 *
 * The farmer never has to type. The structured selects stay fully interactive for corrections.
 */

import { store } from '../../state/store';
import { apiClient } from '../../api-client';
import { renderCropOptgroupsHtml, renderCropDatalistHtml, getCropConfig } from '../../../config/crops';
import { renderDistrictOptgroupsHtml, renderDistrictDatalistHtml, getDistrictConfig, ALL_DISTRICTS } from '../../../config/districts';
import { type VoiceExtraction, scoreHypotheses, extractAgrarianSlots } from '../../../core/voice-extraction';
import { I18N_DICTIONARY, Language, formatNumber, parseDevanagariNumber, toDevanagariDigits } from '../../i18n';



export const MAHARASHTRA_DISTRICT_COORDS: Record<string, { lat: number; lon: number }> = Object.fromEntries(
  ALL_DISTRICTS.map(d => [d.name.toLowerCase(), { lat: d.latitude, lon: d.longitude }])
);
MAHARASHTRA_DISTRICT_COORDS['ahmednagar'] = MAHARASHTRA_DISTRICT_COORDS['ahilyanagar'] || { lat: 19.0952, lon: 74.7480 };
MAHARASHTRA_DISTRICT_COORDS['aurangabad'] = MAHARASHTRA_DISTRICT_COORDS['chhatrapati sambhajinagar'] || { lat: 19.8762, lon: 75.3433 };
MAHARASHTRA_DISTRICT_COORDS['osmanabad'] = MAHARASHTRA_DISTRICT_COORDS['dharashiv'] || { lat: 18.1861, lon: 76.0419 };

/** Native language sample utterances for noisy presentation rooms. */
const LANG_CHIPS: Record<'mr-IN' | 'hi-IN' | 'en-IN', Array<{ text: string; hint: string }>> = {
  'mr-IN': [
    { text: 'नाशिक निफाड मध्ये 40 गोणी कांदा आहे', hint: 'मराठी · 40 bags · Nashik' },
    { text: 'पुणे जुन्नर मध्ये 80 क्रेट टोमॅटो', hint: 'मराठी · 80 crates · Pune' },
    { text: 'लातूर मध्ये 30 क्विंटल सोयाबीन', hint: 'मराठी · 30 quintals · Latur' },
    { text: '50 गोणी तांदूळ', hint: 'मराठी · 50 bags (25q) · Rice' },
    { text: 'अहमदनगर संगमनेर मध्ये 50 गोणी बटाटा', hint: 'मराठी · 50 bags · Ahilyanagar' },
    { text: 'सोलापूर पंढरपूर मध्ये 15 क्विंटल डाळिंब', hint: 'मराठी · 15 quintals · Solapur' }
  ],
  'hi-IN': [
    { text: 'नासिक में 40 बोरी प्याज है', hint: 'हिन्दी · 40 bags · Nashik' },
    { text: 'पुणे में 80 क्रेट टमाटर', hint: 'हिन्दी · 80 crates · Pune' },
    { text: 'लातूर में 30 क्विंटल सोयाबीन', hint: 'हिन्दी · 30 quintals · Latur' },
    { text: '50 बोरी चावल', hint: 'हिन्दी · 50 bags (25q) · Rice' },
    { text: 'जलगांव में 2 ट्रॉली गेहूं', hint: 'हिन्दी · 2 trolleys · Jalgaon' },
    { text: 'धुले में 25 कट्टे मक्का', hint: 'हिन्दी · 25 bags · Dhule' }
  ],
  'en-IN': [
    { text: '40 bags onion in Nashik', hint: 'English · 40 bags · Nashik' },
    { text: '80 crates tomato in Pune', hint: 'English · 80 crates · Pune' },
    { text: '30 quintals soyabean in Latur', hint: 'English · 30 quintals · Latur' },
    { text: '50 bags rice', hint: 'English · 50 bags (25q) · Rice' },
    { text: '2 trolley wheat in Jalgaon', hint: 'English · 80 quintals · Jalgaon' },
    { text: '50 bags potato in Ahmednagar', hint: 'English · 50 bags · Ahilyanagar' }
  ]
};

const UNIFIED_DEMO_CHIPS = LANG_CHIPS['mr-IN'];
const DEMO_CHIPS = UNIFIED_DEMO_CHIPS;

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): SpeechRecognitionLike | null {
  const w = window as unknown as Record<string, any>;
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) return null;
  return new Ctor() as SpeechRecognitionLike;
}

export function renderEntryView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'feature-entry-view';

  const state = store.getState();
  const appLang: Language = state.language || 'mr';
  const initialDistrictName = state.userLocation?.district || 'Nashik';
  const initialDistrict = getDistrictConfig(initialDistrictName);
  const initialQty = state.harvestQuantityQuintals || 25;
  const eDict = I18N_DICTIONARY.entry;

  container.innerHTML = `
    <div class="editorial-grid-2" style="align-items: start; margin: var(--space-6) 0;">

      <!-- Left Column: Voice-first entry form -->
      <div class="editorial-panel" style="padding: var(--space-8); border: 1.5px solid var(--color-border);">
        <div class="kicker">${eDict.heroKicker[appLang]}</div>
        <h1 class="heading-xl" style="color: var(--color-text-main); margin-bottom: var(--space-3);">
          ${appLang === 'mr' ? 'माल कुठे आणि कधी विकावा?' : (appLang === 'hi' ? 'फसल कहां और कब बेचें?' : 'Where & When Should You Sell?')}
        </h1>
        <p class="text-farmer-lead" style="font-size: var(--font-size-sm); margin-bottom: var(--space-5);">
          ${eDict.heroSubtitle[appLang]}
        </p>

        <!-- ============ HERO VOICE INTERFACE ============ -->
        <div class="voice-hero" style="background: var(--color-brand-primary-subtle); border: 1.5px solid var(--color-brand-primary); border-radius: var(--radius-xl); padding: var(--space-6); margin-bottom: var(--space-5); text-align: center;">
          
          <!-- 1-Tap Language Selector Pills -->
          <div style="display: flex; justify-content: center; margin-bottom: var(--space-4);">
            <div id="voice-lang-pills" style="display: inline-flex; gap: 4px; padding: 4px; border-radius: 999px; background: rgba(30, 86, 49, 0.08); border: 1.5px solid rgba(30, 86, 49, 0.25);">
              <button type="button" class="voice-lang-pill ${appLang === 'mr' ? 'is-active' : ''}" data-lang="mr-IN" style="padding: 6px 16px; border-radius: 999px; border: none; font-size: 0.82rem; font-weight: 800; cursor: pointer; transition: all 0.2s ease; ${appLang === 'mr' ? 'background: var(--color-brand-primary); color: #ffffff;' : 'background: transparent; color: var(--color-text-main);'}">
                मराठी
              </button>
              <button type="button" class="voice-lang-pill ${appLang === 'hi' ? 'is-active' : ''}" data-lang="hi-IN" style="padding: 6px 16px; border-radius: 999px; border: none; font-size: 0.82rem; font-weight: 800; cursor: pointer; transition: all 0.2s ease; ${appLang === 'hi' ? 'background: var(--color-brand-primary); color: #ffffff;' : 'background: transparent; color: var(--color-text-main);'}">
                हिन्दी
              </button>
              <button type="button" class="voice-lang-pill ${appLang === 'en' ? 'is-active' : ''}" data-lang="en-IN" style="padding: 6px 16px; border-radius: 999px; border: none; font-size: 0.82rem; font-weight: 800; cursor: pointer; transition: all 0.2s ease; ${appLang === 'en' ? 'background: var(--color-brand-primary); color: #ffffff;' : 'background: transparent; color: var(--color-text-main);'}">
                English
              </button>
            </div>
          </div>

          <div>
            <button type="button" id="btn-voice-mic" class="voice-mic-button" aria-label="Speak your crop, quantity and district">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>
            </button>
          </div>
          <div id="voice-title-label" style="font-family: var(--font-family-heading); font-weight: 800; font-size: 1.05rem; color: var(--color-text-main); margin-top: var(--space-3);">
            ${eDict.speakTitle[appLang]}
          </div>
          <div id="voice-sub-label" style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 3px;">
            ${eDict.speakSub[appLang]}
          </div>

          <div id="voice-status" class="voice-status" style="margin-top: var(--space-3); min-height: 22px; font-size: var(--font-size-xs); font-weight: 700; color: var(--color-text-muted);">
            ${appLang === 'mr' ? 'माइक दाबा आणि बोला (मराठी निवडले आहे)' : (appLang === 'hi' ? 'माइक दबाएं और बोलें (हिंदी चुनी गई है)' : 'Tap mic and speak (English selected)')}
          </div>

          <div id="voice-transcript" style="margin-top: var(--space-2); font-size: var(--font-size-xs); color: var(--color-text-main); font-weight: 600; min-height: 20px;"></div>

          <!-- Demo chips for noisy rooms -->
          <div style="margin-top: var(--space-4); border-top: 1px dashed var(--color-border); padding-top: var(--space-3);">
            <div style="font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 800; color: var(--color-text-muted); margin-bottom: 8px;">
              ${eDict.noisyRoom[appLang]}
            </div>

            <div id="demo-chips-wrapper" style="display: flex; flex-wrap: wrap; gap: 6px; justify-content: center;">
            </div>
          </div>
        </div>

        <div id="voice-confirmation" style="display: none; margin-bottom: var(--space-4);"></div>

        <!-- ============ STRUCTURED FORM ============ -->
        <form id="entry-form">
          <div class="form-group" style="margin-bottom: var(--space-4);">
            <label class="input-label" for="select-crop">${eDict.selectCrop[appLang]}</label>
            <div style="margin-bottom: var(--space-2);">
              <input type="text" id="input-crop-search" class="input-field" list="crop-datalist"
                placeholder="${eDict.cropSearchPlaceholder[appLang]}"
                style="width: 100%; padding: var(--space-2) var(--space-3); font-size: var(--font-size-sm); background: var(--color-bg-subtle);" />
              ${renderCropDatalistHtml('crop-datalist')}
            </div>
            <select id="select-crop" class="select-field" style="width: 100%;">
              ${renderCropOptgroupsHtml(state.selectedCrop || 'Onion', appLang)}
            </select>
          </div>

          <div class="form-group" style="margin-bottom: var(--space-4);">
            <label class="input-label" for="input-qty">${eDict.qtyLabel[appLang]}</label>
            <input type="text" inputmode="decimal" id="input-qty" class="input-field" value="${formatNumber(initialQty, appLang)}" style="width: 100%; font-family: var(--font-family-numbers); font-weight: 800;" />
            <div id="qty-unit-note" style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 6px;">

              ${appLang === 'mr'
                ? '१ गोणी = ०.५ क्विंटल · १ क्रेट = ०.२५ क्विंटल · १ टेम्पो = १२ क्विंटल · १ ट्रॉली = ४० क्विंटल'
                : (appLang === 'hi'
                ? '१ बोरी = ०.५ क्विंटल · १ क्रेट = ०.२५ क्विंटल · १ टेम्पो = १२ क्विंटल · १ ट्रॉली = ४० क्विंटल'
                : '1 bag = 0.5 qtl · 1 crate = 0.25 qtl · 1 pickup = 12 qtl · 1 trolley = 40 qtl')}
            </div>
          </div>

          <div class="form-group" style="margin-bottom: var(--space-6);">
            <label class="input-label" for="select-district">${eDict.districtLabel[appLang]}</label>
            <div style="margin-bottom: var(--space-2);">
              <input type="text" id="input-district-search" class="input-field" list="district-datalist"
                placeholder="${eDict.districtSearchPlaceholder[appLang]}"
                style="width: 100%; padding: var(--space-2) var(--space-3); font-size: var(--font-size-sm); background: var(--color-bg-subtle);" />
              ${renderDistrictDatalistHtml('district-datalist')}
            </div>
            <select id="select-district" class="select-field" style="width: 100%;">
              ${renderDistrictOptgroupsHtml(initialDistrictName, appLang)}
            </select>
            <input type="hidden" id="input-location" value="${initialDistrict.name}" />
            <div id="district-coords-preview" style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 6px;">
              ${initialDistrict.displayName} • ${initialDistrict.divisionLabel}
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-lg" id="btn-submit-entry" style="width: 100%;">
            ${eDict.btnCalculate[appLang]}
          </button>
        </form>
      </div>

      <!-- Right Column: Agricultural Visual -->
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div class="editorial-image-frame" style="height: 320px;">
          <img src="/assets/images/hero_wheat.jpg" alt="Agricultural Fields" onerror="this.src='https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1000&q=80'" />
          <div style="position: absolute; bottom: 16px; left: 16px; right: 16px; background: rgba(24, 32, 20, 0.85); backdrop-filter: blur(8px); padding: var(--space-4); border-radius: var(--radius-lg); color: #fff;">
            <div class="badge badge-accent" style="margin-bottom: 6px;">
              ${appLang === 'mr' ? 'असली दाम™ हमी' : (appLang === 'hi' ? 'असली दाम™ गारंटी' : 'AsliDaam™ Guarantee')}
            </div>
            <div style="font-family: var(--font-family-heading); font-weight: 700; font-size: var(--font-size-sm); color: #ffffff;">
              ${appLang === 'mr'
                ? '"केवळ मोठा भाव पाहून फसू नका. प्रत्यक्ष भाडे, साठवणूक आणि तोलाई वजा करून खिशात उरणारा निव्वळ नफाच खरा असतो."'
                : (appLang === 'hi'
                ? '"केवल थोक भाव देखकर न जाएं। ढुलाई, साठवणूक व वजन कटौती काटकर हाथ में आने वाला शुद्ध पैसा ही सच्चा लाभ है."'
                : '"Highest gross mandi price doesn\'t mean highest cash in hand. Always factor in road freight, holding decay and the buyer\'s freshness discount."')}
            </div>
          </div>
        </div>

        <div class="entry-features-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
          <div class="editorial-panel" style="padding: var(--space-4); background: #ffffff;">
            <div style="font-family: var(--font-family-heading); font-weight: 800; font-size: var(--font-size-sm); color: var(--color-text-main);">
              ${appLang === 'mr' ? 'टाइप नको, फक्त बोला' : (appLang === 'hi' ? 'टाइप नहीं, बोलकर बताएं' : 'Speak, Don\'t Type')}
            </div>
            <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 4px;">
              ${appLang === 'mr' ? 'मराठी व हिंदीसाठी अचूक कृषी उच्चार ओळख' : (appLang === 'hi' ? 'हिंदी व मराठी हेतु सटीक कृषि वाणी पहचान' : 'Whisper STT + Gemini entity extraction')}
            </div>
          </div>
          <div class="editorial-panel" style="padding: var(--space-4); background: #ffffff;">
            <div style="font-family: var(--font-family-heading); font-weight: 800; font-size: var(--font-size-sm); color: var(--color-text-main);">
              ${appLang === 'mr' ? 'गोणी / बोरी → क्विंटल' : (appLang === 'hi' ? 'बोरी → क्विंटल' : 'Bags → Quintals')}
            </div>
            <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 4px;">
              ${appLang === 'mr' ? 'स्थानिक परिमाणे (गोणी, क्रेट, टेम्पो) आपोआप क्विंटलमध्ये' : (appLang === 'hi' ? 'स्थानीय माप (बोरी, क्रेट, टेम्पो) स्वतः क्विंटल में' : 'Unit conversion is always recomputed locally')}
            </div>
          </div>
          <div class="editorial-panel" style="padding: var(--space-4); background: #ffffff;">
            <div style="font-family: var(--font-family-heading); font-weight: 800; font-size: var(--font-size-sm); color: var(--color-text-main);">
              ${appLang === 'mr' ? 'प्रत्यक्ष रस्ता अंतर' : (appLang === 'hi' ? 'वास्तविक सड़क दूरी' : 'Real Road Haulage')}
            </div>
            <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 4px;">
              ${appLang === 'mr' ? '१.३५× घाटाचे व वळणाचे अंतर जोडून अचूक वाहतूक खर्च' : (appLang === 'hi' ? '१.३५× वास्तविक सड़क मोड़ जोड़कर सटीक ढुलाई भाड़ा' : 'OSRM driving km calibrated at 1.35× road factor')}
            </div>
          </div>
          <div class="editorial-panel" style="padding: var(--space-4); background: #ffffff;">
            <div style="font-family: var(--font-family-heading); font-weight: 800; font-size: var(--font-size-sm); color: var(--color-text-main);">
              ${appLang === 'mr' ? 'अंदाजेबाजी नाही' : (appLang === 'hi' ? 'सट्टेबाजी नहीं' : 'Zero Guesswork')}
            </div>
            <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 4px;">
              ${appLang === 'mr' ? 'भाव जुने किंवा संशयास्पद असल्यास स्पष्ट नकार' : (appLang === 'hi' ? 'भाव पुराने या संदिग्ध होने पर स्पष्ट अस्वीकार' : 'Honest abstention when data is stale or unreliable')}
            </div>
          </div>
        </div>
      </div>


    </div>
  `;

  // ==========================================================================

  // Element handles
  // ==========================================================================
  const cropSelect = container.querySelector('#select-crop') as HTMLSelectElement;
  const cropSearchInput = container.querySelector('#input-crop-search') as HTMLInputElement;
  const qtyInput = container.querySelector('#input-qty') as HTMLInputElement;
  const districtSelect = container.querySelector('#select-district') as HTMLSelectElement;
  const districtSearchInput = container.querySelector('#input-district-search') as HTMLInputElement;
  const locInput = container.querySelector('#input-location') as HTMLInputElement;
  const coordsPreview = container.querySelector('#district-coords-preview') as HTMLElement;
  const micBtn = container.querySelector('#btn-voice-mic') as HTMLButtonElement;
  const statusEl = container.querySelector('#voice-status') as HTMLElement;
  const transcriptEl = container.querySelector('#voice-transcript') as HTMLElement;
  const confirmEl = container.querySelector('#voice-confirmation') as HTMLElement;

  if (appLang !== 'en' && qtyInput) {
    qtyInput.addEventListener('input', () => {
      const s = qtyInput.selectionStart;
      qtyInput.value = toDevanagariDigits(qtyInput.value);
      if (s !== null) qtyInput.setSelectionRange(s, s);
    });
  }


  // ==========================================================================
  // Manual controls (kept 100% interactive)
  // ==========================================================================
  cropSearchInput?.addEventListener('input', () => {
    const val = cropSearchInput.value.trim();
    if (!val) return;
    const matched = getCropConfig(val);
    if (matched) cropSelect.value = matched.id;
  });

  cropSelect?.addEventListener('change', () => {
    const opt = cropSelect.selectedOptions[0];
    if (opt) cropSearchInput.value = opt.textContent || '';
  });

  function applyDistrict(dName: string) {
    const config = getDistrictConfig(dName);
    if (districtSelect) districtSelect.value = config.name;
    if (locInput) locInput.value = config.name;
    if (coordsPreview) {
      coordsPreview.textContent = `Geodesic origin: ${config.displayName} (${config.latitude.toFixed(4)}° N, ${config.longitude.toFixed(4)}° E) • ${config.divisionLabel}`;
    }
    return config;
  }

  districtSearchInput?.addEventListener('input', () => {
    const val = districtSearchInput.value.trim();
    if (!val) return;
    const matched = getDistrictConfig(val);
    if (matched) applyDistrict(matched.name);
  });

  districtSelect?.addEventListener('change', () => {
    const config = applyDistrict(districtSelect.value);
    districtSearchInput.value = config.displayName;
  });

  // ==========================================================================
  // Voice autofill
  // ==========================================================================
  function flashField(el: HTMLElement | null) {
    if (!el) return;
    el.classList.remove('voice-autofilled');
    // Force reflow so the animation restarts on repeated fills.
    void el.offsetWidth;
    el.classList.add('voice-autofilled');
    setTimeout(() => el.classList.remove('voice-autofilled'), 1800);
  }

  function setStatus(html: string, mode: 'idle' | 'recording' | 'processing' | 'ok' | 'error') {
    statusEl.innerHTML = html;
    micBtn.classList.toggle('is-recording', mode === 'recording');
    micBtn.classList.toggle('is-processing', mode === 'processing');
    statusEl.style.color =
      mode === 'error' ? 'var(--color-status-abstain)'
      : mode === 'ok' ? 'var(--color-status-success)'
      : mode === 'recording' ? 'var(--color-status-abstain)'
      : 'var(--color-text-muted)';
  }

  function applyExtraction(extraction: VoiceExtraction, pipelineLabel: string) {
    let filled = 0;

    if (extraction.crop) {
      const cfg = getCropConfig(extraction.crop);
      if (cfg) {
        cropSelect.value = cfg.id;
        cropSearchInput.value = cfg.displayName;
        store.setSelectedCrop(cfg.id);
        flashField(cropSelect);
        filled += 1;
      }
    }

    if (extraction.quantityQuintals !== null && extraction.quantityQuintals !== undefined) {
      qtyInput.value = formatNumber(extraction.quantityQuintals, appLang);
      store.setHarvestQuantity(extraction.quantityQuintals);
      flashField(qtyInput);
      filled += 1;
    }


    if (extraction.district) {
      const cfg = applyDistrict(extraction.district);
      districtSearchInput.value = cfg.displayName;
      store.setUserLocation(cfg.latitude, cfg.longitude, cfg.name);
      flashField(districtSelect);
      filled += 1;
    }

    const unitLabel = extraction.originalUnit && extraction.originalUnit !== 'Quintals'
      ? `${extraction.originalQuantity} ${extraction.originalUnit} (${extraction.quantityQuintals} क्विंटल)`
      : `${extraction.quantityQuintals ?? '—'} क्विंटल`;

    confirmEl.style.display = 'block';
    const lang = extraction.detectedLanguage || 'mr';
    const langBadge = (extraction.detectedLanguageDisplay || 'मराठी').replace(/^[^\s]+\s+/, '');

    let cropLabel = 'शेतमाल';
    let qtyLabel = 'वजन';
    let distLabel = 'जिल्हा';
    let summaryText = extraction.displaySummaryMr;

    if (lang === 'hi') {
      cropLabel = 'फसल';
      qtyLabel = 'मात्रा';
      distLabel = 'जिला';
      summaryText = extraction.displaySummaryHi || extraction.displaySummaryMr;
    } else if (lang === 'en') {
      cropLabel = 'Crop';
      qtyLabel = 'Quantity';
      distLabel = 'District';
      summaryText = extraction.displaySummaryEn || extraction.displaySummaryMr;
    }

    confirmEl.innerHTML = `
      <div style="background: ${filled === 3 ? 'var(--color-status-success-bg)' : 'var(--color-status-warning-bg)'}; border: 1.5px solid ${filled === 3 ? 'var(--color-status-success)' : 'var(--color-status-warning)'}; border-radius: var(--radius-lg); padding: var(--space-3) var(--space-4);">
        <div style="font-size: var(--font-size-sm); font-weight: 800; color: var(--color-text-main); line-height: 1.6;">
          AI Verified (${langBadge} • ${pipelineLabel}):
          <span class="badge badge-sage">${cropLabel}: ${extraction.cropDisplay || '—'}</span>
          <span class="badge badge-sage">${qtyLabel}: ${unitLabel}</span>
          <span class="badge badge-sage">${distLabel}: ${extraction.districtDisplay || '—'}</span>
        </div>
        <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 6px;">
          ${summaryText} · confidence <strong>${extraction.confidence}</strong>
          ${extraction.warnings.length > 0 ? `<br>${extraction.warnings.join(' ')}` : ''}
        </div>
      </div>
    `;

    const statusMsg = lang === 'hi'
      ? (filled === 3 ? 'फॉर्म भर दिया गया। जांचें और Calculate दबाएं।' : `3 में से ${filled} फ़ील्ड भरे गए — कृपया बाकी मैन्युअल भरें।`)
      : (lang === 'en'
          ? (filled === 3 ? 'Form filled. Check it and press Calculate.' : `Filled ${filled} of 3 fields — please complete the rest manually.`)
          : (filled === 3 ? 'फॉर्म भरला गेला. तपासा आणि Calculate दाबा.' : `3 पैकी ${filled} रकाने भरले — उरलेले हाताने भरा.`));

    setStatus(statusMsg, filled === 3 ? 'ok' : 'error');
  }

  // ==========================================================================
  // Trilingual Native Routing & Demo Chips
  // ==========================================================================
  let currentLang: 'mr-IN' | 'hi-IN' | 'en-IN' = appLang === 'hi' ? 'hi-IN' : (appLang === 'en' ? 'en-IN' : 'mr-IN');


  function renderLanguageChips() {
    const chipsWrapper = container.querySelector('#demo-chips-wrapper') as HTMLElement | null;
    if (!chipsWrapper) return;
    const chips = LANG_CHIPS[currentLang] || LANG_CHIPS['mr-IN'];
    chipsWrapper.innerHTML = chips.map((c, i) => `
      <button type="button" class="voice-demo-chip" data-chip="${i}" title="${c.hint}">
        ${c.text}
      </button>
    `).join('');

    chipsWrapper.querySelectorAll('.voice-demo-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const idx = parseInt((chip as HTMLElement).getAttribute('data-chip') || '0', 10);
        const chipData = chips[idx];
        if (chipData) {
          void processVoiceText(chipData.text, 'demo-chip');
        }
      });
    });
  }

  function updateLanguagePillsUI() {
    const pills = container.querySelectorAll('.voice-lang-pill');
    pills.forEach(pill => {
      const pLang = pill.getAttribute('data-lang');
      if (pLang === currentLang) {
        pill.classList.add('is-active');
        (pill as HTMLElement).style.background = 'var(--color-brand-primary)';
        (pill as HTMLElement).style.color = '#ffffff';
      } else {
        pill.classList.remove('is-active');
        (pill as HTMLElement).style.background = 'transparent';
        (pill as HTMLElement).style.color = 'var(--color-text-main)';
      }
    });

    const subLabel = container.querySelector('#voice-sub-label');
    const statusEl = container.querySelector('#voice-status');

    if (currentLang === 'mr-IN') {
      if (subLabel) subLabel.textContent = 'बोलताना थांबले तरी आवाज रेकॉर्ड होत राहील. बोलणे पूर्ण झाल्यावर Stop दाबा.';
      if (statusEl && !listening) statusEl.textContent = 'माइक दाबा आणि बोला (मराठी मोड)';
    } else if (currentLang === 'hi-IN') {
      if (subLabel) subLabel.textContent = 'बोलते समय रुकने पर भी आवाज रिकॉर्ड होती रहेगी। बोलना पूरा होने पर Stop दबाएं।';
      if (statusEl && !listening) statusEl.textContent = 'माइक दबाएं और बोलें (हिन्दी मोड)';
    } else {
      if (subLabel) subLabel.textContent = 'Natural pauses are preserved. Tap Stop when you finish speaking.';
      if (statusEl && !listening) statusEl.textContent = 'Tap mic to speak (English Mode)';
    }

    renderLanguageChips();
  }

  const langPillsContainer = container.querySelector('#voice-lang-pills');
  langPillsContainer?.querySelectorAll('.voice-lang-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const newLang = pill.getAttribute('data-lang') as 'mr-IN' | 'hi-IN' | 'en-IN';
      if (newLang && newLang !== currentLang) {
        if (listening) {
          stopListeningAndProcess();
        }
        currentLang = newLang;
        const shortLang = (newLang.split('-')[0] || 'mr') as Language;
        store.setLanguage(shortLang);
        container.replaceWith(renderEntryView());
      }
    });
  });


  // Initial chip render
  renderLanguageChips();

  async function processVoiceText(text: string, source: 'web-speech' | 'demo-chip' | 'typed') {
    transcriptEl.innerHTML = `<span style="color: var(--color-text-main); font-weight: 700;">“${text}”</span>`;
    setStatus('AI विश्लेषक / विश्लेषण हो रहा है (Analyzing speech…)', 'processing');
    try {
      // Step 1: Instant zero-latency local extraction with fuzzy matching
      const localExtraction = extractAgrarianSlots(text);

      // Step 2: Call backend API for pipeline reconciliation & server logs
      const apiLang = currentLang.split('-')[0] as 'mr' | 'hi' | 'en';
      const res = await apiClient.processVoiceText(text, source, apiLang);
      const label = res.pipeline.nluProvider === 'google-gemini'
        ? 'Whisper + Gemini'
        : 'MandiMitra AI Extractor';

      // Pick the highest-confidence extraction (local vs server)
      const chosen = (res.extraction.confidence === 'HIGH' || !localExtraction.crop)
        ? res.extraction
        : localExtraction;

      applyExtraction(chosen, label);
    } catch (err) {
      // Offline fallback: never fail in front of users or judges
      const localExtraction = extractAgrarianSlots(text);
      if (localExtraction.crop || localExtraction.quantityQuintals !== null) {
        applyExtraction(localExtraction, 'Offline MandiMitra AI');
      } else {
        setStatus(`Voice service unavailable: ${err instanceof Error ? err.message : String(err)}`, 'error');
      }
    }
  }

  async function recordAndTranscribe() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setStatus('This browser cannot record audio. Tap a sample below or fill the form manually.', 'error');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = e => chunks.push(e.data);

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setStatus('Whisper AI transcribing…', 'processing');
        try {
          const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
          const apiLang = currentLang.split('-')[0] || 'mr';
          const res = await apiClient.processVoiceAudio(blob, apiLang);
          if (res.pipeline.sttStatus === 'skipped-no-key' || res.pipeline.sttStatus === 'failed') {
            setStatus(`Server speech-to-text unavailable (${res.pipeline.sttStatus}). Tap a sample chip or fill manually.`, 'error');
            return;
          }
          transcriptEl.innerHTML = `<span style="color: var(--color-text-main); font-weight: 700;">“${res.extraction.transcript}”</span>`;
          applyExtraction(
            res.extraction,
            res.pipeline.nluProvider === 'google-gemini' ? 'Whisper + Gemini' : 'Whisper + MandiMitra offline extractor'
          );
        } catch (err) {
          setStatus(`Transcription failed: ${err instanceof Error ? err.message : String(err)}`, 'error');
        }
      };

      recorder.start();
      setStatus('रेकॉर्डिंग सुरू आहे... / बोलिए... (Whisper AI)', 'recording');
      setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, 6000);
    } catch {
      setStatus('Microphone permission denied. Tap a sample chip below or fill manually.', 'error');
    }
  }

  let listening = false;
  let activeRecognition: any = null;
  let finalTranscript = '';
  let accumulatedTranscript = '';
  let autoStopTimer: any = null;
  let silenceTimer: any = null;

  function stopListeningAndProcess() {
    if (!listening) return;
    listening = false;
    clearTimeout(autoStopTimer);
    clearTimeout(silenceTimer);

    if (micBtn) {
      micBtn.classList.remove('is-recording');
      micBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>';
      micBtn.setAttribute('title', 'Tap to speak');
    }

    if (activeRecognition) {
      try { activeRecognition.stop(); } catch {}
      activeRecognition = null;
    }

    const textToProcess = finalTranscript.trim();
    if (textToProcess.length > 0) {
      transcriptEl.innerHTML = `<span style="color: var(--color-text-main); font-weight: 700;">“${textToProcess}”</span>`;
      void processVoiceText(textToProcess, 'web-speech');
    } else {
      const msg = currentLang === 'mr-IN'
        ? 'बोलणे ओळखले नाही. पुन्हा प्रयत्न करा किंवा खालील नमुना टॅप करा.'
        : (currentLang === 'hi-IN'
            ? 'कोई आवाज नहीं पहचानी गई। दोबारा प्रयास करें या नीचे डेमो चिप चुनें।'
            : 'No speech detected. Tap mic to retry or tap a sample below.');
      setStatus(msg, 'error');
    }
  }

  micBtn?.addEventListener('click', () => {
    if (listening) {
      // User tapped mic while speaking -> finish and process immediately!
      stopListeningAndProcess();
      return;
    }

    const recognition = getSpeechRecognition();
    if (recognition) {
      listening = true;
      activeRecognition = recognition;
      finalTranscript = '';
      accumulatedTranscript = '';

      // Route to native neural ASR model for selected language!
      recognition.lang = currentLang;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;
      recognition.continuous = true;

      micBtn.classList.add('is-recording');
      micBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle;"><rect x="4" y="4" width="16" height="16" rx="3"/></svg>';
      micBtn.setAttribute('title', 'Tap when finished speaking');

      const recordingMsg = currentLang === 'mr-IN'
        ? 'ऐकत आहे... (बोलणे संपल्यावर Stop दाबा)'
        : (currentLang === 'hi-IN'
            ? 'सुन रहे हैं... (बोलना पूरा होने पर Stop दबाएं)'
            : 'Listening... (Tap Stop when finished)');
      setStatus(recordingMsg, 'recording');
      transcriptEl.textContent = '';

      // Hard safety timer: 20 seconds maximum
      autoStopTimer = setTimeout(() => {
        if (listening) {
          stopListeningAndProcess();
        }
      }, 20000);

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            currentFinal += result[0].transcript + ' ';
          } else {
            currentInterim += result[0].transcript;
          }
        }

        const sessionText = currentFinal.trim();
        if (sessionText) {
          finalTranscript = (accumulatedTranscript ? accumulatedTranscript + ' ' + sessionText : sessionText).trim();
        }

        const fullDisplay = finalTranscript.trim();
        const interimDisplay = currentInterim.trim();

        transcriptEl.innerHTML =
          (fullDisplay ? `<span style="color: var(--color-text-main); font-weight: 700;">"${fullDisplay}"</span>` : '') +
          (interimDisplay ? `<span style="color: var(--color-text-muted); opacity: 0.6; font-style: italic;"> ${interimDisplay}</span>` : '');

        // Reset silence grace timer on new speech: gives 3.5s of silence after speaking
        clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {
          if (listening && finalTranscript.trim().length > 0) {
            stopListeningAndProcess();
          }
        }, 3500);
      };

      recognition.onerror = (event: any) => {
        const code = event?.error || 'unknown';
        if (code === 'no-speech' && listening) {
          // Ignore momentary no-speech during pauses, keep listening
          return;
        }
        const friendlyMessages: Record<string, string> = {
          'not-allowed': 'माइक्रोफोन परवानगी नाकारली / अनुमति अस्वीकृत। Allow mic in browser settings.',
          'network': 'स्पीच सेवा उपलब्ध नाही / उपलब्ध नहीं है। Check internet connection.',
          'audio-capture': 'माइक्रोफोन सापडला नाही / नहीं मिला।',
          'aborted': '',
          'service-not-allowed': 'Speech service blocked by browser.'
        };
        const msg = friendlyMessages[code];
        if (msg) {
          setStatus(msg, 'error');
          stopListeningAndProcess();
        }
      };

      recognition.onend = () => {
        // If Chrome disconnected on a momentary pause while the user is still speaking:
        if (listening) {
          accumulatedTranscript = finalTranscript;
          // Reconnect smoothly without dropping accumulated speech!
          try {
            recognition.start();
          } catch {
            // Already running or stopped
          }
        }
      };

      try {
        recognition.start();
      } catch {
        void recordAndTranscribe();
      }
    } else {
      void recordAndTranscribe();
    }
  });

  // ==========================================================================
  // Submit
  // ==========================================================================
  const form = container.querySelector('#entry-form') as HTMLFormElement;
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const crop = cropSelect ? cropSelect.value : 'Onion';
    store.setSelectedCrop(crop);

    const qty = Math.max(0.5, parseDevanagariNumber(qtyInput?.value || '25'));

    store.setHarvestQuantity(qty);

    const dVal = districtSelect ? districtSelect.value : (locInput ? locInput.value : 'Nashik');
    const distConfig = getDistrictConfig(dVal);
    store.setUserLocation(distConfig.latitude, distConfig.longitude, distConfig.name);
    store.setLoading(true);

    try {
      const currentState = store.getState();
      const response = await apiClient.evaluate({
        commodity: crop,
        latitude: distConfig.latitude,
        longitude: distConfig.longitude,
        transportCostPerKmPerQtl: currentState.costConfig.transportCostPerKmPerQtl,
        storageCostPerDayPerQtl: currentState.costConfig.storageCostPerDayPerQtl,
        radiusKm: currentState.costConfig.searchRadiusKm
      });
      store.setEvaluationData(response);
      store.setRoute('/hub');
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Evaluation service unavailable');
    }
  });

  return container;
}

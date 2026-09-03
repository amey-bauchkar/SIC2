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
import type { VoiceExtraction } from '../../../core/voice-extraction';

export const MAHARASHTRA_DISTRICT_COORDS: Record<string, { lat: number; lon: number }> = Object.fromEntries(
  ALL_DISTRICTS.map(d => [d.name.toLowerCase(), { lat: d.latitude, lon: d.longitude }])
);
MAHARASHTRA_DISTRICT_COORDS['ahmednagar'] = MAHARASHTRA_DISTRICT_COORDS['ahilyanagar'] || { lat: 19.0952, lon: 74.7480 };
MAHARASHTRA_DISTRICT_COORDS['aurangabad'] = MAHARASHTRA_DISTRICT_COORDS['chhatrapati sambhajinagar'] || { lat: 19.8762, lon: 75.3433 };
MAHARASHTRA_DISTRICT_COORDS['osmanabad'] = MAHARASHTRA_DISTRICT_COORDS['dharashiv'] || { lat: 18.1861, lon: 76.0419 };

/** Sample utterances for noisy presentation rooms across Marathi, Hindi, and English. */
const DEMO_CHIPS_MR: Array<{ emoji: string; text: string; hint: string }> = [
  { emoji: '🧅', text: 'नाशिक निफाड मध्ये 40 गोणी कांदा आहे', hint: 'Onion · 40 bags · Nashik' },
  { emoji: '🍅', text: 'पुणे जुन्नर मध्ये 80 क्रेट टोमॅटो', hint: 'Tomato · 80 crates · Pune' },
  { emoji: '🌻', text: 'लातूर मध्ये 30 क्विंटल सोयाबीन', hint: 'Soyabean · 30 quintals · Latur' }
];

const DEMO_CHIPS_HI: Array<{ emoji: string; text: string; hint: string }> = [
  { emoji: '🧅', text: 'नासिक में 40 बोरी प्याज है', hint: 'Onion · 40 bags · Nashik' },
  { emoji: '🍅', text: 'पुणे में 80 क्रेट टमाटर', hint: 'Tomato · 80 crates · Pune' },
  { emoji: '🌻', text: 'लातूर में 30 क्विंटल सोयाबीन', hint: 'Soyabean · 30 quintals · Latur' },
  { emoji: '🌾', text: 'जलगांव में 2 ट्रॉली गेहूं', hint: 'Wheat · 2 trolleys · Jalgaon' },
  { emoji: '🌽', text: 'धुले में 25 कट्टे मक्का', hint: 'Maize · 25 bags · Dhule' }
];

const DEMO_CHIPS_EN: Array<{ emoji: string; text: string; hint: string }> = [
  { emoji: '🧅', text: '40 bags onion in Nashik Niphad', hint: 'Onion · 40 bags · Nashik' },
  { emoji: '🍅', text: '80 crates tomato in Pune Junnar', hint: 'Tomato · 80 crates · Pune' },
  { emoji: '🌾', text: '2 trolley wheat in Jalgaon', hint: 'Wheat · 2 trolleys · Jalgaon' }
];

const DEMO_CHIPS = DEMO_CHIPS_MR;

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
  const initialDistrictName = state.userLocation?.district || 'Nashik';
  const initialDistrict = getDistrictConfig(initialDistrictName);
  const initialQty = state.harvestQuantityQuintals || 25;

  container.innerHTML = `
    <div class="editorial-grid-2" style="align-items: start; margin: var(--space-6) 0;">

      <!-- Left Column: Voice-first entry form -->
      <div class="editorial-panel" style="padding: var(--space-8); border: 1.5px solid var(--color-border);">
        <div class="kicker">🌾 MANDIMITRA DECISION ENGINE</div>
        <h1 class="heading-xl" style="color: var(--color-text-main); margin-bottom: var(--space-3);">
          Where &amp; When Should You Sell?
        </h1>
        <p class="text-farmer-lead" style="font-size: var(--font-size-sm); margin-bottom: var(--space-5);">
          Speak or select your harvested crop and location. We calculate the true net take-home cash
          across all nearby mandis over the next 0 to 3 days.
        </p>

        <!-- ============ HERO VOICE INTERFACE ============ -->
        <div class="voice-hero" style="background: var(--color-brand-primary-subtle); border: 1.5px solid var(--color-brand-primary); border-radius: var(--radius-xl); padding: var(--space-5); margin-bottom: var(--space-5); text-align: center;">
          
          <!-- Voice Language Selector -->
          <div class="voice-lang-picker" style="display: flex; justify-content: center; gap: 8px; margin-bottom: var(--space-4);">
            <button type="button" class="btn-voice-lang active" data-lang="mr-IN" style="padding: 4px 14px; font-size: 0.75rem; border-radius: 999px; border: 1.5px solid var(--color-brand-primary); background: var(--color-brand-primary); color: #ffffff; font-weight: 700; cursor: pointer; transition: all 0.2s;">
              🇮🇳 मराठी
            </button>
            <button type="button" class="btn-voice-lang" data-lang="hi-IN" style="padding: 4px 14px; font-size: 0.75rem; border-radius: 999px; border: 1.5px solid #cbd5e1; background: #ffffff; color: var(--color-text-muted); font-weight: 700; cursor: pointer; transition: all 0.2s;">
              🇮🇳 हिन्दी
            </button>
            <button type="button" class="btn-voice-lang" data-lang="en-IN" style="padding: 4px 14px; font-size: 0.75rem; border-radius: 999px; border: 1.5px solid #cbd5e1; background: #ffffff; color: var(--color-text-muted); font-weight: 700; cursor: pointer; transition: all 0.2s;">
              🇬🇧 English
            </button>
          </div>

          <button type="button" id="btn-voice-mic" class="voice-mic-button" aria-label="Speak your crop, quantity and district">
            🎙️
          </button>
          <div style="font-family: var(--font-family-heading); font-weight: 800; font-size: var(--font-size-sm); color: var(--color-text-main); margin-top: var(--space-3);">
            बोलून सांगा / बोलकर बताएं
          </div>
          <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 2px;">
            AI Voice Fill — say your crop, how many bags or crates, and your taluka
          </div>

          <div id="voice-status" class="voice-status" style="margin-top: var(--space-3); min-height: 22px; font-size: var(--font-size-xs); font-weight: 700; color: var(--color-text-muted);">
            Tap the microphone to begin
          </div>

          <div id="voice-transcript" style="margin-top: var(--space-2); font-size: var(--font-size-xs); color: var(--color-text-muted); font-style: italic; min-height: 18px;"></div>

          <!-- Demo chips for noisy rooms -->
          <div style="margin-top: var(--space-4); border-top: 1px dashed var(--color-border); padding-top: var(--space-3);">
            <div style="font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 800; color: var(--color-text-muted); margin-bottom: 6px;">
              Noisy room? Tap a sample instead
            </div>
            <div id="demo-chips-wrapper" style="display: flex; flex-wrap: wrap; gap: 6px; justify-content: center;">
              ${DEMO_CHIPS_MR.map((c, i) => `
                <button type="button" class="voice-demo-chip" data-chip="${i}" title="${c.hint}">
                  ${c.emoji} ${c.text}
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <div id="voice-confirmation" style="display: none; margin-bottom: var(--space-4);"></div>

        <!-- ============ STRUCTURED FORM ============ -->
        <form id="entry-form">
          <div class="form-group" style="margin-bottom: var(--space-4);">
            <label class="input-label" for="select-crop">Select Commodity (शेतमाल / फसल निवडा)</label>
            <div style="margin-bottom: var(--space-2);">
              <input type="text" id="input-crop-search" class="input-field" list="crop-datalist"
                placeholder="🔍 Quick search crop (e.g. Wheat, Chana, Aalu, Pomegranate)..."
                style="width: 100%; padding: var(--space-2) var(--space-3); font-size: var(--font-size-sm); background: var(--color-bg-subtle);" />
              ${renderCropDatalistHtml('crop-datalist')}
            </div>
            <select id="select-crop" class="select-field" style="width: 100%;">
              ${renderCropOptgroupsHtml(state.selectedCrop || 'Onion')}
            </select>
          </div>

          <div class="form-group" style="margin-bottom: var(--space-4);">
            <label class="input-label" for="input-qty">Harvest Volume in Quintals (एकूण वजन — क्विंटल)</label>
            <input type="number" id="input-qty" class="input-field" value="${initialQty}" min="0.5" step="0.5" style="width: 100%;" />
            <div id="qty-unit-note" style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 6px;">
              1 गोणी/बोरी = 0.5 क्विंटल · 1 क्रेट/पेटी = 0.25 क्विंटल · 1 टेम्पो = 12 क्विंटल · 1 ट्रॉली = 40 क्विंटल
            </div>
          </div>

          <div class="form-group" style="margin-bottom: var(--space-6);">
            <label class="input-label" for="select-district">Farmer Origin District (शेतकरी जिल्हा / मूळ स्थान निवडा)</label>
            <div style="margin-bottom: var(--space-2);">
              <input type="text" id="input-district-search" class="input-field" list="district-datalist"
                placeholder="🔍 Quick search district (e.g. Nashik, Pune, Latur, Solapur, Kolhapur)..."
                style="width: 100%; padding: var(--space-2) var(--space-3); font-size: var(--font-size-sm); background: var(--color-bg-subtle);" />
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
            ⚡ Calculate Best Market &amp; Timing
          </button>
        </form>
      </div>

      <!-- Right Column: Agricultural Visual -->
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div class="editorial-image-frame" style="height: 320px;">
          <img src="/assets/images/hero_wheat.jpg" alt="Agricultural Fields" onerror="this.src='https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1000&q=80'" />
          <div style="position: absolute; bottom: 16px; left: 16px; right: 16px; background: rgba(24, 32, 20, 0.85); backdrop-filter: blur(8px); padding: var(--space-4); border-radius: var(--radius-lg); color: #fff;">
            <div class="badge badge-accent" style="margin-bottom: 6px;">AsliDaam™ Guarantee</div>
            <div style="font-family: var(--font-family-heading); font-weight: 700; font-size: var(--font-size-sm); color: #ffffff;">
              "Highest gross mandi price doesn't mean highest cash in hand. Always factor in road freight, holding decay and the buyer's freshness discount."
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
          <div class="editorial-panel" style="padding: var(--space-4); background: #ffffff;">
            <div style="font-size: 1.25rem; margin-bottom: 4px;">🎙️</div>
            <div style="font-family: var(--font-family-heading); font-weight: 800; font-size: var(--font-size-sm); color: var(--color-text-main);">Speak, Don't Type</div>
            <div style="font-size: var(--font-size-xs); color: var(--color-text-muted);">Whisper STT + Gemini entity extraction, with an offline catalogue extractor as fallback</div>
          </div>
          <div class="editorial-panel" style="padding: var(--space-4); background: #ffffff;">
            <div style="font-size: 1.25rem; margin-bottom: 4px;">⚖️</div>
            <div style="font-family: var(--font-family-heading); font-weight: 800; font-size: var(--font-size-sm); color: var(--color-text-main);">Bags → Quintals</div>
            <div style="font-size: var(--font-size-xs); color: var(--color-text-muted);">Unit conversion is always recomputed locally — never left to the language model</div>
          </div>
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
      coordsPreview.textContent = `📍 Geodesic origin: ${config.displayName} (${config.latitude.toFixed(4)}° N, ${config.longitude.toFixed(4)}° E) • ${config.divisionLabel}`;
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
      qtyInput.value = String(extraction.quantityQuintals);
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
    const isHi = currentLang === 'hi-IN';
    confirmEl.innerHTML = `
      <div style="background: ${filled === 3 ? 'var(--color-status-success-bg)' : 'var(--color-status-warning-bg)'}; border: 1.5px solid ${filled === 3 ? 'var(--color-status-success)' : 'var(--color-status-warning)'}; border-radius: var(--radius-lg); padding: var(--space-3) var(--space-4);">
        <div style="font-size: var(--font-size-sm); font-weight: 800; color: var(--color-text-main); line-height: 1.6;">
          ✨ AI Verified (${pipelineLabel}):
          <span class="badge badge-sage">${isHi ? 'फसल' : 'शेतमाल'}: ${extraction.cropDisplay || '—'}</span>
          <span class="badge badge-sage">${isHi ? 'मात्रा' : 'वजन'}: ${unitLabel}</span>
          <span class="badge badge-sage">${isHi ? 'जिला' : 'जिल्हा'}: ${extraction.districtDisplay || '—'}</span>
        </div>
        <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 6px;">
          ${(isHi && extraction.displaySummaryHi ? extraction.displaySummaryHi : extraction.displaySummaryMr)} · confidence <strong>${extraction.confidence}</strong>
          ${extraction.warnings.length > 0 ? `<br>⚠️ ${extraction.warnings.join(' ')}` : ''}
        </div>
      </div>
    `;

    setStatus(
      filled === 3
        ? (isHi ? '✅ फॉर्म भर दिया गया। जांचें और Calculate दबाएं।' : '✅ Form filled. Check it and press Calculate.')
        : (isHi ? `⚠️ 3 में से ${filled} फ़ील्ड भरे गए — कृपया बाकी मैन्युअल भरें।` : `⚠️ Filled ${filled} of 3 fields — please complete the rest manually.`),
      filled === 3 ? 'ok' : 'error'
    );
  }

  let currentLang: 'mr-IN' | 'hi-IN' | 'en-IN' = 'mr-IN';

  const chipsWrapper = container.querySelector('#demo-chips-wrapper') as HTMLElement | null;
  const langButtons = container.querySelectorAll('.btn-voice-lang');

  function renderChips() {
    const chips = currentLang === 'hi-IN' ? DEMO_CHIPS_HI : (currentLang === 'en-IN' ? DEMO_CHIPS_EN : DEMO_CHIPS_MR);
    if (chipsWrapper) {
      chipsWrapper.innerHTML = chips.map((c, i) => `
        <button type="button" class="voice-demo-chip" data-chip="${i}" title="${c.hint}">
          ${c.emoji} ${c.text}
        </button>
      `).join('');

      chipsWrapper.querySelectorAll('.voice-demo-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const idx = parseInt((chip as HTMLElement).getAttribute('data-chip') || '0', 10);
          void processTranscript(chips[idx].text, 'demo-chip');
        });
      });
    }
  }

  langButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      langButtons.forEach(b => {
        (b as HTMLElement).style.background = '#ffffff';
        (b as HTMLElement).style.color = 'var(--color-text-muted)';
        (b as HTMLElement).style.borderColor = '#cbd5e1';
      });
      const el = btn as HTMLElement;
      el.style.background = 'var(--color-brand-primary)';
      el.style.color = '#ffffff';
      el.style.borderColor = 'var(--color-brand-primary)';
      currentLang = (btn.getAttribute('data-lang') || 'mr-IN') as 'mr-IN' | 'hi-IN' | 'en-IN';
      renderChips();
      setStatus(
        currentLang === 'hi-IN'
          ? 'माइक दबाएं और बोलें (हिन्दी सक्रिय)'
          : (currentLang === 'en-IN' ? 'Tap mic to speak (English active)' : 'माइक टॅप करा आणि बोला (मराठी सक्रिय)'),
        'idle'
      );
    });
  });

  async function processTranscript(text: string, source: 'web-speech' | 'demo-chip' | 'typed') {
    transcriptEl.textContent = `“${text}”`;
    const statusMsg = currentLang === 'hi-IN'
      ? '🤖 AI विश्लेषण हो रहा है (फसल, मात्रा और जिला पहचाना जा रहा है…)'
      : (currentLang === 'en-IN' ? '🤖 AI analyzing (extracting agrarian slots…)' : '🤖 Gemini AI विश्लेषक (Extracting Agrarian Slots…)');
    setStatus(statusMsg, 'processing');
    try {
      const res = await apiClient.processVoiceText(text, source);
      const label = res.pipeline.nluProvider === 'google-gemini'
        ? 'Whisper + Gemini'
        : 'MandiMitra offline extractor';
      applyExtraction(res.extraction, label);
    } catch (err) {
      setStatus(`Voice service unavailable: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  }

  async function recordAndTranscribe() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setStatus('This browser cannot record audio. Use a demo chip or fill the form manually.', 'error');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = e => chunks.push(e.data);

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setStatus('🤖 Whisper AI transcribing…', 'processing');
        try {
          const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
          const res = await apiClient.processVoiceAudio(blob, currentLang.split('-')[0] || 'mr');
          if (res.pipeline.sttStatus === 'skipped-no-key' || res.pipeline.sttStatus === 'failed') {
            setStatus(`Server speech-to-text unavailable (${res.pipeline.sttStatus}). Tap a demo chip or fill the form manually.`, 'error');
            return;
          }
          transcriptEl.textContent = `“${res.extraction.transcript}”`;
          applyExtraction(
            res.extraction,
            res.pipeline.nluProvider === 'google-gemini' ? 'Whisper + Gemini' : 'Whisper + MandiMitra offline extractor'
          );
        } catch (err) {
          setStatus(`Transcription failed: ${err instanceof Error ? err.message : String(err)}`, 'error');
        }
      };

      recorder.start();
      setStatus(
        currentLang === 'hi-IN'
          ? '🔴 रिकॉर्डिंग जारी है... (Whisper AI सुन रहे हैं)'
          : '🔴 रेकॉर्डिंग सुरू आहे... (Whisper AI Listening)',
        'recording'
      );
      setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, 6000);
    } catch {
      setStatus('Microphone permission denied. Tap a demo chip or fill the form manually.', 'error');
    }
  }

  let listening = false;
  let gotResult = false;
  micBtn?.addEventListener('click', () => {
    if (listening) return;

    const recognition = getSpeechRecognition();
    if (recognition) {
      listening = true;
      gotResult = false;
      recognition.lang = currentLang;
      recognition.interimResults = true;   // Show live transcript as the farmer speaks
      recognition.maxAlternatives = 1;
      recognition.continuous = true;       // Don't stop on mid-sentence pauses

      if (currentLang === 'hi-IN') {
        setStatus('🔴 रिकॉर्डिंग जारी है... (Listening in Hindi)', 'recording');
      } else if (currentLang === 'en-IN') {
        setStatus('🔴 Recording in progress... (Listening in English)', 'recording');
      } else {
        setStatus('🔴 रेकॉर्डिंग सुरू आहे... (Listening in Marathi)', 'recording');
      }
      transcriptEl.textContent = '';

      let finalTranscript = '';

      // Auto-stop after 8 seconds of continuous listening and process accumulated transcript
      const autoStopTimer = setTimeout(() => {
        if (listening) {
          try { recognition.stop(); } catch { /* already stopped */ }
        }
      }, 8000);

      // Safety timeout: hard-stop if onend never fires (browser hang)
      const safetyTimer = setTimeout(() => {
        if (listening) {
          try { recognition.stop(); } catch { /* already stopped */ }
          listening = false;
          micBtn.classList.remove('is-recording');
          if (!gotResult && finalTranscript.trim()) {
            gotResult = true;
            void processTranscript(finalTranscript.trim(), 'web-speech');
          } else if (!gotResult) {
            setStatus(
              currentLang === 'hi-IN'
                ? '⏱️ समय समाप्त हो गया। फिर से बोलने के लिए माइक दबाएं, या नीचे डेमो चिप चुनें।'
                : '⏱️ Listening timed out. Tap the mic to try again, or use a demo chip below.',
              'error'
            );
          }
        }
      }, 12000);

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const chunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += chunk + ' ';
          } else {
            interim += chunk;
          }
        }
        // Live visual feedback: show what the mic is hearing in real-time
        const finalDisplay = finalTranscript.trim();
        const interimDisplay = interim.trim();
        transcriptEl.innerHTML =
          (finalDisplay ? `<span style="color: var(--color-text-main); font-weight: 700;">"${finalDisplay}"</span>` : '') +
          (interimDisplay ? `<span style="color: var(--color-text-muted); opacity: 0.6; font-style: italic;"> ${interimDisplay}</span>` : '');
      };

      recognition.onerror = (event: any) => {
        const code = event?.error || 'unknown';
        const friendlyMessagesHi: Record<string, string> = {
          'not-allowed': '🔇 माइक्रोफोन अनुमति अस्वीकृत। ब्राउज़र सेटिंग्स में अनुमति दें, या नीचे डेमो चिप टैप करें।',
          'network': '🌐 स्पीच सेवा उपलब्ध नहीं है (इंटरनेट आवश्यक)। नीचे डेमो चिप टैप करें।',
          'no-speech': '🔇 कोई आवाज नहीं पहचानी गई। कृपया स्पष्ट बोलें, या नीचे डेमो चिप टैप करें।',
          'audio-capture': '🎤 माइक्रोफोन नहीं मिला। नीचे डेमो चिप टैप करें।',
          'aborted': '',
          'service-not-allowed': '🔇 Speech service blocked by browser. Tap a demo chip below.'
        };
        const friendlyMessagesMr: Record<string, string> = {
          'not-allowed': '🔇 माइक्रोफोन एक्सेस नाकारला. ब्राउझर सेटिंग्जमध्ये अनुमती द्या, किंवा खाली एक नमुना टॅप करा.',
          'network': '🌐 स्पीच सर्व्हिस उपलब्ध नाही (इंटरनेट आवश्यक). खाली एक नमुना टॅप करा.',
          'no-speech': '🔇 बोलणे ओळखले नाही. पुन्हा स्पष्ट बोला, किंवा खाली एक नमुना टॅप करा.',
          'audio-capture': '🎤 माइक्रोफोन सापडला नाही. खाली एक नमुना टॅप करा.',
          'aborted': '',
          'service-not-allowed': '🔇 Speech service blocked by browser. Tap a demo chip below.'
        };
        const dict = currentLang === 'hi-IN' ? friendlyMessagesHi : friendlyMessagesMr;
        const msg = dict[code] || `Speech error (${code}). Tap a demo chip instead.`;
        if (msg) setStatus(msg, 'error');
        listening = false;
        micBtn.classList.remove('is-recording');
        clearTimeout(autoStopTimer);
        clearTimeout(safetyTimer);
      };

      recognition.onend = () => {
        clearTimeout(autoStopTimer);
        clearTimeout(safetyTimer);
        listening = false;
        micBtn.classList.remove('is-recording');
        // Process accumulated transcript
        if (finalTranscript.trim() && !gotResult) {
          gotResult = true;
          void processTranscript(finalTranscript.trim(), 'web-speech');
        } else if (!gotResult) {
          const current = statusEl.textContent || '';
          if (current.includes('रेकॉर्डिंग') || current.includes('Listening') || current.includes('रिकॉर्डिंग')) {
            setStatus(
              currentLang === 'hi-IN'
                ? '🔇 कोई आवाज नहीं पहचानी गई। दोबारा प्रयास करें या नीचे डेमो चिप चुनें।'
                : '🔇 बोलणे ओळखले नाही. पुन्हा प्रयत्न करा किंवा खाली नमुना टॅप करा.',
              'error'
            );
          }
        }
      };

      try {
        recognition.start();
      } catch {
        listening = false;
        clearTimeout(autoStopTimer);
        clearTimeout(safetyTimer);
        void recordAndTranscribe();
      }
    } else {
      void recordAndTranscribe();
    }
  });

  // Initial chip setup
  renderChips();

  // ==========================================================================
  // Submit
  // ==========================================================================
  const form = container.querySelector('#entry-form') as HTMLFormElement;
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const crop = cropSelect ? cropSelect.value : 'Onion';
    store.setSelectedCrop(crop);

    const qty = Math.max(0.5, parseFloat(qtyInput?.value || '25'));
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

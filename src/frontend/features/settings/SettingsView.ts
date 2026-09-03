/**
 * MandiMitra Feature: Farmer Logistics Settings View
 * Route: /settings
 * 
 * VerdaAgro Editorial Agricultural Redesign
 * 100% Preserves user cost updates, inputs, and form submission
 */

import { store } from '../../state/store';
import { formatCurrency, formatNumber, parseDevanagariNumber, toDevanagariDigits, Language } from '../../i18n';

export function renderSettingsView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'feature-settings-view';

  const state = store.getState();
  const lang: Language = state.language || 'mr';
  const config = state.costConfig;

  container.innerHTML = `
    <div class="editorial-panel" style="padding: var(--space-8); max-width: 800px; margin: 0 auto;">
      <div style="border-bottom: 1px solid var(--color-border-subtle); padding-bottom: var(--space-4); margin-bottom: var(--space-6);">
        <div class="kicker">${lang === 'mr' ? 'वाहतूक व खर्च सिम्युलेटर' : (lang === 'hi' ? 'परिवहन व लागत सिम्युलेटर' : 'LOGISTICS & COST SIMULATOR')}</div>
        <h2 class="heading-xl">
          ${lang === 'mr' ? 'शेती वाहतूक व साठवणूक गृहीतके' : (lang === 'hi' ? 'कृषि ढुलाई व भंडारण अनुमान' : 'Farm Logistics Assumptions')}
        </h2>
        <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); margin-top: 4px;">
          ${lang === 'mr'
            ? 'स्थानिक वाहने आणि साठवणूक सोयीनुसार वाहतूक भाडे व साठवणूक खर्च बदला.'
            : (lang === 'hi'
            ? 'स्थानीय वाहन व भंडारण व्यवस्था अनुसार ढुलाई भाड़ा व भंडारण खर्च बदलें.'
            : 'Tailor transport freight and crop holding costs to your local vehicle and storage arrangements.')}
        </p>
      </div>

      <form id="settings-form">
        
        <!-- Transport Cost Input -->
        <div class="form-group" style="margin-bottom: var(--space-5);">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
            <label class="input-label" for="input-transport-cost">
              ${lang === 'mr' ? 'वाहतूक भाडे दर (₹ प्रति किमी प्रति क्विंटल)' : (lang === 'hi' ? 'ढुलाई भाड़ा दर (₹ प्रति किमी प्रति क्विंटल)' : 'Transport Haulage Cost (₹ per km per quintal)')}
            </label>
            <span style="font-size: var(--font-size-xs); color: var(--color-brand-primary-dark); font-weight: 700;">
              ${lang === 'mr' ? `प्रादेशिक सरासरी: ${formatCurrency(config.transportCostPerKmPerQtl, lang, true)}` : (lang === 'hi' ? `क्षेत्रीय औसत: ${formatCurrency(config.transportCostPerKmPerQtl, lang, true)}` : `Regional Default: ₹${config.transportCostPerKmPerQtl.toFixed(2)}`)}
            </span>
          </div>
          <input 
            type="text" 
            inputmode="decimal"
            id="input-transport-cost" 
            class="input-field"
            style="font-family: var(--font-family-numbers); font-weight: 800;"
            value="${formatNumber(config.transportCostPerKmPerQtl, lang)}" 
          />
          <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 4px;">
            ${lang === 'mr'
              ? 'पिकअप किंवा ट्रॅक्टर ट्रॉलीचे इंधन व चालक खर्च प्रति किमी प्रति क्विंटल.'
              : (lang === 'hi'
              ? 'पिकअप या ट्रैक्टर ट्रॉली का ईंधन व चालक खर्च प्रति किमी प्रति क्विंटल.'
              : 'Covers pickup truck or tractor trolley fuel and driver cost per kilometer per quintal of produce.')}
          </div>
        </div>

        <!-- Storage & Holding Cost Input -->
        <div class="form-group" style="margin-bottom: var(--space-5);">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
            <label class="input-label" for="input-storage-cost">
              ${lang === 'mr' ? 'साठवणूक व टिकवण खर्च (₹ प्रति दिवस प्रति क्विंटल)' : (lang === 'hi' ? 'भंडारण व रखरखाव खर्च (₹ प्रति दिन प्रति क्विंटल)' : 'Holding & Storage Cost (₹ per day per quintal)')}
            </label>
            <span style="font-size: var(--font-size-xs); color: var(--color-brand-primary-dark); font-weight: 700;">
              ${lang === 'mr' ? `सरासरी: ${formatCurrency(config.storageCostPerDayPerQtl, lang, true)}` : (lang === 'hi' ? `औसत: ${formatCurrency(config.storageCostPerDayPerQtl, lang, true)}` : `Default: ₹${config.storageCostPerDayPerQtl.toFixed(2)}`)}
            </span>
          </div>
          <input 
            type="text" 
            inputmode="decimal"
            id="input-storage-cost" 
            class="input-field"
            style="font-family: var(--font-family-numbers); font-weight: 800;"
            value="${formatNumber(config.storageCostPerDayPerQtl, lang)}" 
          />
          <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 4px;">
            ${lang === 'mr'
              ? 'मालाचे नैसर्गिक वजन घटणे आणि गोदामाचे दैनंदिन भाडे.'
              : (lang === 'hi'
              ? 'फसल की प्राकृतिक वजन घटौती और गोदाम का दैनिक किराया.'
              : 'Models biological crop shrinkage, weight loss, and daily shed holding expenses.')}
          </div>
        </div>

        <!-- Search Radius Input -->
        <div class="form-group" style="margin-bottom: var(--space-8);">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
            <label class="input-label" for="input-radius">
              ${lang === 'mr' ? 'कमाल शोध अंतर (किलोमीटर)' : (lang === 'hi' ? 'अधिकतम खोज दायरा (किलोमीटर)' : 'Maximum Search Radius (Kilometers)')}
            </label>
            <span style="font-size: var(--font-size-xs); color: var(--color-brand-primary-dark); font-weight: 700;">
              ${lang === 'mr' ? `सरासरी: ${formatNumber(config.searchRadiusKm, lang)} किमी` : (lang === 'hi' ? `औसत: ${formatNumber(config.searchRadiusKm, lang)} किमी` : `Default: ${config.searchRadiusKm} km`)}
            </span>
          </div>
          <input 
            type="text" 
            inputmode="numeric"
            id="input-radius" 
            class="input-field"
            style="font-family: var(--font-family-numbers); font-weight: 800;"
            value="${formatNumber(config.searchRadiusKm, lang)}" 
          />
          <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 4px;">
            ${lang === 'mr'
              ? 'नफ्याची बाजारपेठ शोधण्यासाठी तुमच्या शेताभोवती विचारात घेतलेले कमाल अंतर.'
              : (lang === 'hi'
              ? 'लाभकारी मंडी खोजने हेतु आपके खेत के आसपास का अधिकतम दायरा.'
              : 'Maximum driving distance considered around your farm for finding profitable APMCs.')}
          </div>
        </div>

        <button type="submit" class="btn btn-primary btn-lg" id="btn-save-settings" style="width: 100%;">
          ${lang === 'mr' ? '✓ खर्च सेव्ह करा व नफा पुन्हा मोजा' : (lang === 'hi' ? '✓ सेटिंग्स सहेजें व लाभ दोबारा निकालें' : '✓ Save Settings & Recalculate Payouts')}
        </button>
      </form>
    </div>
  `;

  const transportInput = container.querySelector('#input-transport-cost') as HTMLInputElement;
  const storageInput = container.querySelector('#input-storage-cost') as HTMLInputElement;
  const radiusInput = container.querySelector('#input-radius') as HTMLInputElement;

  // Auto-convert typed ASCII digits to Devanagari numerals when in vernacular mode
  if (lang !== 'en') {
    [transportInput, storageInput, radiusInput].forEach(inp => {
      if (!inp) return;
      inp.addEventListener('input', () => {
        const start = inp.selectionStart;
        inp.value = toDevanagariDigits(inp.value);
        if (start !== null) {
          inp.setSelectionRange(start, start);
        }
      });
    });
  }

  const form = container.querySelector('#settings-form') as HTMLFormElement;
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      store.updateCostConfig({
        transportCostPerKmPerQtl: parseDevanagariNumber(transportInput.value) || 2.5,
        storageCostPerDayPerQtl: parseDevanagariNumber(storageInput.value) || 0.45,
        searchRadiusKm: parseDevanagariNumber(radiusInput.value) || 120.0
      });


      // Navigate back to hub
      store.setRoute('/hub');
    });
  }

  return container;
}

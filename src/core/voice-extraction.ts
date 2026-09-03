/**
 * MandiMitra Core: Agrarian Voice Slot Extraction & Unit Normalisation
 *
 * Deterministic, dependency-free extraction of {crop, quantity, unit, district} from spoken
 * Marathi / Hindi / English. This is BOTH:
 *   1. the offline fallback when OPENAI_API_KEY / GEMINI_API_KEY are unset (so a live demo can
 *      never fail with a 500), and
 *   2. the validator that repairs a partial LLM response — the LLM is never trusted to invent a
 *      crop or a district that is not in the canonical catalogues.
 *
 * Unit conversions (the critical step for Indian farmers, who speak in bags and crates):
 *   1 Bag / गोणी / बोरी            = 0.50 quintals (50 kg)
 *   1 Crate / क्रेट / पेटी          = 0.25 quintals (25 kg)
 *   1 Quintal / क्विंटल             = 1.00 quintal
 *   1 Tempo / छोटा हत्ती            = 12.0 quintals
 *   1 Trolley / ट्रॉली / ट्रॅक्टर    = 40.0 quintals
 */

import { ALL_CROPS, CropItem } from '../config/crops';
import { ALL_DISTRICTS, DistrictItem } from '../config/districts';
import { MAHARASHTRA_MANDIS } from '../data-pipeline/registry';

export type AgrarianUnit = 'Bags' | 'Crates' | 'Quintals' | 'Trolley' | 'Tempo';

export const UNIT_TO_QUINTALS: Record<AgrarianUnit, number> = {
  Bags: 0.5,
  Crates: 0.25,
  Quintals: 1.0,
  Tempo: 12.0,
  Trolley: 40.0
};

/** Spoken unit tokens across Marathi, Hindi and English. */
const UNIT_TOKENS: Array<{ unit: AgrarianUnit; tokens: string[] }> = [
  { unit: 'Bags', tokens: ['गोणी', 'गोण्या', 'गोणि', 'बोरी', 'बोरे', 'बोरा', 'बोर्या', 'बोरीया', 'बोरियां', 'कट्टा', 'कट्टे', 'कट्टी', 'पोते', 'पोती', 'पैकेट', 'पैकेट्स', 'bag', 'bags', 'goni', 'goniya', 'bori', 'bora', 'borey', 'boriyan', 'katta', 'katte', 'katti', 'packet', 'packets', 'sack', 'sacks'] },
  { unit: 'Crates', tokens: ['क्रेट', 'क्रेटस', 'क्रेट्स', 'पेटी', 'पेट्या', 'पेटियां', 'पेटियाँ', 'डब्बा', 'डब्बे', 'कार्टन', 'crate', 'crates', 'peti', 'pethi', 'petya', 'petiyan', 'box', 'boxes', 'carton', 'cartons'] },
  { unit: 'Trolley', tokens: ['ट्रॉली', 'ट्राली', 'ट्रॅक्टर', 'ट्रैक्टर', 'ट्रॅक्टरभर', 'ट्रैक्टरभर', 'ट्रालीभर', 'ट्रॉलीभर', 'trolley', 'trolly', 'tractor', 'trali'] },
  { unit: 'Tempo', tokens: ['टेम्पो', 'टेंपो', 'छोटा हत्ती', 'छोटा हाथी', 'छोटाहाथी', 'पिकअप', 'लोडर', 'tempo', 'chhota hathi', 'chota hathi', 'pickup', 'loader'] },
  { unit: 'Quintals', tokens: ['क्विंटल', 'क्विंटल्स', 'कुंटल', 'कुंतल', 'कुन्तल', 'क्वि.', 'quintal', 'quintals', 'qtl', 'quintaal', 'kuintal', 'kvintal', 'kuntal'] }
];

/** Spoken numerals, Marathi and Hindi (including standard, colloquial, and vowel-normalized spellings). */
const WORD_NUMBERS: Record<string, number> = {
  // 1-10
  'एक': 1, 'ek': 1,
  'दोन': 2, 'दो': 2, 'don': 2, 'do': 2,
  'तीन': 3, 'तिन': 3, 'teen': 3, 'tin': 3,
  'चार': 4, 'char': 4,
  'पाच': 5, 'पांच': 5, 'पाँच': 5, 'paach': 5, 'panch': 5,
  'सहा': 6, 'छह': 6, 'छः': 6, 'saha': 6, 'chhah': 6, 'chhe': 6,
  'सात': 7, 'saat': 7,
  'आठ': 8, 'aath': 8,
  'नऊ': 9, 'नौ': 9, 'nau': 9,
  'दहा': 10, 'दस': 10, 'daha': 10, 'das': 10,

  // 11-20
  'अकरा': 11, 'ग्यारह': 11, 'gyarah': 11,
  'बारा': 12, 'बारह': 12, 'barah': 12,
  'तेरा': 13, 'तेरह': 13, 'terah': 13,
  'चौदा': 14, 'चौदह': 14, 'chaudah': 14,
  'पंधरा': 15, 'पंद्रह': 15, 'पन्द्रह': 15, 'pandhra': 15, 'pandrah': 15,
  'सोळा': 16, 'सोलह': 16, 'solah': 16,
  'सतरा': 17, 'सत्रह': 17, 'satrah': 17,
  'अठरा': 18, 'अठारह': 18, 'अट्ठारह': 18, 'atharah': 18,
  'एकोणीस': 19, 'उन्नीस': 19, 'unnis': 19,
  'वीस': 20, 'विस': 20, 'बीस': 20, 'बिस': 20, 'vees': 20, 'bees': 20,

  // 21-30
  'एकवीस': 21, 'इक्कीस': 21, 'ikkis': 21,
  'बावीस': 22, 'बाईस': 22, 'baees': 22,
  'तेवीस': 23, 'तेईस': 23, 'teees': 23,
  'चोवीस': 24, 'चौबीस': 24, 'chaubees': 24,
  'पंचवीस': 25, 'पंचविस': 25, 'पच्चीस': 25, 'पच्चिस': 25, 'pachis': 25, 'pachees': 25,
  'सव्वीस': 26, 'छब्बीस': 26, 'chhabees': 26,
  'सत्तावीस': 27, 'सत्ताईस': 27, 'sattaees': 27,
  'अठ्ठावीस': 28, 'अट्ठाईस': 28, 'atthaees': 28,
  'एकोणतीस': 29, 'उनतीस': 29, 'untees': 29,
  'तीस': 30, 'तिस': 30, 'tees': 30,

  // 31-40
  'एकतीस': 31, 'इकतीस': 31,
  'बत्तीस': 32,
  'तेहेतीस': 33, 'तैंतीस': 33,
  'चौतीस': 34, 'चौंतीस': 34,
  'पस्तीस': 35, 'पैंतीस': 35, 'पैतिस': 35, 'पेंतीस': 35, 'paintis': 35,
  'छत्तीस': 36,
  'सदतीस': 37, 'सैंतीस': 37,
  'अडतीस': 38, 'अड़तीस': 38,
  'एकेचाळीस': 39, 'उनतालीस': 39, 'उनचालीस': 39,
  'चाळीस': 40, 'चाळिस': 40, 'चालीस': 40, 'चालिस': 40, 'chalis': 40,

  // 41-50
  'पंचेचाळीस': 45, 'पैंतालीस': 45, 'पैतालिस': 45, 'paintalis': 45,
  'पन्नास': 50, 'पचास': 50, 'pannas': 50, 'pachas': 50,

  // 51-100
  'साठ': 60, 'saath': 60,
  'सत्तर': 70, 'sattar': 70,
  'ऐंशी': 80, 'अस्सी': 80, 'अस्सि': 80, 'assi': 80,
  'नव्वद': 90, 'नब्बे': 90, 'nabbe': 90,
  'शंभर': 100, 'सौ': 100, 'shambhar': 100, 'sau': 100,

  // Colloquial spoken fractions / amounts
  'डेढ़': 1.5, 'देढ़': 1.5, 'dedh': 1.5,
  'ढाई': 2.5, 'dhai': 2.5
};

/** Additional colloquial crop names not present in the catalogue's own Marathi/Hindi labels. */
const CROP_SYNONYMS: Record<string, string[]> = {
  'Onion': ['kanda', 'kandaa', 'pyaz', 'pyaaz', 'pyaaj', 'कांदे', 'कांद्या', 'कांद्याचा', 'प्याज़', 'प्याज', 'कान्दा', 'लाल प्याज', 'लाल कांदा'],
  'Tomato': ['tamatar', 'tomato', 'टमाटे', 'टोमेटो', 'टमाटर', 'टमाटा', 'tamata', 'लाल टमाटर'],
  'Soyabean': ['soyabean', 'soybean', 'soya', 'सोयाबिन', 'सोयबीन', 'सोयाबीनचा', 'soybin', 'सोयाबीन', 'सोया'],
  'Wheat': ['gehu', 'gehun', 'gahu', 'gahun', 'गेहूं', 'गेहू', 'गव्हा', 'गहु', 'गव्ह', 'कनक'],
  'Potato': ['batata', 'aalu', 'alu', 'aaloo', 'बटाटे', 'बटाट्या', 'बटाटा', 'आलू', 'आलु'],
  'Bengal Gram(Gram)(Whole)': ['chana', 'harbara', 'हरभरा', 'चना', 'चने', 'काला चना', 'काबुली चना', 'छोला', 'bengal gram', 'gram', 'हरभऱ्या', 'चणा', 'chanaa'],
  'Pomegranate': ['dalimb', 'anar', 'डाळींब', 'डाळिंब', 'अनार', 'दाड़िम'],
  'Grapes': ['draksha', 'angur', 'द्राक्ष', 'द्राक्षे', 'अंगूर', 'angoor', 'अंगुर'],
  'Maize': ['makka', 'maka', 'मक्याचे', 'मक्का', 'मका', 'मक्याच', 'मक्के', 'भुट्टा', 'मकई', 'bhutta'],
  'Turmeric': ['halad', 'haldi', 'हळद', 'हल्दी', 'हळदी'],
  'Green Chilli': ['mirchi', 'mirch', 'hirvi mirchi', 'मिर्ची', 'हिरवी मिरची', 'मिरच्या', 'हरी मिर्च', 'हरी मिर्ची', 'मिर्च', 'hari mirch'],
  'Red gram/Arhar/Tur(whole)': ['तूर', 'तुर', 'तूरडाळ', 'toor', 'turdal', 'arhar', 'tur', 'अरहर', 'तुअर', 'अरहर दाल'],
  'Jowar(Sorghum)': ['ज्वारी', 'जोंधळा', 'ज्वार', 'jowar', 'jwari', 'jondhal'],
  'Bajra(Pearl Millet/Cumbu)': ['बाजरी', 'बाजरा', 'bajra', 'bajri', 'bajari'],
  'Groundnut': ['भुईमूग', 'शेंगदाणा', 'मूंगफली', 'मुंगफली', 'मूँगफली', 'moongfali', 'shengdana', 'groundnut', 'मूंगफली दाना']
};

// ============================================================================
// Text normalisation helpers
// ============================================================================

/**
 * Normalize Devanagari long/short vowel marks so 'सोलापुर' matches 'सोलापूर',
 * 'नासिक' matches 'नासीक', etc. This dramatically improves fuzzy matching.
 */
export function normalizeDevanagariVowels(text: string): string {
  return (text || '')
    .replace(/ू/g, 'ु')   // long uu → short u
    .replace(/ी/g, 'ि')   // long ii → short i
    .replace(/ॉ/g, 'ो')   // candra o → o (ट्रॉली → ट्रोली)
    .replace(/ॅ/g, 'े')   // candra e → e
    .replace(/़/g, '')     // nuqta removal (प्याज़ → प्याज)
    .replace(/ँ/g, 'ं');   // chandrabindu → anusvara
}

// ============================================================================
// Lexicon construction (built once from the canonical catalogues)
// ============================================================================

interface LexiconEntry {
  token: string;
  canonicalId: string;
}

function pushToken(list: LexiconEntry[], token: string, canonicalId: string): void {
  const t = (token || '').trim().toLowerCase();
  if (t.length < 2) return;
  list.push({ token: t, canonicalId });
  const norm = normalizeDevanagariVowels(t);
  if (norm !== t && norm.length >= 2) {
    list.push({ token: norm, canonicalId });
  }
}

let cropLexicon: LexiconEntry[] | null = null;
let districtLexicon: LexiconEntry[] | null = null;
let talukaToDistrict: LexiconEntry[] | null = null;

function buildCropLexicon(): LexiconEntry[] {
  if (cropLexicon) return cropLexicon;
  const list: LexiconEntry[] = [];
  for (const c of ALL_CROPS) {
    pushToken(list, c.id, c.id);
    pushToken(list, c.nameEn, c.id);
    pushToken(list, c.nameMr, c.id);
    pushToken(list, c.nameHi, c.id);
    // Leading token of a compound Agmarknet name, e.g. "Bengal Gram(Gram)(Whole)" -> "bengal gram"
    const base = c.id.split('(')[0].trim();
    pushToken(list, base, c.id);
  }
  // Only register a synonym when its target actually exists in the catalogue, so the extractor
  // can never resolve to a commodity MandiMitra has no price for.
  const knownIds = new Set(ALL_CROPS.map(c => c.id));
  for (const [cropId, synonyms] of Object.entries(CROP_SYNONYMS)) {
    if (!knownIds.has(cropId)) continue;
    for (const s of synonyms) pushToken(list, s, cropId);
  }
  // Longest tokens first so "green chilli" beats "chilli" and "onion green" beats "onion".
  list.sort((a, b) => b.token.length - a.token.length);
  cropLexicon = list;
  return list;
}

function buildDistrictLexicon(): LexiconEntry[] {
  if (districtLexicon) return districtLexicon;
  const list: LexiconEntry[] = [];
  for (const d of ALL_DISTRICTS) {
    pushToken(list, d.name, d.name);
    pushToken(list, d.nameMr, d.name);
    // Vowel-normalized form of the Marathi label
    pushToken(list, normalizeDevanagariVowels(d.nameMr), d.name);
    // Marathi labels sometimes carry the historical name in brackets.
    const bracketed = /\(([^)]+)\)/.exec(d.nameMr);
    if (bracketed) pushToken(list, bracketed[1], d.name);
    pushToken(list, d.nameMr.replace(/\([^)]*\)/g, '').trim(), d.name);
  }
  // Historical / alternate district names still in everyday speech.
  pushToken(list, 'ahmednagar', 'Ahilyanagar');
  pushToken(list, 'अहमदनगर', 'Ahilyanagar');
  pushToken(list, 'अहमदनगरात', 'Ahilyanagar');
  pushToken(list, 'अहिल्यानगर', 'Ahilyanagar');
  pushToken(list, 'aurangabad', 'Chhatrapati Sambhajinagar');
  pushToken(list, 'औरंगाबाद', 'Chhatrapati Sambhajinagar');
  pushToken(list, 'sambhajinagar', 'Chhatrapati Sambhajinagar');
  pushToken(list, 'छत्रपति संभाजीनगर', 'Chhatrapati Sambhajinagar');
  pushToken(list, 'संभाजीनगर', 'Chhatrapati Sambhajinagar');
  pushToken(list, 'osmanabad', 'Dharashiv');
  pushToken(list, 'उस्मानाबाद', 'Dharashiv');
  pushToken(list, 'धाराशिव', 'Dharashiv');
  pushToken(list, 'nasik', 'Nashik');
  pushToken(list, 'नाशिक', 'Nashik');
  pushToken(list, 'नासिक', 'Nashik');  // स vs श confusion in Speech API
  pushToken(list, 'poona', 'Pune');
  pushToken(list, 'पूना', 'Pune');
  pushToken(list, 'mumbai', 'Mumbai Suburban');
  pushToken(list, 'मुंबई', 'Mumbai Suburban');
  pushToken(list, 'बम्बई', 'Mumbai Suburban');
  pushToken(list, 'जलगांव', 'Jalgaon');
  pushToken(list, 'जलगाँव', 'Jalgaon');
  pushToken(list, 'धुलिया', 'Dhule');
  pushToken(list, 'नांदेड़', 'Nanded');
  pushToken(list, 'रायगढ', 'Raigad');
  pushToken(list, 'रायगढ़', 'Raigad');
  pushToken(list, 'गढ़चिरौली', 'Gadchiroli');
  pushToken(list, 'गडचिरोली', 'Gadchiroli');
  pushToken(list, 'बुलढाना', 'Buldhana');
  pushToken(list, 'परभनी', 'Parbhani');
  pushToken(list, 'लातुर', 'Latur');
  pushToken(list, 'लातूर', 'Latur');

  // Oblique / stripped stems produced by suffix-stripping
  pushToken(list, 'पुण्य', 'Pune');         // पुण्यात → पुण्य
  pushToken(list, 'धुळ्य', 'Dhule');        // धुळ्यात → धुळ्य
  pushToken(list, 'धुळे', 'Dhule');
  pushToken(list, 'धुले', 'Dhule');
  pushToken(list, 'सातार', 'Satara');       // सातारात → सातार
  pushToken(list, 'अकोल', 'Akola');         // अकोल्यात → अकोल
  pushToken(list, 'जालन', 'Jalna');         // जालन्यात → जालन
  pushToken(list, 'भंडार', 'Bhandara');     // भंडाऱ्यात → भंडार
  pushToken(list, 'बुलढाण', 'Buldhana');    // बुलढाण्यात → बुलढाण
  // Vowel-normalized forms (long→short vowel)
  pushToken(list, 'सोलापुर', 'Solapur');    // सोलापूर → सोलापुर
  pushToken(list, 'कोल्हापुर', 'Kolhapur'); // कोल्हापूर → कोल्हापुर
  pushToken(list, 'नागपुर', 'Nagpur');      // नागपूर → नागपुर
  pushToken(list, 'चंद्रपुर', 'Chandrapur');
  pushToken(list, 'गोंदिया', 'Gondia');
  pushToken(list, 'गोंदीया', 'Gondia');

  list.sort((a, b) => b.token.length - a.token.length);
  districtLexicon = list;
  return list;
}

/**
 * Taluka / mandi-town names mapped to their district, derived from the canonical APMC registry
 * plus the well-known onion-belt talukas farmers actually name in speech.
 */
function buildTalukaLexicon(): LexiconEntry[] {
  if (talukaToDistrict) return talukaToDistrict;
  const list: LexiconEntry[] = [];

  for (const m of MAHARASHTRA_MANDIS) {
    const base = m.name.replace(/\([^)]*\)/g, '').trim();
    pushToken(list, base, m.district);
    const paren = /\(([^)]+)\)/.exec(m.name);
    if (paren) pushToken(list, paren[1].replace(/apmc/i, '').trim(), m.district);
  }

  const extraTalukas: Array<[string, string]> = [
    ['niphad', 'Nashik'], ['निफाड', 'Nashik'], ['निफाड़', 'Nashik'],
    ['dindori', 'Nashik'], ['दिंडोरी', 'Nashik'], ['दिण्डोरी', 'Nashik'],
    ['vinchur', 'Nashik'], ['विंचूर', 'Nashik'],
    ['satana', 'Nashik'], ['सटाणा', 'Nashik'], ['सटाना', 'Nashik'],
    ['kalwan', 'Nashik'], ['कळवण', 'Nashik'],
    ['malegaon', 'Nashik'], ['मालेगाव', 'Nashik'], ['मालेगाँव', 'Nashik'],
    ['junnar', 'Pune'], ['जुन्नर', 'Pune'],
    ['narayangaon', 'Pune'], ['नारायणगाव', 'Pune'], ['नारायणगाँव', 'Pune'],
    ['otur', 'Pune'], ['ओतूर', 'Pune'],
    ['sangamner', 'Ahilyanagar'], ['संगमनेर', 'Ahilyanagar'],
    ['kopargaon', 'Ahilyanagar'], ['कोपरगाव', 'Ahilyanagar'],
    ['rahata', 'Ahilyanagar'], ['राहाता', 'Ahilyanagar'],
    ['shrirampur', 'Ahilyanagar'], ['श्रीरामपूर', 'Ahilyanagar'],
    ['udgir', 'Latur'], ['उदगीर', 'Latur'],
    ['ausa', 'Latur'], ['औसा', 'Latur'],
    ['pandharpur', 'Solapur'], ['पंढरपूर', 'Solapur'], ['पंढरपुर', 'Solapur'],
    ['akluj', 'Solapur'], ['अकलूज', 'Solapur'],
    ['kamthi', 'Nagpur'], ['कामठी', 'Nagpur'],
    ['katol', 'Nagpur'], ['कातोल', 'Nagpur'],
    ['lasalgaon', 'Nashik'], ['लासलगाव', 'Nashik'], ['लासलगाँव', 'Nashik'],
    ['pimpalgaon', 'Nashik'], ['पिंपळगाव', 'Nashik'], ['पिम्पलगांव', 'Nashik'], ['पिंपलगांव', 'Nashik']
  ];
  for (const [token, district] of extraTalukas) pushToken(list, token, district);

  list.sort((a, b) => b.token.length - a.token.length);
  talukaToDistrict = list;
  return list;
}

/** Test hook: rebuild lexicons (used after catalogue edits). */
export function resetVoiceLexicons(): void {
  cropLexicon = null;
  districtLexicon = null;
  talukaToDistrict = null;
}

// ============================================================================
// Text normalisation
// ============================================================================

const DEVANAGARI_DIGITS: Record<string, string> = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
};

/**
 * Marathi grammatical suffixes that get appended to place/crop names in natural speech.
 * Ordered longest-first so 'मधल्या' is stripped before 'मध'.
 */
const MARATHI_SUFFIXES = [
  'मधल्या', 'मध्ये', 'मधून', 'मधे', 'पासून',
  'याकडे', 'याजवळ',
  'ात', 'ला', 'हून',
  'च्या', 'चे', 'ची', 'ने',
  'कडे', 'जवळ',
];

/**
 * Hindi postpositions and colloquial suffixes that get appended to place/unit/crop names.
 * Ordered longest-first so compound/longer endings match before shorter ones.
 */
const HINDI_SUFFIXES = [
  'वाले', 'वाली', 'वाला',
  'भर',
  'में', 'मे', 'पर', 'पे',
  'से', 'को',
  'का', 'के', 'की',
];

/** Strip Marathi locative / oblique / genitive suffixes from each word. */
function stripMarathiSuffixes(text: string): string {
  const words = text.split(/\s+/);
  const stripped = words.map(w => {
    for (const suffix of MARATHI_SUFFIXES) {
      // Only strip if the remaining stem is at least 2 characters
      if (w.endsWith(suffix) && w.length > suffix.length + 2) {
        return w.slice(0, -suffix.length);
      }
    }
    return w;
  });
  return stripped.join(' ');
}

/** Strip Hindi postpositions and suffixes from each word. */
function stripHindiSuffixes(text: string): string {
  const words = text.split(/\s+/);
  const stripped = words.map(w => {
    // Preserve root agrarian words that must never be stripped
    if (w === 'मक्का' || w === 'मका' || w === 'छोका' || w === 'पक्का') {
      return w;
    }
    for (const suffix of HINDI_SUFFIXES) {
      // Only strip if the remaining stem is at least 2 characters
      if (w.endsWith(suffix) && w.length > suffix.length + 2) {
        const stem = w.slice(0, -suffix.length);
        // Do not strip if stem ends in a virama/halant (consonant conjunct like 'क्क')
        if (stem.endsWith('\u094d')) {
          continue;
        }
        return stem;
      }
    }
    return w;
  });
  return stripped.join(' ');
}

export function normalizeSpokenText(raw: string): string {
  let s = (raw || '').toLowerCase();
  // Step 1: Devanagari digits → ASCII
  s = s.replace(/[०-९]/g, ch => DEVANAGARI_DIGITS[ch] || ch);
  // Step 2: Strip punctuation
  s = s.replace(/[,\.!?;:"']/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  // Step 3: Normalize Devanagari vowels for fuzzy matching
  s = normalizeDevanagariVowels(s);
  // Step 4: Strip Marathi grammatical suffixes
  s = stripMarathiSuffixes(s);
  // Step 5: Strip Hindi postpositions & suffixes
  s = stripHindiSuffixes(s);
  // Re-clean whitespace after stripping
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function findLexiconMatch(text: string, lexicon: LexiconEntry[]): { canonicalId: string; token: string } | null {
  for (const entry of lexicon) {
    if (text.includes(entry.token)) {
      return { canonicalId: entry.canonicalId, token: entry.token };
    }
  }
  return null;
}

// ============================================================================
// Extraction
// ============================================================================

export interface VoiceExtraction {
  transcript: string;
  crop: string | null;
  cropDisplay: string | null;
  originalQuantity: number | null;
  originalUnit: AgrarianUnit | null;
  quantityQuintals: number | null;
  district: string | null;
  districtDisplay: string | null;
  displaySummaryMr: string;
  displaySummaryHi: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  matched: {
    cropToken: string | null;
    unitToken: string | null;
    districtToken: string | null;
    districtVia: 'district' | 'taluka' | null;
  };
  warnings: string[];
}

function findCrop(text: string): { item: CropItem | null; token: string | null } {
  const hit = findLexiconMatch(text, buildCropLexicon());
  if (!hit) return { item: null, token: null };
  const item = ALL_CROPS.find(c => c.id === hit.canonicalId) || null;
  return { item, token: hit.token };
}

function findDistrict(text: string): { item: DistrictItem | null; token: string | null; via: 'district' | 'taluka' | null } {
  const direct = findLexiconMatch(text, buildDistrictLexicon());
  if (direct) {
    const item = ALL_DISTRICTS.find(d => d.name === direct.canonicalId) || null;
    if (item) return { item, token: direct.token, via: 'district' };
  }
  const viaTaluka = findLexiconMatch(text, buildTalukaLexicon());
  if (viaTaluka) {
    const item = ALL_DISTRICTS.find(d => d.name === viaTaluka.canonicalId) || null;
    if (item) return { item, token: viaTaluka.token, via: 'taluka' };
  }
  return { item: null, token: null, via: null };
}

function findUnit(text: string): { unit: AgrarianUnit | null; token: string | null } {
  for (const group of UNIT_TOKENS) {
    for (const token of group.tokens) {
      const lower = token.toLowerCase();
      if (text.includes(lower)) {
        return { unit: group.unit, token: lower };
      }
      const norm = normalizeDevanagariVowels(lower);
      if (text.includes(norm)) {
        return { unit: group.unit, token: norm };
      }
    }
  }
  return { unit: null, token: null };
}

/**
 * Picks the quantity: prefers a numeral adjacent to the unit token, then any numeral,
 * then a spoken number word.
 */
function findQuantity(text: string, unitToken: string | null): number | null {
  if (unitToken) {
    const escaped = unitToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const before = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:\\S+\\s+){0,2}?${escaped}`);
    const after = new RegExp(`${escaped}\\s*(?:\\S+\\s+){0,2}?(\\d+(?:\\.\\d+)?)`);
    const m1 = before.exec(text);
    if (m1) return parseFloat(m1[1]);
    const m2 = after.exec(text);
    if (m2) return parseFloat(m2[1]);
  }

  const anyNumber = /(\d+(?:\.\d+)?)/.exec(text);
  if (anyNumber) return parseFloat(anyNumber[1]);

  // Check whole words first
  const words = text.split(/\s+/);
  for (const w of words) {
    if (w in WORD_NUMBERS) return WORD_NUMBERS[w];
  }
  // Check substring matches longest first (prevents 'दो' matching inside 'दोन')
  const sortedWordEntries = Object.entries(WORD_NUMBERS).sort((a, b) => b[0].length - a[0].length);
  for (const [word, value] of sortedWordEntries) {
    if (text.includes(word)) return value;
  }
  return null;
}

/**
 * Deterministic extraction of the four agrarian slots. Never throws.
 */
export function extractAgrarianSlots(rawText: string): VoiceExtraction {
  const transcript = (rawText || '').trim();
  const text = normalizeSpokenText(transcript);
  const warnings: string[] = [];

  const { item: cropItem, token: cropToken } = findCrop(text);
  const { item: districtItem, token: districtToken, via } = findDistrict(text);
  const { unit, token: unitToken } = findUnit(text);
  const quantity = findQuantity(text, unitToken);

  const effectiveUnit: AgrarianUnit | null = unit || (quantity !== null ? 'Quintals' : null);
  if (!unit && quantity !== null) {
    warnings.push('No unit was spoken; the number was read as quintals.');
  }

  const quantityQuintals = (quantity !== null && effectiveUnit)
    ? Math.round(quantity * UNIT_TO_QUINTALS[effectiveUnit] * 100) / 100
    : null;

  if (!cropItem) warnings.push('No commodity from the 99-crop Maharashtra catalogue was recognised.');
  if (!districtItem) warnings.push('No Maharashtra district or taluka was recognised.');
  if (quantity === null) warnings.push('No quantity was recognised.');

  const filled = [cropItem, districtItem, quantityQuintals].filter(Boolean).length;
  const confidence: 'HIGH' | 'MEDIUM' | 'LOW' = filled === 3 ? 'HIGH' : filled === 2 ? 'MEDIUM' : 'LOW';

  const unitLabelMr: Record<AgrarianUnit, string> = {
    Bags: 'गोणी',
    Crates: 'क्रेट',
    Quintals: 'क्विंटल',
    Tempo: 'टेम्पो',
    Trolley: 'ट्रॉली'
  };

  const unitLabelHi: Record<AgrarianUnit, string> = {
    Bags: 'बोरी',
    Crates: 'क्रेट',
    Quintals: 'क्विंटल',
    Tempo: 'टेम्पो',
    Trolley: 'ट्रॉली'
  };

  const parts: string[] = [];
  if (cropItem) parts.push(cropItem.nameMr);
  if (quantity !== null && effectiveUnit) {
    parts.push(
      effectiveUnit === 'Quintals'
        ? `${quantity} क्विंटल`
        : `${quantity} ${unitLabelMr[effectiveUnit]} (${quantityQuintals} क्विंटल)`
    );
  }
  if (districtItem) parts.push(districtItem.nameMr);

  const partsHi: string[] = [];
  if (cropItem) partsHi.push(cropItem.nameHi || cropItem.nameEn);
  if (quantity !== null && effectiveUnit) {
    partsHi.push(
      effectiveUnit === 'Quintals'
        ? `${quantity} क्विंटल`
        : `${quantity} ${unitLabelHi[effectiveUnit]} (${quantityQuintals} क्विंटल)`
    );
  }
  if (districtItem) partsHi.push(districtItem.displayName.split('(')[0].trim());

  return {
    transcript,
    crop: cropItem ? cropItem.id : null,
    cropDisplay: cropItem ? cropItem.displayName : null,
    originalQuantity: quantity,
    originalUnit: effectiveUnit,
    quantityQuintals,
    district: districtItem ? districtItem.name : null,
    districtDisplay: districtItem ? districtItem.displayName : null,
    displaySummaryMr: parts.length > 0 ? parts.join(' • ') : 'काहीही ओळखता आले नाही',
    displaySummaryHi: partsHi.length > 0 ? partsHi.join(' • ') : 'कुछ भी पहचाना नहीं जा सका',
    confidence,
    matched: {
      cropToken,
      unitToken,
      districtToken,
      districtVia: via
    },
    warnings
  };
}

/**
 * Repairs / validates a raw LLM extraction against the canonical catalogues.
 * Any slot the LLM leaves blank or fills with an unknown value is recomputed deterministically,
 * so the response can never contain a crop or district MandiMitra cannot actually price.
 */
export function reconcileLlmExtraction(
  transcript: string,
  llm: Partial<{
    crop: string;
    originalQuantity: number;
    originalUnit: string;
    quantityQuintals: number;
    district: string;
    displaySummaryMr: string;
    displaySummaryHi: string;
  }>
): VoiceExtraction {
  const deterministic = extractAgrarianSlots(transcript);

  const cropMatch = llm.crop
    ? ALL_CROPS.find(c => c.id.toLowerCase() === String(llm.crop).toLowerCase()
        || c.nameEn.toLowerCase() === String(llm.crop).toLowerCase())
    : undefined;
  const districtMatch = llm.district
    ? ALL_DISTRICTS.find(d => d.name.toLowerCase() === String(llm.district).toLowerCase())
    : undefined;

  const unitValid = llm.originalUnit && (llm.originalUnit in UNIT_TO_QUINTALS)
    ? (llm.originalUnit as AgrarianUnit)
    : null;

  const crop = cropMatch || (deterministic.crop ? ALL_CROPS.find(c => c.id === deterministic.crop) : undefined);
  const district = districtMatch || (deterministic.district ? ALL_DISTRICTS.find(d => d.name === deterministic.district) : undefined);
  const originalUnit = unitValid || deterministic.originalUnit;
  const originalQuantity = Number.isFinite(llm.originalQuantity as number)
    ? Number(llm.originalQuantity)
    : deterministic.originalQuantity;

  // The conversion is ALWAYS recomputed locally; an LLM arithmetic slip must never reach a farmer.
  const quantityQuintals = (originalQuantity !== null && originalQuantity !== undefined && originalUnit)
    ? Math.round(originalQuantity * UNIT_TO_QUINTALS[originalUnit] * 100) / 100
    : deterministic.quantityQuintals;

  const warnings = [...deterministic.warnings];
  if (llm.quantityQuintals !== undefined && quantityQuintals !== null
      && Math.abs(Number(llm.quantityQuintals) - quantityQuintals) > 0.01) {
    warnings.push(
      `LLM reported ${llm.quantityQuintals} quintals; MandiMitra recomputed ${quantityQuintals} from ${originalQuantity} ${originalUnit} and used its own figure.`
    );
  }

  const filled = [crop, district, quantityQuintals].filter(Boolean).length;

  const unitLabelMr: Record<AgrarianUnit, string> = {
    Bags: 'गोणी', Crates: 'क्रेट', Quintals: 'क्विंटल', Tempo: 'टेम्पो', Trolley: 'ट्रॉली'
  };
  const unitLabelHi: Record<AgrarianUnit, string> = {
    Bags: 'बोरी', Crates: 'क्रेट', Quintals: 'क्विंटल', Tempo: 'टेम्पो', Trolley: 'ट्रॉली'
  };

  const parts: string[] = [];
  if (crop) parts.push(crop.nameMr);
  if (originalQuantity !== null && originalQuantity !== undefined && originalUnit) {
    parts.push(
      originalUnit === 'Quintals'
        ? `${originalQuantity} क्विंटल`
        : `${originalQuantity} ${unitLabelMr[originalUnit]} (${quantityQuintals} क्विंटल)`
    );
  }
  if (district) parts.push(district.nameMr);

  const partsHi: string[] = [];
  if (crop) partsHi.push(crop.nameHi || crop.nameEn);
  if (originalQuantity !== null && originalQuantity !== undefined && originalUnit) {
    partsHi.push(
      originalUnit === 'Quintals'
        ? `${originalQuantity} क्विंटल`
        : `${originalQuantity} ${unitLabelHi[originalUnit]} (${quantityQuintals} क्विंटल)`
    );
  }
  if (district) partsHi.push(district.displayName.split('(')[0].trim());

  return {
    transcript,
    crop: crop ? crop.id : null,
    cropDisplay: crop ? crop.displayName : null,
    originalQuantity: originalQuantity ?? null,
    originalUnit: originalUnit ?? null,
    quantityQuintals,
    district: district ? district.name : null,
    districtDisplay: district ? district.displayName : null,
    displaySummaryMr: parts.length > 0 ? parts.join(' • ') : (llm.displaySummaryMr || 'काहीही ओळखता आले नाही'),
    displaySummaryHi: partsHi.length > 0 ? partsHi.join(' • ') : (llm.displaySummaryHi || 'कुछ भी पहचाना नहीं जा सका'),
    confidence: filled === 3 ? 'HIGH' : filled === 2 ? 'MEDIUM' : 'LOW',
    matched: deterministic.matched,
    warnings
  };
}

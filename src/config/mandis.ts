/**
 * MandiMitra: Central Mandi and Geographic Localization Registry
 * 
 * Provides authentic vernacular translations for all 82+ Maharashtra APMC mandis,
 * major districts, states, policy actions, and commodities in Marathi and Hindi.
 */

export type AppLanguage = 'en' | 'mr' | 'hi';

export interface MandiTranslation {
  mr: string;
  hi: string;
}

/**
 * Comprehensive dictionary for all Maharashtra APMCs, terminal hubs, and sub-mandis.
 */
export const MANDI_NAME_MAP: Record<string, MandiTranslation> = {
  // Nashik Division
  'lasalgaon': { mr: 'लासलगाव', hi: 'लासलगांव' },
  'lasalgaon apmc': { mr: 'लासलगाव बाजार समिती', hi: 'लासलगांव मंडी' },
  'pimpalgaon': { mr: 'पिंपळगाव', hi: 'पिंपलगांव' },
  'pimpalgaon baswant': { mr: 'पिंपळगाव बसवंत', hi: 'पिंपलगांव बसवंत' },
  'pimpalgaon baswant apmc': { mr: 'पिंपळगाव बसवंत बाजार समिती', hi: 'पिंपलगांव बसवंत मंडी' },
  'pimpalgaon (baswant)': { mr: 'पिंपळगाव बसवंत', hi: 'पिंपलगांव बसवंत' },
  'nashik': { mr: 'नाशिक', hi: 'नासिक' },
  'nashik (dindori road)': { mr: 'नाशिक (दिंडोरी रोड)', hi: 'नासिक (दिंडोरी रोड)' },
  'nashik apmc': { mr: 'नाशिक बाजार समिती', hi: 'नासिक मंडी' },
  'dindori': { mr: 'दिंडोरी', hi: 'दिंडोरी' },
  'dindori road': { mr: 'दिंडोरी रोड', hi: 'दिंडोरी रोड' },
  'manmad': { mr: 'मनमाड', hi: 'मनमाड' },
  'sinnar': { mr: 'सिन्नर', hi: 'सिन्नर' },
  'yeola': { mr: 'येवला', hi: 'येवला' },
  'kalwan': { mr: 'कळवण', hi: 'कलवण' },
  'satana': { mr: 'सटाणा', hi: 'सटाणा' },
  'malegaon': { mr: 'मालेगाव', hi: 'मालेगांव' },
  'niphad': { mr: 'निफाड', hi: 'निफाड' },
  'vinchur': { mr: 'विंचूर', hi: 'विंचूर' },
  'mohadi': { mr: 'मोहाडी', hi: 'मोहाडी' },

  // Ahilyanagar (Ahmednagar)
  'ahmednagar': { mr: 'अहिल्यानगर', hi: 'अहिल्यानगर' },
  'ahilyanagar': { mr: 'अहिल्यानगर', hi: 'अहिल्यानगर' },
  'rahata': { mr: 'रहाता', hi: 'रहाता' },
  'sangamner': { mr: 'संगमनेर', hi: 'संगमनेर' },
  'kopargaon': { mr: 'कोपरगाव', hi: 'कोपरगांव' },
  'shrirampur': { mr: 'श्रीरामपूर', hi: 'श्रीरामपुर' },
  'newasa': { mr: 'नेवासा', hi: 'नेवासा' },
  'shevgaon': { mr: 'शेवगाव', hi: 'शेवगांव' },
  'pathardi': { mr: 'पाथर्डी', hi: 'पाथर्डी' },
  'parner': { mr: 'पारनेर', hi: 'पारनेर' },
  'karjat': { mr: 'कर्जत', hi: 'कर्जत' },
  'jamkhed': { mr: 'जामखेड', hi: 'जामखेड' },
  'belapur': { mr: 'बेलापूर', hi: 'बेलापूर' },

  // Jalgaon & Dhule & Nandurbar
  'jalgaon': { mr: 'जळगाव', hi: 'जलगांव' },
  'raver': { mr: 'रावेर', hi: 'रावेर' },
  'chalisgaon': { mr: 'चाळीसगाव', hi: 'चालीसगांव' },
  'chopda': { mr: 'चोपडा', hi: 'चोपड़ा' },
  'pachora': { mr: 'पाचोरा', hi: 'पाचोरा' },
  'dhule': { mr: 'धुळे', hi: 'धुले' },
  'dondaicha': { mr: 'दोंडाईचा', hi: 'दोंडाईचा' },
  'shirpur': { mr: 'शिरपूर', hi: 'शिरपुर' },
  'nandurbar': { mr: 'नंदुरबार', hi: 'नंदुरबार' },
  'shahada': { mr: 'शहादा', hi: 'शहादा' },

  // Pune Division
  'pune': { mr: 'पुणे', hi: 'पुणे' },
  'pune (gultekdi)': { mr: 'पुणे (गुलटेकडी)', hi: 'पुणे (गुलटेकड़ी)' },
  'gultekdi': { mr: 'गुलटेकडी', hi: 'गुलटेकड़ी' },
  'junnar': { mr: 'जुन्नर', hi: 'जुन्नर' },
  'narayangaon': { mr: 'नारायणगाव', hi: 'नारायणगांव' },
  'junnar (narayangaon)': { mr: 'जुन्नर (नारायणगाव)', hi: 'जुन्नर (नारायणगांव)' },
  'baramati': { mr: 'बारामती', hi: 'बारामती' },
  'khed': { mr: 'खेड', hi: 'खेड' },
  'chakan': { mr: 'चाकण', hi: 'चाकन' },
  'khed (chakan)': { mr: 'खेड (चाकण)', hi: 'खेड (चाकन)' },
  'otur': { mr: 'ओतूर', hi: 'ओतूर' },
  'belhe': { mr: 'बेल्हे', hi: 'बेल्हे' },
  'indapur': { mr: 'इंदापूर', hi: 'इंदापुर' },
  'daund': { mr: 'दौंड', hi: 'दौंड' },
  'shirur': { mr: 'शिरूर', hi: 'शिरूर' },
  'bhor': { mr: 'भोर', hi: 'भोर' },
  'saswad': { mr: 'सासवड', hi: 'सासवड' },

  // Solapur & Kolhapur & Sangli & Satara
  'solapur': { mr: 'सोलापूर', hi: 'सोलापुर' },
  'barshi': { mr: 'बार्शी', hi: 'बार्शी' },
  'pandharpur': { mr: 'पंढरपूर', hi: 'पंढरपुर' },
  'sangola': { mr: 'सांगोला', hi: 'सांगोला' },
  'kolhapur': { mr: 'कोल्हापूर', hi: 'कोल्हापुर' },
  'kolhapur (shahu market)': { mr: 'कोल्हापूर (शाहू मार्केट)', hi: 'कोल्हापुर (शाहू मार्केट)' },
  'shahu market': { mr: 'शाहू मार्केट', hi: 'शाहू मार्केट' },
  'gadhinglaj': { mr: 'गडहिंग्लज', hi: 'गडहिंग्लज' },
  'sangli': { mr: 'सांगली', hi: 'सांगली' },
  'tasgaon': { mr: 'तासगाव', hi: 'तासगांव' },
  'satara': { mr: 'सातारा', hi: 'सातारा' },
  'karad': { mr: 'कराड', hi: 'कराड' },
  'wai': { mr: 'वाई', hi: 'वाई' },

  // Chhatrapati Sambhajinagar & Marathwada
  'aurangabad': { mr: 'छत्रपती संभाजीनगर', hi: 'छत्रपति संभाजीनगर' },
  'chhatrapati sambhajinagar': { mr: 'छत्रपती संभाजीनगर', hi: 'छत्रपति संभाजीनगर' },
  'chh. sambhajinagar (jadhavwadi)': { mr: 'छत्रपती संभाजीनगर (जाधववाडी)', hi: 'छत्रपति संभाजीनगर (जाधववाड़ी)' },
  'jadhavwadi': { mr: 'जाधववाडी', hi: 'जाधववाड़ी' },
  'paithan': { mr: 'पैठण', hi: 'पैठण' },
  'jalna': { mr: 'जालना', hi: 'जालना' },
  'partur': { mr: 'परतूर', hi: 'परतूर' },
  'beed': { mr: 'बीड', hi: 'बीड' },
  'parli vaijnath': { mr: 'परळी वैजनाथ', hi: 'परली वैजनाथ' },
  'parli': { mr: 'परळी', hi: 'परली' },
  'latur': { mr: 'लातूर', hi: 'लातुर' },
  'udgir': { mr: 'उदगीर', hi: 'उदगीर' },
  'ahmedpur': { mr: 'अहमदपूर', hi: 'अहमदपुर' },
  'ausa': { mr: 'औसा', hi: 'औसा' },
  'murud': { mr: 'मुरुड', hi: 'मुरुड' },
  'dharashiv': { mr: 'धाराशिव', hi: 'धाराशिव' },
  'osmanabad': { mr: 'धाराशिव', hi: 'धाराशिव' },
  'tuljapur': { mr: 'तुळजापूर', hi: 'तुलजापुर' },
  'nanded': { mr: 'नांदेड', hi: 'नांदेड' },
  'degloor': { mr: 'देगलूर', hi: 'देगलूर' },
  'parbhani': { mr: 'परभणी', hi: 'परभणी' },
  'gangakhed': { mr: 'गंगाखेड', hi: 'गंगाखेड' },
  'hingoli': { mr: 'हिंगोली', hi: 'हिंगोली' },
  'basmath': { mr: 'वसमत', hi: 'बसमत' },

  // Vidarbha
  'amravati': { mr: 'अमरावती', hi: 'अमरावती' },
  'warud': { mr: 'वरुड', hi: 'वरुड़' },
  'akola': { mr: 'अकोला', hi: 'अकोला' },
  'akot': { mr: 'अकोट', hi: 'अकोट' },
  'murtizapur': { mr: 'मुर्तिजापूर', hi: 'मुर्तिजापुर' },
  'yavatmal': { mr: 'यवतमाळ', hi: 'यवतमाल' },
  'wani': { mr: 'वणी', hi: 'वणी' },
  'khamgaon': { mr: 'खामगाव', hi: 'खामगांव' },
  'malkapur': { mr: 'मलकापूर', hi: 'मलकापुर' },
  'buldhana': { mr: 'बुलढाणा', hi: 'बुलढाणा' },
  'washim': { mr: 'वाशीम', hi: 'वाशिम' },
  'karanja lad': { mr: 'कारंजा लाड', hi: 'कारंजा लाड' },
  'nagpur': { mr: 'नागपूर', hi: 'नागपुर' },
  'kalamna': { mr: 'कळमना', hi: 'कलमना' },
  'nagpur (kalamna)': { mr: 'नागपूर (कळमना)', hi: 'नागपुर (कलमना)' },
  'katol': { mr: 'काटोल', hi: 'काटोल' },
  'wardha': { mr: 'वर्धा', hi: 'वर्धा' },
  'hinganghat': { mr: 'हिंगणघाट', hi: 'हिंगनघाट' },
  'chandrapur': { mr: 'चंद्रपूर', hi: 'चंद्रपुर' },
  'warora': { mr: 'वरोरा', hi: 'वरोरा' },
  'bhandara': { mr: 'भंडारा', hi: 'भंडारा' },
  'tumsar': { mr: 'तुमसर', hi: 'तुमसर' },
  'gondia': { mr: 'गोंदिया', hi: 'गोंदिया' },
  'tirora': { mr: 'तिरोडा', hi: 'तिरोड़ा' },
  'gadchiroli': { mr: 'गडचिरोली', hi: 'गडचिरोली' },
  'chamorshi': { mr: 'चामोर्शी', hi: 'चामोर्शी' },

  // Konkan & Mumbai Metropolitan
  'vashi': { mr: 'वाशी', hi: 'वाशी' },
  'vashi apmc': { mr: 'वाशी बाजार समिती', hi: 'वाशी मंडी' },
  'navi mumbai (vashi apmc)': { mr: 'नवी मुंबई (वाशी एपीएमसी)', hi: 'नवी मुंबई (वाशी एपीएमसी)' },
  'vashi (mumbai)': { mr: 'वाशी (मुंबई)', hi: 'वाशी (मुंबई)' },
  'mumbai': { mr: 'मुंबई', hi: 'मुंबई' },
  'mumbai (byculla market)': { mr: 'मुंबई (भायखळा मार्केट)', hi: 'मुंबई (भायखला मार्केट)' },
  'byculla': { mr: 'भायखळा', hi: 'भायखला' },
  'kalyan': { mr: 'कल्याण', hi: 'कल्याण' },
  'murbad': { mr: 'मुरबाड', hi: 'मुरबाड' },
  'dahanu (gholvad)': { mr: 'डहाणू (घोलवड)', hi: 'डहाणू (घोलवड)' },
  'dahanu': { mr: 'डहाणू', hi: 'डहाणू' },
  'palghar': { mr: 'पालघर', hi: 'पालघर' },
  'panvel': { mr: 'पनवेल', hi: 'पनवेल' },
  'pen': { mr: 'पेण', hi: 'पेण' },
  'ratnagiri': { mr: 'रत्नागिरी', hi: 'रत्नागिरी' },
  'chiplun': { mr: 'चिपळूण', hi: 'चिपलूण' },
  'kudal': { mr: 'कुडाळ', hi: 'कुडाल' },
  'sawantwadi': { mr: 'सावंतवाडी', hi: 'सावंतवाड़ी' },

  // Generic descriptions
  'terminal mandi': { mr: 'मुख्य बाजार समिती', hi: 'प्रमुख मंडी' },
  'the better mandi': { mr: 'सर्वोत्तम बाजार समिती', hi: 'सर्वश्रेष्ठ मंडी' }
};

/**
 * Translates a mandi name into authentic Marathi or Hindi.
 * Falls back safely to transliterated or formatted text if unlisted.
 */
export function translateMandiName(rawName: string, lang: AppLanguage): string {
  if (lang === 'en' || !rawName) return rawName || '';

  const clean = rawName.trim();
  const lower = clean.toLowerCase();

  // Direct lookup
  if (MANDI_NAME_MAP[lower]) {
    return MANDI_NAME_MAP[lower][lang];
  }

  // Check without trailing APMC
  const withoutApmc = lower.replace(/\s+apmc$/i, '').trim();
  if (MANDI_NAME_MAP[withoutApmc]) {
    const base = MANDI_NAME_MAP[withoutApmc][lang];
    return lang === 'mr' ? `${base} बाजार समिती` : `${base} मंडी`;
  }

  // Check partial key match
  for (const [key, trans] of Object.entries(MANDI_NAME_MAP)) {
    if (lower.startsWith(key) || lower.endsWith(key) || lower.includes(key)) {
      return trans[lang];
    }
  }

  // Fallback: if ends with APMC
  if (/apmc$/i.test(clean)) {
    const stripped = clean.replace(/apmc$/i, '').trim();
    return lang === 'mr' ? `${stripped} बाजार समिती` : `${stripped} मंडी`;
  }

  return clean;
}

/**
 * Translates district names into Marathi and Hindi.
 */
export const DISTRICT_NAME_MAP: Record<string, MandiTranslation> = {
  'nashik': { mr: 'नाशिक', hi: 'नासिक' },
  'ahilyanagar': { mr: 'अहिल्यानगर', hi: 'अहिल्यानगर' },
  'ahmednagar': { mr: 'अहिल्यानगर', hi: 'अहिल्यानगर' },
  'jalgaon': { mr: 'जळगाव', hi: 'जलगांव' },
  'dhule': { mr: 'धुळे', hi: 'धुले' },
  'nandurbar': { mr: 'नंदुरबार', hi: 'नंदुरबार' },
  'pune': { mr: 'पुणे', hi: 'पुणे' },
  'solapur': { mr: 'सोलापूर', hi: 'सोलापुर' },
  'satara': { mr: 'सातारा', hi: 'सातारा' },
  'sangli': { mr: 'सांगली', hi: 'सांगली' },
  'kolhapur': { mr: 'कोल्हापूर', hi: 'कोल्हापुर' },
  'chhatrapati sambhajinagar': { mr: 'छत्रपती संभाजीनगर', hi: 'छत्रपति संभाजीनगर' },
  'aurangabad': { mr: 'छत्रपती संभाजीनगर', hi: 'छत्रपति संभाजीनगर' },
  'jalna': { mr: 'जालना', hi: 'जालना' },
  'beed': { mr: 'बीड', hi: 'बीड' },
  'latur': { mr: 'लातूर', hi: 'लातुर' },
  'dharashiv': { mr: 'धाराशिव', hi: 'धाराशिव' },
  'osmanabad': { mr: 'धाराशिव', hi: 'धाराशिव' },
  'nanded': { mr: 'नांदेड', hi: 'नांदेड' },
  'parbhani': { mr: 'परभणी', hi: 'परभणी' },
  'hingoli': { mr: 'हिंगोली', hi: 'हिंगोली' },
  'amravati': { mr: 'अमरावती', hi: 'अमरावती' },
  'akola': { mr: 'अकोला', hi: 'अकोला' },
  'yavatmal': { mr: 'यवतमाळ', hi: 'यवतमाल' },
  'buldhana': { mr: 'बुलढाणा', hi: 'बुलढाणा' },
  'washim': { mr: 'वाशीम', hi: 'वाशिम' },
  'nagpur': { mr: 'नागपूर', hi: 'नागपुर' },
  'wardha': { mr: 'वर्धा', hi: 'वर्धा' },
  'chandrapur': { mr: 'चंद्रपूर', hi: 'चंद्रपुर' },
  'bhandara': { mr: 'भंडारा', hi: 'भंडारा' },
  'gondia': { mr: 'गोंदिया', hi: 'गोंदिया' },
  'gadchiroli': { mr: 'गडचिरोली', hi: 'गडचिरोली' },
  'thane': { mr: 'ठाणे', hi: 'ठाणे' },
  'palghar': { mr: 'पालघर', hi: 'पालघर' },
  'raigad': { mr: 'रायगड', hi: 'रायगढ' },
  'ratnagiri': { mr: 'रत्नागिरी', hi: 'रत्नागिरी' },
  'sindhudurg': { mr: 'सिंधुदुर्ग', hi: 'सिंधुदुर्ग' },
  'mumbai suburban': { mr: 'मुंबई उपनगर', hi: 'मुंबई उपनगर' },
  'mumbai city': { mr: 'मुंबई शहर', hi: 'मुंबई शहर' }
};

export function translateDistrict(district: string, lang: AppLanguage): string {
  if (lang === 'en' || !district) return district || '';
  const lower = district.trim().toLowerCase();
  return DISTRICT_NAME_MAP[lower]?.[lang] || district;
}

export function translateState(state: string, lang: AppLanguage): string {
  if (lang === 'en' || !state) return state || '';
  if (/maharashtra/i.test(state)) {
    return 'महाराष्ट्र';
  }
  return state;
}

/**
 * Translates algorithm policy actions into native Marathi and Hindi badges.
 * e.g. SELL_TODAY -> 'आजच विका' (mr) | 'आज ही बेचें' (hi)
 */
export function translateAction(action: string, lang: AppLanguage): string {
  if (!action) return '';
  if (lang === 'en') {
    return action.replace(/_/g, ' ');
  }

  const upper = action.toUpperCase().replace(/\s+/g, '_');

  if (upper === 'SELL_TODAY') {
    return lang === 'mr' ? 'आजच विका' : 'आज ही बेचें';
  }
  if (upper === 'NO_RECOMMENDATION') {
    return lang === 'mr' ? 'शिफारस नाकारली' : 'सलाह अस्वीकार';
  }

  const waitMatch = upper.match(/WAIT_([0-9]+)_DAYS?/);
  if (waitMatch) {
    const days = waitMatch[1];
    const devDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    const dStr = days.replace(/[0-9]/g, d => devDigits[parseInt(d, 10)]);
    return lang === 'mr' ? `${dStr} दिवस थांबा` : `${dStr} दिन रुकें`;
  }

  return action.replace(/_/g, ' ');
}

/**
 * Translates common commodity names into Marathi and Hindi.
 */
export const COMMODITY_NAME_MAP: Record<string, MandiTranslation> = {
  'onion': { mr: 'कांदा', hi: 'प्याज' },
  'tomato': { mr: 'टोमॅटो', hi: 'टमाटर' },
  'soyabean': { mr: 'सोयाबीन', hi: 'सोयाबीन' },
  'soybean': { mr: 'सोयाबीन', hi: 'सोयाबीन' },
  'wheat': { mr: 'गहू', hi: 'गेहूं' },
  'potato': { mr: 'बटाटा', hi: 'आलू' },
  'rice': { mr: 'तांदूळ', hi: 'चावल' },
  'cotton': { mr: 'कापूस', hi: 'कपास' },
  'maize': { mr: 'मका', hi: 'मक्का' },
  'chana': { mr: 'हरभरा', hi: 'चना' },
  'gram': { mr: 'हरभरा', hi: 'चना' },
  'tur': { mr: 'तूर', hi: 'अरहर' },
  'grapes': { mr: 'द्राक्षे', hi: 'अंगूर' },
  'pomegranate': { mr: 'डाळिंब', hi: 'अनार' }
};

export function translateCommodity(commodity: string, lang: AppLanguage): string {
  if (lang === 'en' || !commodity) return commodity || '';
  const lower = commodity.trim().toLowerCase();
  return COMMODITY_NAME_MAP[lower]?.[lang] || commodity;
}

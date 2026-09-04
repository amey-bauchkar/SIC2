/**
 * MandiMitra Central Localization & Numeral Engine (i18n)
 * 
 * Supports:
 * - Languages: English ('en'), Marathi ('mr'), Hindi ('hi')
 * - Complete conversion to Devanagari digits (०, १, २, ३, ४, ५, ६, ७, ८, ९) for Marathi and Hindi
 * - Cultural Indian currency formatting (₹१,५०० vs ₹1,500)
 * - Vernacular unit binding (क्विंटल, किमी, टक्के, शेतकरी)
 */

export type Language = 'en' | 'mr' | 'hi';

const DEVANAGARI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

/**
 * Converts any ASCII digits in a string or number into authentic Devanagari digits (०-९).
 */
export function toDevanagariDigits(val: number | string): string {
  return String(val).replace(/[0-9]/g, (digit) => DEVANAGARI_DIGITS[parseInt(digit, 10)]);
}

/**
 * Converts any Devanagari digits (०-९) back into standard ASCII digits and parses as float.
 * e.g. '२.५' -> 2.5, '१००' -> 100, '३' -> 3
 */
export function parseDevanagariNumber(val: string | number): number {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  if (!val) return 0;
  const DEVANAGARI_MAP: Record<string, string> = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
  };
  const asciiStr = String(val).replace(/[०-९]/g, (ch) => DEVANAGARI_MAP[ch] || ch).replace(/,/g, '');
  const parsed = parseFloat(asciiStr);
  return Number.isFinite(parsed) ? parsed : 0;
}


/**
 * Formats a number with Indian comma grouping (en-IN).
 * If Marathi or Hindi is selected, converts the digits to Devanagari numerals.
 */
export function formatNumber(val: number | string, lang: Language, decimals?: number): string {
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  if (!Number.isFinite(num)) return String(val);

  const formattedEn = decimals !== undefined
    ? num.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : (Number.isInteger(num) ? num.toLocaleString('en-IN') : num.toLocaleString('en-IN', { maximumFractionDigits: 2 }));


  if (lang === 'en') return formattedEn;
  return toDevanagariDigits(formattedEn);
}

/**
 * Formats currency in Rupees (₹) with Devanagari numerals for Marathi/Hindi.
 * e.g. 1500 -> '₹1,500' (en) | '₹१,५००' (mr/hi)
 */
export function formatCurrency(val: number, lang: Language, showDecimals: boolean = false): string {
  const num = Math.round(val * 100) / 100;
  const formatted = formatNumber(num, lang, showDecimals ? 2 : 0);
  return `₹${formatted}`;
}

export type AgrarianUnit = 'qtl' | 'km' | 'days' | 'pct' | 'farmers' | 'bags' | 'crates' | 'tonnes';

/**
 * Formats a quantity with its vernacular unit name and Devanagari numerals.
 * e.g. formatUnit(25, 'qtl', 'mr') -> '२५ क्विंटल'
 */
export function formatUnit(val: number | string, unit: AgrarianUnit, lang: Language): string {
  const numStr = formatNumber(val, lang);

  const UNIT_LABELS: Record<AgrarianUnit, Record<Language, string>> = {
    qtl: { en: 'qtl', mr: 'क्विंटल', hi: 'क्विंटल' },
    km: { en: 'km', mr: 'किमी', hi: 'किमी' },
    days: { en: 'days', mr: 'दिवस', hi: 'दिन' },
    pct: { en: '%', mr: '%', hi: '%' },
    farmers: { en: 'farmers', mr: 'शेतकरी', hi: 'किसान' },
    bags: { en: 'bags', mr: 'गोणी', hi: 'बोरी' },
    crates: { en: 'crates', mr: 'क्रेट', hi: 'क्रेट' },
    tonnes: { en: 'tonnes', mr: 'टन', hi: 'टन' }
  };

  const label = UNIT_LABELS[unit]?.[lang] || UNIT_LABELS[unit]?.en || unit;
  return unit === 'pct' ? `${numStr}${label}` : `${numStr} ${label}`;
}

/**
 * Central dictionary for Shell, Navigation, Decision Hub, SajhaBazaar, and Entry View
 */
export const I18N_DICTIONARY = {
  nav: {
    hub: { en: 'Decision Hub', mr: 'निर्णय केंद्र', hi: 'फैसला केंद्र' },
    entry: { en: 'Voice Entry', mr: 'आवाज नोंद', hi: 'आवाज प्रविष्टि' },
    sajha: { en: '🤝 SajhaBazaar', mr: '🤝 साझा बाजार', hi: '🤝 साझा बाजार' },
    markets: { en: 'Markets Radar', mr: 'बाजार भाव रडार', hi: 'मंडी भाव रडार' },
    evidence: { en: 'Evidence & Why', mr: 'तथ्य आणि पुरावे', hi: 'तथ्य और कारण' },
    backtest: { en: 'Backtest', mr: 'मागील पडताळणी', hi: 'बैकटेस्ट' },
    settings: { en: 'Cost Settings', mr: 'खर्च सेटिंग्ज', hi: 'लागत सेटिंग्स' },
    checkBestPrice: { en: '⚡ Check Best Price', mr: '⚡ सर्वोत्तम भाव पहा', hi: '⚡ सर्वश्रेष्ठ मूल्य देखें' }
  },
  shell: {
    footerBrandDesc: {
      en: 'Smart crop-selling decision support system designed specifically for Indian farmers. Calculating true net take-home cash (AsliDaam™) after haulage freight, APMC cess, and storage decay.',
      mr: 'भारतीय शेतकरी बांधवांसाठी खास डिझाइन केलेली स्मार्ट कृषी निर्णय प्रणाली. वाहतूक भाडे, तोलाई-हम्भाली आणि साठवणूक वजा करून शेतकऱ्याच्या खिशात उरणारा खरा निव्वळ नफा (असली दाम™) अचूक मोजते.',
      hi: 'भारतीय किसानों के लिए विशेष रूप से बनाई गई स्मार्ट निर्णय प्रणाली। ढुलाई भाड़ा, मंडी शुल्क व साठवणूक काटकर किसान की जेब में बचने वाला सच्चा लाभ (असली दाम™) सटीक निकालती है.'
    },
    colDecision: { en: 'Decision Engine', mr: 'निर्णय यंत्रणा', hi: 'निर्णय प्रणाली' },
    colData: { en: 'Data Verification', mr: 'डेटा पडताळणी', hi: 'डेटा सत्यापन' },
    colTrust: { en: 'Farmer Trust & Sources', mr: 'विश्वास व शासकीय स्रोत', hi: 'विश्वसनीय शासकीय स्रोत' },
    trustData: {
      en: 'Data: CEDA-AMD (2000-2023), Ashoka University',
      mr: 'माहिती स्रोत: CEDA-AMD (२०००-२०२३), अशोका विद्यापीठ',
      hi: 'डेटा संग्रह: CEDA-AMD (२०००-२०२३), अशोका यूनिवर्सिटी'
    },
    trustFeeds: {
      en: 'Live Feeds: Agmarknet (data.gov.in)',
      mr: 'थेट माहिती: Agmarknet (data.gov.in)',
      hi: 'लाइव फीड्स: Agmarknet (data.gov.in)'
    },
    trustRouting: {
      en: 'Routing: OSRM India Road Haulage Factor 1.35x',
      mr: 'रस्ते वाहतूक: OSRM भारत अंतर घटक १.३५x',
      hi: 'सड़क मार्ग: OSRM इंडिया ढुलाई गुणक १.३५x'
    },
    linkAsliDaam: { en: 'AsliDaam™ Optimization', mr: 'असली दाम™ नफा गणना', hi: 'असली दाम™ मुनाफा गणना' },
    linkRadar: { en: 'Regional Mandi Radar', mr: 'प्रादेशिक बाजार भाव रडार', hi: 'क्षेत्रीय मंडी भाव रडार' },
    linkShield: { en: 'Nirnay Kawach (Stress Shield)', mr: 'निर्णय कवच (भाडे सुरक्षा हमी)', hi: 'निर्णय कवच (भाड़ा सुरक्षा गारंटी)' },
    linkCongestion: { en: 'Bhed Vivek (Congestion Model)', mr: 'भेद विवेक (बाजार गर्दी मॉडेल)', hi: 'भेद विवेक (मंडी भीड़ मॉडल)' },
    linkBacktest: { en: 'Empirical Backtest Metrics', mr: 'ऐतिहासिक अचूकता पडताळणी', hi: 'ऐतिहासिक सटीकता जांच' },
    linkQuality: { en: 'Data Quality Abstention', mr: 'प्रामाणिक डेटा गुणवत्ता नकार', hi: 'पारदर्शी डेटा गुणवत्ता अस्वीकार' },
    linkRates: { en: 'Custom Freight & Holding Rates', mr: 'स्वतःचे वाहतूक व साठवणूक दर', hi: 'व्यक्तिगत ढुलाई व भंडारण दर' },
    noSpeculation: { en: 'No Speculation', mr: 'अंदाज नाही', hi: 'सट्टेबाजी नहीं' },
    honestAbstention: { en: 'Honest Abstention', mr: 'सत्यता प्रथम', hi: 'पारदर्शिता प्रथम' },
    farmerFirst: { en: 'Farmer First', mr: 'शेतकरी हित सर्वोपरि', hi: 'किसान हित सर्वोपरि' },
    copyright: {
      en: '© 2026 MandiMitra • Built for Indian Agriculture • Net Realisable Value (NRV) & Data Quality First',
      mr: '© २०२६ मंडीमित्र • भारतीय शेतीसाठी समर्पित • निव्वळ नफा (NRV) आणि सत्यता प्रथम',
      hi: '© २०२६ मंडीमित्र • भारतीय कृषि को समर्पित • शुद्ध नकद लाभ और सत्यता प्रथम'
    },
    mobile: {
      hub: { en: 'Decision', mr: 'निर्णय', hi: 'फैसला' },
      voice: { en: 'Voice', mr: 'आवाज', hi: 'आवाज' },
      sajha: { en: 'Sajha', mr: 'साझा', hi: 'साझा' },
      markets: { en: 'Markets', mr: 'बाजार', hi: 'मंडी' },
      evidence: { en: 'Evidence', mr: 'पुरावा', hi: 'तथ्य' },
      backtest: { en: 'Backtest', mr: 'पडताळणी', hi: 'जांच' },
      settings: { en: 'Settings', mr: 'खर्च', hi: 'लागत' }
    }
  },
  hub: {
    heroTitle: {
      en: 'Rooted in the Land.<br>Driven by Real Profits.',
      mr: 'मातीशी घट्ट नाळ.<br>खरा निव्वळ नफा खिशात.',
      hi: 'धरती से मजबूत जुड़ाव.<br>जेब में सच्चा शुद्ध मुनाफा.'
    },
    heroDesc: {
      en: 'MandiMitra helps farmers in Maharashtra make the single most profitable selling decision: which mandi, which day, and which transport option clears the highest genuine take-home cash.',
      mr: 'महाराष्ट्रातील शेतकऱ्यांसाठी सर्वात फायदेशीर निर्णय: कोणता बाजार, कोणता दिवस आणि कोणती वाहतूक सर्वात जास्त रोख रक्कम खिशात मिळवून देईल.',
      hi: 'महाराष्ट्र के किसानों के लिए सबसे अधिक लाभकारी निर्णय: कौन सी मंडी, कौन सा दिन और कौन सा वाहन सबसे अधिक शुद्ध नकद लाभ देगा.'
    },
    heroFeature1: { en: 'Higher Real Net Take-Home', mr: 'थेट खिशात जास्त निव्वळ नफा', hi: 'जेब में अधिक शुद्ध नकद लाभ' },
    heroFeature1Desc: {
      en: 'Calculates real in-hand rupees rather than naive gross prices. Accounts for transport freight, APMC cess, warehouse storage and commercial decay.',
      mr: 'केवळ कच्चा भाव न पाहता प्रत्यक्ष वाहतूक भाडे, बाजार समिती तोलाई-अडत आणि साठवणूक वजा करून खिशात उरणारा खरा पैसा दाखवतो.',
      hi: 'केवल थोक भाव नहीं, बल्कि ढुलाई भाड़ा, मंडी शुल्क व वजन कटौती काटकर हाथ में आने वाला असली पैसा दिखाता है.'
    },
    heroFeature2: { en: 'Shared Freight Market Access (SajhaBazaar)', mr: 'गावचा शेअर टेम्पो (साझा बाजार)', hi: 'साझा किसान वाहन (साझा बाजार)' },
    heroFeature3: { en: 'Honest Data Quality Abstention', mr: 'प्रामाणिक डेटा पडताळणी (चुकीच्या भावात नकार)', hi: 'सत्यापित मंडी भाव (गलत डेटा पर अस्वीकार)' },
    cockpitKicker: { en: 'DECISION COCKPIT FILTER', mr: 'निर्णय नियंत्रण केंद्र', hi: 'फैसला नियंत्रण केंद्र' },
    cockpitTitle: { en: 'Find Your Best Selling Market & Timing', mr: 'तुमच्या मालासाठी सर्वोत्तम बाजार व अचूक दिवस शोधा', hi: 'अपनी फसल के लिए सर्वश्रेष्ठ मंडी और सही दिन खोजें' },
    cockpitDesc: {
      en: 'Enter your crop volume and location to evaluate nearby mandis over the next 0 to 3 days.',
      mr: 'पुढील ० ते ३ दिवसांतील अचूक भाव जाणून घेण्यासाठी तुमचे वजन आणि तालुका निवडा.',
      hi: 'अगले ० से ३ दिनों का सटीक भाव जानने के लिए अपनी उपज और स्थान चुनें.'
    },
    cropLabel: { en: 'Crop', mr: 'शेतमाल निवडा', hi: 'फसल चुनें' },
    qtyLabel: { en: 'Harvest Volume (Quintals)', mr: 'एकूण वजन (क्विंटल)', hi: 'कुल वजन (क्विंटल)' },
    originLabel: { en: 'Farmer Origin', mr: 'शेतकरी तालुका / जिल्हा', hi: 'किसान स्थान / जिला' },
    btnRun: { en: '⚡ Run AsliDaam', mr: '⚡ असली दाम शोधा', hi: '⚡ असली दाम निकालें' },
    verdictKicker: { en: 'MANDIMITRA ASLIDAAM VERDICT', mr: 'मंडीमित्र अंतिम निकाल (ASLIDAAM™)', hi: 'मंडीमित्र अंतिम निर्णय (ASLIDAAM™)' },
    extraCash: { en: 'Extra Cash in Your Pocket', mr: 'खिशात जास्तीचा निव्वळ नफा', hi: 'जेब में अतिरिक्त नकद लाभ' },
    vsLocal: { en: 'vs nearest local mandi', mr: 'स्थानिक जवळच्या बाजारापेक्षा जास्त फायदा', hi: 'पास की स्थानीय मंडी से अधिक लाभ' },
    totalTakeHome: { en: 'Total AsliDaam Take-Home', mr: 'अपेक्षित एकूण असली दाम (खिशात उरणारे पैसे)', hi: 'कुल असली दाम (जेब में बचने वाले पैसे)' },
    travelHaulage: { en: 'Travel Haulage & Risk', mr: 'वाहतूक अंतर आणि खात्री', hi: 'परिवहन दूरी व विश्वसनीयता' },
    dataQualityLabel: { en: 'Data quality', mr: 'डेटा गुणवत्ता', hi: 'डेटा गुणवत्ता' },
    whyDecision: { en: 'Why this decision?', mr: 'हा निर्णय का?', hi: 'यह निर्णय क्यों?' },
    audioSummary: { en: 'Regional Audio Voice Readout', mr: 'शेतकऱ्यांसाठी स्थानिक आवाज सारांश', hi: 'किसानों के लिए क्षेत्रीय आवाज सारांश' },
    shieldTitle: { en: '🛡️ FARMER PROFIT PROTECTION SHIELD (नफा सुरक्षा हमी)', mr: '🛡️ शेतकरी नफा सुरक्षा हमी (निर्णय कवच)', hi: '🛡️ किसान मुनाफा सुरक्षा कवच (निर्णय कवच)' },
    shieldSubtitle: {
      en: 'Stress-Tested Against Transport & Mandi Congestion',
      mr: 'वाहतूक भाडे वाढले किंवा बाजारात गर्दी झाली तरी नफा टिकून राहण्याची खात्री',
      hi: 'भाड़ा बढ़ने या मंडी में भीड़ होने पर भी मुनाफा टिके रहने की जांच'
    },
    normalFare: { en: 'Normal Tempo Fare:', mr: 'नियमित टेम्पो भाडे:', hi: 'सामान्य टेम्पो भाड़ा:' },
    safeFare: { en: 'Safe Fare Limit:', mr: 'सुरक्षित भाडे मर्यादा:', hi: 'सुरक्षित भाड़ा सीमा:' },
    farmerGuarantee: { en: 'Farmer Guarantee:', mr: 'शेतकरी हमी:', hi: 'किसान गारंटी:' },
    rushDrop: { en: 'Expected Price Drop in Rush:', mr: 'बाजारात आवक वाढल्यास अपेक्षित भाव घसरण:', hi: 'मंडी में आवक बढ़ने पर संभावित गिरावट:' },
    buyerDemand: { en: 'Buyer Demand:', mr: 'व्यापारी मागणी व उठाव:', hi: 'व्यापारी मांग व उठाव:' },
    rushForecastTag: { en: 'MANDIMITRA FORECAST', mr: 'मंडीमित्र अंदाज', hi: 'मंडीमित्र अनुमान' },
    rushConfidence: { en: 'CONFIDENCE', mr: 'विश्वासार्हता', hi: 'विश्वसनीयता' },
    rushOverrideTag: { en: 'YOUR WHAT-IF', mr: 'तुमची कल्पना', hi: 'आपका अनुमान' },
    rushOutlookTitle: { en: 'Next 4 days at this mandi', mr: 'या बाजार समितीत पुढील २ दिवस', hi: 'इस मंडी में अगले ४ दिन' },
    rushWhyTitle: { en: 'Why we expect this crowd', mr: 'ही गर्दी का अपेक्षित आहे', hi: 'यह भीड़ क्यों अपेक्षित है' },
    rushWhatIfLabel: { en: 'Explore a what-if instead:', mr: 'वेगळी स्थिती तपासा:', hi: 'अलग स्थिति जांचें:' },
    rushBackToForecast: { en: 'Back to forecast', mr: 'अंदाजाकडे परत', hi: 'अनुमान पर वापस' },
    rushYardClosed: { en: 'Yard closed', mr: 'बाजार बंद', hi: 'मंडी बंद' },
    rushMeasured: { en: 'measured', mr: 'मोजलेले', hi: 'मापा गया' },
    rushReference: { en: 'reference', mr: 'संदर्भ', hi: 'संदर्भ' },
    auditTitle: { en: '💰 TRANSPARENT POCKET CASH AUDIT (खिशातील निव्वळ नफा)', mr: '💰 खिशातील निव्वळ नफा हिशोब (पारदर्शक ताळेबंद)', hi: '💰 जेब में शुद्ध नकद हिसाब (पारदर्शी विवरण)' },
    auditSubtitle: {
      en: 'Where Every Rupee Goes (No hidden deductions)',
      mr: 'पैसा कुठे जातो आणि हातात किती उरतो? (कोणतीही लपवलेली वजावट नाही)',
      hi: 'पैसा कहां खर्च होता है और हाथ में कितना बचता है? (कोई छुपा शुल्क नहीं)'
    },
    abstentionTitle: { en: 'HONEST ABSTENTION', mr: 'प्रामाणिक नकार (डेटा अपूर्ण)', hi: 'पारदर्शी अस्वीकार (डेटा अधूरा)' },
    abstentionDesc: {
      en: 'MandiMitra is not recommending anything right now because the live mandi data does not meet our reliability standards.',
      mr: 'मंडीमित्र सध्या कोणतीही शिफारस करत नाही कारण संबंधित बाजारातील दर शेतकरी विश्वासाच्या निकषांवर पुरेसे ताजे नाहीत.',
      hi: 'मंडीमित्र अभी कोई सिफारिश नहीं कर रहा है क्योंकि मंडी के भाव हमारे विश्वसनीयता मानकों पर खरे नहीं उतरे हैं.'
    }
  },
  sajha: {
    title: {
      en: 'SajhaBazaar: Shared Transport, Better Returns',
      mr: 'साझा बाजार: गावाचा शेअर टेम्पो, जास्तीचा नफा',
      hi: 'साझा बाजार: साझा परिवहन, अधिक मुनाफा'
    },
    subtitle: {
      en: 'Share a pickup with nearby farmers and reach high-paying terminal markets together.',
      mr: 'जवळच्या शेतकरी बांधवांसोबत एकत्र टेम्पो करा आणि लांबच्या मोठ्या मंडईत जास्त भावाने माल विका.',
      hi: 'पास के किसान भाइयों के साथ वाहन साझा करें और बड़ी मंडी तक पहुंचकर बेहतर दाम पाएं.'
    },
    cropLabel: { en: 'Crop to Pool', mr: 'शेतमाल निवडा', hi: 'फसल चुनें' },
    qtyLabel: { en: 'Your Load (Quintals)', mr: 'तुमचा भार (क्विंटल)', hi: 'आपकी उपज (क्विंटल)' },
    locLabel: { en: 'Your Village / Taluka', mr: 'तुमचा परिसर / तालुका', hi: 'आपका क्षेत्र / तालुका' },
    findPool: { en: '🤝 Find Matching Pool', mr: '🤝 शेअर टेम्पो शोधा', hi: '🤝 साझा वाहन खोजें' },
    vehicleTitle: { en: 'Shared Vehicle Status', mr: 'गावचा शेअर टेम्पो', hi: 'साझा किसान वाहन' },
    route: { en: 'Route', mr: 'मार्ग', hi: 'मार्ग' },
    filled: { en: 'loaded', mr: 'भरला', hi: 'भरा' },
    spaceLeft: { en: 'space left!', mr: 'जागा शिल्लक!', hi: 'जगह बाकी!' },
    capacity: { en: 'Capacity', mr: 'एकूण क्षमता', hi: 'कुल क्षमता' },
    savingsTitle: { en: 'Your In-Pocket Cash Savings', mr: 'खिशात जास्तीची निव्वळ बचत', hi: 'जेब में अतिरिक्त नकद लाभ' },
    savingsSub: {
      en: 'Extra cash in your wallet after haulage & commission',
      mr: 'एकट्याने जाण्यापेक्षा वाहतूक खर्चात झालेली थेट रोख बचत',
      hi: 'अकेले जाने की तुलना में परिवहन भाड़े में सीधी बचत'
    },
    soloFare: { en: 'Solo Trip Fare', mr: 'एकट्याने गेलात तर भाडे', hi: 'अकेले का पूरा भाड़ा' },
    pooledFare: { en: 'Your Pooled Share', mr: 'शेअर टेम्पोतील तुमचे भाडे', hi: 'साझा वाहन में आपका हिस्सा' },
    fareSaved: { en: 'Freight Saved', mr: 'भाड्यातील थेट बचत', hi: 'भाड़े में कुल बचत' },
    farmersTitle: { en: 'Co-Traveling Farmers', mr: 'सोबत असणारे शेतकरी', hi: 'साथ चलने वाले किसान' },
    youBadge: { en: 'YOU', mr: 'तुम्ही', hi: 'आप' },
    noPoolTitle: { en: 'No Matching Pool Right Now', mr: 'सध्या जवळचा शेअर टेम्पो उपलब्ध नाही', hi: 'फिलहाल पास में साझा वाहन उपलब्ध नहीं है' },
    noPoolDesc: {
      en: 'No nearby farmers found with compatible crop volume for this destination today. You can dispatch solo or check back soon.',
      mr: 'आज तुमच्या परिसरात या पिकासाठी इतर शेतकरी उपलब्ध नाहीत. तुम्ही एकट्याने जाऊ शकता किंवा पुन्हा प्रयत्न करा.',
      hi: 'आज आपके क्षेत्र में इस फसल के अन्य किसान उपलब्ध नहीं हैं। आप अकेले वाहन से जा सकते हैं.'
    },
    demoNote: {
      en: '* Calculated using real Maharashtra APMC Agmarknet prices and diesel freight rates.',
      mr: '* महाराष्ट्र कृषी पणन मंडळ व प्रत्यक्ष डिझेल दरांवर आधारित पारदर्शक हिशोब.',
      hi: '* महाराष्ट्र कृषि मंडी व वास्तविक डीजल दरों पर आधारित पारदर्शी हिसाब.'
    }
  },
  entry: {
    heroKicker: { en: '🌾 MANDIMITRA DECISION ENGINE', mr: '🌾 मंडीमित्र शेती निर्णय प्रणाली', hi: '🌾 मंडीमित्र कृषि निर्णय प्रणाली' },
    heroSubtitle: {
      en: 'Speak or select your harvested crop and location. We calculate the true net take-home cash across all nearby mandis over the next 0 to 3 days.',
      mr: 'तुमचे पीक आणि गाव बोला किंवा निवडा. आम्ही पुढील ० ते ३ दिवसांतील थेट खिशात उरणारा खरा नफा शोधू.',
      hi: 'अपनी फसल और स्थान बोलकर या चुनकर बताएं। हम अगले ० से ३ दिनों का शुद्ध नकद लाभ निकालेंगे.'
    },
    speakTitle: { en: 'Speak to Fill', mr: 'बोलून सांगा (मराठी निवडले आहे)', hi: 'बोलकर बताएं (हिंदी चुनी गई है)' },
    speakSub: {
      en: 'Microphone continues recording even if you pause. Tap ⏹️ when done.',
      mr: 'बोलताना थांबले तरी आवाज रेकॉर्ड होत राहील. बोलणे पूर्ण झाल्यावर ⏹️ दाबा.',
      hi: 'बोलते समय रुकने पर भी रिकॉर्डिंग जारी रहेगी। बोलना पूरा होने पर ⏹️ दबाएं.'
    },
    noisyRoom: { en: 'Noisy room? Tap a sample to test:', mr: 'आवाज ऐकू येत नसेल तर खालील नमुना निवडा:', hi: 'शोर हो तो नीचे दिए गए नमूने पर क्लिक करें:' },
    selectCrop: { en: 'Select Commodity', mr: 'शेतमाल निवडा', hi: 'फसल चुनें' },
    cropSearchPlaceholder: { en: '🔍 Quick search crop (e.g. Wheat, Chana, Aalu)...', mr: '🔍 शेतमाल शोधा (उदा. गहू, कांदा, सोयाबीन, हरभरा)...', hi: '🔍 फसल खोजें (उदा. गेहूं, प्याज, सोयाबीन, चना)...' },
    qtyLabel: { en: 'Harvest Volume in Quintals', mr: 'एकूण वजन (क्विंटल)', hi: 'कुल वजन (क्विंटल)' },
    districtLabel: { en: 'Farmer Origin District', mr: 'शेतकरी जिल्हा / मूळ स्थान निवडा', hi: 'किसान जिला / मूल स्थान चुनें' },
    districtSearchPlaceholder: { en: '🔍 Quick search district (e.g. Nashik, Pune, Latur)...', mr: '🔍 जिल्हा शोधा (उदा. नाशिक, पुणे, लातूर, सोलापूर)...', hi: '🔍 जिला खोजें (उदा. नासिक, पुणे, लातूर, सोलापूर)...' },
    btnCalculate: { en: '⚡ Calculate Best Market & Timing', mr: '⚡ सर्वोत्तम बाजार आणि अचूक दिवस शोधा', hi: '⚡ सर्वश्रेष्ठ मंडी और सही दिन निकालें' }
  }
};

import {
  translateMandiName,
  translateDistrict,
  translateState,
  translateAction,
  translateCommodity,
  MANDI_NAME_MAP,
  DISTRICT_NAME_MAP,
  COMMODITY_NAME_MAP
} from '../../config/mandis';

export {
  translateMandiName,
  translateDistrict,
  translateState,
  translateAction,
  translateCommodity,
  MANDI_NAME_MAP,
  DISTRICT_NAME_MAP,
  COMMODITY_NAME_MAP
};

/**
 * Translates algorithm decision rationale into natural Marathi or Hindi,
 * converting embedded numbers into authentic Devanagari numerals.
 */
export function translateReason(reason: string, lang: Language): string {
  if (lang === 'en' || !reason) return reason;

  // Normalize any Devanagari digits to ASCII first for robust regex matching
  const DEVANAGARI_MAP: Record<string, string> = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
  };
  const norm = reason.replace(/[०-९]/g, (d) => DEVANAGARI_MAP[d] || d);

  // 1. Selling today at X secures optimal net return of ₹Y/qtl.
  let m = norm.match(/Selling today at (.+?) secures optimal net return of ₹?([0-9.]+)\/qtl/i);
  if (m) {
    const market = translateMandiName(m[1], lang);
    const amount = formatNumber(m[2], lang, 1);
    return lang === 'mr'
      ? `आजच ${market} येथे विक्री केल्यास ₹${amount}/क्विंटल इतका सर्वोत्तम निव्वळ नफा सुरक्षित होतो.`
      : `आज ही ${market} में बिक्री करने पर ₹${amount}/क्विंटल का सर्वोत्तम शुद्ध लाभ सुरक्षित होता है.`;
  }

  // 2. Projected future price appreciation does not sufficiently compensate...
  m = norm.match(/Projected future price appreciation does not sufficiently compensate for holding depreciation and price volatility buffer \(₹?([0-9.]+)\/qtl\)/i);
  if (m) {
    const vol = formatNumber(m[1], lang, 1);
    return lang === 'mr'
      ? `पुढील अपेक्षित भाववाढ ही साठवणूक घट आणि भाव चढ-उतार जोखीम बफर (₹${vol}/क्विंटल) भरून काढण्यास पुरेशी नाही.`
      : `भविष्य में संभावित भाव वृद्धि, साठवणूक घट और मूल्य उतार-चढ़ाव बफर (₹${vol}/क्विंटल) की भरपाई के लिए पर्याप्त नहीं है.`;
  }

  // 3. Road distance of ~X km keeps haulage tariffs minimal at ₹Y/qtl.
  m = norm.match(/Road distance of ~?([0-9.]+) km keeps haulage tariffs minimal at ₹?([0-9.]+)\/qtl/i);
  if (m) {
    const dist = formatNumber(m[1], lang, 1);
    const rate = formatNumber(m[2], lang, 1);
    return lang === 'mr'
      ? `सुमारे ~${dist} किमीच्या कमी रस्ता अंतरामुळे वाहतूक भाडे किमान ₹${rate}/क्विंटल इतकेच राहते.`
      : `लगभग ~${dist} किमी की कम सड़क दूरी के कारण ढुलाई भाड़ा न्यूनतम ₹${rate}/क्विंटल ही रहता है.`;
  }

  // 4. Haulage logistics: ~X km estimated road haulage incurs ₹Y/qtl freight cost.
  m = norm.match(/Haulage logistics: ~?([0-9.]+) km estimated road haulage incurs ₹?([0-9.]+)\/qtl freight cost/i);
  if (m) {
    const dist = formatNumber(m[1], lang, 1);
    const rate = formatNumber(m[2], lang, 1);
    return lang === 'mr'
      ? `वाहतूक व्यवस्था: ~${dist} किमी अंदाजे रस्ता अंतरासाठी ₹${rate}/क्विंटल वाहतूक खर्च येतो.`
      : `ढुलाई व्यवस्था: ~${dist} किमी अनुमानित सड़क दूरी पर ₹${rate}/क्विंटल भाड़ा खर्च आता है.`;
  }

  // 5. X offers highest projected net return (₹Y/qtl) on Day Z.
  m = norm.match(/(.+?) offers highest projected net return \(₹?([0-9.]+)\/qtl\) on Day ([0-9]+)/i);
  if (m) {
    const market = translateMandiName(m[1], lang);
    const amount = formatNumber(m[2], lang, 1);
    const day = formatNumber(m[3], lang);
    return lang === 'mr'
      ? `${market} दिवस ${day} रोजी सर्वाधिक अंदाजित निव्वळ नफा (₹${amount}/क्विंटल) देतो.`
      : `${market} दिन ${day} को अधिकतम अनुमानित शुद्ध लाभ (₹${amount}/क्विंटल) प्रदान करता है.`;
  }

  // 6. Expected gross price gain is +₹X/qtl vs selling today.
  m = norm.match(/Expected gross price gain is \+?₹?([0-9.]+)\/qtl vs selling today/i);
  if (m) {
    const gain = formatNumber(m[1], lang, 1);
    return lang === 'mr'
      ? `आजच्या विक्रीच्या तुलनेत अपेक्षित लिलाव भाव वाढ +₹${gain}/क्विंटल आहे.`
      : `आज की बिक्री की तुलना में अनुमानित नीलामी भाव वृद्धि +₹${gain}/क्विंटल है.`;
  }

  // 7. Net gain after holding cost (₹X/qtl) and transport exceeds risk threshold by ₹Y/qtl.
  m = norm.match(/Net gain after holding cost \(₹?([0-9.]+)\/qtl\) and transport exceeds risk threshold by ₹?([0-9.]+)\/qtl/i);
  if (m) {
    const cost = formatNumber(m[1], lang, 1);
    const gain = formatNumber(m[2], lang, 1);
    return lang === 'mr'
      ? `साठवणूक खर्च (₹${cost}/क्विंटल) आणि वाहतूक वजा जाता मिळणारा निव्वळ नफा जोखीम मर्यादेपेक्षा ₹${gain}/क्विंटलने जास्त आहे.`
      : `भंडारण खर्च (₹${cost}/क्विंटल) और ढुलाई के बाद शुद्ध लाभ जोखिम सीमा से ₹${gain}/क्विंटल अधिक है.`;
  }

  // 8. A Xq pool to Y was evaluated, but A of B participant(s) would not clear the ₹Z/qtl materiality threshold.
  m = norm.match(/A ([0-9.]+)q pool to (.+?) was evaluated, but ([0-9]+) of ([0-9]+) participant\(s\) would not clear the ₹?([0-9.]+)\/qtl materiality threshold/i);
  if (m) {
    const q = formatNumber(m[1], lang);
    const dest = translateMandiName(m[2], lang);
    const losers = formatNumber(m[3], lang);
    const total = formatNumber(m[4], lang);
    const thresh = formatNumber(m[5], lang);
    return lang === 'mr'
      ? `${dest} साठी ${q} क्विंटलच्या एकत्र वाहनाची तपासणी केली, परंतु ${total} पैकी ${losers} शेतकऱ्याला किमान ₹${thresh}/क्विंटल नफा मर्यादेचा फायदा मिळत नाही.`
      : `${dest} के लिए ${q} क्विंटल के साझा वाहन की जांच की गई, लेकिन ${total} में से ${losers} किसान को न्यूनतम ₹${thresh}/क्विंटल लाभ सीमा का फायदा नहीं मिल रहा है.`;
  }

  // 9. Smallest gain in the group: ₹X/qtl. SajhaBazaar only surfaces a pool when every member is materially better off.
  m = norm.match(/Smallest gain in the group:\s*₹?([-\d.]+)\/qtl\.\s*SajhaBazaar only surfaces a pool when every member is materially better off/i);
  if (m) {
    const minGain = formatNumber(m[1], lang, 1);
    return lang === 'mr'
      ? `गटातील सर्वात कमी फायदा: ₹${minGain}/क्विंटल. साझा बाजार फक्त तेव्हाच एकत्र वाहनाची शिफारस करतो जेव्हा प्रत्येक शेतकऱ्याला स्पष्ट आर्थिक फायदा होतो.`
      : `समूह में सबसे कम लाभ: ₹${minGain}/क्विंटल। साझा बाजार केवल तभी वाहन की सलाह देता है जब प्रत्येक किसान को स्पष्ट आर्थिक लाभ हो.`;
  }

  // 10. Sell individually at your local mandi as AsliDaam advises.
  if (/Sell individually at your local mandi as AsliDaam advises/i.test(norm)) {
    return lang === 'mr'
      ? 'असलीदामच्या सल्ल्यानुसार तुमच्या स्थानिक जवळच्या बाजारात स्वतंत्रपणे विक्री करा.'
      : 'असलीदाम की सलाह के अनुसार अपनी स्थानीय मंडी में व्यक्तिगत रूप से बिक्री करें.';
  }

  // 11. X farmers within Y km are holding Z with overlapping sell windows, combining to W quintals.
  m = norm.match(/([0-9]+) farmers within ([0-9.]+) km are holding (.+?) with overlapping sell windows, combining to ([0-9.]+) quintals/i);
  if (m) {
    const farmers = formatNumber(m[1], lang);
    const radius = formatNumber(m[2], lang);
    const crop = translateCommodity(m[3], lang);
    const q = formatNumber(m[4], lang);
    return lang === 'mr'
      ? `${radius} किमी परिसरातील ${farmers} शेतकरी ${crop} पिकासाठी एकत्र येत असून, एकूण ${q} क्विंटलचा भार तयार होत आहे.`
      : `${radius} किमी दायरे के ${farmers} किसान ${crop} फसल हेतु साथ आ रहे हैं, जिससे कुल ${q} क्विंटल का भार तैयार हो रहा है.`;
  }

  // 12. Alone, Xq must charter a whole VEHICLE: ₹Y for the trip, i.e. ₹Z/qtl of freight...
  m = norm.match(/Alone,\s*([0-9.]+)q must charter a whole (.+?):\s*₹?([\d,]+) for the trip,\s*i\.e\.\s*₹?([\d.]+)\/qtl of freight(.*)/i);
  if (m) {
    const q = formatNumber(m[1], lang);
    const veh = m[2];
    const cost = formatNumber(m[3].replace(/,/g, ''), lang);
    const rate = formatNumber(m[4], lang);
    return lang === 'mr'
      ? `एकट्याने गेल्यास, ${q} क्विंटलसाठी संपूर्ण ${veh} भाड्याने करावी लागते: फेरीचा खर्च ₹${cost}, म्हणजेच ₹${rate}/क्विंटल वाहतूक भाडे.`
      : `अकेले जाने पर, ${q} क्विंटल हेतु पूरा ${veh} बुक करना पड़ता है: चक्कर का खर्च ₹${cost}, यानी ₹${rate}/क्विंटल ढुलाई भाड़ा.`;
  }

  // 13. Pooled into one VEHICLE, the same trip costs ₹X shared across Yq — ₹Z/qtl.
  m = norm.match(/Pooled into one (.+?),\s*the same trip costs\s*₹?([\d,]+)\s*shared across\s*([0-9.]+)q\s*—\s*₹?([\d.]+)\/qtl/i);
  if (m) {
    const veh = m[1];
    const cost = formatNumber(m[2].replace(/,/g, ''), lang);
    const q = formatNumber(m[3], lang);
    const rate = formatNumber(m[4], lang);
    return lang === 'mr'
      ? `एकाच ${veh} मध्ये एकत्र केल्यास, तोच खर्च ${q} क्विंटलमध्ये विभागून प्रति क्विंटल फक्त ₹${rate} येतो.`
      : `एक ही ${veh} में साझा करने पर, वही खर्च ${q} क्विंटल में बंटकर प्रति क्विंटल केवल ₹${rate} आता है.`;
  }

  // 14. Freight per quintal falls by ₹X...
  m = norm.match(/Freight per quintal falls by\s*₹?([\d.]+)(.*)/i);
  if (m) {
    const drop = formatNumber(m[1], lang, 1);
    return lang === 'mr'
      ? `प्रति क्विंटल वाहतूक भाड्यात ₹${drop} ची थेट बचत होते.`
      : `प्रति क्विंटल ढुलाई भाड़े में ₹${drop} की सीधी बचत होती है.`;
  }

  // 15. Pooling does not change the mandi price...
  if (/Pooling does not change the mandi price/i.test(norm)) {
    return lang === 'mr'
      ? 'एकत्र वाहतुकीमुळे बाजार भाव बदलत नाही, तर गाडी भाड्याची बचत होऊन शेतकऱ्याचा निव्वळ नफा वाढतो.'
      : 'साझा ढुलाई से मंडी का भाव नहीं बदलता, बल्कि भाड़े की बचत होकर किसान का शुद्ध मुनाफा बढ़ता है.';
  }

  // 16. All candidate mandis within search radius have stale or sparse reporting
  if (/All candidate mandis within search radius have stale or sparse reporting/i.test(norm)) {
    return lang === 'mr'
      ? 'शोध परिसरातील सर्व बाजार समित्यांमध्ये जुनी किंवा अपुरी माहिती उपलब्ध आहे (खराब माहिती दर्जा).'
      : 'खोज दायरे की सभी मंडियों में पुराना या अधूरा डेटा उपलब्ध है (खराब डेटा गुणवत्ता श्रेणी).';
  }

  // 17. Data recency is older than 5 days or 30-day reporting density is under 40%
  if (/Data recency is older than 5 days or 30-day reporting density is under 40%/i.test(norm)) {
    return lang === 'mr'
      ? 'बाजार माहिती ५ दिवसांपेक्षा जास्त जुनी आहे किंवा ३० दिवसांतील नोंदणी ४०% पेक्षा कमी आहे.'
      : 'डेटा ५ दिन से अधिक पुराना है या ३० दिनों में आवक रिपोर्टिंग ४०% से कम है.';
  }

  // 18. To protect farmer financial returns from misleading advice, MandiMitra refuses to recommend
  if (/To protect farmer financial returns from misleading advice/i.test(norm)) {
    return lang === 'mr'
      ? 'शेतकऱ्यांचे आर्थिक नुकसान टाळण्यासाठी, दिशाभूल करणाऱ्या माहितीवर मंडीमित्र शिफारस करणे टाळते.'
      : 'किसानों को नुकसान से बचाने के लिए, भ्रामक डेटा पर मंडीमित्र सिफारिश देने से मना करता है.';
  }

  // 19. No price observation available for current market day
  if (/No price observation available for current market day/i.test(norm)) {
    return lang === 'mr'
      ? 'चालू बाजार दिवसासाठी कोणतेही भाव उपलब्ध नाहीत.'
      : 'वर्तमान बाजार दिवस के लिए कोई भाव उपलब्ध नहीं है.';
  }

  // 20. Underlying data for X failed quality checks
  m = norm.match(/Underlying data for (.+?) failed quality checks/i);
  if (m) {
    const markets = m[1].split(',').map(name => translateMandiName(name.trim(), lang)).join(', ');
    return lang === 'mr'
      ? `${markets} साठीची मूळ माहिती दर्जा तपासणीत अपुरी ठरली.`
      : `${markets} के लिए मूल डेटा गुणवत्ता जांच में विफल रहा.`;
  }

  return toDevanagariDigits(reason);
}



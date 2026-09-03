/**
 * MandiMitra: 36 Maharashtra Districts & Agricultural Origins
 * Sourced directly from data/maharashtra_districts_all.json
 * Grouped into 6 administrative divisions with bilingual Marathi labels & precise geodesic coordinates.
 */

import { translateDistrict } from './mandis';

export interface DistrictItem {
  id: string;              // Standard English district name
  name: string;            // Standard English name
  nameMr: string;          // Marathi name
  displayName: string;     // E.g. "Nashik (नाशिक)"
  division: string;
  divisionLabel: string;
  latitude: number;
  longitude: number;
  majorCommodities: string[];
}

export interface DistrictDivisionGroup {
  id: string;
  label: string;
  districts: DistrictItem[];
}

export const DISTRICT_DIVISIONS: DistrictDivisionGroup[] = [
  {
    id: "Nashik",
    label: "📍 नाशिक विभाग (Nashik Division)",
    districts: [
      {
        id: "Nashik",
        name: "Nashik",
        nameMr: "नाशिक",
        displayName: "Nashik (नाशिक)",
        division: "Nashik",
        divisionLabel: "📍 नाशिक विभाग (Nashik Division)",
        latitude: 19.9975,
        longitude: 73.7898,
        majorCommodities: ["Onion", "Tomato", "Grapes", "Pomegranate", "Maize"]
      },
      {
        id: "Ahilyanagar",
        name: "Ahilyanagar",
        nameMr: "अहिल्यानगर (अहमदनगर)",
        displayName: "Ahilyanagar (अहिल्यानगर (अहमदनगर))",
        division: "Nashik",
        divisionLabel: "📍 नाशिक विभाग (Nashik Division)",
        latitude: 19.0952,
        longitude: 74.748,
        majorCommodities: ["Onion", "Soyabean", "Pomegranate", "Sugarcane", "Wheat"]
      },
      {
        id: "Jalgaon",
        name: "Jalgaon",
        nameMr: "जळगाव",
        displayName: "Jalgaon (जळगाव)",
        division: "Nashik",
        divisionLabel: "📍 नाशिक विभाग (Nashik Division)",
        latitude: 21.0077,
        longitude: 75.5626,
        majorCommodities: ["Banana", "Cotton", "Maize", "Soyabean", "Jowar"]
      },
      {
        id: "Dhule",
        name: "Dhule",
        nameMr: "धुळे",
        displayName: "Dhule (धुळे)",
        division: "Nashik",
        divisionLabel: "📍 नाशिक विभाग (Nashik Division)",
        latitude: 20.9042,
        longitude: 74.7749,
        majorCommodities: ["Cotton", "Chilli", "Onion", "Maize", "Bajra"]
      },
      {
        id: "Nandurbar",
        name: "Nandurbar",
        nameMr: "नंदुरबार",
        displayName: "Nandurbar (नंदुरबार)",
        division: "Nashik",
        divisionLabel: "📍 नाशिक विभाग (Nashik Division)",
        latitude: 21.3739,
        longitude: 74.2405,
        majorCommodities: ["Chilli", "Cotton", "Maize", "Soyabean"]
      },
    ]
  },
  {
    id: "Pune",
    label: "📍 पुणे विभाग (Pune Division)",
    districts: [
      {
        id: "Pune",
        name: "Pune",
        nameMr: "पुणे",
        displayName: "Pune (पुणे)",
        division: "Pune",
        divisionLabel: "📍 पुणे विभाग (Pune Division)",
        latitude: 18.5204,
        longitude: 73.8567,
        majorCommodities: ["Tomato", "Onion", "Vegetables", "Sugarcane", "Wheat"]
      },
      {
        id: "Solapur",
        name: "Solapur",
        nameMr: "सोलापूर",
        displayName: "Solapur (सोलापूर)",
        division: "Pune",
        divisionLabel: "📍 पुणे विभाग (Pune Division)",
        latitude: 17.6599,
        longitude: 75.9064,
        majorCommodities: ["Pomegranate", "Onion", "Jowar", "Chilli", "Grape"]
      },
      {
        id: "Kolhapur",
        name: "Kolhapur",
        nameMr: "कोल्हापूर",
        displayName: "Kolhapur (कोल्हापूर)",
        division: "Pune",
        divisionLabel: "📍 पुणे विभाग (Pune Division)",
        latitude: 16.705,
        longitude: 74.2433,
        majorCommodities: ["Jaggery", "Sugarcane", "Soyabean", "Groundnut", "Rice"]
      },
      {
        id: "Sangli",
        name: "Sangli",
        nameMr: "सांगली",
        displayName: "Sangli (सांगली)",
        division: "Pune",
        divisionLabel: "📍 पुणे विभाग (Pune Division)",
        latitude: 16.8524,
        longitude: 74.5815,
        majorCommodities: ["Turmeric", "Grapes", "Raisins", "Soyabean", "Maize"]
      },
      {
        id: "Satara",
        name: "Satara",
        nameMr: "सातारा",
        displayName: "Satara (सातारा)",
        division: "Pune",
        divisionLabel: "📍 पुणे विभाग (Pune Division)",
        latitude: 17.6805,
        longitude: 74.0183,
        majorCommodities: ["Ginger", "Strawberry", "Soyabean", "Onion", "Sugarcane"]
      },
    ]
  },
  {
    id: "Chhatrapati Sambhajinagar",
    label: "📍 छत्रपती संभाजीनगर विभाग (Marathwada Division)",
    districts: [
      {
        id: "Chhatrapati Sambhajinagar",
        name: "Chhatrapati Sambhajinagar",
        nameMr: "छत्रपती संभाजीनगर (औरंगाबाद)",
        displayName: "Chhatrapati Sambhajinagar (छत्रपती संभाजीनगर (औरंगाबाद))",
        division: "Chhatrapati Sambhajinagar",
        divisionLabel: "📍 छत्रपती संभाजीनगर विभाग (Marathwada Division)",
        latitude: 19.8762,
        longitude: 75.3433,
        majorCommodities: ["Cotton", "Soyabean", "Maize", "Ginger", "Mosambi"]
      },
      {
        id: "Jalna",
        name: "Jalna",
        nameMr: "जालना",
        displayName: "Jalna (जालना)",
        division: "Chhatrapati Sambhajinagar",
        divisionLabel: "📍 छत्रपती संभाजीनगर विभाग (Marathwada Division)",
        latitude: 19.8347,
        longitude: 75.8816,
        majorCommodities: ["Mosambi (Sweet Lime)", "Soyabean", "Cotton", "Chilli", "Maize"]
      },
      {
        id: "Beed",
        name: "Beed",
        nameMr: "बीड",
        displayName: "Beed (बीड)",
        division: "Chhatrapati Sambhajinagar",
        divisionLabel: "📍 छत्रपती संभाजीनगर विभाग (Marathwada Division)",
        latitude: 18.9891,
        longitude: 75.7601,
        majorCommodities: ["Soyabean", "Cotton", "Tur", "Jowar", "Sugarcane"]
      },
      {
        id: "Latur",
        name: "Latur",
        nameMr: "लातूर",
        displayName: "Latur (लातूर)",
        division: "Chhatrapati Sambhajinagar",
        divisionLabel: "📍 छत्रपती संभाजीनगर विभाग (Marathwada Division)",
        latitude: 18.4088,
        longitude: 76.5604,
        majorCommodities: ["Soyabean", "Tur (Arhar)", "Urad", "Chana (Bengal Gram)"]
      },
      {
        id: "Dharashiv",
        name: "Dharashiv",
        nameMr: "धाराशिव (उस्मानाबाद)",
        displayName: "Dharashiv (धाराशिव (उस्मानाबाद))",
        division: "Chhatrapati Sambhajinagar",
        divisionLabel: "📍 छत्रपती संभाजीनगर विभाग (Marathwada Division)",
        latitude: 18.1861,
        longitude: 76.0419,
        majorCommodities: ["Soyabean", "Tur", "Chana", "Sugarcane", "Jowar"]
      },
      {
        id: "Nanded",
        name: "Nanded",
        nameMr: "नांदेड",
        displayName: "Nanded (नांदेड)",
        division: "Chhatrapati Sambhajinagar",
        divisionLabel: "📍 छत्रपती संभाजीनगर विभाग (Marathwada Division)",
        latitude: 19.1383,
        longitude: 77.321,
        majorCommodities: ["Cotton", "Soyabean", "Turmeric", "Banana", "Jowar"]
      },
      {
        id: "Parbhani",
        name: "Parbhani",
        nameMr: "परभणी",
        displayName: "Parbhani (परभणी)",
        division: "Chhatrapati Sambhajinagar",
        divisionLabel: "📍 छत्रपती संभाजीनगर विभाग (Marathwada Division)",
        latitude: 19.2686,
        longitude: 76.7708,
        majorCommodities: ["Cotton", "Soyabean", "Jowar", "Tur"]
      },
      {
        id: "Hingoli",
        name: "Hingoli",
        nameMr: "हिंगोली",
        displayName: "Hingoli (हिंगोली)",
        division: "Chhatrapati Sambhajinagar",
        divisionLabel: "📍 छत्रपती संभाजीनगर विभाग (Marathwada Division)",
        latitude: 19.7188,
        longitude: 77.1475,
        majorCommodities: ["Soyabean", "Turmeric", "Cotton", "Jowar"]
      },
    ]
  },
  {
    id: "Amravati",
    label: "📍 अमरावती विभाग (Amravati Division)",
    districts: [
      {
        id: "Amravati",
        name: "Amravati",
        nameMr: "अमरावती",
        displayName: "Amravati (अमरावती)",
        division: "Amravati",
        divisionLabel: "📍 अमरावती विभाग (Amravati Division)",
        latitude: 20.9374,
        longitude: 77.7796,
        majorCommodities: ["Soyabean", "Cotton", "Tur", "Orange", "Gram"]
      },
      {
        id: "Akola",
        name: "Akola",
        nameMr: "अकोला",
        displayName: "Akola (अकोला)",
        division: "Amravati",
        divisionLabel: "📍 अमरावती विभाग (Amravati Division)",
        latitude: 20.7002,
        longitude: 77.0082,
        majorCommodities: ["Cotton", "Soyabean", "Tur", "Gram (Chana)", "Jowar"]
      },
      {
        id: "Yavatmal",
        name: "Yavatmal",
        nameMr: "यवतमाळ",
        displayName: "Yavatmal (यवतमाळ)",
        division: "Amravati",
        divisionLabel: "📍 अमरावती विभाग (Amravati Division)",
        latitude: 20.3888,
        longitude: 78.1204,
        majorCommodities: ["Cotton", "Soyabean", "Tur", "Wheat"]
      },
      {
        id: "Buldhana",
        name: "Buldhana",
        nameMr: "बुलढाणा",
        displayName: "Buldhana (बुलढाणा)",
        division: "Amravati",
        divisionLabel: "📍 अमरावती विभाग (Amravati Division)",
        latitude: 20.53,
        longitude: 76.18,
        majorCommodities: ["Soyabean", "Cotton", "Maize", "Ginger", "Chilli"]
      },
      {
        id: "Washim",
        name: "Washim",
        nameMr: "वाशिम",
        displayName: "Washim (वाशिम)",
        division: "Amravati",
        divisionLabel: "📍 अमरावती विभाग (Amravati Division)",
        latitude: 20.1111,
        longitude: 77.1333,
        majorCommodities: ["Soyabean", "Tur", "Gram", "Wheat"]
      },
    ]
  },
  {
    id: "Nagpur",
    label: "📍 नागपूर विभाग (Nagpur Division)",
    districts: [
      {
        id: "Nagpur",
        name: "Nagpur",
        nameMr: "नागपूर",
        displayName: "Nagpur (नागपूर)",
        division: "Nagpur",
        divisionLabel: "📍 नागपूर विभाग (Nagpur Division)",
        latitude: 21.1458,
        longitude: 79.0882,
        majorCommodities: ["Orange", "Soyabean", "Cotton", "Tur", "Paddy"]
      },
      {
        id: "Wardha",
        name: "Wardha",
        nameMr: "वर्धा",
        displayName: "Wardha (वर्धा)",
        division: "Nagpur",
        divisionLabel: "📍 नागपूर विभाग (Nagpur Division)",
        latitude: 20.7453,
        longitude: 78.6022,
        majorCommodities: ["Cotton", "Soyabean", "Tur", "Wheat"]
      },
      {
        id: "Chandrapur",
        name: "Chandrapur",
        nameMr: "चंद्रपूर",
        displayName: "Chandrapur (चंद्रपूर)",
        division: "Nagpur",
        divisionLabel: "📍 नागपूर विभाग (Nagpur Division)",
        latitude: 19.9615,
        longitude: 79.2961,
        majorCommodities: ["Paddy (Rice)", "Soyabean", "Cotton", "Tur"]
      },
      {
        id: "Bhandara",
        name: "Bhandara",
        nameMr: "भंडारा",
        displayName: "Bhandara (भंडारा)",
        division: "Nagpur",
        divisionLabel: "📍 नागपूर विभाग (Nagpur Division)",
        latitude: 21.1714,
        longitude: 79.6547,
        majorCommodities: ["Paddy (Rice)", "Soyabean", "Wheat", "Chana"]
      },
      {
        id: "Gondia",
        name: "Gondia",
        nameMr: "गोंदिया",
        displayName: "Gondia (गोंदिया)",
        division: "Nagpur",
        divisionLabel: "📍 नागपूर विभाग (Nagpur Division)",
        latitude: 21.4598,
        longitude: 80.1961,
        majorCommodities: ["Paddy (Rice)", "Linseed", "Wheat"]
      },
      {
        id: "Gadchiroli",
        name: "Gadchiroli",
        nameMr: "गडचिरोली",
        displayName: "Gadchiroli (गडचिरोली)",
        division: "Nagpur",
        divisionLabel: "📍 नागपूर विभाग (Nagpur Division)",
        latitude: 20.1849,
        longitude: 80.003,
        majorCommodities: ["Paddy (Rice)", "Minor Forest Produce", "Soyabean"]
      },
    ]
  },
  {
    id: "Konkan",
    label: "📍 कोकण विभाग (Konkan Division)",
    districts: [
      {
        id: "Mumbai Suburban",
        name: "Mumbai Suburban",
        nameMr: "मुंबई उपनगर",
        displayName: "Mumbai Suburban (मुंबई उपनगर)",
        division: "Konkan",
        divisionLabel: "📍 कोकण विभाग (Konkan Division)",
        latitude: 19.076,
        longitude: 72.8777,
        majorCommodities: ["All Fruits", "All Vegetables", "Spices", "Grain Terminal"]
      },
      {
        id: "Mumbai City",
        name: "Mumbai City",
        nameMr: "मुंबई शहर",
        displayName: "Mumbai City (मुंबई शहर)",
        division: "Konkan",
        divisionLabel: "📍 कोकण विभाग (Konkan Division)",
        latitude: 18.9388,
        longitude: 72.8354,
        majorCommodities: ["Consumption Terminal", "Fish & Export Hub"]
      },
      {
        id: "Thane",
        name: "Thane",
        nameMr: "ठाणे",
        displayName: "Thane (ठाणे)",
        division: "Konkan",
        divisionLabel: "📍 कोकण विभाग (Konkan Division)",
        latitude: 19.2183,
        longitude: 72.9781,
        majorCommodities: ["Vegetables", "Paddy", "Fruits"]
      },
      {
        id: "Palghar",
        name: "Palghar",
        nameMr: "पालघर",
        displayName: "Palghar (पालघर)",
        division: "Konkan",
        divisionLabel: "📍 कोकण विभाग (Konkan Division)",
        latitude: 19.6967,
        longitude: 72.7699,
        majorCommodities: ["Chiku (Sapota)", "Paddy", "Vegetables", "Grass"]
      },
      {
        id: "Raigad",
        name: "Raigad",
        nameMr: "रायगड (अलिबाग)",
        displayName: "Raigad (रायगड (अलिबाग))",
        division: "Konkan",
        divisionLabel: "📍 कोकण विभाग (Konkan Division)",
        latitude: 18.656,
        longitude: 72.869,
        majorCommodities: ["Paddy", "Mango (Alphonso)", "Coconut", "Vegetables"]
      },
      {
        id: "Ratnagiri",
        name: "Ratnagiri",
        nameMr: "रत्नागिरी",
        displayName: "Ratnagiri (रत्नागिरी)",
        division: "Konkan",
        divisionLabel: "📍 कोकण विभाग (Konkan Division)",
        latitude: 16.9902,
        longitude: 73.312,
        majorCommodities: ["Hapus Mango (Alphonso)", "Cashewnut", "Coconut", "Paddy"]
      },
      {
        id: "Sindhudurg",
        name: "Sindhudurg",
        nameMr: "सिंधुदुर्ग",
        displayName: "Sindhudurg (सिंधुदुर्ग)",
        division: "Konkan",
        divisionLabel: "📍 कोकण विभाग (Konkan Division)",
        latitude: 16.1158,
        longitude: 73.6976,
        majorCommodities: ["Alphonso Mango", "Cashew", "Coconut", "Betel Nut"]
      },
    ]
  },
];

export const ALL_DISTRICTS: DistrictItem[] = DISTRICT_DIVISIONS.flatMap(div => div.districts);

const DISTRICT_LOOKUP = new Map<string, DistrictItem>();
for (const dist of ALL_DISTRICTS) {
  DISTRICT_LOOKUP.set(dist.name.toLowerCase(), dist);
  DISTRICT_LOOKUP.set(dist.nameMr.toLowerCase(), dist);
}

/**
 * Resolves a district by name with alias support (e.g. Ahmednagar -> Ahilyanagar, Aurangabad -> Chhatrapati Sambhajinagar)
 */
export function getDistrictConfig(inputName: string): DistrictItem {
  const query = (inputName || '').toLowerCase().trim();
  if (!query) return DISTRICT_LOOKUP.get('nashik') || ALL_DISTRICTS[0];

  // Direct match
  const direct = DISTRICT_LOOKUP.get(query);
  if (direct) return direct;

  // Aliases
  if (query.includes('ahmednagar') || query.includes('nagar')) {
    const d = DISTRICT_LOOKUP.get('ahilyanagar');
    if (d) return d;
  }
  if (query.includes('aurangabad')) {
    const d = DISTRICT_LOOKUP.get('chhatrapati sambhajinagar');
    if (d) return d;
  }
  if (query.includes('osmanabad')) {
    const d = DISTRICT_LOOKUP.get('dharashiv');
    if (d) return d;
  }

  // Partial match
  for (const [k, v] of DISTRICT_LOOKUP.entries()) {
    if (k.includes(query) || query.includes(k)) {
      return v;
    }
  }

  // Fallback to Nashik (default geodesic center)
  return DISTRICT_LOOKUP.get('nashik') || ALL_DISTRICTS[0];
}

/**
 * Generates HTML <optgroup> options for a district <select> element with language support
 */
export function renderDistrictOptgroupsHtml(selectedDistrictName: string = 'Nashik', lang: 'en' | 'mr' | 'hi' = 'mr'): string {
  const normSelected = (selectedDistrictName || 'Nashik').toLowerCase();
  return DISTRICT_DIVISIONS.map(div => {
    const options = div.districts.map(d => {
      const isSelected = d.name.toLowerCase() === normSelected || normSelected.includes(d.name.toLowerCase());
      const label = lang === 'hi' ? `${translateDistrict(d.name, 'hi')} (${d.name})`
        : lang === 'mr' ? `${d.nameMr} (${d.name})`
        : d.displayName;
      return `<option value="${d.name}" ${isSelected ? 'selected' : ''}>${label}</option>`;
    }).join('\n      ');
    const groupLabel = lang === 'hi'
      ? (div.label.replace('विभाग', 'प्रभाग').replace('नाशिक', 'नासिक').replace('छत्रपती संभाजीनगर', 'छत्रपति संभाजीनगर').replace('अमरावती', 'अमरावती').replace('नागपूर', 'नागपुर').replace('पुणे', 'पुणे').replace('कोकण', 'कोंकण'))
      : (lang === 'mr' ? div.label : `📍 ${div.id} Division`);
    return `  <optgroup label="${groupLabel}">\n      ${options}\n    </optgroup>`;
  }).join('\n\n');
}


/**
 * Generates HTML <datalist> for instant district search
 */
export function renderDistrictDatalistHtml(datalistId: string = 'district-datalist'): string {
  const options = ALL_DISTRICTS.map(d => 
    `<option value="${d.name}">${d.displayName}</option>`
  ).join('\n  ');
  return `<datalist id="${datalistId}">\n  ${options}\n</datalist>`;
}

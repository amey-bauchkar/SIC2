/**
 * MandiMitra Maharashtra Commodity Catalog & Directory
 * 
 * Sourced directly from data/prices/commodities_index.json (99 agricultural crops).
 * Excludes livestock items (Ox, Cow).
 * Provides multi-lingual Marathi/Hindi labels, benchmark modal prices, and biological decay classifications.
 */

export type CropDecayType = 'PERISHABLE' | 'SEMI_PERISHABLE' | 'DRY_GRAIN';

export interface CropItem {
  id: string;                    // Exact Agmarknet commodity name
  nameEn: string;
  nameMr: string;
  nameHi: string;
  displayName: string;           // E.g. "Wheat (गहू / गेहूं)"
  category: string;
  benchmarkModalPrice: number;   // INR/quintal from real Agmarknet summary
  decayType: CropDecayType;
}

export interface CropCategoryGroup {
  id: string;
  label: string;
  crops: CropItem[];
}

export const CROP_CATEGORIES: CropCategoryGroup[] = [
  {
    id: "CEREALS_GRAINS",
    label: "🌾 धान्य (Cereals & Grains)",
    crops: [
      {
        id: "Wheat",
        nameEn: "Wheat",
        nameMr: "\u0917\u0939\u0942",
        nameHi: "\u0917\u0947\u0939\u0942\u0902",
        displayName: "Wheat (\u0917\u0939\u0942 / \u0917\u0947\u0939\u0942\u0902)",
        category: "CEREALS_GRAINS",
        benchmarkModalPrice: 2744.8,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Rice",
        nameEn: "Rice",
        nameMr: "\u0924\u093e\u0902\u0926\u0942\u0933",
        nameHi: "\u091a\u093e\u0935\u0932",
        displayName: "Rice (\u0924\u093e\u0902\u0926\u0942\u0933 / \u091a\u093e\u0935\u0932)",
        category: "CEREALS_GRAINS",
        benchmarkModalPrice: 5486.8,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Maize",
        nameEn: "Maize",
        nameMr: "\u092e\u0915\u093e",
        nameHi: "\u092e\u0915\u094d\u0915\u093e",
        displayName: "Maize (\u092e\u0915\u093e / \u092e\u0915\u094d\u0915\u093e)",
        category: "CEREALS_GRAINS",
        benchmarkModalPrice: 2502.8,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Bajra(Pearl Millet/Cumbu)",
        nameEn: "Bajra",
        nameMr: "\u092c\u093e\u091c\u0930\u0940",
        nameHi: "\u092c\u093e\u091c\u0930\u093e",
        displayName: "Bajra (\u092c\u093e\u091c\u0930\u0940 / \u092c\u093e\u091c\u0930\u093e)",
        category: "CEREALS_GRAINS",
        benchmarkModalPrice: 2579.5,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Jowar(Sorghum)",
        nameEn: "Jowar",
        nameMr: "\u091c\u094d\u0935\u093e\u0930\u0940",
        nameHi: "\u091c\u094d\u0935\u093e\u0930",
        displayName: "Jowar (\u091c\u094d\u0935\u093e\u0930\u0940 / \u091c\u094d\u0935\u093e\u0930)",
        category: "CEREALS_GRAINS",
        benchmarkModalPrice: 3386.6,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Ragi(Finger Millet)",
        nameEn: "Ragi / Nachani",
        nameMr: "\u0928\u093e\u091a\u0923\u0940",
        nameHi: "\u0930\u093e\u0917\u0940",
        displayName: "Ragi / Nachani (\u0928\u093e\u091a\u0923\u0940 / \u0930\u093e\u0917\u0940)",
        category: "CEREALS_GRAINS",
        benchmarkModalPrice: 5650.0,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Paddy(Common)",
        nameEn: "Paddy",
        nameMr: "\u0927\u093e\u0928",
        nameHi: "\u0927\u093e\u0928",
        displayName: "Paddy (\u0927\u093e\u0928 / \u0927\u093e\u0928)",
        category: "CEREALS_GRAINS",
        benchmarkModalPrice: 2806.0,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Rajgir",
        nameEn: "Rajgira",
        nameMr: "\u0930\u093e\u091c\u0917\u093f\u0930\u093e",
        nameHi: "\u091a\u094c\u0932\u093e\u0908",
        displayName: "Rajgira (\u0930\u093e\u091c\u0917\u093f\u0930\u093e / \u091a\u094c\u0932\u093e\u0908)",
        category: "CEREALS_GRAINS",
        benchmarkModalPrice: 5.0,
        decayType: "DRY_GRAIN"
      },
    ]
  },
  {
    id: "PULSES_DALS",
    label: "🥣 कडधान्ये व डाळी (Pulses & Dals)",
    crops: [
      {
        id: "Bengal Gram(Gram)(Whole)",
        nameEn: "Bengal Gram / Chana",
        nameMr: "\u0939\u0930\u092d\u0930\u093e",
        nameHi: "\u091a\u0928\u093e",
        displayName: "Bengal Gram / Chana (\u0939\u0930\u092d\u0930\u093e / \u091a\u0928\u093e)",
        category: "PULSES_DALS",
        benchmarkModalPrice: 5670.5,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Bengal Gram Dal(Chana Dal)",
        nameEn: "Chana Dal",
        nameMr: "\u091a\u0928\u093e \u0921\u093e\u0933",
        nameHi: "\u091a\u0928\u093e \u0926\u093e\u0932",
        displayName: "Chana Dal (\u091a\u0928\u093e \u0921\u093e\u0933 / \u091a\u0928\u093e \u0926\u093e\u0932)",
        category: "PULSES_DALS",
        benchmarkModalPrice: 7900.0,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Green Gram(Moong)(Whole)",
        nameEn: "Green Gram / Moong",
        nameMr: "\u092e\u0942\u0917",
        nameHi: "\u092e\u0942\u0901\u0917",
        displayName: "Green Gram / Moong (\u092e\u0942\u0917 / \u092e\u0942\u0901\u0917)",
        category: "PULSES_DALS",
        benchmarkModalPrice: 8712.8,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Green Gram Dal(Moong Dal)",
        nameEn: "Moong Dal",
        nameMr: "\u092e\u0942\u0917 \u0921\u093e\u0933",
        nameHi: "\u092e\u0942\u0901\u0917 \u0926\u093e\u0932",
        displayName: "Moong Dal (\u092e\u0942\u0917 \u0921\u093e\u0933 / \u092e\u0942\u0901\u0917 \u0926\u093e\u0932)",
        category: "PULSES_DALS",
        benchmarkModalPrice: 10300.0,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Red gram/Arhar/Tur(whole)",
        nameEn: "Tur / Arhar",
        nameMr: "\u0924\u0942\u0930",
        nameHi: "\u0905\u0930\u0939\u0930",
        displayName: "Tur / Arhar (\u0924\u0942\u0930 / \u0905\u0930\u0939\u0930)",
        category: "PULSES_DALS",
        benchmarkModalPrice: 7809.2,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Red gram split/Arhar dal/Tur dal)",
        nameEn: "Tur Dal",
        nameMr: "\u0924\u0942\u0930 \u0921\u093e\u0933",
        nameHi: "\u0905\u0930\u0939\u0930 \u0926\u093e\u0932",
        displayName: "Tur Dal (\u0924\u0942\u0930 \u0921\u093e\u0933 / \u0905\u0930\u0939\u0930 \u0926\u093e\u0932)",
        category: "PULSES_DALS",
        benchmarkModalPrice: 2500.0,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Black Gram(Urd Beans)(Whole)",
        nameEn: "Black Gram / Urad",
        nameMr: "\u0909\u0921\u0940\u0926",
        nameHi: "\u0909\u0921\u093c\u0926",
        displayName: "Black Gram / Urad (\u0909\u0921\u0940\u0926 / \u0909\u0921\u093c\u0926)",
        category: "PULSES_DALS",
        benchmarkModalPrice: 8378.6,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Black Gram Dal(Urd Dal)",
        nameEn: "Urad Dal",
        nameMr: "\u0909\u0921\u0940\u0926 \u0921\u093e\u0933",
        nameHi: "\u0909\u0921\u093c\u0926 \u0926\u093e\u0932",
        displayName: "Urad Dal (\u0909\u0921\u0940\u0926 \u0921\u093e\u0933 / \u0909\u0921\u093c\u0926 \u0926\u093e\u0932)",
        category: "PULSES_DALS",
        benchmarkModalPrice: 12000.0,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Lentil(Masur)(Whole)",
        nameEn: "Masur",
        nameMr: "\u092e\u0938\u0942\u0930",
        nameHi: "\u092e\u0938\u0942\u0930",
        displayName: "Masur (\u092e\u0938\u0942\u0930 / \u092e\u0938\u0942\u0930)",
        category: "PULSES_DALS",
        benchmarkModalPrice: 7100.0,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Masur Dal",
        nameEn: "Masur Dal",
        nameMr: "\u092e\u0938\u0942\u0930 \u0921\u093e\u0933",
        nameHi: "\u092e\u0938\u0942\u0930 \u0926\u093e\u0932",
        displayName: "Masur Dal (\u092e\u0938\u0942\u0930 \u0921\u093e\u0933 / \u092e\u0938\u0942\u0930 \u0926\u093e\u0932)",
        category: "PULSES_DALS",
        benchmarkModalPrice: 7400.0,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Cowpea(Lobia/Karamani)",
        nameEn: "Cowpea / Chawli",
        nameMr: "\u091a\u0935\u0933\u0940",
        nameHi: "\u0932\u094b\u092c\u093f\u092f\u093e",
        displayName: "Cowpea / Chawli (\u091a\u0935\u0933\u0940 / \u0932\u094b\u092c\u093f\u092f\u093e)",
        category: "PULSES_DALS",
        benchmarkModalPrice: 8700.0,
        decayType: "DRY_GRAIN"
      },
    ]
  },
  {
    id: "VEGETABLES",
    label: "🥦 भाजीपाला (Vegetables)",
    crops: [
      {
        id: "Tomato",
        nameEn: "Tomato",
        nameMr: "\u091f\u094b\u092e\u0945\u091f\u094b",
        nameHi: "\u091f\u092e\u093e\u091f\u0930",
        displayName: "Tomato (\u091f\u094b\u092e\u0945\u091f\u094b / \u091f\u092e\u093e\u091f\u0930)",
        category: "VEGETABLES",
        benchmarkModalPrice: 1278.4,
        decayType: "PERISHABLE"
      },
      {
        id: "Green Chilli",
        nameEn: "Green Chilli",
        nameMr: "\u0939\u093f\u0930\u0935\u0940 \u092e\u093f\u0930\u091a\u0940",
        nameHi: "\u0939\u0930\u0940 \u092e\u093f\u0930\u094d\u091a",
        displayName: "Green Chilli (\u0939\u093f\u0930\u0935\u0940 \u092e\u093f\u0930\u091a\u0940 / \u0939\u0930\u0940 \u092e\u093f\u0930\u094d\u091a)",
        category: "VEGETABLES",
        benchmarkModalPrice: 2871.2,
        decayType: "PERISHABLE"
      },
      {
        id: "Brinjal",
        nameEn: "Brinjal / Eggplant",
        nameMr: "\u0935\u093e\u0902\u0917\u0940",
        nameHi: "\u092c\u0948\u0902\u0917\u0928",
        displayName: "Brinjal / Eggplant (\u0935\u093e\u0902\u0917\u0940 / \u092c\u0948\u0902\u0917\u0928)",
        category: "VEGETABLES",
        benchmarkModalPrice: 2187.0,
        decayType: "PERISHABLE"
      },
      {
        id: "Bhindi(Ladies Finger)",
        nameEn: "Bhindi / Okra",
        nameMr: "\u092d\u0947\u0902\u0921\u0940",
        nameHi: "\u092d\u093f\u0902\u0921\u0940",
        displayName: "Bhindi / Okra (\u092d\u0947\u0902\u0921\u0940 / \u092d\u093f\u0902\u0921\u0940)",
        category: "VEGETABLES",
        benchmarkModalPrice: 2127.0,
        decayType: "PERISHABLE"
      },
      {
        id: "Cabbage",
        nameEn: "Cabbage",
        nameMr: "\u0915\u094b\u092c\u0940",
        nameHi: "\u092a\u0924\u094d\u0924\u093e \u0917\u094b\u092d\u0940",
        displayName: "Cabbage (\u0915\u094b\u092c\u0940 / \u092a\u0924\u094d\u0924\u093e \u0917\u094b\u092d\u0940)",
        category: "VEGETABLES",
        benchmarkModalPrice: 1066.9,
        decayType: "PERISHABLE"
      },
      {
        id: "Cauliflower",
        nameEn: "Cauliflower",
        nameMr: "\u092b\u094d\u0932\u0949\u0935\u0930",
        nameHi: "\u092b\u0942\u0932\u0917\u094b\u092d\u0940",
        displayName: "Cauliflower (\u092b\u094d\u0932\u0949\u0935\u0930 / \u092b\u0942\u0932\u0917\u094b\u092d\u0940)",
        category: "VEGETABLES",
        benchmarkModalPrice: 1583.8,
        decayType: "PERISHABLE"
      },
      {
        id: "Chilly Capsicum",
        nameEn: "Capsicum",
        nameMr: "\u0936\u093f\u092e\u0932\u093e \u092e\u093f\u0930\u091a\u0940",
        nameHi: "\u0936\u093f\u092e\u0932\u093e \u092e\u093f\u0930\u094d\u091a",
        displayName: "Capsicum (\u0936\u093f\u092e\u0932\u093e \u092e\u093f\u0930\u091a\u0940 / \u0936\u093f\u092e\u0932\u093e \u092e\u093f\u0930\u094d\u091a)",
        category: "VEGETABLES",
        benchmarkModalPrice: 2184.6,
        decayType: "PERISHABLE"
      },
      {
        id: "Cucumbar(Kheera)",
        nameEn: "Cucumber",
        nameMr: "\u0915\u093e\u0915\u0921\u0940",
        nameHi: "\u0916\u0940\u0930\u093e",
        displayName: "Cucumber (\u0915\u093e\u0915\u0921\u0940 / \u0916\u0940\u0930\u093e)",
        category: "VEGETABLES",
        benchmarkModalPrice: 1896.9,
        decayType: "PERISHABLE"
      },
      {
        id: "Spinach",
        nameEn: "Spinach / Palak",
        nameMr: "\u092a\u093e\u0932\u0915",
        nameHi: "\u092a\u093e\u0932\u0915",
        displayName: "Spinach / Palak (\u092a\u093e\u0932\u0915 / \u092a\u093e\u0932\u0915)",
        category: "VEGETABLES",
        benchmarkModalPrice: 675.3,
        decayType: "PERISHABLE"
      },
      {
        id: "Methi(Leaves)",
        nameEn: "Methi Leaves",
        nameMr: "\u092e\u0947\u0925\u0940",
        nameHi: "\u092e\u0947\u0925\u0940",
        displayName: "Methi Leaves (\u092e\u0947\u0925\u0940 / \u092e\u0947\u0925\u0940)",
        category: "VEGETABLES",
        benchmarkModalPrice: 1364.2,
        decayType: "PERISHABLE"
      },
      {
        id: "Coriander(Leaves)",
        nameEn: "Coriander Leaves",
        nameMr: "\u0915\u094b\u0925\u093f\u0902\u092c\u0940\u0930",
        nameHi: "\u0927\u0928\u093f\u092f\u093e \u092a\u0924\u094d\u0924\u0940",
        displayName: "Coriander Leaves (\u0915\u094b\u0925\u093f\u0902\u092c\u0940\u0930 / \u0927\u0928\u093f\u092f\u093e \u092a\u0924\u094d\u0924\u0940)",
        category: "VEGETABLES",
        benchmarkModalPrice: 1074.8,
        decayType: "PERISHABLE"
      },
      {
        id: "Mint(Pudina)",
        nameEn: "Mint / Pudina",
        nameMr: "\u092a\u0941\u0926\u093f\u0928\u093e",
        nameHi: "\u092a\u0941\u0926\u0940\u0928\u093e",
        displayName: "Mint / Pudina (\u092a\u0941\u0926\u093f\u0928\u093e / \u092a\u0941\u0926\u0940\u0928\u093e)",
        category: "VEGETABLES",
        benchmarkModalPrice: 254.0,
        decayType: "PERISHABLE"
      },
      {
        id: "Beans",
        nameEn: "Beans",
        nameMr: "\u0918\u0947\u0935\u0921\u093e",
        nameHi: "\u092c\u0940\u0928\u094d\u0938",
        displayName: "Beans (\u0918\u0947\u0935\u0921\u093e / \u092c\u0940\u0928\u094d\u0938)",
        category: "VEGETABLES",
        benchmarkModalPrice: 2592.9,
        decayType: "PERISHABLE"
      },
      {
        id: "French Beans(Frasbean)",
        nameEn: "French Beans",
        nameMr: "\u092b\u0930\u0938\u092c\u0940",
        nameHi: "\u092b\u094d\u0930\u0947\u0902\u091a \u092c\u0940\u0928\u094d\u0938",
        displayName: "French Beans (\u092b\u0930\u0938\u092c\u0940 / \u092b\u094d\u0930\u0947\u0902\u091a \u092c\u0940\u0928\u094d\u0938)",
        category: "VEGETABLES",
        benchmarkModalPrice: 4000.0,
        decayType: "PERISHABLE"
      },
      {
        id: "Bitter gourd",
        nameEn: "Bitter Gourd / Karela",
        nameMr: "\u0915\u093e\u0930\u0932\u0947",
        nameHi: "\u0915\u0930\u0947\u0932\u093e",
        displayName: "Bitter Gourd / Karela (\u0915\u093e\u0930\u0932\u0947 / \u0915\u0930\u0947\u0932\u093e)",
        category: "VEGETABLES",
        benchmarkModalPrice: 2503.3,
        decayType: "PERISHABLE"
      },
      {
        id: "Bottle gourd",
        nameEn: "Bottle Gourd / Lauki",
        nameMr: "\u0926\u0941\u0927\u0940 \u092d\u094b\u092a\u0933\u093e",
        nameHi: "\u0932\u094c\u0915\u0940",
        displayName: "Bottle Gourd / Lauki (\u0926\u0941\u0927\u0940 \u092d\u094b\u092a\u0933\u093e / \u0932\u094c\u0915\u0940)",
        category: "VEGETABLES",
        benchmarkModalPrice: 1268.5,
        decayType: "PERISHABLE"
      },
      {
        id: "Ridgeguard(Tori)",
        nameEn: "Ridge Gourd / Dodka",
        nameMr: "\u0926\u094b\u0921\u0915\u093e",
        nameHi: "\u0924\u094b\u0930\u0908",
        displayName: "Ridge Gourd / Dodka (\u0926\u094b\u0921\u0915\u093e / \u0924\u094b\u0930\u0908)",
        category: "VEGETABLES",
        benchmarkModalPrice: 2566.5,
        decayType: "PERISHABLE"
      },
      {
        id: "Snakeguard",
        nameEn: "Snake Gourd",
        nameMr: "\u092a\u0921\u0935\u0933",
        nameHi: "\u091a\u093f\u091a\u093f\u0902\u0921\u093e",
        displayName: "Snake Gourd (\u092a\u0921\u0935\u0933 / \u091a\u093f\u091a\u093f\u0902\u0921\u093e)",
        category: "VEGETABLES",
        benchmarkModalPrice: 2225.0,
        decayType: "PERISHABLE"
      },
      {
        id: "Pointed gourd(Parval)",
        nameEn: "Pointed Gourd",
        nameMr: "\u092a\u0930\u0935\u0933",
        nameHi: "\u092a\u0930\u0935\u0932",
        displayName: "Pointed Gourd (\u092a\u0930\u0935\u0933 / \u092a\u0930\u0935\u0932)",
        category: "VEGETABLES",
        benchmarkModalPrice: 4000.0,
        decayType: "PERISHABLE"
      },
      {
        id: "Little gourd(Kundru)",
        nameEn: "Ivy Gourd / Tondli",
        nameMr: "\u0924\u094b\u0902\u0921\u0932\u0940",
        nameHi: "\u0915\u0941\u0902\u0926\u0930\u0942",
        displayName: "Ivy Gourd / Tondli (\u0924\u094b\u0902\u0921\u0932\u0940 / \u0915\u0941\u0902\u0926\u0930\u0942)",
        category: "VEGETABLES",
        benchmarkModalPrice: 2375.0,
        decayType: "PERISHABLE"
      },
      {
        id: "Drumstick",
        nameEn: "Drumstick / Shevga",
        nameMr: "\u0936\u0947\u0935\u0917\u093e",
        nameHi: "\u0938\u0939\u091c\u0928",
        displayName: "Drumstick / Shevga (\u0936\u0947\u0935\u0917\u093e / \u0938\u0939\u091c\u0928)",
        category: "VEGETABLES",
        benchmarkModalPrice: 3457.1,
        decayType: "PERISHABLE"
      },
      {
        id: "Pumpkin",
        nameEn: "Pumpkin",
        nameMr: "\u0932\u093e\u0932 \u092d\u094b\u092a\u0933\u093e",
        nameHi: "\u0915\u0926\u094d\u0926\u0942",
        displayName: "Pumpkin (\u0932\u093e\u0932 \u092d\u094b\u092a\u0933\u093e / \u0915\u0926\u094d\u0926\u0942)",
        category: "VEGETABLES",
        benchmarkModalPrice: 1528.3,
        decayType: "PERISHABLE"
      },
      {
        id: "Sweet Pumpkin",
        nameEn: "Sweet Pumpkin",
        nameMr: "\u0917\u094b\u0921 \u092d\u094b\u092a\u0933\u093e",
        nameHi: "\u092e\u0940\u0920\u093e \u0915\u0926\u094d\u0926\u0942",
        displayName: "Sweet Pumpkin (\u0917\u094b\u0921 \u092d\u094b\u092a\u0933\u093e / \u092e\u0940\u0920\u093e \u0915\u0926\u094d\u0926\u0942)",
        category: "VEGETABLES",
        benchmarkModalPrice: 950.0,
        decayType: "PERISHABLE"
      },
      {
        id: "Green Peas",
        nameEn: "Green Peas",
        nameMr: "\u092e\u091f\u093e\u0930",
        nameHi: "\u0939\u0930\u0940 \u092e\u091f\u0930",
        displayName: "Green Peas (\u092e\u091f\u093e\u0930 / \u0939\u0930\u0940 \u092e\u091f\u0930)",
        category: "VEGETABLES",
        benchmarkModalPrice: 5900.0,
        decayType: "PERISHABLE"
      },
      {
        id: "Peas Wet",
        nameEn: "Fresh Peas",
        nameMr: "\u0913\u0932\u093e \u0935\u093e\u091f\u093e\u0923\u093e",
        nameHi: "\u0917\u0940\u0932\u0940 \u092e\u091f\u0930",
        displayName: "Fresh Peas (\u0913\u0932\u093e \u0935\u093e\u091f\u093e\u0923\u093e / \u0917\u0940\u0932\u0940 \u092e\u091f\u0930)",
        category: "VEGETABLES",
        benchmarkModalPrice: 6375.0,
        decayType: "PERISHABLE"
      },
    ]
  },
  {
    id: "BULBS_TUBERS",
    label: "🥔 कंदमुळे (Bulbs & Tubers)",
    crops: [
      {
        id: "Onion",
        nameEn: "Onion",
        nameMr: "\u0915\u093e\u0902\u0926\u093e",
        nameHi: "\u092a\u094d\u092f\u093e\u091c",
        displayName: "Onion (\u0915\u093e\u0902\u0926\u093e / \u092a\u094d\u092f\u093e\u091c)",
        category: "BULBS_TUBERS",
        benchmarkModalPrice: 3791.8,
        decayType: "SEMI_PERISHABLE"
      },
      {
        id: "Onion Green",
        nameEn: "Spring Onion",
        nameMr: "\u092a\u093e\u0924\u0940\u091a\u093e \u0915\u093e\u0902\u0926\u093e",
        nameHi: "\u0939\u0930\u093e \u092a\u094d\u092f\u093e\u091c",
        displayName: "Spring Onion (\u092a\u093e\u0924\u0940\u091a\u093e \u0915\u093e\u0902\u0926\u093e / \u0939\u0930\u093e \u092a\u094d\u092f\u093e\u091c)",
        category: "BULBS_TUBERS",
        benchmarkModalPrice: 481.8,
        decayType: "SEMI_PERISHABLE"
      },
      {
        id: "Potato",
        nameEn: "Potato",
        nameMr: "\u092c\u091f\u093e\u091f\u093e",
        nameHi: "\u0906\u0932\u0942",
        displayName: "Potato (\u092c\u091f\u093e\u091f\u093e / \u0906\u0932\u0942)",
        category: "BULBS_TUBERS",
        benchmarkModalPrice: 1247.2,
        decayType: "SEMI_PERISHABLE"
      },
      {
        id: "Garlic",
        nameEn: "Garlic",
        nameMr: "\u0932\u0938\u0942\u0923",
        nameHi: "\u0932\u0939\u0938\u0941\u0928",
        displayName: "Garlic (\u0932\u0938\u0942\u0923 / \u0932\u0939\u0938\u0941\u0928)",
        category: "BULBS_TUBERS",
        benchmarkModalPrice: 13200.0,
        decayType: "SEMI_PERISHABLE"
      },
      {
        id: "Ginger(Green)",
        nameEn: "Ginger",
        nameMr: "\u0906\u0932\u0947",
        nameHi: "\u0905\u0926\u0930\u0915",
        displayName: "Ginger (\u0906\u0932\u0947 / \u0905\u0926\u0930\u0915)",
        category: "BULBS_TUBERS",
        benchmarkModalPrice: 9540.0,
        decayType: "SEMI_PERISHABLE"
      },
      {
        id: "Carrot",
        nameEn: "Carrot",
        nameMr: "\u0917\u093e\u091c\u0930",
        nameHi: "\u0917\u093e\u091c\u0930",
        displayName: "Carrot (\u0917\u093e\u091c\u0930 / \u0917\u093e\u091c\u0930)",
        category: "BULBS_TUBERS",
        benchmarkModalPrice: 2287.5,
        decayType: "SEMI_PERISHABLE"
      },
      {
        id: "Raddish",
        nameEn: "Radish",
        nameMr: "\u092e\u0941\u0933\u093e",
        nameHi: "\u092e\u0942\u0932\u0940",
        displayName: "Radish (\u092e\u0941\u0933\u093e / \u092e\u0942\u0932\u0940)",
        category: "BULBS_TUBERS",
        benchmarkModalPrice: 1220.8,
        decayType: "SEMI_PERISHABLE"
      },
      {
        id: "Beetroot",
        nameEn: "Beetroot",
        nameMr: "\u092c\u0940\u091f",
        nameHi: "\u091a\u0941\u0915\u0902\u0926\u0930",
        displayName: "Beetroot (\u092c\u0940\u091f / \u091a\u0941\u0915\u0902\u0926\u0930)",
        category: "BULBS_TUBERS",
        benchmarkModalPrice: 2262.5,
        decayType: "SEMI_PERISHABLE"
      },
      {
        id: "Sweet Potato",
        nameEn: "Sweet Potato",
        nameMr: "\u0930\u0924\u093e\u0933\u0947",
        nameHi: "\u0936\u0915\u0930\u0915\u0902\u0926",
        displayName: "Sweet Potato (\u0930\u0924\u093e\u0933\u0947 / \u0936\u0915\u0930\u0915\u0902\u0926)",
        category: "BULBS_TUBERS",
        benchmarkModalPrice: 3266.7,
        decayType: "SEMI_PERISHABLE"
      },
      {
        id: "Elephant Yam(Suran)/Amorphophallus",
        nameEn: "Elephant Yam / Suran",
        nameMr: "\u0938\u0941\u0930\u0923",
        nameHi: "\u091c\u093f\u092e\u0940\u0915\u0902\u0926",
        displayName: "Elephant Yam / Suran (\u0938\u0941\u0930\u0923 / \u091c\u093f\u092e\u0940\u0915\u0902\u0926)",
        category: "BULBS_TUBERS",
        benchmarkModalPrice: 2850.0,
        decayType: "SEMI_PERISHABLE"
      },
    ]
  },
  {
    id: "FRUITS",
    label: "🍎 फळे (Fruits)",
    crops: [
      {
        id: "Pomegranate",
        nameEn: "Pomegranate",
        nameMr: "\u0921\u093e\u0933\u093f\u0902\u092c",
        nameHi: "\u0905\u0928\u093e\u0930",
        displayName: "Pomegranate (\u0921\u093e\u0933\u093f\u0902\u092c / \u0905\u0928\u093e\u0930)",
        category: "FRUITS",
        benchmarkModalPrice: 8067.9,
        decayType: "PERISHABLE"
      },
      {
        id: "Banana",
        nameEn: "Banana",
        nameMr: "\u0915\u0947\u0933\u0940",
        nameHi: "\u0915\u0947\u0932\u093e",
        displayName: "Banana (\u0915\u0947\u0933\u0940 / \u0915\u0947\u0932\u093e)",
        category: "FRUITS",
        benchmarkModalPrice: 2322.9,
        decayType: "PERISHABLE"
      },
      {
        id: "Banana - Green",
        nameEn: "Raw Banana",
        nameMr: "\u0915\u091a\u094d\u091a\u0940 \u0915\u0947\u0933\u0940",
        nameHi: "\u0915\u091a\u094d\u091a\u093e \u0915\u0947\u0932\u093e",
        displayName: "Raw Banana (\u0915\u091a\u094d\u091a\u0940 \u0915\u0947\u0933\u0940 / \u0915\u091a\u094d\u091a\u093e \u0915\u0947\u0932\u093e)",
        category: "FRUITS",
        benchmarkModalPrice: 3100.0,
        decayType: "PERISHABLE"
      },
      {
        id: "Grapes",
        nameEn: "Grapes",
        nameMr: "\u0926\u094d\u0930\u093e\u0915\u094d\u0937\u0947",
        nameHi: "\u0905\u0902\u0917\u0942\u0930",
        displayName: "Grapes (\u0926\u094d\u0930\u093e\u0915\u094d\u0937\u0947 / \u0905\u0902\u0917\u0942\u0930)",
        category: "FRUITS",
        benchmarkModalPrice: 9000.0,
        decayType: "PERISHABLE"
      },
      {
        id: "Apple",
        nameEn: "Apple",
        nameMr: "\u0938\u092b\u0930\u091a\u0902\u0926",
        nameHi: "\u0938\u0947\u092c",
        displayName: "Apple (\u0938\u092b\u0930\u091a\u0902\u0926 / \u0938\u0947\u092c)",
        category: "FRUITS",
        benchmarkModalPrice: 11750.0,
        decayType: "PERISHABLE"
      },
      {
        id: "Mousambi(Sweet Lime)",
        nameEn: "Sweet Lime / Mosambi",
        nameMr: "\u092e\u094b\u0938\u0902\u092c\u0940",
        nameHi: "\u092e\u094c\u0938\u092e\u0940",
        displayName: "Sweet Lime / Mosambi (\u092e\u094b\u0938\u0902\u092c\u0940 / \u092e\u094c\u0938\u092e\u0940)",
        category: "FRUITS",
        benchmarkModalPrice: 3334.4,
        decayType: "PERISHABLE"
      },
      {
        id: "Guava",
        nameEn: "Guava / Peru",
        nameMr: "\u092a\u0947\u0930\u0942",
        nameHi: "\u0905\u092e\u0930\u0942\u0926",
        displayName: "Guava / Peru (\u092a\u0947\u0930\u0942 / \u0905\u092e\u0930\u0942\u0926)",
        category: "FRUITS",
        benchmarkModalPrice: 5250.0,
        decayType: "PERISHABLE"
      },
      {
        id: "Water Melon",
        nameEn: "Watermelon",
        nameMr: "\u0915\u0932\u093f\u0902\u0917\u0921",
        nameHi: "\u0924\u0930\u092c\u0942\u091c",
        displayName: "Watermelon (\u0915\u0932\u093f\u0902\u0917\u0921 / \u0924\u0930\u092c\u0942\u091c)",
        category: "FRUITS",
        benchmarkModalPrice: 883.3,
        decayType: "PERISHABLE"
      },
      {
        id: "Karbuja(Musk Melon)",
        nameEn: "Muskmelon",
        nameMr: "\u0916\u0930\u092c\u0942\u091c",
        nameHi: "\u0916\u0930\u092c\u0942\u091c\u093e",
        displayName: "Muskmelon (\u0916\u0930\u092c\u0942\u091c / \u0916\u0930\u092c\u0942\u091c\u093e)",
        category: "FRUITS",
        benchmarkModalPrice: 2500.0,
        decayType: "PERISHABLE"
      },
      {
        id: "Papaya",
        nameEn: "Papaya",
        nameMr: "\u092a\u092a\u0908",
        nameHi: "\u092a\u092a\u0940\u0924\u093e",
        displayName: "Papaya (\u092a\u092a\u0908 / \u092a\u092a\u0940\u0924\u093e)",
        category: "FRUITS",
        benchmarkModalPrice: 2625.0,
        decayType: "PERISHABLE"
      },
      {
        id: "Orange",
        nameEn: "Orange / Santra",
        nameMr: "\u0938\u0902\u0924\u094d\u0930\u0947",
        nameHi: "\u0938\u0902\u0924\u0930\u093e",
        displayName: "Orange / Santra (\u0938\u0902\u0924\u094d\u0930\u0947 / \u0938\u0902\u0924\u0930\u093e)",
        category: "FRUITS",
        benchmarkModalPrice: 9500.0,
        decayType: "PERISHABLE"
      },
      {
        id: "Seetapal",
        nameEn: "Custard Apple / Sitaphal",
        nameMr: "\u0938\u0940\u0924\u093e\u092b\u0933",
        nameHi: "\u0936\u0930\u0940\u092b\u093e",
        displayName: "Custard Apple / Sitaphal (\u0938\u0940\u0924\u093e\u092b\u0933 / \u0936\u0930\u0940\u092b\u093e)",
        category: "FRUITS",
        benchmarkModalPrice: 5625.0,
        decayType: "PERISHABLE"
      },
      {
        id: "Lime",
        nameEn: "Lemon / Limbu",
        nameMr: "\u0932\u093f\u0902\u092c\u0942",
        nameHi: "\u0928\u0940\u0902\u092c\u0942",
        displayName: "Lemon / Limbu (\u0932\u093f\u0902\u092c\u0942 / \u0928\u0940\u0902\u092c\u0942)",
        category: "FRUITS",
        benchmarkModalPrice: 5083.3,
        decayType: "PERISHABLE"
      },
      {
        id: "Mango",
        nameEn: "Mango / Amba",
        nameMr: "\u0906\u0902\u092c\u093e",
        nameHi: "\u0906\u092e",
        displayName: "Mango / Amba (\u0906\u0902\u092c\u093e / \u0906\u092e)",
        category: "FRUITS",
        benchmarkModalPrice: 13000.0,
        decayType: "PERISHABLE"
      },
      {
        id: "Mango(Raw-Ripe)",
        nameEn: "Raw Mango / Kairi",
        nameMr: "\u0915\u0948\u0930\u0940",
        nameHi: "\u0915\u091a\u094d\u091a\u093e \u0906\u092e",
        displayName: "Raw Mango / Kairi (\u0915\u0948\u0930\u0940 / \u0915\u091a\u094d\u091a\u093e \u0906\u092e)",
        category: "FRUITS",
        benchmarkModalPrice: 4000.0,
        decayType: "PERISHABLE"
      },
      {
        id: "Pineapple",
        nameEn: "Pineapple",
        nameMr: "\u0905\u0928\u0928\u0938",
        nameHi: "\u0905\u0928\u093e\u0928\u093e\u0938",
        displayName: "Pineapple (\u0905\u0928\u0928\u0938 / \u0905\u0928\u093e\u0928\u093e\u0938)",
        category: "FRUITS",
        benchmarkModalPrice: 3575.0,
        decayType: "PERISHABLE"
      },
      {
        id: "Plum",
        nameEn: "Plum",
        nameMr: "\u092a\u094d\u0932\u092e",
        nameHi: "\u0906\u0932\u0942\u092c\u0941\u0916\u093e\u0930\u093e",
        displayName: "Plum (\u092a\u094d\u0932\u092e / \u0906\u0932\u0942\u092c\u0941\u0916\u093e\u0930\u093e)",
        category: "FRUITS",
        benchmarkModalPrice: 6500.0,
        decayType: "PERISHABLE"
      },
      {
        id: "Pear(Marasebu)",
        nameEn: "Pear / Nashpati",
        nameMr: "\u0928\u093e\u0936\u092a\u093e\u0924\u0940",
        nameHi: "\u0928\u093e\u0936\u092a\u093e\u0924\u0940",
        displayName: "Pear / Nashpati (\u0928\u093e\u0936\u092a\u093e\u0924\u0940 / \u0928\u093e\u0936\u092a\u093e\u0924\u0940)",
        category: "FRUITS",
        benchmarkModalPrice: 10000.0,
        decayType: "PERISHABLE"
      },
      {
        id: "Amla(Nelli Kai)",
        nameEn: "Amla",
        nameMr: "\u0906\u0935\u0933\u093e",
        nameHi: "\u0906\u0901\u0935\u0932\u093e",
        displayName: "Amla (\u0906\u0935\u0933\u093e / \u0906\u0901\u0935\u0932\u093e)",
        category: "FRUITS",
        benchmarkModalPrice: 4000.0,
        decayType: "PERISHABLE"
      },
      {
        id: "Chikoos(Sapota)",
        nameEn: "Chikoo / Sapota",
        nameMr: "\u091a\u093f\u0915\u094d\u0915\u0942",
        nameHi: "\u091a\u0940\u0915\u0942",
        displayName: "Chikoo / Sapota (\u091a\u093f\u0915\u094d\u0915\u0942 / \u091a\u0940\u0915\u0942)",
        category: "FRUITS",
        benchmarkModalPrice: 3500.0,
        decayType: "PERISHABLE"
      },
      {
        id: "Coconut",
        nameEn: "Coconut",
        nameMr: "\u0928\u093e\u0930\u0933",
        nameHi: "\u0928\u093e\u0930\u093f\u092f\u0932",
        displayName: "Coconut (\u0928\u093e\u0930\u0933 / \u0928\u093e\u0930\u093f\u092f\u0932)",
        category: "FRUITS",
        benchmarkModalPrice: 4025.0,
        decayType: "PERISHABLE"
      },
      {
        id: "Tender Coconut",
        nameEn: "Tender Coconut",
        nameMr: "\u0936\u0939\u093e\u0933\u0947",
        nameHi: "\u0921\u093e\u092c",
        displayName: "Tender Coconut (\u0936\u0939\u093e\u0933\u0947 / \u0921\u093e\u092c)",
        category: "FRUITS",
        benchmarkModalPrice: 3075.0,
        decayType: "PERISHABLE"
      },
      {
        id: "Tamarind Fruit",
        nameEn: "Tamarind",
        nameMr: "\u091a\u093f\u0902\u091a",
        nameHi: "\u0907\u092e\u0932\u0940",
        displayName: "Tamarind (\u091a\u093f\u0902\u091a / \u0907\u092e\u0932\u0940)",
        category: "FRUITS",
        benchmarkModalPrice: 11000.0,
        decayType: "PERISHABLE"
      },
    ]
  },
  {
    id: "OILSEEDS_CASH",
    label: "🌻 गळीत धान्य व नगदी (Oilseeds & Cash Crops)",
    crops: [
      {
        id: "Soyabean",
        nameEn: "Soyabean",
        nameMr: "\u0938\u094b\u092f\u093e\u092c\u0940\u0928",
        nameHi: "\u0938\u094b\u092f\u093e\u092c\u0940\u0928",
        displayName: "Soyabean (\u0938\u094b\u092f\u093e\u092c\u0940\u0928 / \u0938\u094b\u092f\u093e\u092c\u0940\u0928)",
        category: "OILSEEDS_CASH",
        benchmarkModalPrice: 5627.1,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Groundnut",
        nameEn: "Groundnut",
        nameMr: "\u092d\u0941\u0908\u092e\u0942\u0917",
        nameHi: "\u092e\u0942\u0901\u0917\u092b\u0932\u0940",
        displayName: "Groundnut (\u092d\u0941\u0908\u092e\u0942\u0917 / \u092e\u0942\u0901\u0917\u092b\u0932\u0940)",
        category: "OILSEEDS_CASH",
        benchmarkModalPrice: 7263.7,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Ground Nut Seed",
        nameEn: "Groundnut Seed",
        nameMr: "\u0936\u0947\u0902\u0917\u0926\u093e\u0923\u093e \u092c\u0940",
        nameHi: "\u092e\u0942\u0901\u0917\u092b\u0932\u0940 \u0926\u093e\u0928\u093e",
        displayName: "Groundnut Seed (\u0936\u0947\u0902\u0917\u0926\u093e\u0923\u093e \u092c\u0940 / \u092e\u0942\u0901\u0917\u092b\u0932\u0940 \u0926\u093e\u0928\u093e)",
        category: "OILSEEDS_CASH",
        benchmarkModalPrice: 12333.3,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Sesamum(Sesame,Gingelly,Til)",
        nameEn: "Sesame / Til",
        nameMr: "\u0924\u0940\u0933",
        nameHi: "\u0924\u093f\u0932",
        displayName: "Sesame / Til (\u0924\u0940\u0933 / \u0924\u093f\u0932)",
        category: "OILSEEDS_CASH",
        benchmarkModalPrice: 12162.0,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Safflower",
        nameEn: "Safflower / Kardi",
        nameMr: "\u0915\u0930\u0921\u0908",
        nameHi: "\u0915\u0941\u0938\u0941\u092e",
        displayName: "Safflower / Kardi (\u0915\u0930\u0921\u0908 / \u0915\u0941\u0938\u0941\u092e)",
        category: "OILSEEDS_CASH",
        benchmarkModalPrice: 5251.0,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Linseed",
        nameEn: "Linseed / Javas",
        nameMr: "\u091c\u0935\u0938",
        nameHi: "\u0905\u0932\u0938\u0940",
        displayName: "Linseed / Javas (\u091c\u0935\u0938 / \u0905\u0932\u0938\u0940)",
        category: "OILSEEDS_CASH",
        benchmarkModalPrice: 6501.0,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Gur(Jaggery)",
        nameEn: "Jaggery / Gul",
        nameMr: "\u0917\u0942\u0933",
        nameHi: "\u0917\u0941\u0921\u093c",
        displayName: "Jaggery / Gul (\u0917\u0942\u0933 / \u0917\u0941\u0921\u093c)",
        category: "OILSEEDS_CASH",
        benchmarkModalPrice: 5465.0,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Sugar",
        nameEn: "Sugar",
        nameMr: "\u0938\u093e\u0916\u0930",
        nameHi: "\u091a\u0940\u0928\u0940",
        displayName: "Sugar (\u0938\u093e\u0916\u0930 / \u091a\u0940\u0928\u0940)",
        category: "OILSEEDS_CASH",
        benchmarkModalPrice: 5050.0,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Sabu Dan",
        nameEn: "Sabudana",
        nameMr: "\u0938\u093e\u092c\u0941\u0926\u093e\u0923\u093e",
        nameHi: "\u0938\u093e\u092c\u0942\u0926\u093e\u0928\u093e",
        displayName: "Sabudana (\u0938\u093e\u092c\u0941\u0926\u093e\u0923\u093e / \u0938\u093e\u092c\u0942\u0926\u093e\u0928\u093e)",
        category: "OILSEEDS_CASH",
        benchmarkModalPrice: 7600.0,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Guar",
        nameEn: "Guar Seed",
        nameMr: "\u0917\u0941\u0935\u093e\u0930",
        nameHi: "\u0917\u094d\u0935\u093e\u0930",
        displayName: "Guar Seed (\u0917\u0941\u0935\u093e\u0930 / \u0917\u094d\u0935\u093e\u0930)",
        category: "OILSEEDS_CASH",
        benchmarkModalPrice: 5160.7,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Arecanut(Betelnut/Supari)",
        nameEn: "Arecanut / Supari",
        nameMr: "\u0938\u0941\u092a\u093e\u0930\u0940",
        nameHi: "\u0938\u0941\u092a\u093e\u0930\u0940",
        displayName: "Arecanut / Supari (\u0938\u0941\u092a\u093e\u0930\u0940 / \u0938\u0941\u092a\u093e\u0930\u0940)",
        category: "OILSEEDS_CASH",
        benchmarkModalPrice: 63250.0,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Cashewnuts",
        nameEn: "Cashew / Kaju",
        nameMr: "\u0915\u093e\u091c\u0942",
        nameHi: "\u0915\u093e\u091c\u0942",
        displayName: "Cashew / Kaju (\u0915\u093e\u091c\u0942 / \u0915\u093e\u091c\u0942)",
        category: "OILSEEDS_CASH",
        benchmarkModalPrice: 115000.0,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Almond(Badam)",
        nameEn: "Almond / Badam",
        nameMr: "\u092c\u0926\u093e\u092e",
        nameHi: "\u092c\u093e\u0926\u093e\u092e",
        displayName: "Almond / Badam (\u092c\u0926\u093e\u092e / \u092c\u093e\u0926\u093e\u092e)",
        category: "OILSEEDS_CASH",
        benchmarkModalPrice: 95000.0,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Marigold(Calcutta)",
        nameEn: "Marigold / Zendu",
        nameMr: "\u091d\u0947\u0902\u0921\u0942",
        nameHi: "\u0917\u0947\u0902\u0926\u093e",
        displayName: "Marigold / Zendu (\u091d\u0947\u0902\u0921\u0942 / \u0917\u0947\u0902\u0926\u093e)",
        category: "OILSEEDS_CASH",
        benchmarkModalPrice: 2925.0,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Ghee",
        nameEn: "Ghee / Toop",
        nameMr: "\u0924\u0942\u092a",
        nameHi: "\u0918\u0940",
        displayName: "Ghee / Toop (\u0924\u0942\u092a / \u0918\u0940)",
        category: "OILSEEDS_CASH",
        benchmarkModalPrice: 70000.0,
        decayType: "DRY_GRAIN"
      },
    ]
  },
  {
    id: "SPICES",
    label: "🌿 मसाले (Spices)",
    crops: [
      {
        id: "Turmeric",
        nameEn: "Turmeric",
        nameMr: "\u0939\u0933\u0926",
        nameHi: "\u0939\u0932\u094d\u0926\u0940",
        displayName: "Turmeric (\u0939\u0933\u0926 / \u0939\u0932\u094d\u0926\u0940)",
        category: "SPICES",
        benchmarkModalPrice: 16683.8,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Cummin Seed(Jeera)",
        nameEn: "Cumin / Jeera",
        nameMr: "\u091c\u093f\u0930\u0947",
        nameHi: "\u091c\u0940\u0930\u093e",
        displayName: "Cumin / Jeera (\u091c\u093f\u0930\u0947 / \u091c\u0940\u0930\u093e)",
        category: "SPICES",
        benchmarkModalPrice: 31000.0,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Corriander seed",
        nameEn: "Coriander Seed / Dhane",
        nameMr: "\u0927\u0928\u0947",
        nameHi: "\u0938\u0942\u0916\u093e \u0927\u0928\u093f\u092f\u093e",
        displayName: "Coriander Seed / Dhane (\u0927\u0928\u0947 / \u0938\u0942\u0916\u093e \u0927\u0928\u093f\u092f\u093e)",
        category: "SPICES",
        benchmarkModalPrice: 15333.3,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Chili Red",
        nameEn: "Dry Red Chilli",
        nameMr: "\u0938\u0941\u0915\u0932\u0947\u0932\u0940 \u0932\u093e\u0932 \u092e\u093f\u0930\u091a\u0940",
        nameHi: "\u0938\u0942\u0916\u0940 \u0932\u093e\u0932 \u092e\u093f\u0930\u094d\u091a",
        displayName: "Dry Red Chilli (\u0938\u0941\u0915\u0932\u0947\u0932\u0940 \u0932\u093e\u0932 \u092e\u093f\u0930\u091a\u0940 / \u0938\u0942\u0916\u0940 \u0932\u093e\u0932 \u092e\u093f\u0930\u094d\u091a)",
        category: "SPICES",
        benchmarkModalPrice: 39000.0,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Black pepper",
        nameEn: "Black Pepper",
        nameMr: "\u0915\u093e\u0933\u0940 \u092e\u093f\u0930\u0940",
        nameHi: "\u0915\u093e\u0932\u0940 \u092e\u093f\u0930\u094d\u091a",
        displayName: "Black Pepper (\u0915\u093e\u0933\u0940 \u092e\u093f\u0930\u0940 / \u0915\u093e\u0932\u0940 \u092e\u093f\u0930\u094d\u091a)",
        category: "SPICES",
        benchmarkModalPrice: 75000.0,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Cardamom",
        nameEn: "Cardamom",
        nameMr: "\u0935\u0947\u0932\u091a\u0940",
        nameHi: "\u0907\u0932\u093e\u092f\u091a\u0940",
        displayName: "Cardamom (\u0935\u0947\u0932\u091a\u0940 / \u0907\u0932\u093e\u092f\u091a\u0940)",
        category: "SPICES",
        benchmarkModalPrice: 297500.0,
        decayType: "DRY_GRAIN"
      },
      {
        id: "Soanf",
        nameEn: "Fennel / Badishep",
        nameMr: "\u092c\u0921\u0940\u0936\u0947\u092a",
        nameHi: "\u0938\u094c\u0902\u092b",
        displayName: "Fennel / Badishep (\u092c\u0921\u0940\u0936\u0947\u092a / \u0938\u094c\u0902\u092b)",
        category: "SPICES",
        benchmarkModalPrice: 23500.0,
        decayType: "DRY_GRAIN"
      },
    ]
  },
];

export const ALL_CROPS: CropItem[] = CROP_CATEGORIES.flatMap(cat => cat.crops);

const CROP_LOOKUP = new Map<string, CropItem>();
for (const crop of ALL_CROPS) {
  CROP_LOOKUP.set(crop.id.toLowerCase(), crop);
  CROP_LOOKUP.set(crop.nameEn.toLowerCase(), crop);
}

/**
 * Finds a crop by exact or normalized name
 */
export function getCropConfig(name: string): CropItem {
  const key = (name || '').toLowerCase().trim();
  const direct = CROP_LOOKUP.get(key);
  if (direct) return direct;

  // Search partial matches
  for (const [k, v] of CROP_LOOKUP.entries()) {
    if (k.includes(key) || key.includes(k)) return v;
  }

  // Safe fallback to Onion
  return CROP_LOOKUP.get('onion') || ALL_CROPS[0];
}

/**
 * Generates HTML <optgroup> options for a <select> element
 */
export function renderCropOptgroupsHtml(selectedCropId: string = 'Onion'): string {
  const normSelected = (selectedCropId || 'Onion').toLowerCase();
  return CROP_CATEGORIES.map(cat => {
    const options = cat.crops.map(crop => {
      const isSelected = crop.id.toLowerCase() === normSelected || crop.nameEn.toLowerCase() === normSelected;
      return `<option value="${crop.id}" ${isSelected ? 'selected' : ''}>${crop.displayName}</option>`;
    }).join('\n      ');
    return `  <optgroup label="${cat.label}">\n      ${options}\n    </optgroup>`;
  }).join('\n\n');
}

/**
 * Generates HTML <datalist> for instant search
 */
export function renderCropDatalistHtml(datalistId: string = 'crop-datalist'): string {
  const options = ALL_CROPS.map(crop => 
    `<option value="${crop.id}">${crop.displayName}</option>`
  ).join('\n  ');
  return `<datalist id="${datalistId}">\n  ${options}\n</datalist>`;
}

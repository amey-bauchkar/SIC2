"""
MandiMitra — All 36 Districts & Major APMC Mandis Directory of Maharashtra
Covers all 6 administrative divisions, all 36 districts, primary commodities, and major APMCs.
"""

MAHARASHTRA_DISTRICTS = {
    # -------------------------------------------------------------
    # 1. NASHIK DIVISION (North Maharashtra / Khandesh)
    # -------------------------------------------------------------
    "Nashik": {
        "division": "Nashik",
        "hq_name": "Nashik",
        "hq_coords": [19.9975, 73.7898],
        "major_commodities": ["Onion", "Tomato", "Grapes", "Pomegranate", "Maize"],
        "apmc_mandis": [
            {"id": "nsk_lasalgaon", "name": "Lasalgaon", "taluka": "Niphad", "type": "National Onion Terminal", "coords": [20.1477, 74.2254]},
            {"id": "nsk_pimpalgaon", "name": "Pimpalgaon Baswant", "taluka": "Niphad", "type": "Major Onion/Tomato APMC", "coords": [20.1706, 73.9877]},
            {"id": "nsk_nashik", "name": "Nashik (Dindori Road)", "taluka": "Nashik", "type": "District Central APMC", "coords": [20.0160, 73.7997]},
            {"id": "nsk_manmad", "name": "Manmad", "taluka": "Nandgaon", "type": "Grain & Onion APMC", "coords": [20.2526, 74.4428]},
            {"id": "nsk_sinnar", "name": "Sinnar", "taluka": "Sinnar", "type": "Onion & Veg APMC", "coords": [19.8475, 74.0006]},
            {"id": "nsk_yeola", "name": "Yeola", "taluka": "Yeola", "type": "Onion & Maize APMC", "coords": [20.0425, 74.4897]}
        ]
    },
    "Ahilyanagar": {  # Formerly Ahmednagar
        "division": "Nashik",
        "hq_name": "Ahilyanagar (Ahmednagar)",
        "hq_coords": [19.0952, 74.7480],
        "major_commodities": ["Onion", "Soyabean", "Pomegranate", "Sugarcane", "Wheat"],
        "apmc_mandis": [
            {"id": "ahn_ahmednagar", "name": "Ahmednagar", "taluka": "Nagar", "type": "District Central APMC", "coords": [19.0948, 74.7492]},
            {"id": "ahn_rahata", "name": "Rahata", "taluka": "Rahata", "type": "Major Onion & Pomegranate APMC", "coords": [19.6644, 74.4988]},
            {"id": "ahn_sangamner", "name": "Sangamner", "taluka": "Sangamner", "type": "Tomato & Veg APMC", "coords": [19.5772, 74.2144]},
            {"id": "ahn_kopargaon", "name": "Kopargaon", "taluka": "Kopargaon", "type": "Grain & Cash Crop APMC", "coords": [19.8895, 74.4789]}
        ]
    },
    "Jalgaon": {
        "division": "Nashik",
        "hq_name": "Jalgaon",
        "hq_coords": [21.0077, 75.5626],
        "major_commodities": ["Banana", "Cotton", "Maize", "Soyabean", "Jowar"],
        "apmc_mandis": [
            {"id": "jlg_jalgaon", "name": "Jalgaon", "taluka": "Jalgaon", "type": "District Central APMC", "coords": [21.0055, 75.5650]},
            {"id": "jlg_raver", "name": "Raver", "taluka": "Raver", "type": "India's Banana Capital APMC", "coords": [21.2464, 76.0322]},
            {"id": "jlg_chalisgaon", "name": "Chalisgaon", "taluka": "Chalisgaon", "type": "Maize & Cotton APMC", "coords": [20.4632, 75.0125]}
        ]
    },
    "Dhule": {
        "division": "Nashik",
        "hq_name": "Dhule",
        "hq_coords": [20.9042, 74.7749],
        "major_commodities": ["Cotton", "Chilli", "Onion", "Maize", "Bajra"],
        "apmc_mandis": [
            {"id": "dhl_dhule", "name": "Dhule", "taluka": "Dhule", "type": "District Central APMC", "coords": [20.9020, 74.7760]},
            {"id": "dhl_dondaicha", "name": "Dondaicha", "taluka": "Sindkheda", "type": "Major Chilli & Maize APMC", "coords": [21.3289, 74.5714]}
        ]
    },
    "Nandurbar": {
        "division": "Nashik",
        "hq_name": "Nandurbar",
        "hq_coords": [21.3739, 74.2405],
        "major_commodities": ["Chilli", "Cotton", "Maize", "Soyabean"],
        "apmc_mandis": [
            {"id": "ndb_nandurbar", "name": "Nandurbar", "taluka": "Nandurbar", "type": "Famous Red Chilli Market", "coords": [21.3710, 74.2420]},
            {"id": "ndb_shahada", "name": "Shahada", "taluka": "Shahada", "type": "Cotton & Grain APMC", "coords": [21.5422, 74.4711]}
        ]
    },

    # -------------------------------------------------------------
    # 2. PUNE DIVISION (Paschim Maharashtra)
    # -------------------------------------------------------------
    "Pune": {
        "division": "Pune",
        "hq_name": "Pune",
        "hq_coords": [18.5204, 73.8567],
        "major_commodities": ["Tomato", "Onion", "Vegetables", "Sugarcane", "Wheat"],
        "apmc_mandis": [
            {"id": "pun_gultekdi", "name": "Pune (Gultekdi)", "taluka": "Haveli", "type": "Mega Market Yard Terminal", "coords": [18.4908, 73.8647]},
            {"id": "pun_narayangaon", "name": "Junnar (Narayangaon)", "taluka": "Junnar", "type": "Western India Tomato Hub", "coords": [19.1177, 73.9785]},
            {"id": "pun_baramati", "name": "Baramati", "taluka": "Baramati", "type": "Sugarcane & Grain Hub", "coords": [18.1517, 74.5772]},
            {"id": "pun_chakan", "name": "Khed (Chakan)", "taluka": "Khed", "type": "Onion & Green Veg APMC", "coords": [18.7610, 73.8596]}
        ]
    },
    "Solapur": {
        "division": "Pune",
        "hq_name": "Solapur",
        "hq_coords": [17.6599, 75.9064],
        "major_commodities": ["Pomegranate", "Onion", "Jowar", "Chilli", "Grape"],
        "apmc_mandis": [
            {"id": "sol_solapur", "name": "Solapur", "taluka": "Solapur North", "type": "India's Pomegranate Hub APMC", "coords": [17.6580, 75.9080]},
            {"id": "sol_barshi", "name": "Barshi", "taluka": "Barshi", "type": "Pulses & Lentils Major APMC", "coords": [18.2325, 75.6942]},
            {"id": "sol_pandharpur", "name": "Pandharpur", "taluka": "Pandharpur", "type": "Vegetable & Jowar APMC", "coords": [17.6778, 75.3283]}
        ]
    },
    "Kolhapur": {
        "division": "Pune",
        "hq_name": "Kolhapur",
        "hq_coords": [16.7050, 74.2433],
        "major_commodities": ["Jaggery", "Sugarcane", "Soyabean", "Groundnut", "Rice"],
        "apmc_mandis": [
            {"id": "kop_kolhapur", "name": "Kolhapur (Shahu Market)", "taluka": "Karveer", "type": "National Jaggery Market", "coords": [16.7020, 74.2450]},
            {"id": "kop_gadhinglaj", "name": "Gadhinglaj", "taluka": "Gadhinglaj", "type": "Southern Border Grain APMC", "coords": [16.2294, 74.3512]}
        ]
    },
    "Sangli": {
        "division": "Pune",
        "hq_name": "Sangli",
        "hq_coords": [16.8524, 74.5815],
        "major_commodities": ["Turmeric", "Grapes", "Raisins", "Soyabean", "Maize"],
        "apmc_mandis": [
            {"id": "sgl_sangli", "name": "Sangli", "taluka": "Miraj", "type": "Asia's Largest Turmeric & Raisin Hub", "coords": [16.8500, 74.5800]},
            {"id": "sgl_tasgaon", "name": "Tasgaon", "taluka": "Tasgaon", "type": "Famous Raisin/Grapes APMC", "coords": [17.0342, 74.6044]}
        ]
    },
    "Satara": {
        "division": "Pune",
        "hq_name": "Satara",
        "hq_coords": [17.6805, 74.0183],
        "major_commodities": ["Ginger", "Strawberry", "Soyabean", "Onion", "Sugarcane"],
        "apmc_mandis": [
            {"id": "str_satara", "name": "Satara", "taluka": "Satara", "type": "District Central APMC", "coords": [17.6800, 74.0190]},
            {"id": "str_karad", "name": "Karad", "taluka": "Karad", "type": "Major South Satara APMC", "coords": [17.2885, 74.1844]},
            {"id": "str_wai", "name": "Wai", "taluka": "Wai", "type": "Turmeric & Ginger APMC", "coords": [17.9472, 73.8928]}
        ]
    },

    # -------------------------------------------------------------
    # 3. CHHATRAPATI SAMBHAJINAGAR DIVISION (Marathwada)
    # -------------------------------------------------------------
    "Chhatrapati Sambhajinagar": {  # Formerly Aurangabad
        "division": "Chhatrapati Sambhajinagar",
        "hq_name": "Chhatrapati Sambhajinagar",
        "hq_coords": [19.8762, 75.3433],
        "major_commodities": ["Cotton", "Soyabean", "Maize", "Ginger", "Mosambi"],
        "apmc_mandis": [
            {"id": "csn_aurangabad", "name": "Chh. Sambhajinagar (Jadhavwadi)", "taluka": "Aurangabad", "type": "Central Marathwada APMC", "coords": [19.8980, 75.3620]},
            {"id": "csn_paithan", "name": "Paithan", "taluka": "Paithan", "type": "Cotton & Grain APMC", "coords": [19.4817, 75.3853]}
        ]
    },
    "Jalna": {
        "division": "Chhatrapati Sambhajinagar",
        "hq_name": "Jalna",
        "hq_coords": [19.8347, 75.8816],
        "major_commodities": ["Mosambi (Sweet Lime)", "Soyabean", "Cotton", "Chilli", "Maize"],
        "apmc_mandis": [
            {"id": "jln_jalna", "name": "Jalna", "taluka": "Jalna", "type": "Major Seed & Sweet Lime Capital", "coords": [19.8350, 75.8820]},
            {"id": "jln_partur", "name": "Partur", "taluka": "Partur", "type": "Cotton & Soyabean APMC", "coords": [19.5934, 76.2163]}
        ]
    },
    "Beed": {
        "division": "Chhatrapati Sambhajinagar",
        "hq_name": "Beed",
        "hq_coords": [18.9891, 75.7601],
        "major_commodities": ["Soyabean", "Cotton", "Tur", "Jowar", "Sugarcane"],
        "apmc_mandis": [
            {"id": "bed_beed", "name": "Beed", "taluka": "Beed", "type": "District Central APMC", "coords": [18.9900, 75.7610]},
            {"id": "bed_parli", "name": "Parli Vaijnath", "taluka": "Parli", "type": "Cotton & Pulse APMC", "coords": [18.8524, 76.5367]}
        ]
    },
    "Latur": {
        "division": "Chhatrapati Sambhajinagar",
        "hq_name": "Latur",
        "hq_coords": [18.4088, 76.5604],
        "major_commodities": ["Soyabean", "Tur (Arhar)", "Urad", "Chana (Bengal Gram)"],
        "apmc_mandis": [
            {"id": "lat_latur", "name": "Latur", "taluka": "Latur", "type": "National Pulses & Soybean Hub", "coords": [18.3976, 76.5786]},
            {"id": "lat_udgir", "name": "Udgir", "taluka": "Udgir", "type": "Oilseed & Grain Terminal", "coords": [18.3942, 77.1147]},
            {"id": "lat_ahmedpur", "name": "Ahmedpur", "taluka": "Ahmedpur", "type": "Grain & Pulse APMC", "coords": [18.7051, 76.9318]}
        ]
    },
    "Dharashiv": {  # Formerly Osmanabad
        "division": "Chhatrapati Sambhajinagar",
        "hq_name": "Dharashiv",
        "hq_coords": [18.1861, 76.0419],
        "major_commodities": ["Soyabean", "Tur", "Chana", "Sugarcane", "Jowar"],
        "apmc_mandis": [
            {"id": "dhr_dharashiv", "name": "Dharashiv", "taluka": "Dharashiv", "type": "District Central APMC", "coords": [18.1850, 76.0420]},
            {"id": "dhr_tuljapur", "name": "Tuljapur", "taluka": "Tuljapur", "type": "Soyabean & Jowar APMC", "coords": [18.0076, 76.0754]}
        ]
    },
    "Nanded": {
        "division": "Chhatrapati Sambhajinagar",
        "hq_name": "Nanded",
        "hq_coords": [19.1383, 77.3210],
        "major_commodities": ["Cotton", "Soyabean", "Turmeric", "Banana", "Jowar"],
        "apmc_mandis": [
            {"id": "ndd_nanded", "name": "Nanded", "taluka": "Nanded", "type": "Major Cotton & Turmeric APMC", "coords": [19.1390, 77.3220]},
            {"id": "ndd_degloor", "name": "Degloor", "taluka": "Degloor", "type": "Border Grain APMC", "coords": [18.5528, 77.5815]}
        ]
    },
    "Parbhani": {
        "division": "Chhatrapati Sambhajinagar",
        "hq_name": "Parbhani",
        "hq_coords": [19.2686, 76.7708],
        "major_commodities": ["Cotton", "Soyabean", "Jowar", "Tur"],
        "apmc_mandis": [
            {"id": "pbn_parbhani", "name": "Parbhani", "taluka": "Parbhani", "type": "District Central APMC", "coords": [19.2690, 76.7710]},
            {"id": "pbn_gangakhed", "name": "Gangakhed", "taluka": "Gangakhed", "type": "Cotton & Soyabean APMC", "coords": [18.9567, 76.7533]}
        ]
    },
    "Hingoli": {
        "division": "Chhatrapati Sambhajinagar",
        "hq_name": "Hingoli",
        "hq_coords": [19.7188, 77.1475],
        "major_commodities": ["Soyabean", "Turmeric", "Cotton", "Jowar"],
        "apmc_mandis": [
            {"id": "hng_hingoli", "name": "Hingoli", "taluka": "Hingoli", "type": "District Central APMC", "coords": [19.7180, 77.1480]},
            {"id": "hng_basmath", "name": "Basmath", "taluka": "Basmath", "type": "Major Turmeric APMC", "coords": [19.5167, 77.1667]}
        ]
    },

    # -------------------------------------------------------------
    # 4. AMRAVATI DIVISION (Western Vidarbha)
    # -------------------------------------------------------------
    "Amravati": {
        "division": "Amravati",
        "hq_name": "Amravati",
        "hq_coords": [20.9374, 77.7796],
        "major_commodities": ["Soyabean", "Cotton", "Tur", "Orange", "Gram"],
        "apmc_mandis": [
            {"id": "amt_amravati", "name": "Amravati", "taluka": "Amravati", "type": "Vidarbha Soyabean Capital", "coords": [20.9380, 77.7800]},
            {"id": "amt_warud", "name": "Warud", "taluka": "Warud", "type": "Famous Orange Market (California of Vidarbha)", "coords": [21.4642, 78.2678]}
        ]
    },
    "Akola": {
        "division": "Amravati",
        "hq_name": "Akola",
        "hq_coords": [20.7002, 77.0082],
        "major_commodities": ["Cotton", "Soyabean", "Tur", "Gram (Chana)", "Jowar"],
        "apmc_mandis": [
            {"id": "akl_akola", "name": "Akola", "taluka": "Akola", "type": "Historical Cotton City APMC", "coords": [20.7010, 77.0090]},
            {"id": "akl_akot", "name": "Akot", "taluka": "Akot", "type": "Cotton & Turmeric APMC", "coords": [21.0967, 77.0583]}
        ]
    },
    "Yavatmal": {
        "division": "Amravati",
        "hq_name": "Yavatmal",
        "hq_coords": [20.3888, 78.1204],
        "major_commodities": ["Cotton", "Soyabean", "Tur", "Wheat"],
        "apmc_mandis": [
            {"id": "yvt_yavatmal", "name": "Yavatmal", "taluka": "Yavatmal", "type": "White Gold (Cotton) Capital", "coords": [20.3890, 78.1210]},
            {"id": "yvt_wani", "name": "Wani", "taluka": "Wani", "type": "Cotton & Grain APMC", "coords": [20.0631, 78.9525]}
        ]
    },
    "Buldhana": {
        "division": "Amravati",
        "hq_name": "Buldhana",
        "hq_coords": [20.5300, 76.1800],
        "major_commodities": ["Soyabean", "Cotton", "Maize", "Ginger", "Chilli"],
        "apmc_mandis": [
            {"id": "bld_khamgaon", "name": "Khamgaon", "taluka": "Khamgaon", "type": "Historic Cotton & Silver Hub", "coords": [20.6931, 76.5714]},
            {"id": "bld_malkapur", "name": "Malkapur", "taluka": "Malkapur", "type": "Major Grain APMC", "coords": [20.8842, 76.2025]}
        ]
    },
    "Washim": {
        "division": "Amravati",
        "hq_name": "Washim",
        "hq_coords": [20.1111, 77.1333],
        "major_commodities": ["Soyabean", "Tur", "Gram", "Wheat"],
        "apmc_mandis": [
            {"id": "wsh_washim", "name": "Washim", "taluka": "Washim", "type": "District Central Soyabean APMC", "coords": [20.1120, 77.1340]},
            {"id": "wsh_karanja", "name": "Karanja Lad", "taluka": "Karanja", "type": "High Volume Soyabean APMC", "coords": [20.4833, 77.4833]}
        ]
    },

    # -------------------------------------------------------------
    # 5. NAGPUR DIVISION (Eastern Vidarbha)
    # -------------------------------------------------------------
    "Nagpur": {
        "division": "Nagpur",
        "hq_name": "Nagpur",
        "hq_coords": [21.1458, 79.0882],
        "major_commodities": ["Orange", "Soyabean", "Cotton", "Tur", "Paddy"],
        "apmc_mandis": [
            {"id": "ngp_kalamna", "name": "Nagpur (Kalamna)", "taluka": "Nagpur Urban", "type": "Central India Mega Wholesale Market", "coords": [21.1789, 79.1432]},
            {"id": "ngp_katol", "name": "Katol", "taluka": "Katol", "type": "Famous Orange & Cotton APMC", "coords": [21.2667, 78.5833]}
        ]
    },
    "Wardha": {
        "division": "Nagpur",
        "hq_name": "Wardha",
        "hq_coords": [20.7453, 78.6022],
        "major_commodities": ["Cotton", "Soyabean", "Tur", "Wheat"],
        "apmc_mandis": [
            {"id": "wrd_wardha", "name": "Wardha", "taluka": "Wardha", "type": "District Central APMC", "coords": [20.7460, 78.6030]},
            {"id": "wrd_hinganghat", "name": "Hinganghat", "taluka": "Hinganghat", "type": "Major Cotton & Oilseed APMC", "coords": [20.5500, 78.8333]}
        ]
    },
    "Chandrapur": {
        "division": "Nagpur",
        "hq_name": "Chandrapur",
        "hq_coords": [19.9615, 79.2961],
        "major_commodities": ["Paddy (Rice)", "Soyabean", "Cotton", "Tur"],
        "apmc_mandis": [
            {"id": "chd_chandrapur", "name": "Chandrapur", "taluka": "Chandrapur", "type": "District Central APMC", "coords": [19.9620, 79.2970]},
            {"id": "chd_warora", "name": "Warora", "taluka": "Warora", "type": "Cotton & Grain APMC", "coords": [20.2333, 79.0000]}
        ]
    },
    "Bhandara": {
        "division": "Nagpur",
        "hq_name": "Bhandara",
        "hq_coords": [21.1714, 79.6547],
        "major_commodities": ["Paddy (Rice)", "Soyabean", "Wheat", "Chana"],
        "apmc_mandis": [
            {"id": "bhn_bhandara", "name": "Bhandara", "taluka": "Bhandara", "type": "Paddy & Rice Bowl APMC", "coords": [21.1720, 79.6550]},
            {"id": "bhn_tumsar", "name": "Tumsar", "taluka": "Tumsar", "type": "Major Rice Mill & Grain APMC", "coords": [21.3833, 79.7333]}
        ]
    },
    "Gondia": {
        "division": "Nagpur",
        "hq_name": "Gondia",
        "hq_coords": [21.4598, 80.1961],
        "major_commodities": ["Paddy (Rice)", "Linseed", "Wheat"],
        "apmc_mandis": [
            {"id": "gnd_gondia", "name": "Gondia", "taluka": "Gondia", "type": "Rice City Terminal APMC", "coords": [21.4600, 80.1970]},
            {"id": "gnd_tirora", "name": "Tirora", "taluka": "Tirora", "type": "Paddy APMC", "coords": [21.4167, 79.9333]}
        ]
    },
    "Gadchiroli": {
        "division": "Nagpur",
        "hq_name": "Gadchiroli",
        "hq_coords": [20.1849, 80.0030],
        "major_commodities": ["Paddy (Rice)", "Minor Forest Produce", "Soyabean"],
        "apmc_mandis": [
            {"id": "gdc_gadchiroli", "name": "Gadchiroli", "taluka": "Gadchiroli", "type": "District Central APMC", "coords": [20.1850, 80.0040]},
            {"id": "gdc_chamorshi", "name": "Chamorshi", "taluka": "Chamorshi", "type": "Paddy APMC", "coords": [19.9333, 79.9167]}
        ]
    },

    # -------------------------------------------------------------
    # 6. KONKAN DIVISION (Coastal Maharashtra)
    # -------------------------------------------------------------
    "Mumbai Suburban": {
        "division": "Konkan",
        "hq_name": "Navi Mumbai (Vashi APMC)",
        "hq_coords": [19.0760, 72.8777],
        "major_commodities": ["All Fruits", "All Vegetables", "Spices", "Grain Terminal"],
        "apmc_mandis": [
            {"id": "bom_vashi", "name": "Navi Mumbai (Vashi APMC)", "taluka": "Thane/Navi Mumbai", "type": "Apex Wholesale Terminal for entire Maharashtra", "coords": [19.0736, 73.0086]}
        ]
    },
    "Mumbai City": {
        "division": "Konkan",
        "hq_name": "Mumbai City",
        "hq_coords": [18.9388, 72.8354],
        "major_commodities": ["Consumption Terminal", "Fish & Export Hub"],
        "apmc_mandis": [
            {"id": "bom_byculla", "name": "Mumbai (Byculla Market)", "taluka": "Mumbai City", "type": "Historic Vegetable Wholesale Market", "coords": [18.9774, 72.8335]}
        ]
    },
    "Thane": {
        "division": "Konkan",
        "hq_name": "Thane",
        "hq_coords": [19.2183, 72.9781],
        "major_commodities": ["Vegetables", "Paddy", "Fruits"],
        "apmc_mandis": [
            {"id": "thn_kalyan", "name": "Kalyan", "taluka": "Kalyan", "type": "Major Vegetable Wholesale APMC", "coords": [19.2437, 73.1355]},
            {"id": "thn_murbad", "name": "Murbad", "taluka": "Murbad", "type": "Paddy & Grain APMC", "coords": [19.2500, 73.4000]}
        ]
    },
    "Palghar": {
        "division": "Konkan",
        "hq_name": "Palghar",
        "hq_coords": [19.6967, 72.7699],
        "major_commodities": ["Chiku (Sapota)", "Paddy", "Vegetables", "Grass"],
        "apmc_mandis": [
            {"id": "plg_dahanu", "name": "Dahanu (Gholvad)", "taluka": "Dahanu", "type": "National GI Chiku Capital", "coords": [19.9700, 72.7300]},
            {"id": "plg_palghar", "name": "Palghar", "taluka": "Palghar", "type": "District Central APMC", "coords": [19.6970, 72.7700]}
        ]
    },
    "Raigad": {
        "division": "Konkan",
        "hq_name": "Alibaug",
        "hq_coords": [18.6560, 72.8690],
        "major_commodities": ["Paddy", "Mango (Alphonso)", "Coconut", "Vegetables"],
        "apmc_mandis": [
            {"id": "rgd_panvel", "name": "Panvel", "taluka": "Panvel", "type": "Key Urban Gate APMC", "coords": [18.9894, 73.1175]},
            {"id": "rgd_pen", "name": "Pen", "taluka": "Pen", "type": "Paddy & Salt Terminal", "coords": [18.7333, 73.0833]}
        ]
    },
    "Ratnagiri": {
        "division": "Konkan",
        "hq_name": "Ratnagiri",
        "hq_coords": [16.9902, 73.3120],
        "major_commodities": ["Hapus Mango (Alphonso)", "Cashewnut", "Coconut", "Paddy"],
        "apmc_mandis": [
            {"id": "rtn_ratnagiri", "name": "Ratnagiri", "taluka": "Ratnagiri", "type": "GI Alphonso Mango Terminal", "coords": [16.9910, 73.3130]},
            {"id": "rtn_chiplun", "name": "Chiplun", "taluka": "Chiplun", "type": "Mid-Konkan Agricultural Hub", "coords": [17.5333, 73.5167]}
        ]
    },
    "Sindhudurg": {
        "division": "Konkan",
        "hq_name": "Oros",
        "hq_coords": [16.1158, 73.6976],
        "major_commodities": ["Alphonso Mango", "Cashew", "Coconut", "Betel Nut"],
        "apmc_mandis": [
            {"id": "snd_kudal", "name": "Kudal", "taluka": "Kudal", "type": "South Konkan Mango & Cashew APMC", "coords": [16.0167, 73.6833]},
            {"id": "snd_sawantwadi", "name": "Sawantwadi", "taluka": "Sawantwadi", "type": "Border Horticultural APMC", "coords": [15.9000, 73.8167]}
        ]
    }
}

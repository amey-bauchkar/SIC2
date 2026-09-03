/**
 * MandiMitra Data Pipeline: Regional APMC Market Registry
 * Complete state-wide registry of all 82 major Maharashtra APMC mandis.
 * 
 * OWNER: Amay (Team Lead)
 */

import { Market } from '../contracts/domain';

export const MAHARASHTRA_MANDIS: Market[] = [
  {
    id: 'nsk_lasalgaon',
    name: 'Lasalgaon',
    state: 'Maharashtra',
    district: 'Nashik',
    lat: 20.1477,
    lon: 74.2254
  },
  {
    id: 'nsk_pimpalgaon',
    name: 'Pimpalgaon Baswant',
    state: 'Maharashtra',
    district: 'Nashik',
    lat: 20.1706,
    lon: 73.9877
  },
  {
    id: 'nsk_nashik',
    name: 'Nashik (Dindori Road)',
    state: 'Maharashtra',
    district: 'Nashik',
    lat: 20.016,
    lon: 73.7997
  },
  {
    id: 'nsk_manmad',
    name: 'Manmad',
    state: 'Maharashtra',
    district: 'Nashik',
    lat: 20.2526,
    lon: 74.4428
  },
  {
    id: 'nsk_sinnar',
    name: 'Sinnar',
    state: 'Maharashtra',
    district: 'Nashik',
    lat: 19.8475,
    lon: 74.0006
  },
  {
    id: 'nsk_yeola',
    name: 'Yeola',
    state: 'Maharashtra',
    district: 'Nashik',
    lat: 20.0425,
    lon: 74.4897
  },
  {
    id: 'ahn_ahmednagar',
    name: 'Ahmednagar',
    state: 'Maharashtra',
    district: 'Ahilyanagar',
    lat: 19.0948,
    lon: 74.7492
  },
  {
    id: 'ahn_rahata',
    name: 'Rahata',
    state: 'Maharashtra',
    district: 'Ahilyanagar',
    lat: 19.6644,
    lon: 74.4988
  },
  {
    id: 'ahn_sangamner',
    name: 'Sangamner',
    state: 'Maharashtra',
    district: 'Ahilyanagar',
    lat: 19.5772,
    lon: 74.2144
  },
  {
    id: 'ahn_kopargaon',
    name: 'Kopargaon',
    state: 'Maharashtra',
    district: 'Ahilyanagar',
    lat: 19.8895,
    lon: 74.4789
  },
  {
    id: 'jlg_jalgaon',
    name: 'Jalgaon',
    state: 'Maharashtra',
    district: 'Jalgaon',
    lat: 21.0055,
    lon: 75.565
  },
  {
    id: 'jlg_raver',
    name: 'Raver',
    state: 'Maharashtra',
    district: 'Jalgaon',
    lat: 21.2464,
    lon: 76.0322
  },
  {
    id: 'jlg_chalisgaon',
    name: 'Chalisgaon',
    state: 'Maharashtra',
    district: 'Jalgaon',
    lat: 20.4632,
    lon: 75.0125
  },
  {
    id: 'dhl_dhule',
    name: 'Dhule',
    state: 'Maharashtra',
    district: 'Dhule',
    lat: 20.902,
    lon: 74.776
  },
  {
    id: 'dhl_dondaicha',
    name: 'Dondaicha',
    state: 'Maharashtra',
    district: 'Dhule',
    lat: 21.3289,
    lon: 74.5714
  },
  {
    id: 'ndb_nandurbar',
    name: 'Nandurbar',
    state: 'Maharashtra',
    district: 'Nandurbar',
    lat: 21.371,
    lon: 74.242
  },
  {
    id: 'ndb_shahada',
    name: 'Shahada',
    state: 'Maharashtra',
    district: 'Nandurbar',
    lat: 21.5422,
    lon: 74.4711
  },
  {
    id: 'pun_gultekdi',
    name: 'Pune (Gultekdi)',
    state: 'Maharashtra',
    district: 'Pune',
    lat: 18.4908,
    lon: 73.8647
  },
  {
    id: 'pun_narayangaon',
    name: 'Junnar (Narayangaon)',
    state: 'Maharashtra',
    district: 'Pune',
    lat: 19.1177,
    lon: 73.9785
  },
  {
    id: 'pun_baramati',
    name: 'Baramati',
    state: 'Maharashtra',
    district: 'Pune',
    lat: 18.1517,
    lon: 74.5772
  },
  {
    id: 'pun_chakan',
    name: 'Khed (Chakan)',
    state: 'Maharashtra',
    district: 'Pune',
    lat: 18.761,
    lon: 73.8596
  },
  {
    id: 'sol_solapur',
    name: 'Solapur',
    state: 'Maharashtra',
    district: 'Solapur',
    lat: 17.658,
    lon: 75.908
  },
  {
    id: 'sol_barshi',
    name: 'Barshi',
    state: 'Maharashtra',
    district: 'Solapur',
    lat: 18.2325,
    lon: 75.6942
  },
  {
    id: 'sol_pandharpur',
    name: 'Pandharpur',
    state: 'Maharashtra',
    district: 'Solapur',
    lat: 17.6778,
    lon: 75.3283
  },
  {
    id: 'kop_kolhapur',
    name: 'Kolhapur (Shahu Market)',
    state: 'Maharashtra',
    district: 'Kolhapur',
    lat: 16.702,
    lon: 74.245
  },
  {
    id: 'kop_gadhinglaj',
    name: 'Gadhinglaj',
    state: 'Maharashtra',
    district: 'Kolhapur',
    lat: 16.2294,
    lon: 74.3512
  },
  {
    id: 'sgl_sangli',
    name: 'Sangli',
    state: 'Maharashtra',
    district: 'Sangli',
    lat: 16.85,
    lon: 74.58
  },
  {
    id: 'sgl_tasgaon',
    name: 'Tasgaon',
    state: 'Maharashtra',
    district: 'Sangli',
    lat: 17.0342,
    lon: 74.6044
  },
  {
    id: 'str_satara',
    name: 'Satara',
    state: 'Maharashtra',
    district: 'Satara',
    lat: 17.68,
    lon: 74.019
  },
  {
    id: 'str_karad',
    name: 'Karad',
    state: 'Maharashtra',
    district: 'Satara',
    lat: 17.2885,
    lon: 74.1844
  },
  {
    id: 'str_wai',
    name: 'Wai',
    state: 'Maharashtra',
    district: 'Satara',
    lat: 17.9472,
    lon: 73.8928
  },
  {
    id: 'csn_aurangabad',
    name: 'Chh. Sambhajinagar (Jadhavwadi)',
    state: 'Maharashtra',
    district: 'Chhatrapati Sambhajinagar',
    lat: 19.898,
    lon: 75.362
  },
  {
    id: 'csn_paithan',
    name: 'Paithan',
    state: 'Maharashtra',
    district: 'Chhatrapati Sambhajinagar',
    lat: 19.4817,
    lon: 75.3853
  },
  {
    id: 'jln_jalna',
    name: 'Jalna',
    state: 'Maharashtra',
    district: 'Jalna',
    lat: 19.835,
    lon: 75.882
  },
  {
    id: 'jln_partur',
    name: 'Partur',
    state: 'Maharashtra',
    district: 'Jalna',
    lat: 19.5934,
    lon: 76.2163
  },
  {
    id: 'bed_beed',
    name: 'Beed',
    state: 'Maharashtra',
    district: 'Beed',
    lat: 18.99,
    lon: 75.761
  },
  {
    id: 'bed_parli',
    name: 'Parli Vaijnath',
    state: 'Maharashtra',
    district: 'Beed',
    lat: 18.8524,
    lon: 76.5367
  },
  {
    id: 'lat_latur',
    name: 'Latur',
    state: 'Maharashtra',
    district: 'Latur',
    lat: 18.3976,
    lon: 76.5786
  },
  {
    id: 'lat_udgir',
    name: 'Udgir',
    state: 'Maharashtra',
    district: 'Latur',
    lat: 18.3942,
    lon: 77.1147
  },
  {
    id: 'lat_ahmedpur',
    name: 'Ahmedpur',
    state: 'Maharashtra',
    district: 'Latur',
    lat: 18.7051,
    lon: 76.9318
  },
  {
    id: 'dhr_dharashiv',
    name: 'Dharashiv',
    state: 'Maharashtra',
    district: 'Dharashiv',
    lat: 18.185,
    lon: 76.042
  },
  {
    id: 'dhr_tuljapur',
    name: 'Tuljapur',
    state: 'Maharashtra',
    district: 'Dharashiv',
    lat: 18.0076,
    lon: 76.0754
  },
  {
    id: 'ndd_nanded',
    name: 'Nanded',
    state: 'Maharashtra',
    district: 'Nanded',
    lat: 19.139,
    lon: 77.322
  },
  {
    id: 'ndd_degloor',
    name: 'Degloor',
    state: 'Maharashtra',
    district: 'Nanded',
    lat: 18.5528,
    lon: 77.5815
  },
  {
    id: 'pbn_parbhani',
    name: 'Parbhani',
    state: 'Maharashtra',
    district: 'Parbhani',
    lat: 19.269,
    lon: 76.771
  },
  {
    id: 'pbn_gangakhed',
    name: 'Gangakhed',
    state: 'Maharashtra',
    district: 'Parbhani',
    lat: 18.9567,
    lon: 76.7533
  },
  {
    id: 'hng_hingoli',
    name: 'Hingoli',
    state: 'Maharashtra',
    district: 'Hingoli',
    lat: 19.718,
    lon: 77.148
  },
  {
    id: 'hng_basmath',
    name: 'Basmath',
    state: 'Maharashtra',
    district: 'Hingoli',
    lat: 19.5167,
    lon: 77.1667
  },
  {
    id: 'amt_amravati',
    name: 'Amravati',
    state: 'Maharashtra',
    district: 'Amravati',
    lat: 20.938,
    lon: 77.78
  },
  {
    id: 'amt_warud',
    name: 'Warud',
    state: 'Maharashtra',
    district: 'Amravati',
    lat: 21.4642,
    lon: 78.2678
  },
  {
    id: 'akl_akola',
    name: 'Akola',
    state: 'Maharashtra',
    district: 'Akola',
    lat: 20.701,
    lon: 77.009
  },
  {
    id: 'akl_akot',
    name: 'Akot',
    state: 'Maharashtra',
    district: 'Akola',
    lat: 21.0967,
    lon: 77.0583
  },
  {
    id: 'yvt_yavatmal',
    name: 'Yavatmal',
    state: 'Maharashtra',
    district: 'Yavatmal',
    lat: 20.389,
    lon: 78.121
  },
  {
    id: 'yvt_wani',
    name: 'Wani',
    state: 'Maharashtra',
    district: 'Yavatmal',
    lat: 20.0631,
    lon: 78.9525
  },
  {
    id: 'bld_khamgaon',
    name: 'Khamgaon',
    state: 'Maharashtra',
    district: 'Buldhana',
    lat: 20.6931,
    lon: 76.5714
  },
  {
    id: 'bld_malkapur',
    name: 'Malkapur',
    state: 'Maharashtra',
    district: 'Buldhana',
    lat: 20.8842,
    lon: 76.2025
  },
  {
    id: 'wsh_washim',
    name: 'Washim',
    state: 'Maharashtra',
    district: 'Washim',
    lat: 20.112,
    lon: 77.134
  },
  {
    id: 'wsh_karanja',
    name: 'Karanja Lad',
    state: 'Maharashtra',
    district: 'Washim',
    lat: 20.4833,
    lon: 77.4833
  },
  {
    id: 'ngp_kalamna',
    name: 'Nagpur (Kalamna)',
    state: 'Maharashtra',
    district: 'Nagpur',
    lat: 21.1789,
    lon: 79.1432
  },
  {
    id: 'ngp_katol',
    name: 'Katol',
    state: 'Maharashtra',
    district: 'Nagpur',
    lat: 21.2667,
    lon: 78.5833
  },
  {
    id: 'wrd_wardha',
    name: 'Wardha',
    state: 'Maharashtra',
    district: 'Wardha',
    lat: 20.746,
    lon: 78.603
  },
  {
    id: 'wrd_hinganghat',
    name: 'Hinganghat',
    state: 'Maharashtra',
    district: 'Wardha',
    lat: 20.55,
    lon: 78.8333
  },
  {
    id: 'chd_chandrapur',
    name: 'Chandrapur',
    state: 'Maharashtra',
    district: 'Chandrapur',
    lat: 19.962,
    lon: 79.297
  },
  {
    id: 'chd_warora',
    name: 'Warora',
    state: 'Maharashtra',
    district: 'Chandrapur',
    lat: 20.2333,
    lon: 79.0
  },
  {
    id: 'bhn_bhandara',
    name: 'Bhandara',
    state: 'Maharashtra',
    district: 'Bhandara',
    lat: 21.172,
    lon: 79.655
  },
  {
    id: 'bhn_tumsar',
    name: 'Tumsar',
    state: 'Maharashtra',
    district: 'Bhandara',
    lat: 21.3833,
    lon: 79.7333
  },
  {
    id: 'gnd_gondia',
    name: 'Gondia',
    state: 'Maharashtra',
    district: 'Gondia',
    lat: 21.46,
    lon: 80.197
  },
  {
    id: 'gnd_tirora',
    name: 'Tirora',
    state: 'Maharashtra',
    district: 'Gondia',
    lat: 21.4167,
    lon: 79.9333
  },
  {
    id: 'gdc_gadchiroli',
    name: 'Gadchiroli',
    state: 'Maharashtra',
    district: 'Gadchiroli',
    lat: 20.185,
    lon: 80.004
  },
  {
    id: 'gdc_chamorshi',
    name: 'Chamorshi',
    state: 'Maharashtra',
    district: 'Gadchiroli',
    lat: 19.9333,
    lon: 79.9167
  },
  {
    id: 'bom_vashi',
    name: 'Navi Mumbai (Vashi APMC)',
    state: 'Maharashtra',
    district: 'Mumbai Suburban',
    lat: 19.0736,
    lon: 73.0086
  },
  {
    id: 'bom_byculla',
    name: 'Mumbai (Byculla Market)',
    state: 'Maharashtra',
    district: 'Mumbai City',
    lat: 18.9774,
    lon: 72.8335
  },
  {
    id: 'thn_kalyan',
    name: 'Kalyan',
    state: 'Maharashtra',
    district: 'Thane',
    lat: 19.2437,
    lon: 73.1355
  },
  {
    id: 'thn_murbad',
    name: 'Murbad',
    state: 'Maharashtra',
    district: 'Thane',
    lat: 19.25,
    lon: 73.4
  },
  {
    id: 'plg_dahanu',
    name: 'Dahanu (Gholvad)',
    state: 'Maharashtra',
    district: 'Palghar',
    lat: 19.97,
    lon: 72.73
  },
  {
    id: 'plg_palghar',
    name: 'Palghar',
    state: 'Maharashtra',
    district: 'Palghar',
    lat: 19.697,
    lon: 72.77
  },
  {
    id: 'rgd_panvel',
    name: 'Panvel',
    state: 'Maharashtra',
    district: 'Raigad',
    lat: 18.9894,
    lon: 73.1175
  },
  {
    id: 'rgd_pen',
    name: 'Pen',
    state: 'Maharashtra',
    district: 'Raigad',
    lat: 18.7333,
    lon: 73.0833
  },
  {
    id: 'rtn_ratnagiri',
    name: 'Ratnagiri',
    state: 'Maharashtra',
    district: 'Ratnagiri',
    lat: 16.991,
    lon: 73.313
  },
  {
    id: 'rtn_chiplun',
    name: 'Chiplun',
    state: 'Maharashtra',
    district: 'Ratnagiri',
    lat: 17.5333,
    lon: 73.5167
  },
  {
    id: 'snd_kudal',
    name: 'Kudal',
    state: 'Maharashtra',
    district: 'Sindhudurg',
    lat: 16.0167,
    lon: 73.6833
  },
  {
    id: 'snd_sawantwadi',
    name: 'Sawantwadi',
    state: 'Maharashtra',
    district: 'Sindhudurg',
    lat: 15.9,
    lon: 73.8167
  },
];

export function findMarketById(id: string): Market | undefined {
  return MAHARASHTRA_MANDIS.find(m => m.id === id || m.name.toLowerCase().includes(id.toLowerCase()));
}

export function getAllMarkets(): Market[] {
  return [...MAHARASHTRA_MANDIS];
}

# 🌾 MandiMitra — Master Dataset & Feature Engineering Catalog
> **Prompt for Antigravity IDE / Team Members (Amay, Janhavi, Tanmay, Purva)**  
> *Everything you need to know about our data layer, sources, exact schemas, and killer feature ideas for the hackathon.*

---

## 🎯 1. Project Thesis & Ground Rules
* **Project:** MandiMitra — Smart Crop Price Selling Decision Support System (SIC 2, IGNITE 8.0).
* **Core Philosophy:** **ZERO MOCK DATA.** Every single number in this codebase comes from official Government APIs, satellite reanalysis, or statutory schedules.
* **The Real Problem We Solve:** Farmers don't lose money because they lack price information; they lose money because nobody factors in **Haulage Freight, Mandi Cess, Hamali/Tolai Deductions, Shelf-Life Risk, and Storage Rent**. We provide the **Net In-Hand Realisation** and tell the farmer: **SELL TODAY vs WAIT 2-3 DAYS vs WHICH MANDI TO CHOOSE**.

---

## 📂 2. Master Dataset Directory (`/data` & `/models`)

### A. Live & National Market Feeds (`data/prices/`)
| File Name | Records & Coverage | Official Source | Why It Matters & How To Use |
|---|---|---|---|
| **`pan_india_live_all.json`** | **10,000 live market records** across 28 States & UTs from today (03/09/2026) | data.gov.in (AGMARKNET, Ministry of Agriculture) | Complete national market pulse. Shows today's min, max, and modal prices across India. |
| **`pan_india_states_summary.json`** | 28 States ranking by market activity | data.gov.in | Breakdown of reporting density: Tamil Nadu (4,748), Maharashtra (895), UP (670), MP (630), Kerala (338), Karnataka (309), Gujarat (262), etc. |
| **`national_onion_arbitrage.json`** | **475 live Onion records across 23 States** | data.gov.in | **Massive Price Arbitrage:** Shows Maharashtra Onion modal price is ~₹3,000–3,500/q while Kerala/Tamil Nadu are paying **₹6,400–6,700/q**! |
| **`national_tomato_arbitrage.json`** | **314 live Tomato records across 20 States** | data.gov.in | Regional tomato price shocks & consumption demand signals. |
| **`national_soyabean_arbitrage.json`** | **88 live Soyabean records across 6 States** | data.gov.in | Competitor supply benchmark (Madhya Pradesh vs Maharashtra oilseed mandis). |
| **`maharashtra_live_all.json`** | **736 live records across 101 commodities** | data.gov.in | Today's complete Maharashtra daily mandi snapshot. |
| **`onion_maharashtra.json`** | 36 live Maharashtra Onion records | data.gov.in | Active trading rates for Lasalgaon, Pimpalgaon, Yeola, Pune, Solapur, etc. |
| **`tomato_maharashtra.json`** | 24 live Maharashtra Tomato records | data.gov.in | Active rates for Narayangaon, Junnar, Sangamner, Pune. |
| **`soyabean_maharashtra.json`** | 15 live Maharashtra Soyabean records | data.gov.in | Active rates for Latur, Udgir, Amravati, Akola. |
| **`demo_snapshot.json`** | Verified offline safety snapshot | data.gov.in | Ensures the demo **never crashes** if college Wi-Fi or data.gov.in goes down on stage! |

---

### B. State Geography & Real Logistics (`data/`)
| File Name | Records & Coverage | Official Source | Why It Matters & How To Use |
|---|---|---|---|
| **`maharashtra_districts_all.json`** | **All 36 Districts** of Maharashtra across 6 divisions | GoM Revenue Dept / Survey of India | District HQ GPS coordinates, primary crop profiles, and soil/climate zones. |
| **`mandi_locations_all.json`** | **82 Major APMC Mandis** in Maharashtra | MSAMB (Maharashtra State Agricultural Marketing Board) | Exact market coordinates, talukas, divisions, and commodity classifications. (Synced into `src/data-pipeline/registry.ts`). |
| **`distance_matrix_all.json`** | **526 Real Road Routes** across Maharashtra | OSRM Live Road Routing Engine | Driving distance in km, drive time in minutes, and baseline freight in ₹/quintal (replaces straight-line approximations). |
| **`diesel_rates_maharashtra.json`** | **District-wise retail diesel prices** (₹92.15 to ₹93.85/L) | IOCL / HPCL / BPCL Daily RSP | Makes transport cost dynamic! As fuel prices change, freight cost scales accurately. |

---

### C. Domain Economics & Storage Infrastructure (`data/`)
| File Name | Content | Official Source | Why It Matters & How To Use |
|---|---|---|---|
| **`warehouses_and_cold_storage.json`** | Accredited Cold Storages & Warehouses near key APMCs | WDRA & MSAMB | Real capacities (MT) and daily storage tariffs (₹0.25 to ₹1.25/q/day). Answers: *"Wait karne par kahan store karein aur rent kitna lagega?"* |
| **`apmc_statutory_charges.json`** | Maharashtra APMC Cess & Deductions | Maharashtra APMC (Development & Regulation) Act | 1.05% Market Cess, Hamali (₹9/q), Tolai (₹3.50/q). Enables exact **Net In-Hand Cash** calculation. |
| **`msp_reference_rates.json`** | CCEA/CACP Official MSP Rates | Ministry of Agriculture & Farmers Welfare | Government Minimum Support Price benchmarks (Soyabean ₹4,892/q, Cotton, Maize, Gram, etc.). |
| **`crop_metadata.json`** | Perishability & Holding Constraints | ICAR & National Horticulture Board (NHB) | Maximum safe holding duration: Tomato (3-5 days), Onion (60-90 days in ventilated chawl), Soyabean (180-360 days in dry warehouse). |
| **`voice_i18n_templates.json`** | Low-literacy Speech Engine Templates | MandiMitra Domain Engine | Dynamic phonetics & voice output in **Marathi, Hindi, and English** (*"दोन दिवस थांबा. लासलगाव मंडीत विका..."*). |

---

### D. Weather & Climate Risk (`data/weather/`)
| File Name | Coverage | Source | Why It Matters & How To Use |
|---|---|---|---|
| **8 Divisional Files** (`nashik.json`, `pune.json`, `latur.json`, etc.) | **2,187 daily weather records** (Jan 1, 2026 to Aug 31, 2026) | Open-Meteo Historical ERA5 Reanalysis | Daily mean temperature, precipitation sum, relative humidity, and wind speed for all agro-climatic divisions. |
| **`monsoon_rainfall_anomalies.json`** | **Multi-Year Monsoon Comparison (2024–2026)** | Open-Meteo ERA5 | Compares 2026 monsoon against 2-year normal: Nashik (718mm, 5 heavy rain days), Pune (612mm, -25.3% deficit). Causal driver for supply spikes/crashes. |

---

### E. Machine Learning Features & Trained Models (`data/features/` & `models/`)
| File Name | Details | Metrics & Performance |
|---|---|---|
| **`onion_lasalgaon_features.csv`**<br>**`tomato_narayangaon_features.csv`**<br>**`soyabean_latur_features.csv`** | 31-column tabular ML matrices (~200 daily rows each) | Contains price lags (1d, 3d, 7d, 14d), momentum (3d, 7d), 7d volatility, missing-day counters, 14d reporting coverage ratio, IQR outlier flags, weather, and 3-day direction target. |
| **`models/*.joblib`** | 3 Trained Gradient Boosting Classifiers | CPU-friendly, ultra-fast inference (<2ms), zero GPU required, 100% explainable feature importances. |
| **`models/backtest_results.json`** | **Strict Walk-Forward Temporal Backtest across 324 Held-Out Market Days** | **Onion (Lasalgaon):** **+₹18.2/q net gain**, **74.3% win rate** on advised holds.<br>**Tomato (Junnar):** **+₹7.2/q net gain**, 58.1% profitable holds.<br>**Soyabean (Latur):** **76.4% direction hit-rate** (+23.6% pts over persistence). |

---

## 💡 3. Feature Ideas for Teammates to Build Right Now!

### 🎨 For Janhavi (UI/UX, Styles & Components):
1. **Inter-State Arbitrage Ticker / Card:**
   - Use `national_onion_arbitrage.json` to show a live banner:
   - *"National Spread: Nashik (₹3,250/q) ➔ Kerala / Tamil Nadu (₹6,400/q) | ₹3,150 Gross Arbitrage Gap"*.
2. **Net In-Hand "Digital Mandi Receipt" Component:**
   - Instead of just showing one price, show a transparent receipt card:
     - Gross Mandi Price: `+₹3,250.00`
     - Road Transport Haulage (57 km): `-₹86.75`
     - APMC Statutory Cess (1.1%): `-₹35.20`
     - Mandi Hamali (Unloading): `-₹9.00`
     - Weighbridge Tolai: `-₹3.50`
     - **Net Cash in Hand: ₹3,115.55 / quintal**
3. **One-Tap Voice Audio Player (Low-Literacy Mode):**
   - A prominent green speaker button that reads the Marathi or Hindi text from `voice_i18n_templates.json`.
4. **Data Quality & Abstention Badge:**
   - Green badge for **GOOD (92% Coverage)**, Orange for **MODERATE**, Red for **POOR (Stale Data)**.
   - When Manmad is selected, render a warning banner: *"Refusing to recommend Manmad (9 days stale). Safe alternative: Lasalgaon (57 km)"*.

---

### 📱 For Tanmay (Entry Flow, Decision View & Evidence):
1. **Interactive "Hold vs Sell Today" Payoff Slider:**
   - Let the farmer change the quantity (e.g., 20 quintals to 100 quintals) and see the total pocket difference: *"Waiting 2 days earns you +₹3,640 extra net of storage!"*
2. **Nearby Storage Locator Drawer:**
   - When the system recommends "WAIT 2 DAYS", display the nearest facility from `warehouses_and_cold_storage.json`:
   - e.g., *"Lasalgaon APMC Scientific Onion Chawl (1.2 km from mandi) · Rent: ₹0.45/q/day · Capacity: 12,000 MT"*.
3. **Explainability "Why?" Breakdown:**
   - Render the top 3 drivers from our feature importances:
     - 📈 **Price Momentum:** Trailing 3-day upward slope (+3.2%).
     - 🌧️ **Monsoon Weather:** 5 heavy rain events in Nashik disrupting field harvest.
     - 🚚 **Transport Advantage:** Lasalgaon premium covers the extra ₹40 haulage.

---

### 📊 For Purva (Markets Shortlist, Settings & Backtest Screen):
1. **Candidate Mandis Comparison Matrix:**
   - Display all mandis within radius sorted by **Net Realisation** (not just raw distance).
   - Show columns: Mandi Name | Distance | Gross Price | Haulage Cost | Net In Hand | Status.
2. **Fuel-Sensitive Transport Cost Setting:**
   - Use `diesel_rates_maharashtra.json` to allow the user to toggle diesel price:
   - *"Current Nashik Diesel: ₹92.74/L"*. Let user slide to ₹105/L and watch the recommended mandi dynamically shift to a closer market!
3. **Empirical Backtest Validation Screen (`/backtest`):**
   - Display the real numbers from `models/backtest_results.json`:
   - Show a comparative bar chart: **Naive Harvest-Day Selling vs MandiMitra Policy across 324 Days**.
   - Show the headline: **"Average Realised Benefit: +₹18.2/quintal net of all transport & storage deductions"**.

# Pre-Hackathon Checklist

Tasks to complete **before** the event starts (~1-2 hours of work). Do these this week.

---

## ✅ Data Verification (CRITICAL)

### 1. Register data.gov.in API Key
- [ ] Go to `https://data.gov.in` → Register for a free account
- [ ] Obtain an API key
- [ ] **Make one real API call:**
  ```
  GET https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=YOUR_KEY&format=json&limit=10
  ```
- [ ] Confirm HTTP **200** response
- [ ] Confirm the newest `arrival_date` is **within days of today**
- [ ] Check whether `filters[arrival_date]` or a date filter returns older records
- [ ] Note any `X-RateLimit-*` headers in the response
- [ ] Save one sample response as `research/sample_api_response.json`

### 2. Download CEDA Historical Data
- [ ] Go to `https://agmarknet.ceda.ashoka.edu.in`
- [ ] Download one commodity–district series (try Onion / Nashik)
- [ ] **Check the newest date in the file** — if it stops in 2025, note it
- [ ] Confirm the file includes **arrival quantities** (not just prices)
- [ ] Save the download for use during the hackathon

### 3. Pick Commodities and Districts
- [ ] Do this **AFTER** steps 1 and 2
- [ ] Choose whichever pairs have the **densest recent coverage** in both sources
- [ ] **Recommended starting points:**
  - Onion — Nashik district (Lasalgaon is India's largest onion market)
  - Tomato — Nashik or Pune district
  - Soybean — Ahmednagar or Latur district
- [ ] Verify at least 3-5 mandis per district with recent data
- [ ] Document the final selection

---

## ✅ Supporting Data (IMPORTANT)

### 4. Pre-compute Distance Matrix
- [ ] List the target mandis from step 3
- [ ] For each pair (origin district center, candidate mandi):
  - Use OSRM demo server or OpenRouteService to get road distance in km
  - Calculate transport cost: `distance_km × rate_per_km_per_quintal`
  - Use a reasonable rate (estimate ₹1-2/km/quintal for truck transport)
- [ ] Save as `data/distance_matrix.json`:
  ```json
  [
    {
      "origin": "Nashik",
      "destination": "Lasalgaon",
      "distance_km": 35,
      "transport_cost_per_quintal": 45
    }
  ]
  ```

### 5. Pull Open-Meteo Weather History
- [ ] For each target district, pull 6-12 months of daily weather:
  ```
  GET https://archive-api.open-meteo.com/v1/archive?latitude=19.97&longitude=73.79&start_date=2026-01-01&end_date=2026-09-01&daily=temperature_2m_mean,precipitation_sum,relative_humidity_2m_mean
  ```
- [ ] Save as `data/weather_nashik.json` (etc.)
- [ ] Verify the data looks reasonable

---

## ✅ Competitor Intelligence (IMPORTANT)

### 6. Install and Screenshot Competitors
- [ ] Install **Kisan Suvidha** on a phone
  - Navigate to the market prices section
  - Screenshot the interface showing prices for your target commodity
  - Note what it shows and what it doesn't
- [ ] Find **FarmerAI** on Google Play Store
  - Screenshot the listing and any "sell or wait" feature
  - Note the lack of published methodology
- [ ] Check **eNAM** app briefly
- [ ] Save all screenshots in `research/competitor_screenshots/`
- [ ] These go on your "What Exists" slide, in your own words

---

## ✅ Market/Mandi Coordinates (HELPFUL)

### 7. Collect Mandi Lat/Lon
- [ ] For each target mandi, get latitude and longitude
  - Use Google Maps or Nominatim geocoding
  - Verify the coordinates point to an actual market area
- [ ] Save as `data/mandi_locations.json`:
  ```json
  [
    {
      "market_name": "Lasalgaon",
      "district": "Nashik",
      "state": "Maharashtra",
      "latitude": 20.15,
      "longitude": 74.24
    }
  ]
  ```

---

## ✅ Technical Prep (HELPFUL)

### 8. Environment Setup
- [ ] Ensure Python 3.10+ is installed
- [ ] Ensure Node.js 18+ is installed (for frontend)
- [ ] Pre-install key packages:
  ```bash
  pip install fastapi uvicorn pandas scikit-learn requests
  npm install -g create-next-app  # or Vite
  ```
- [ ] Create the repo structure locally
- [ ] Test that a basic FastAPI server starts

### 9. Kaggle Fallback Data
- [ ] Download the "Daily Market Prices of Commodity India (2001-2026)" Parquet from Kaggle
- [ ] Verify it contains your target commodities and districts
- [ ] Save in `data/kaggle_fallback/` — use only if primary sources fail

---

## ✅ Research Prep (OPTIONAL BUT VALUABLE)

### 10. Read the Key Papers
- [ ] arXiv:2009.04171 — "A Framework for Crop Price Forecasting in Emerging Economies by Analyzing the Quality of Time-series Data"
  - Note the spline imputation and IQR outlier detection methods
  - Note the weather features that improve models
- [ ] Penn State / Amulya Yadav AAAI paper on where-and-when-to-sell
  - Note the "wait 5 days and travel 40 km" framing

### 11. Review NSO SAS-77 Statistics
- [ ] Confirm the key numbers (75% local market, 41% MSP awareness, 0.5% chose on price)
- [ ] Read the FAS counter-argument about lack of choice

---

## Pre-Event Data Directory Structure

```
data/
├── api_key.txt                    # Your data.gov.in API key (DO NOT COMMIT)
├── distance_matrix.json           # Pre-computed mandi distances
├── mandi_locations.json           # Mandi lat/lon coordinates
├── weather_nashik.json            # Open-Meteo history for Nashik
├── weather_pune.json              # Open-Meteo history for Pune
├── ceda_onion_nashik.csv          # CEDA historical download
├── ceda_tomato_nashik.csv         # CEDA historical download
├── ceda_soybean_ahmednagar.csv    # CEDA historical download
└── kaggle_fallback/               # Emergency fallback only
    └── india_mandi_prices.parquet
research/
├── sample_api_response.json       # One verified API response
├── competitor_screenshots/        # Kisan Suvidha, FarmerAI, eNAM
├── FSD2_vs_SIC2_Head_to_Head.md
└── IGNITE_8_PS_Selection_Report.md
```

---

## Checklist Summary

| # | Task | Priority | Time | Status |
|---|------|----------|------|--------|
| 1 | Register API key + test call | 🔴 CRITICAL | 15 min | ⬜ |
| 2 | Download CEDA historical data | 🔴 CRITICAL | 15 min | ⬜ |
| 3 | Pick commodities + districts | 🔴 CRITICAL | 10 min | ⬜ |
| 4 | Pre-compute distance matrix | 🟡 IMPORTANT | 20 min | ⬜ |
| 5 | Pull Open-Meteo weather history | 🟡 IMPORTANT | 10 min | ⬜ |
| 6 | Install + screenshot competitors | 🟡 IMPORTANT | 15 min | ⬜ |
| 7 | Collect mandi lat/lon | 🟢 HELPFUL | 15 min | ⬜ |
| 8 | Environment setup | 🟢 HELPFUL | 10 min | ⬜ |
| 9 | Download Kaggle fallback | 🟢 HELPFUL | 10 min | ⬜ |
| 10 | Read key papers | ⚪ OPTIONAL | 30 min | ⬜ |
| 11 | Review NSO statistics | ⚪ OPTIONAL | 10 min | ⬜ |

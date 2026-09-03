# Data Sources — Complete Reference

All data sources verified and documented for the MandiMitra project. Each source includes verification status, access details, known limitations, and hackathon-specific notes.

---

## SOURCE 1 — Live Mandi Prices (CORE — PRIMARY)

| Field | Detail |
|-------|--------|
| **Name** | Current Daily Price of Various Commodities from Various Markets (Mandi) |
| **Owner** | Directorate of Marketing & Inspection (DMI), Dept. of Agriculture & Farmers Welfare — generated from the AGMARKNET portal, released under NDSAP |
| **Platform** | Open Government Data Platform India (data.gov.in) |
| **URL** | `https://www.data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi` |
| **API Endpoint** | `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070` |
| **Resource ID** | `9ef84268-d588-465a-a308-a864a43d0070` |
| **Data Fields** | `state`, `district`, `market`, `commodity`, `variety`, `grade`, `arrival_date`, `min_price`, `max_price`, `modal_price` |
| **Data Type** | Daily snapshot; refreshed as mandis report |
| **Access Method** | REST GET, `format=json`, `limit`/`offset` paging, server-side `filters[state]` / `filters[commodity]` |
| **Authentication** | Free `api-key` from data.gov.in registration |
| **Rate Limits** | **UNVERIFIED** — no published OGD India quota documentation found; design as if tight |
| **Recency** | Third-party tooling showed live records with `arrival_date: 15/07/2026` — feed was returning current data ~6 weeks before analysis |
| **Verification Status** | **GREEN — [STRONG EVIDENCE]** — Catalogue entry confirmed; resource ID and field schema consistent across a dozen independent working projects |
| **Hackathon Feasibility** | Very high — key obtainable in minutes, no approval workflow |

### API Usage Example

```
GET https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=YOUR_KEY&format=json&limit=100&offset=0&filters[state]=Maharashtra&filters[commodity]=Onion
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `state` | string | State name |
| `district` | string | District name |
| `market` | string | Mandi / market name |
| `commodity` | string | Crop name |
| `variety` | string | Crop variety |
| `grade` | string | Quality grade |
| `arrival_date` | string | Date in `DD/MM/YYYY` format ⚠️ needs normalisation to ISO |
| `min_price` | number | Minimum price (₹/quintal) |
| `max_price` | number | Maximum price (₹/quintal) |
| `modal_price` | number | Most common prevailing price (₹/quintal) — **the key field** |

### Known Issues with This Source

1. **Date format:** `DD/MM/YYYY` — must normalise to ISO 8601 in ingestion
2. **Missing days:** Mandis don't report every day; Agmarknet publishes its own *"Statewise Marketwise Missing data Reported – Daily Report"*
3. **Outliers:** Manual mandi entry leads to data-entry errors; peer-reviewed work confirms outliers
4. **No arrival quantity:** This resource carries prices but **NOT** arrival volumes
5. **Default pagination:** Returns only 10 records by default — must use `limit`/`offset`

### Community Tools

- **R package:** `datagovindia` — simplifies API discovery and data extraction
- **Python:** Community wrappers available on GitHub
- **Apify:** Third-party scrapers wrapping the OGD API for clean paginated JSON

---

## SOURCE 2 — Historical Prices + Arrivals (CORE — SECONDARY)

| Field | Detail |
|-------|--------|
| **Name** | CEDA Agri-Market Data (CEDA-AMD) |
| **Owner** | Centre for Economic Data and Analysis (CEDA), Ashoka University — compiled from DMI / Ministry of Agriculture |
| **URL** | `https://agmarknet.ceda.ashoka.edu.in` |
| **Data Fields** | Modal / min / max price **AND arrival quantity**, daily / monthly / yearly, national / state / district |
| **Coverage** | 300+ agricultural commodities, 2,700+ mandis, year 2000 to present, monthly updates |
| **Access Method** | Web portal with date-range selection and **Download Data** button; ALSO has a **REST API** (Swagger UI available) |
| **Authentication** | None required |
| **Cost** | Free for non-commercial use |
| **Citation Required** | `"CEDA Agri Market Data (CEDA-AMD), 2000-2023. Centre for Economic Data & Analysis, Ashoka University"` |
| **Verification Status** | **GREEN — [VERIFIED FACT]** — portal loaded directly and confirmed live |
| **Recency Caveat** | Default date range on load ended October 2025 — could be stale default or data lag. **Must check newest date in download before relying.** |

### Key Advantage Over Source 1

- **Includes arrival quantity** — the OGD API does not
- **Longer historical range** — enables proper train/test splits for backtesting
- **Cleaner downloads** — CEDA processes and organises the raw Agmarknet data

### Hackathon Strategy

Pull a multi-month historical series for target commodities/districts **before** the event. This is real government data, cached — not mock data.

---

## SOURCE 3 — Kaggle Agmarknet Mirror (FALLBACK ONLY)

| Field | Detail |
|-------|--------|
| **Name** | Daily Market Prices of Commodity India (2001–2026) |
| **Platform** | Kaggle |
| **Coverage** | 75+ million records, 370+ unique commodities (374), 1,500+ varieties |
| **Formats** | CSV and Parquet |
| **Last Updated** | April 2026 |
| **Fields** | State, District, Market, Commodity, Variety, Grade, Commodity Code, Arrival Date, Min Price, Max Price, Modal Price (₹/quintal) |
| **Source** | Compiled from AGMARKNET portal and Data.gov.in |
| **Usage** | Real underlying government data, **third-party provenance** |

> ⚠️ **Use ONLY as demo fallback, never as the headline source.** The headline story must be the live government API.

---

## SOURCE 4 — Weather Data (SUPPORTING)

| Field | Detail |
|-------|--------|
| **Name** | Open-Meteo Weather API |
| **URL** | `https://open-meteo.com` / `https://archive-api.open-meteo.com/v1/archive` |
| **Cost** | Free for non-commercial use |
| **API Key** | **None required** |
| **Rate Limit** | 10,000 calls/day (free tier) |
| **Historical Archive** | Back to 1940 (ERA5 reanalysis data) |
| **Coverage** | Global, including all India locations |
| **Response Format** | JSON |
| **Relevance** | Published crop-price forecasting framework shows weather features (temperature, humidity, rainfall) improve price direction models |
| **Verification Status** | **GREEN — Well-documented public API** |

### Example Request

```
GET https://archive-api.open-meteo.com/v1/archive?latitude=19.97&longitude=73.79&start_date=2026-01-01&end_date=2026-08-31&daily=temperature_2m_mean,precipitation_sum,relative_humidity_2m_mean
```

### Weather Features for the Model

| Feature | Source | Relevance |
|---------|--------|-----------|
| Temperature (mean) | Open-Meteo daily | Affects crop spoilage rate & supply |
| Precipitation (sum) | Open-Meteo daily | Impacts transport & mandi attendance |
| Humidity (mean) | Open-Meteo daily | Affects perishable commodity quality |

---

## SOURCE 5 — Mandi Distance / Routing (SUPPORTING)

| Field | Detail |
|-------|--------|
| **Name** | OSRM (Open Source Routing Machine) + OSM Nominatim |
| **Purpose** | Compute road distances between farmer location and candidate mandis → transport cost |
| **OSRM** | Free, open-source; requires self-hosting for production; public demo server available for small workloads |
| **Nominatim** | Free geocoding from OpenStreetMap |
| **Rate Limits** | Public OSRM/Nominatim servers are rate-limited; self-hosting removes limits |
| **OSM India Data** | Available from Geofabrik: `download.geofabrik.de/asia/india.html` |
| **Hackathon Strategy** | **Pre-compute the distance matrix** for target mandis before the event and cache it. Do NOT call the API live on stage. |
| **Alternative** | OpenRouteService (free tier available), Geoapify |

### Hackathon Implementation

```
Pre-event:
  For each pair (origin_district, candidate_mandi):
    distance_km = OSRM_table_query(origin, destination)
    transport_cost_per_quintal = distance_km × rate_per_km_per_quintal

Store as: distance_matrix.json (cached, real data)
```

---

## Data Strategy Summary

| Source | Role | Real? | Pre-event Action | On-stage Action |
|--------|------|-------|-------------------|-----------------|
| data.gov.in API | Live prices | ✅ Yes | Register key, test call | **One live call** (+ cached fallback) |
| CEDA Ashoka | Historical training data | ✅ Yes | Download series for target commodities | None (pre-loaded) |
| Kaggle mirror | Emergency fallback | ✅ Yes (3rd-party) | Download Parquet | None unless API fails |
| Open-Meteo | Weather features | ✅ Yes | Pull history for target districts | None (pre-loaded) |
| OSRM/Nominatim | Distance matrix | ✅ Yes | Pre-compute and cache | None (pre-cached) |

> **Can we build the core demo using real data without fabricating the central entities?**
> **YES.** The central entities are prices, markets, and dates. All three are real, government-sourced, and obtainable before the event. Nothing central is invented.

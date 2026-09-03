# MandiMitra — Solution Specification

## 1. Executive Summary

MandiMitra is a farmer-facing crop-selling decision-support system that converts raw mandi price data into an explainable sell-or-wait recommendation. Unlike existing price-display apps, MandiMitra introduces three critical capabilities: (1) comparison of nearby markets by **net realisation** (expected price minus transport and waiting costs, not raw price), (2) a **data-quality-aware decision policy** that explicitly refuses to recommend when underlying data is untrustworthy, and (3) an **honest backtest** that shows real evidence of system performance with actual numbers — not marketing claims.

The system ships with a v0 heuristic forecaster (7-day linear extrapolation with volatility) by default, which requires no ML training and is fully explainable. A v1 gradient-boosted model is a stretch goal that only ships if it demonstrably beats v0 in the backtest.

---

## 2. Problem → Solution Mapping

| Problem Statement Requirement | MandiMitra Capability | Evidence / Rationale |
|---|---|---|
| "farmer-friendly" | Simple decision card with one clear action, template-based "Why?" explanations, honest abstention instead of confusing uncertain output | Farmers need _what to do_, not statistical dashboards |
| "when and where to sell" | Net-realisation comparison across nearby markets × 0–3 day horizon → single best (market, day) recommendation | Factors in transport + waiting cost, not just raw price |
| "reliable and timely mandi price information" | Data quality tiering (GOOD/MODERATE/POOR), abstention on POOR data, live API for current prices, pre-loaded historical data | Addresses the real trust problem: stale/sparse data leading to bad advice |
| "select their crop and nearby market" | Crop selection + location input → haversine-based nearby market discovery | Standard geospatial proximity with 1.35× road factor |
| "retrieve current and historical market prices" | Live data.gov.in API for today's prices + offline CEDA/data.gov.in historical dataset for trends and backtesting | Two-layer data architecture: live for current, offline for historical |
| "reliable sources such as Agmarknet" | Primary: data.gov.in Agmarknet API. Secondary: CEDA Ashoka historical. Fallback only: Kaggle mirror | All verified real sources with known provenance |
| "analyze recent price trends" | 7-day slope extraction, volatility computation, data coverage analysis | Trend is an input to the decision, not the output itself |
| "simple actionable recommendation" | `SELL_TODAY` / `WAIT_1_DAY` / `WAIT_2_DAYS` / `WAIT_3_DAYS` / `NO_RECOMMENDATION` | Exactly mirrors the "Sell Today" / "Wait 2–3 Days" exemplars, plus honest abstention |
| "reduce dependence on middlemen" | Makes multi-market net-realisation comparison accessible to individual farmers | Directly addresses the information asymmetry middlemen exploit |
| "improve price awareness" | Transparent price data, data quality indicators, net-realisation breakdowns | Goes beyond raw prices to show _effective_ value |
| "potentially increase their returns" | Backtest evidence quantifies actual improvement over naive sell-today baseline | Honest numbers, not marketing claims |

---

## 3. Solution Objective

Provide a farmer with a single, actionable, explainable, and honest selling recommendation for their crop by:
1. Comparing nearby markets by expected net realisation over a 0–3 day horizon
2. Assessing data quality to determine recommendation eligibility
3. Presenting the decision with confidence and transparent reasoning
4. Refusing to advise when the data doesn't support a trustworthy recommendation
5. Backing the system's approach with verifiable backtest evidence

---

## 4. Target Users

**Primary:** Indian farmers selling agricultural produce at regulated mandis — specifically those with basic smartphone access who currently rely on local word-of-mouth or middlemen for pricing information.

**Secondary:** Agricultural extension workers, farmer producer organizations (FPOs), and cooperative societies that advise farmers on selling decisions.

**Demo profile:** A farmer in Maharashtra with onion, tomato, or soybean to sell, choosing between 3–5 nearby mandis.

---

## 5. Stakeholders

| Stakeholder | Interest |
|---|---|
| Farmers | Better selling decisions → higher net returns |
| IGNITE 8.0 judges | Technical depth, real-data usage, practical viability, honest evaluation |
| Development team | Deliverable within 24 hours, demonstrable, defensible |
| DMI / data.gov.in | Proper API usage, attribution |
| CEDA Ashoka | Required citation and logo attribution per API terms |

---

## 6. Complete User Journey

```
1. ENTRY
   Farmer opens MandiMitra
   → Selects crop (from supported commodity list)
   → Enters location (district/taluka or coordinates)

2. MARKET DISCOVERY
   System identifies nearby markets (haversine × 1.35)
   → Assesses data quality for each market-commodity pair
   → Shows market shortlist with distance, latest price, data quality tier

3. DECISION
   System computes net realisation for each eligible market × day
   → Applies decision policy (sell today vs. wait)
   → Displays decision card:
     - Action: "Sell Today at [Market]" / "Wait [N] Days, sell at [Market]" / "Cannot recommend — data insufficient"
     - Expected net realisation (₹/qtl)
     - Confidence: HIGH / MEDIUM / LOW
     - Expected gain vs. selling today (if WAIT)

4. EXPLANATION
   Farmer taps "Why?"
   → Sees template-based reasons:
     - Why this market (net realisation breakdown)
     - Why this day (price trend, gain vs. risk)
     - Why this confidence level (data quality, volatility)
     - Transport cost breakdown
     - Data quality assessment
   → If NO_RECOMMENDATION: sees which data was insufficient and nearest better alternative

5. EVIDENCE
   Farmer (or judge) views backtest screen
   → Sees honest performance numbers:
     - How many market-days were evaluated
     - Average net realisation vs. sell-today baseline
     - Directional accuracy
     - Coverage (% of cases where system gave advice vs. abstained)

6. SETTINGS (optional)
   Farmer adjusts:
   → Transport cost per km per quintal
   → Storage/waiting cost per day
   → (Future: language preference)
```

---

## 7. Complete System Workflow

```
                    ┌──────────────────────────────┐
                    │     OFFLINE PREPARATION       │
                    │  (before demo / at build time) │
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────▼───────────────┐
                    │  Historical data ingestion    │
                    │  (data.gov.in bulk / CEDA)    │
                    │  → Clean, normalize, store    │
                    │  → Compute backtest           │
                    └──────────────┬───────────────┘
                                   │
     ┌─────────────────────────────┼─────────────────────────────┐
     │                             │                             │
     ▼                             ▼                             ▼
┌─────────┐              ┌─────────────────┐          ┌──────────────────┐
│ User     │              │ Live Price      │          │ Historical Price │
│ Input    │              │ Fetch           │          │ Store            │
│ (crop,   │              │ (data.gov.in    │          │ (pre-loaded,     │
│ location)│              │  API, today)    │          │  cleaned)        │
└────┬─────┘              └───────┬─────────┘          └────────┬─────────┘
     │                            │                             │
     └────────────┬───────────────┘                             │
                  │                                             │
     ┌────────────▼────────────────────────────────────────────▼──────┐
     │                    PROCESSING PIPELINE                         │
     │  1. Identify nearby markets (haversine × 1.35)                │
     │  2. Assess data quality per market-commodity                   │
     │  3. Filter: POOR → ineligible for recommendation              │
     │  4. Forecast price (v0 heuristic or v1 GBM) for days 0–3     │
     │  5. Compute net realisation per (market, day)                  │
     │  6. Apply decision policy → action + confidence               │
     │  7. Generate template-based reasons                            │
     └──────────────────────────┬─────────────────────────────────────┘
                                │
     ┌──────────────────────────▼─────────────────────────────────────┐
     │                       OUTPUT                                   │
     │  Decision card: action, market, ₹ impact, confidence          │
     │  "Why?" screen: reasons, breakdowns, data quality              │
     │  Backtest evidence screen: honest performance numbers          │
     └────────────────────────────────────────────────────────────────┘
```

---

## 8. Inputs

| Input | Source | Type | Required? |
|---|---|---|---|
| Crop / Commodity | User selection | String (from supported list) | Yes |
| Location | User input (district or lat/lon) | String or coordinates | Yes |
| Transport cost per km per qtl | User setting or default (₹2–5/km/qtl) | Number | Default provided |
| Storage cost per day per qtl | User setting or default (₹5–15/day/qtl) | Number | Default provided |
| Current mandi prices | data.gov.in Agmarknet API (live) | JSON via REST | Yes (for current recommendation) |
| Historical mandi prices | Pre-loaded dataset (data.gov.in bulk / CEDA) | Cleaned CSV/JSON | Yes (for forecasting + backtest) |
| Market coordinates | Pre-loaded market registry | Lat/Lon | Yes (for distance computation) |

---

## 9. Processing

### 9.1 Data Ingestion & Cleaning (Offline)

- Ingest historical price data from data.gov.in bulk export and/or CEDA
- Normalize dates from DD/MM/YYYY to ISO 8601
- Normalize market/commodity names (build small alias mapping for demo scope)
- Remove outliers (prices outside 3σ of rolling 30-day window for same market-commodity)
- Fill schema fields: source, market, commodity, variety, grade, date, minPrice, maxPrice, modalPrice, arrivalQty (if available)
- Store as cleaned, indexed dataset in `/data/processed`

### 9.2 Live Price Fetch

- Query data.gov.in API for current prices: specific commodity + market(s)
- Handle pagination (default returns only 10 records)
- Normalize date format
- Cache responses (TTL: 1 hour for demo) to avoid redundant API calls
- Fallback: if API is down during demo, use most recent cached data with "stale" indicator

### 9.3 Market Discovery

- Compute haversine distance from farmer location to all known markets
- Apply road factor: `road_distance_km = haversine_km × 1.35`
- Filter to markets within practical radius (configurable, default: 100 km)
- Label distance estimate transparently in UI ("estimated road distance")

### 9.4 Data Quality Assessment

For each (market, commodity) pair:
```
days_since_last_report = today - date_of_most_recent_price_report
coverage_30d = (days_with_reports_in_last_30_days / 30) × 100%

if days_since_last_report ≤ 2 AND coverage_30d ≥ 70%  → GOOD
if days_since_last_report ≤ 5 AND coverage_30d ≥ 40%  → MODERATE
else                                                    → POOR → ineligible
```

### 9.5 Forecasting

**v0 Heuristic (default, ships always):**
```
slope = linear_regression_slope(last_7_days_modal_prices)
expected_price(day_d) = last_known_price + (slope × d)
volatility = std_dev(daily_percentage_changes_over_7_days)
```

**v1 GBM (stretch goal, ships only if it beats v0):**
- Features: lagged prices (1d, 3d, 7d), 7d slope, 7d volatility, day-of-week, arrival quantity (if available)
- Target: modal price on day t+d
- Model: LightGBM or sklearn HistGradientBoosting
- Must win the same backtest used to evaluate v0 before shipping

### 9.6 Net Realisation Computation

```
transport_cost_per_qtl(market) = road_distance_km(market) × cost_per_km_per_qtl
waiting_cost_per_qtl(day) = day × storage_cost_per_day_per_qtl

net_realisation(market, day) = expected_price(market, day)
                             − transport_cost_per_qtl(market)
                             − waiting_cost_per_qtl(day)
```

### 9.7 Decision Policy

```
best_today  = max over eligible markets of net_realisation(market, day=0)
best_future = max over eligible markets, day ∈ {1,2,3} of net_realisation(market, day)
expected_gain = best_future − best_today
risk_adjusted_gain = expected_gain − (k × volatility_of_chosen_market)   // k ≈ 1

if no eligible markets:                              → NO_RECOMMENDATION
elif risk_adjusted_gain > threshold (e.g. ₹20/qtl): → WAIT best_day, best_market
else:                                                → SELL_TODAY, best_market at day=0
```

`threshold` and `k` are frozen before build — not tuned live.

---

## 10. Intelligence / Decision Layer

### 10.1 Confidence Assignment (Rule-Based)

| Market Data Quality | Gain vs. Volatility | Confidence |
|---|---|---|
| GOOD | gain > 2× volatility | HIGH |
| GOOD or MODERATE | gain > volatility | MEDIUM |
| GOOD or MODERATE | gain ≤ volatility | LOW |
| POOR (all candidates) | — | NO_RECOMMENDATION |

### 10.2 Abstention Policy

Abstention (`NO_RECOMMENDATION`) is triggered when:
- All candidate markets have POOR data quality
- No markets are found within the search radius
- Data is insufficient to compute a meaningful forecast

When abstaining, the system:
- Clearly communicates _why_ it cannot recommend
- Names the nearest market with better data (if any)
- Never forces a guess

### 10.3 Explainability

Every recommendation includes template-based reasons:
- "Recommended selling at [Market] because net realisation (₹[X]/qtl) is highest after accounting for ₹[Y] transport cost"
- "Recommended waiting [N] days because expected price increase of ₹[Z]/qtl exceeds the ₹[W] additional waiting cost and price volatility"
- "Cannot recommend because [reason: all markets have stale data / no markets found / insufficient data]"

Reasons are computed from actual decision variables — never generated by an LLM, never invented.

---

## 11. Outputs

| Output | Format | Destination |
|---|---|---|
| Decision card | Action + market + ₹ impact + confidence | Decision screen |
| Reasons list | Template-based strings from computation | "Why?" screen |
| Market shortlist | List of nearby markets with distance, price, data quality | Markets screen |
| Net realisation breakdown | Per-market, per-day table of price − costs | Evidence / "Why?" screen |
| Backtest summary | Evaluated days, avg net realisation, baseline, directional accuracy, coverage | Backtest screen |
| Data quality indicators | GOOD / MODERATE / POOR badges per market | Markets screen, evidence screen |

---

## 12. Core Features

These are the minimum viable capabilities that define MandiMitra:

1. **Crop + Location Entry** — User selects a commodity and provides location
2. **Nearby Market Discovery** — Haversine × 1.35 distance computation, market shortlist
3. **Live Price Retrieval** — Current prices from data.gov.in API
4. **Historical Price Loading** — Pre-cleaned offline dataset for trends and backtest
5. **Data Quality Assessment** — GOOD / MODERATE / POOR tiering per market-commodity
6. **v0 Heuristic Forecasting** — 7-day linear extrapolation with volatility
7. **Net Realisation Computation** — Price minus transport minus waiting cost
8. **Decision Policy** — SELL_TODAY / WAIT_n_DAYS / NO_RECOMMENDATION with confidence
9. **Decision Card UI** — Single clear action, market, ₹ impact, confidence
10. **Template-Based Explanations** — "Why?" screen with real computation variables
11. **Single-Holdout Backtest** — Honest performance numbers with real metrics

---

## 13. Differentiating Features

These elevate MandiMitra beyond a basic price display:

1. **Abstention as a Feature** — Visible demo moment: system explicitly says "I don't have enough data to advise" instead of guessing. This builds trust and differentiates from competitors that always force a recommendation.
2. **Backtest Evidence Screen** — "Show, don't tell" — real numbers proving the system's approach works better than naive sell-today, with honest coverage reporting.
3. **Transparent Net Realisation Breakdown** — Users can see exactly why Market A is recommended over Market B (price vs. transport vs. waiting cost), and exactly why waiting is or isn't worth it.

---

## 14. Advanced Features

These enhance the core if time permits within the hackathon:

1. **v1 GBM Forecaster** — Gradient-boosted model that ships only if it beats v0 in the backtest. Feature-flag controlled swap.
2. **Arrival Quantity Integration** — Use CEDA arrival data as a supply-pressure signal (available in schema, not required for v0).

---

## 15. Future Features (Explicitly Deferred)

These are NOT implemented in the hackathon:

1. Real OSRM/live road routing (replace haversine × 1.35)
2. Multi-fold walk-forward validation for backtesting
3. Weather features (Open-Meteo integration)
4. Marathi / Hindi language support
5. Voice input/output
6. User authentication and personalization
7. Push notifications
8. Dashboards and analytics beyond the backtest screen
9. LSTM or any deep-learning forecasting approach
10. LLM-generated core decisions (an LLM may only _phrase_ an already-computed decision, never _decide_)
11. Multi-crop simultaneous analysis
12. Real-time price alerts

---

## 16. Real Data / Input Requirements

### Source 1 — Live Mandi Prices (Primary)

| Field | Value |
|---|---|
| **Source** | Current Daily Price of Various Commodities from Various Markets (Mandi) |
| **Organization** | Directorate of Marketing & Inspection (DMI), Dept. of Agriculture & Farmers Welfare |
| **URL / Platform** | data.gov.in |
| **Resource ID** | `9ef84268-d588-465a-a308-a864a43d0070` |
| **Data Type** | Daily commodity prices (min, max, modal) by market |
| **Historical / Live** | Live (current day's prices) |
| **Coverage** | National — all reporting mandis |
| **Format** | JSON via REST API |
| **Access Mechanism** | GET with `api-key`, `format=json`, `limit`/`offset` paging, `filters[state]`/`filters[commodity]` |
| **Update Frequency** | Daily (as mandis report) |
| **License** | NDSAP (National Data Sharing and Accessibility Policy) |
| **Known Limitations** | Dates in DD/MM/YYYY, default pagination returns only 10 records, mandis don't report every day, manual entry causes outliers, no arrival quantity |
| **Verification Status** | ✅ Confirmed real — catalogue entry and resource ID verified |

### Source 2 — Historical Prices + Arrivals (Secondary)

| Field | Value |
|---|---|
| **Source** | CEDA Agri-Market Data (CEDA-AMD) |
| **Organization** | Centre for Economic Data & Analysis, Ashoka University |
| **URL** | `agmarknet.ceda.ashoka.edu.in`, API at `api.ceda.ashoka.edu.in` |
| **Data Type** | Historical commodity prices + arrival quantities |
| **Historical / Live** | Historical (2000–present, updated monthly) |
| **Coverage** | 300+ commodities, 2,700+ mandis |
| **Format** | JSON via REST API (Swagger docs available) |
| **Access Mechanism** | REST API |
| **Update Frequency** | Monthly |
| **License** | Citation required: "CEDA Agri Market Data (CEDA-AMD), 2000-2023. Centre for Economic Data & Analysis, Ashoka University" + CEDA logo in bottom-right of any visualization |
| **Known Limitations** | Check actual latest available date at fetch time; recency may lag |
| **Verification Status** | ✅ Confirmed real — API and Swagger docs verified |

### Source 3 — Kaggle Mirror (Fallback Only)

| Field | Value |
|---|---|
| **Source** | Daily Market Prices of Commodity India (2001–2026) |
| **Organization** | Kaggle user `khandelwalmanas` |
| **URL** | `kaggle.com/datasets/khandelwalmanas/daily-commodity-prices-india` |
| **Data Type** | Historical commodity prices |
| **Historical / Live** | Historical only |
| **Coverage** | 75M+ records, 370+ commodities |
| **Format** | CSV / Parquet |
| **Known Limitations** | Third-party provenance — compiled from AGMARKNET/data.gov.in |
| **Verification Status** | ✅ Confirmed to exist — never the headline source, demo fallback only |

### Source 4 — Weather (Optional, P1, Deferred)

| Field | Value |
|---|---|
| **Source** | Open-Meteo Archive API |
| **URL** | `archive-api.open-meteo.com/v1/archive` |
| **Data Type** | Historical weather (ERA5) |
| **Access** | No API key required, 10,000 calls/day free tier |
| **Status** | Deferred — not required for v0, optional for v1 features |

### Source 5 — Distance

Haversine × 1.35 road factor. No external routing API for the MVP. OSRM is viable for future work but not worth setup time in the hackathon.

---

## 17. APIs / External Systems

| System | Role | Integration Point | Hackathon Status |
|---|---|---|---|
| data.gov.in Agmarknet API | Live current prices | Backend → REST GET | CORE — must integrate |
| CEDA API | Historical prices + arrivals | Offline data ingestion | CORE — pre-load data |
| Kaggle dataset | Fallback historical data | Offline data ingestion | FALLBACK ONLY |
| Open-Meteo | Weather data | Not integrated in v0 | DEFERRED |
| OSRM | Road routing | Not integrated in MVP | DEFERRED |

---

## 18. Algorithms / Models / Intelligence

### 18.1 v0 Heuristic Forecaster (Default — Ships Always)

- **Input:** Last 7 days of modal prices for a (market, commodity) pair
- **Method:** Linear regression slope over the 7-day window
- **Output:** Expected price for days 1, 2, 3 ahead; 7-day volatility (std dev of daily % changes)
- **Strengths:** No training required, fully explainable, robust to small data, zero ML risk
- **Weaknesses:** Cannot capture non-linear patterns, seasonal effects, or supply shocks
- **Model version identifier:** `v0-heuristic`

### 18.2 v1 GBM Forecaster (Stretch Goal — Ships Only If It Beats v0)

- **Input:** Lagged prices (1d, 3d, 7d), 7d slope, 7d volatility, day-of-week, arrival quantity
- **Method:** LightGBM / XGBoost / sklearn HistGradientBoosting
- **Output:** Expected price for days 1, 2, 3 ahead
- **Evaluation:** Must beat v0 on the same single-holdout backtest (same metrics)
- **Ship criterion:** Feature-flag swap; v1 ships ONLY if it wins the backtest
- **Model version identifier:** `v1-gbm`

### 18.3 Decision Policy

Rule-based (not ML). See Section 9.7 for full specification. Parameters `k` (risk factor, ≈1) and `threshold` (minimum gain to recommend waiting, e.g. ₹20/qtl) are frozen before build.

### 18.4 Backtesting

- **Method:** Single time-based holdout — train on data before cutoff date T, test on data after T
- **Metrics:** Evaluated market-days, average net realisation, baseline net realisation (sell-today), directional accuracy, coverage (% not abstained)
- **Usage:** Evaluates both v0 and v1 (if attempted); the winner ships
- **Stretch:** Multi-fold walk-forward validation (deferred)

---

## 19. Business Logic

### 19.1 Net Realisation

The core business insight: **compare markets by what the farmer actually receives, not by raw price.**

```
net_realisation(market, day) = expected_price(market, day)
                             − (road_distance_km(market) × cost_per_km_per_qtl)
                             − (day × storage_cost_per_day_per_qtl)
```

### 19.2 Decision Rules

See Section 9.7. The decision policy is deterministic given the inputs — no randomness, no black-box ML in the decision layer.

### 19.3 Configurable Parameters

| Parameter | Default | User-Editable? | Frozen Before Build? |
|---|---|---|---|
| `cost_per_km_per_qtl` | ₹3/km/qtl | Yes (settings) | Default frozen |
| `storage_cost_per_day_per_qtl` | ₹10/day/qtl | Yes (settings) | Default frozen |
| `k` (risk factor) | 1.0 | No | Yes |
| `threshold` (min gain to wait) | ₹20/qtl | No | Yes |
| `max_search_radius_km` | 100 km | Configurable | Default frozen |
| `road_factor` | 1.35 | No | Yes |

---

## 20. Known Constraints

1. **24-hour hackathon timeline** — ruthless scope control required
2. **Data quality varies by market and day** — not all mandis report consistently
3. **Market/commodity naming inconsistency** — requires alias mapping, scoped to demo subset
4. **data.gov.in API reliability** — may have downtime during demo; need cached fallback
5. **No real-time streaming** — prices update daily, not real-time
6. **Farmer UX literacy** — must be simple enough for non-technical users
7. **Transport cost is an estimate** — haversine × 1.35 is approximate, not real routing

---

## 21. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| data.gov.in API down during demo | Cannot show live prices | Cache recent responses; fall back to last-known data with "stale" indicator |
| Historical data too sparse for demo markets | Backtest produces no results | Pre-verify data availability for demo crop/market combinations |
| v0 heuristic performs poorly | Backtest shows no improvement over baseline | Honest reporting — abstention rate and actual numbers shown; don't hide poor results |
| Market naming mismatch between sources | Can't join live and historical data | Build targeted alias mapping for demo scope only |
| Backend bottleneck (Amay overloaded) | Core logic delayed, blocks everyone | Early detection; Janhvi/Tanmay/Purva can absorb isolated backend sub-tasks |
| Scope creep under time pressure | Core features incomplete while chasing stretch goals | Frozen scope with change control; v1 GBM only after v0 is solid |

---

## 22. Edge Cases

1. **No markets within search radius** → `NO_RECOMMENDATION` with message about expanding search
2. **All markets have POOR data quality** → `NO_RECOMMENDATION` naming nearest market with better data for other commodities
3. **Only one eligible market** → Compare sell-today vs. wait at that single market only
4. **Price data has gap (missing days)** → Use available data for slope; reduce confidence; flag in data quality
5. **Negative expected gain from waiting** → `SELL_TODAY` with high confidence
6. **Extremely high volatility** → `SELL_TODAY` with LOW confidence (gain ≤ volatility)
7. **Transport cost exceeds price difference** → Closer market recommended despite lower raw price
8. **Commodity not in demo scope** → Clear message: "This commodity is not yet supported"
9. **User enters invalid location** → Validation error with guidance
10. **API returns anomalous price (outlier)** → Flag in data quality; do not use for forecasting

---

## 23. Failure Modes

| Failure Mode | Detection | Response |
|---|---|---|
| API timeout / 5xx | HTTP error handling | Show cached data with "stale" badge; if no cache, `NO_RECOMMENDATION` |
| Stale data (>5 days old, all markets) | Data quality assessment | `NO_RECOMMENDATION` with explanation |
| Inconsistent market name (can't join data) | Alias lookup miss | Exclude market from analysis; log for debugging |
| All forecasts have high uncertainty | Volatility check | `SELL_TODAY` with LOW confidence, or `NO_RECOMMENDATION` |
| Backtest produces 0 evaluated market-days | Coverage check | Show "insufficient data for evaluation" instead of fake numbers |

---

## 24. Fallback Strategies

| Component | Primary | Fallback |
|---|---|---|
| Live prices | data.gov.in API | Cached most-recent response with "stale" indicator |
| Historical data | CEDA / data.gov.in bulk | Kaggle mirror (labeled as fallback source) |
| Forecasting | v0 heuristic | `NO_RECOMMENDATION` if data insufficient for even v0 |
| Distance | Haversine × 1.35 | (No further fallback; this IS the MVP approach) |
| Decision | Full policy | `NO_RECOMMENDATION` when any required input is missing |

---

## 25. Competitive Differentiation

| Existing Solutions | MandiMitra Advantage |
|---|---|
| Kisan Suvidya / eNAM — show raw prices | MandiMitra computes net realisation (price − transport − waiting) |
| Agmarknet portal — data display | MandiMitra provides a decision, not just data |
| Price prediction apps — always predict | MandiMitra abstains when data is insufficient — builds trust |
| Market comparison apps — compare raw price | MandiMitra compares by what the farmer _actually receives_ |
| No app — rely on middleman | MandiMitra breaks the information asymmetry directly |

---

## 26. Implementation Scope

### 26.1 CORE IMPLEMENTATION (Must Ship)

These are required for a working demo:

1. Offline historical data ingestion + cleaning pipeline
2. Live current-price fetch from data.gov.in API
3. Data quality tiering (GOOD / MODERATE / POOR)
4. Haversine × 1.35 distance computation
5. v0 heuristic forecaster (7-day linear extrapolation + volatility)
6. Net realisation computation (price − transport − waiting)
7. Decision policy (SELL_TODAY / WAIT_1_DAY / WAIT_2_DAYS / WAIT_3_DAYS / NO_RECOMMENDATION)
8. Confidence rule table (HIGH / MEDIUM / LOW)
9. Decision card UI (action, market, ₹ impact, confidence)
10. "Why?" screen with template-based explanations
11. Single-holdout backtest with honest metrics

### 26.2 DIFFERENTIATING IMPLEMENTATION (Should Ship)

These elevate the demo from competent to impressive:

1. Abstention (`NO_RECOMMENDATION`) as a visible, deliberate demo moment
2. Backtest evidence screen with real numbers (evaluated days, net realisation vs. baseline, directional accuracy, coverage)
3. Transparent net realisation breakdown ("Why not sell today?", "Why this market?")

### 26.3 DEFERRED / FUTURE CAPABILITIES (Do Not Implement Unless Explicitly Approved)

1. v1 GBM forecaster — ONLY if v0 is solid, time remains, AND v1 wins the backtest
2. Real OSRM road routing
3. Weather features (Open-Meteo)
4. Marathi / Hindi language support
5. Voice input/output
6. Multi-fold walk-forward validation
7. User authentication
8. Push notifications
9. Analytics dashboards beyond backtest
10. LSTM / deep learning
11. LLM-generated core decisions

---

## 27. Capability Mapping

```
RESEARCHED CAPABILITY                    → COMPONENT              → MODULE                           → OWNER
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
Historical data ingestion + cleaning     → Data Pipeline          → data-pipeline/ingest             → Amay
Live price fetch (data.gov.in API)       → API Integration        → api/price-service                → Amay
Data quality tiering (GOOD/MOD/POOR)     → Data Quality           → core/data-quality                → Amay
Haversine × 1.35 distance               → Geo Utilities          → core/distance                    → Amay
v0 heuristic forecaster                  → Forecast Engine        → core/forecast                    → Amay
v1 GBM forecaster (stretch)             → Forecast Engine        → core/forecast                    → Amay
Net realisation computation              → Business Logic         → core/net-realisation             → Amay
Decision policy (sell/wait/abstain)      → Decision Engine        → core/decision                    → Amay
Confidence rule table                    → Decision Engine        → core/decision                    → Amay
Single-holdout backtest                  → Evaluation             → core/backtest                    → Amay
Abstention policy                        → Decision Engine        → core/decision                    → Amay
Template-based explanations              → Explanation Generator  → core/explain                     → Amay
Backend API endpoints                    → API Layer              → api/routes                       → Amay
Market alias mapping                     → Data Utilities         → data-pipeline/aliases            → Amay
API response caching                     → API Layer              → api/cache                        → Amay

Application shell / layout              → Frontend Shell         → app/layout                       → Janhvi
Shared component system                 → Design System          → components/shared                → Janhvi
Design tokens / styles                  → Design System          → styles/                          → Janhvi
Navigation system                       → Frontend Shell         → app/navigation                   → Janhvi
Global frontend state                   → State Management       → state/                           → Janhvi
Decision card visual shell              → Shared Component       → components/shared/DecisionCard   → Janhvi
Data quality badge component            → Shared Component       → components/shared/QualityBadge   → Janhvi
Loading / error states                  → Shared Components      → components/shared/               → Janhvi

Crop + location entry screen            → Feature: Entry         → features/entry/                  → Tanmay
Decision screen (wiring + display)      → Feature: Decision      → features/decision/               → Tanmay
"Why?" explanation screen               → Feature: Evidence      → features/evidence/               → Tanmay
Entry → Decision user flow              → Feature Integration    → features/entry, features/decision→ Tanmay

Market shortlist screen                 → Feature: Markets       → features/markets/                → Purva
Data quality display                    → Feature: Markets       → features/markets/                → Purva
Settings screen                         → Feature: Settings      → features/settings/               → Purva
Backtest evidence screen                → Feature: Backtest      → features/backtest/               → Purva
```

### Verification Checklist

- [x] Every major capability from Appendix B is represented
- [x] No important requirement has disappeared
- [x] No major capability has been silently weakened
- [x] External dependencies are identified (data.gov.in API, CEDA, Kaggle fallback)
- [x] Deferred capabilities are explicitly recorded (Section 26.3)
- [x] Architecture remains faithful to solution intent (net realisation > raw price, abstention as first-class, honest backtest)
- [x] `NO_RECOMMENDATION` is a first-class action value, not null/error
- [x] v0 heuristic is the default; v1 GBM is stretch-only with backtest gate
- [x] Data quality tiering gates recommendation eligibility
- [x] Template-based explanations, never LLM-generated decisions

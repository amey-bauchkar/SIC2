# MandiMitra — System Architecture Specification

## 1. System Overview

**MandiMitra** is a farmer-facing crop-selling decision-support platform designed for the IGNITE 8.0 24-hour hackathon (Problem Statement SIC 2). The system addresses the critical information asymmetry and decision gap faced by Indian farmers when marketing agricultural produce. 

Existing solutions merely aggregate and display raw mandi modal prices, leaving farmers to perform mental arithmetic regarding transport logistics, perishability, price trajectories, and data freshness. MandiMitra transforms raw market data into an actionable, defensible selling decision (`SELL_TODAY`, `WAIT_1_DAY`, `WAIT_2_DAYS`, `WAIT_3_DAYS`, or an honest `NO_RECOMMENDATION`).

Key architectural pillars:
1. **Net Realisation Optimization**: Evaluates alternatives using net farmer returns (expected mandi price minus distance-factored transport logistics and temporal storage/spoilage deductions), rather than misleading nominal prices.
2. **Data-Quality-Gated Decision Policy**: Explicitly assesses data recency and reporting density. Markets failing minimum quality thresholds are deemed ineligible. If no candidate market meets trustworthy standards, the system outputs a first-class `NO_RECOMMENDATION` abstention.
3. **Dual Data Decoupling**: Separates real-time price queries (data.gov.in REST API) from pre-cleaned, normalized historical time series (CEDA / AGMARKNET bulk exports) used for trend forecasting and rigorous single-holdout backtesting.
4. **Strict Separation of Concerns**: Complete decoupling of data ingestion, algorithmic decision engines, API delivery, shared presentation systems, and feature workflows to guarantee conflict-free parallel engineering across a 4-person team.

---

## 2. Architecture Principles

1. **Deterministic Business Core**: Core domain logic (distance factoring, net realisation, data quality grading, decision rule table) is pure, deterministic, and isolated from UI frameworks and network drivers.
2. **First-Class Abstention**: Refusal to recommend under data poverty (`NO_RECOMMENDATION`) is treated as a valid, high-integrity product outcome, not an unhandled exception or null reference.
3. **Zero Fabrication**: No synthetic records, fabricated mandi prices, simulated coordinates, or hallucinated backtest statistics are ever presented as real. Development mock fixtures are quarantined in dedicated testing directories.
4. **Contract-First Independence**: All module boundaries, REST payloads, and component props are strictly typed via TypeScript contracts before implementation begins, allowing backend and frontend feature teams to develop in complete parallelism.
5. **Radical Simplicity**: Prefer explicit, verifiable algorithms (v0 7-day linear slope + empirical volatility) over opaque deep learning models that cannot be credibly trained or verified in a 24-hour hackathon.
6. **Stateless Scalability**: The backend API services remain stateless, relying on client-driven state for session context and read-optimized local/file-based datasets for historical series.

---

## 3. Major Components

The system is partitioned into four major decoupled subsystems:

1. **Data Ingestion & Quality Subsystem (`/src/data-pipeline`)**:
   - Cleans and normalizes historical records (CEDA / Agmarknet bulk exports).
   - Maps inconsistent market/commodity nomenclature using deterministic alias tables.
   - Evaluates data quality tiers (`GOOD`, `MODERATE`, `POOR`) based on 30-day reporting density and reporting latency.
2. **Analytical & Decision Core Engine (`/src/core`)**:
   - Geodesic road-factor distance approximation (`Haversine × 1.35`).
   - Forecast engine hosting `v0-heuristic` (7-day linear regression slope + standard deviation of daily percentage fluctuations) and extensible to `v1-gbm`.
   - Net realisation calculator factoring haulage tariffs and daily holding depreciation.
   - Deterministic policy evaluator assigning discrete actions and confidence tiers.
   - Single time-based holdout backtest evaluator.
3. **API & Integration Gateway (`/src/backend`)**:
   - REST server exposing strongly-typed endpoints for discovery, live rates, evaluation, and backtest results.
   - In-memory cache layer protecting external data.gov.in rate limits and insulating against upstream downtime.
   - Live Agmarknet client with response normalization and error fallbacks.
4. **Client Application (`/src/frontend`)**:
   - Core Application Shell and Design System (`/src/frontend/shell`, `/src/frontend/components/shared`).
   - Feature Vertical 1: Decision & Evidence (`/src/frontend/features/entry`, `/src/frontend/features/decision`, `/src/frontend/features/evidence`).
   - Feature Vertical 2: Markets & Trust (`/src/frontend/features/markets`, `/src/frontend/features/settings`, `/src/frontend/features/backtest`).

---

## 4. ASCII Architecture Diagram

```
+-----------------------------------------------------------------------------------------+
|                                    CLIENT BROWSER                                       |
|                                                                                         |
|  +-----------------------------------------------------------------------------------+  |
|  |                Application Shell & Navigation (Janhvi - Lead)                     |  |
|  |                Design Tokens, Shared Visual Primitives, Global State              |  |
|  +-----------------------------------------+-----------------------------------------+  |
|                                            |                                            |
|       +------------------------------------+------------------------------------+       |
|       |                                                                         |       |
|       v                                                                         v       |
|  +----------------------------------------+ +----------------------------------------+  |
|  |  VERTICAL 1: DECISION & EVIDENCE       | |  VERTICAL 2: MARKETS & TRUST           |  |
|  |  (Tanmay - Feature Engineer)           | |  (Purva - Feature Engineer)            |  |
|  |                                        | |                                        |  |
|  |  * Route /: Crop & Location Entry      | |  * Route /markets: Shortlist & Quality |  |
|  |  * Route /decision: Action Card & Gain | |  * Route /settings: Cost Overrides     |  |
|  |  * Route /evidence: "Why?" & Audits    | |  * Route /backtest: Real Metric Audits |  |
|  +----------------------------------------+ +----------------------------------------+  |
|       |                                                                         |       |
|       +------------------------------------+------------------------------------+       |
|                                            | HTTP (JSON Contracts)                      |
+--------------------------------------------|--------------------------------------------+
                                             v
+-----------------------------------------------------------------------------------------+
|                          BACKEND & AI ENGINE (Amay - Lead)                              |
|                                                                                         |
|  +-----------------------------------------------------------------------------------+  |
|  |  API Gateway & Controller Layer (Express / Node.js HTTP Service)                  |  |
|  |  Routes: /api/markets  /api/prices/live  /api/evaluate  /api/backtest            |  |
|  |  Validation, Error Handling, In-Memory Response Caching (TTL: 1h)                 |  |
|  +-----------------------------------------+-----------------------------------------+  |
|                                            |                                            |
|       +------------------------------------+------------------------------------+       |
|       |                                    |                                    |       |
|       v                                    v                                    v       |
|  +------------------------+  +-------------------------------+  +--------------------+  |
|  | External Live Fetcher  |  | Decision & Business Core      |  | Historical & Model |  |
|  | (Agmarknet Live Client)|  |                               |  | Engine             |  |
|  |                        |  | * Haversine x 1.35 Distances  |  |                    |  |
|  | * data.gov.in API      |  | * Net Realisation (Dist/Wait) |  | * v0 Heuristic     |  |
|  | * ISO Date Normalize   |  | * Data Quality Tiers          |  | * v1 GBM (Flagged) |  |
|  | * Live Cache & Fallback|  | * Policy & Confidence Rules   |  | * Backtest Runner  |  |
|  +------------------------+  | * Template Explanation Engine |  +--------------------+  |
|                              +-------------------------------+            |             |
|                                            ^                              |             |
+--------------------------------------------|------------------------------|-------------+
                                             |                              |
                                             v                              v
+-----------------------------------------------------------------------------------------+
|                             DATA LAYER (Amay - Lead)                                    |
|                                                                                         |
|  +----------------------------------+            +-----------------------------------+  |
|  | Market Geo Registry              |            | Cleaned Historical Time-Series    |  |
|  | Lat/Lon coordinates, APMC IDs,   |            | /data/processed (Pre-cleaned CEDA |  |
|  | District & State mappings        |            | & Agmarknet bulk records)         |  |
|  +----------------------------------+            +-----------------------------------+  |
|  +-----------------------------------------------------------------------------------+  |
|  | Market & Commodity Aliases Table: Deterministic String Normalization               |  |
|  +-----------------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------------+
```

---

## 5. Component Responsibilities

| Subsystem / Component | Primary Owner | Architectural Responsibilities |
|---|---|---|
| **Domain Contracts** (`/src/contracts`) | Amay (Lead) | Canonical TypeScript interfaces for all shared domain entities, API request/response payloads, and evaluation records. Immutable without contract change review. |
| **System Configuration** (`/src/config`) | Amay (Lead) | Centralized environment variables, operational defaults (₹3/km/qtl, ₹10/day/qtl, k=1.0, threshold=₹20), API keys, and model feature flags. |
| **Data Ingestion & Cleaning** (`/src/data-pipeline`) | Amay (Lead) | Historical dataset parsing, date normalization, outlier truncation (3σ window), deduplication, and market alias mapping. |
| **Core Decision Engine** (`/src/core`) | Amay (Lead) | Pure mathematical implementations of distance, net realisation, quality tiering, linear/GBM forecasting, confidence assignment, and explainability strings. |
| **Backend REST Service** (`/src/backend`) | Amay (Lead) | HTTP route handlers, request validation, live upstream Agmarknet querying with retry/cache, error boundaries, and static historical dataset access. |
| **Application Shell & Design System** (`/src/frontend/shell`, `/src/frontend/components/shared`) | Janhvi (Lead) | Root layout, semantic HTML frame, CSS custom properties (colors, typography, spacing), responsive layout containers, navigation bar, shared UI atoms (`DecisionCard`, `QualityBadge`, `Button`, `StatCard`, `SkeletonLoader`). |
| **Feature: Decision & Evidence** (`/src/frontend/features/entry`, `/src/frontend/features/decision`, `/src/frontend/features/evidence`) | Tanmay | Farmer journey from commodity/location picker, invoking `/api/evaluate`, rendering the primary recommendation card, to the granular "Why?" breakdown screen. |
| **Feature: Markets & Trust** (`/src/frontend/features/markets`, `/src/frontend/features/settings`, `/src/frontend/features/backtest`) | Purva | Shortlisted nearby market list with quality tags, user-editable transport/storage cost configuration, and verifiable backtest empirical results display. |

---

## 6. Technology Stack

- **Runtime Environment**: Node.js (LTS v18+)
- **Language**: TypeScript (strict mode enabled across all contracts, backend services, and client scripts)
- **Backend Framework**: Express.js (lightweight, predictable, minimal overhead for REST endpoints)
- **Frontend Architecture**: Modern Web Architecture utilizing standard semantic HTML5, Vanilla TypeScript, and component-scoped Vanilla CSS design tokens.
- **Data Serialization**: JSON with strict ISO-8601 timestamps.
- **Geodesic Calculation**: Custom Haversine formulation in pure TypeScript with Earth radius constant ($R = 6371.0088\text{ km}$).
- **Historical Data Store**: Normalized JSON/CSV files stored within `/data/processed` and queried via memory-mapped streams.
- **Code Quality & Tooling**: TypeScript Compiler (`tsc`), ESLint, Prettier.

---

## 7. Technology Justifications

1. **Why TypeScript End-to-End?** Eliminates API contract drifting between backend controllers and frontend feature screens. Single interface definition acts as the infallible source of truth.
2. **Why Vanilla CSS & Design Tokens over Tailwind?** Follows project directives. Provides full aesthetic control over rich agricultural dark/light palettes, glassmorphic card elevations, smooth CSS transitions, and zero build-step bundle bloat.
3. **Why Express.js over Microservice Frameworks?** In a 24-hour hackathon, running multiple microservices introduces process management overhead, port collisions, and complex deployment topologies. A modular monolithic Express architecture provides clear internal boundaries with single-process reliability.
4. **Why Haversine × 1.35 over Live OSRM?** Live routing engines require heavy local Docker OSM extracts (multi-gigabyte memory footprints) or external rate-limited public APIs. Empirical transport research demonstrates that $1.35 \times \text{Haversine}$ approximates rural Indian highway routes within an acceptable $\pm 7\%$ margin of error without network dependencies.
5. **Why Pre-Loaded Historical Data?** Live scraping of years of historical data from government portals during a judge demonstration is prone to network failure, rate limits, and latency spikes. Pre-loading verified data ensures 100% demo resilience.

---

## 8. Data Flow

```
[Farmer Enters Crop & Lat/Lon]
               │
               ▼
[POST /api/evaluate { commodity, latitude, longitude, transportCostPerKm, storageCostPerDay }]
               │
               ▼
[Backend: Resolve Candidate Mandis via Geodesic Registry]
               │  Filter radius ≤ 100 km; Compute Road Distance = Haversine × 1.35
               ▼
[Backend: Query Live Price & Historical Time Series]
               │  1. Check in-memory live cache or fetch from data.gov.in API
               │  2. Load 30-day historical observations from /data/processed
               ▼
[Backend: Evaluate Data Quality Tiers]
               │  Calculate daysSinceLastReport & 30-day coverage %
               │  Categorize: GOOD (≤2d, ≥70%), MODERATE (≤5d, ≥40%), POOR (all others)
               ▼
[Backend: Forecast 0..3 Day Prices via Active Model (v0 Heuristic)]
               │  Extract 7-day slope: expectedPrice(d) = modalPrice + (slope × d)
               │  Extract 7-day volatility: stdDev(pctChanges)
               ▼
[Backend: Compute Net Realisation for All Eligible Candidates]
               │  Net Realisation = Price(d) - TransportCost(km) - WaitingCost(d)
               ▼
[Backend: Apply Decision Policy]
               │  Compare best_today vs best_future
               │  Compute risk_adjusted_gain = expected_gain - (1.0 × volatility)
               │  If no eligible markets: action = NO_RECOMMENDATION
               │  Else if risk_adjusted_gain > ₹20: action = WAIT_n_DAYS
               │  Else: action = SELL_TODAY
               ▼
[Backend: Generate Deterministic Template Explanations]
               │  Construct human-readable "reasons" list using real variables
               ▼
[HTTP 200 Response: Recommendation & MarketEvaluations JSON]
               │
               ├──────────────────────────────────────────┐
               ▼                                          ▼
[Tanmay: Render Decision Card & "Why?"]   [Purva: Render Market Shortlist]
```

---

## 9. API & Interface Boundaries

All endpoints run on base URL: `http://localhost:3001/api`.

### 9.1 Endpoints Specification

1. **`GET /api/markets/nearby`**
   - **Query Parameters**: `lat` (float), `lon` (float), `radiusKm` (optional float, default 100)
   - **Response**: `Market[]` sorted by road distance ascending.

2. **`GET /api/prices/live`**
   - **Query Parameters**: `marketId` (string), `commodity` (string)
   - **Response**: `PriceObservation` (source: `data.gov.in-live` or cached).

3. **`POST /api/evaluate`**
   - **Payload**:
     ```json
     {
       "commodity": "Onion",
       "latitude": 19.9975,
       "longitude": 73.7898,
       "transportCostPerKmPerQtl": 3.0,
       "storageCostPerDayPerQtl": 10.0,
       "radiusKm": 100
     }
     ```
   - **Response**:
     ```json
     {
       "recommendation": {
         "action": "WAIT_2_DAYS",
         "market": {
           "id": "lasalgaon",
           "name": "Lasalgaon APMC",
           "state": "Maharashtra",
           "district": "Nashik",
           "lat": 20.1472,
           "lon": 74.2251
         },
         "confidence": "HIGH",
         "expectedGainPerQtl": 85.50,
         "reasons": [
           "Lasalgaon APMC offers highest net return of ₹2,410.50/qtl on Day 2.",
           "Price trend shows positive slope of +₹55.00/qtl/day over the last 7 days.",
           "Expected gain of ₹85.50/qtl outweighs holding costs (₹20.00/qtl) and volatility buffer."
         ]
       },
       "evaluations": [
         {
           "market": { "id": "lasalgaon", "name": "Lasalgaon APMC", "state": "Maharashtra", "district": "Nashik", "lat": 20.1472, "lon": 74.2251 },
           "dataQuality": { "tier": "GOOD", "daysSinceLastReport": 1, "coverage30d": 90.0, "missingDays": 3 },
           "netRealisationByDay": [
             { "day": 0, "expectedPrice": 2350, "transportCostPerQtl": 65, "waitingCostPerQtl": 0, "netRealisation": 2285 },
             { "day": 1, "expectedPrice": 2405, "transportCostPerQtl": 65, "waitingCostPerQtl": 10, "netRealisation": 2330 },
             { "day": 2, "expectedPrice": 2460, "transportCostPerQtl": 65, "waitingCostPerQtl": 20, "netRealisation": 2375 },
             { "day": 3, "expectedPrice": 2515, "transportCostPerQtl": 65, "waitingCostPerQtl": 30, "netRealisation": 2420 }
           ]
         }
       ],
       "evaluatedAt": "2026-09-03T11:45:00.000Z"
     }
     ```

4. **`GET /api/backtest`**
   - **Query Parameters**: `commodity` (string), `modelVersion` (optional `"v0-heuristic" | "v1-gbm"`)
   - **Response**: `BacktestResult`

---

## 10. Security

1. **Secret Isolation**: External API keys (`DATA_GOV_IN_API_KEY`) are read strictly from `.env` on the server. Never bundled into frontend assets.
2. **Input Validation**: Boundary validation on coordinates (`lat` $\in [-90, 90]$, `lon` $\in [-180, 180]$), positive numeric costs, and recognized commodity strings.
3. **CORS Hardening**: Access restricted to localhost frontend dev origins during the hackathon.
4. **Header Sanitization**: Basic security headers (no-sniff, frame protection) configured on Express.

---

## 11. Error Handling & Abstention Strategy

1. **Standardized Error Envelope**:
   ```json
   {
     "error": {
       "code": "COMMODITY_NOT_FOUND",
       "message": "Commodity 'Dragonfruit' is not supported in this region.",
       "details": {}
     }
   }
   ```
2. **Abstention as Product Feature (`NO_RECOMMENDATION`)**:
   When candidate mandis fail quality thresholds, the server returns an HTTP 200 with an explicit recommendation payload:
   ```json
   {
     "recommendation": {
       "action": "NO_RECOMMENDATION",
       "market": null,
       "confidence": "LOW",
       "expectedGainPerQtl": 0,
       "reasons": [
         "All candidate markets within 100km have stale or sparse reporting (POOR quality tier).",
         "The nearest reporting market with reliable data is Pimpalgaon APMC (118 km away)."
       ]
     }
   }
   ```

---

## 12. Resilience

1. **Upstream Circuit Breaker & Fallback**:
   If the live `data.gov.in` API returns HTTP 5xx, timeouts (>3000ms), or network errors:
   - Serve the most recent cached observation marked with `isStale: true`.
   - If no cache exists, fall back to the most recent record from the local `/data/processed` historical store with an explicit warning banner.
2. **Offline Mode**: The core decision engine and backtesting components operate 100% offline using the pre-cleaned local datasets.

---

## 13. Performance Targets

- Geodesic Candidate Selection: $< 15\text{ ms}$ across 200 regional mandis.
- v0 Heuristic Slope & Volatility Calculation: $< 5\text{ ms}$ per market.
- Complete `/api/evaluate` Request-Response Cycle: $< 200\text{ ms}$ (served from cache/local) or $< 1200\text{ ms}$ (with live API fetch).
- Frontend Initial Render: $< 500\text{ ms}$ on standard mobile viewport.

---

## 14. Deployment & Ports

- **Backend API**: Port `3001` (`http://localhost:3001`)
- **Frontend App**: Port `3000` (`http://localhost:3000`)
- **Environment**: Node.js v18+ on local development host.
- Single command runner to launch both processes concurrently.

---

## 15. Environment Configuration

Defined in `.env.example`:
```env
PORT=3001
NODE_ENV=development
DATA_GOV_IN_API_KEY=your_api_key_here
ENABLE_V1_GBM=false
DEFAULT_TRANSPORT_COST_PER_KM_QTL=3.0
DEFAULT_STORAGE_COST_PER_DAY_QTL=10.0
DECISION_RISK_K=1.0
DECISION_GAIN_THRESHOLD=20.0
MAX_SEARCH_RADIUS_KM=100.0
ROAD_DISTANCE_FACTOR=1.35
```

---

## 16. Integration Strategy

1. **Phase 1 Contract Freeze**: Interfaces in `/src/contracts` are locked.
2. **Phase 2 Parallel Sprint**:
   - Amay builds `/src/core`, `/src/data-pipeline`, and `/src/backend`.
   - Janhvi builds `/src/frontend/shell` and `/src/frontend/components/shared`.
   - Tanmay builds `/src/frontend/features/entry`, `/decision`, `/evidence`.
   - Purva builds `/src/frontend/features/markets`, `/settings`, `/backtest`.
3. **Phase 3 Integration Checkpoints**:
   - Integration Checkpoint 1 (Hour 12): Shell mounting shared feature placeholders.
   - Integration Checkpoint 2 (Hour 16): Mock fixture verification across all screens.
   - Integration Checkpoint 3 (Hour 20): End-to-end wiring of live REST responses.
   - Integration Checkpoint 4 (Hour 22): Full backtest audit and presentation rehearsal.

---

## 17. Web & Full-Stack Domain Specifics

### 17.1 Frontend Architecture
- **Component Model**: Pure functional components returning semantic DOM nodes with event listeners.
- **State Management**: A lightweight reactive Store (`/src/frontend/state/store.ts`) holding:
  - `selectedCrop`: string
  - `userLocation`: { lat, lon, district }
  - `costConfig`: { transportCostPerKm, storageCostPerDay }
  - `evaluationResult`: EvaluationResponse | null
  - `isEvaluating`: boolean
- **Routing**: Lightweight client-side hash router (`/#/`, `/#/markets`, `/#/decision`, `/#/evidence`, `/#/backtest`, `/#/settings`).

### 17.2 Backend Architecture
- Layered Express structure:
  - `controllers/`: Request parsing, parameter coercion, response formatting.
  - `services/`: Orchestration between external API clients, historical stores, and core engines.
  - `middleware/`: Error trapping, JSON parsing, logging.

---

## 18. AI & Machine Learning Domain Specifics

### 18.1 Real Data Pipeline & Verified Sources
- **Live Mandi Prices**: data.gov.in Agmarknet API (`Resource ID: 9ef84268-d588-465a-a308-a864a43d0070`).
- **Historical Prices & Arrivals**: CEDA Agri-Market Data (`agmarknet.ceda.ashoka.edu.in`).
  - Required Citation: *"CEDA Agri Market Data (CEDA-AMD), 2000-2023. Centre for Economic Data & Analysis, Ashoka University"* with logo watermark.
- **Fallback Mirror**: Kaggle `khandelwalmanas/daily-commodity-prices-india` (strictly fallback).

### 18.2 Ingestion & Preprocessing
- **Date Standardizer**: Regex conversion of `DD/MM/YYYY` into ISO `YYYY-MM-DD`.
- **Outlier Filter**: Removes daily modal prices diverging by $> 3.0$ standard deviations from the rolling 30-day market mean.
- **Market Alias Normalizer**: Scoped dictionary reconciling names (e.g., `"Lasalgaon"`, `"Lasalgaon(Niphad)"`, `"LASALGAON"` $\rightarrow$ `"lasalgaon"`).

### 18.3 Model Selection & Swappable Forecasting
1. **v0 Heuristic (Primary Baseline - Ships by Default)**:
   - For horizon $d \in \{1, 2, 3\}$:
     $$\hat{P}_{t+d} = P_t + (S_{7d} \times d)$$
     where $S_{7d}$ is the ordinary least squares slope of modal prices over the trailing 7 reporting days.
   - Volatility $\sigma$: Sample standard deviation of daily percentage price changes over the trailing 7 reporting days.
2. **v1 Gradient-Boosted Model (GBM - Stretch Goal)**:
   - Model: Scikit-learn `HistGradientBoostingRegressor` or LightGBM via Node-Python bridge or ONNX runtime.
   - Features: $P_t, P_{t-1}, P_{t-3}, P_{t-7}, S_{7d}, \sigma_{7d}$, DayOfWeek, ArrivalQuantity.
   - Gate: Swappable via `ENABLE_V1_GBM=true`. Will only be activated if its backtest directional accuracy and net realisation gain strictly exceed `v0-heuristic`.

### 18.4 Evaluation & Single-Holdout Backtest
- **Cutoff Date**: Fixed timestamp $T$ (e.g., 2024-01-01). Data before $T$ used for baseline estimation; data after $T$ evaluated day-by-day.
- **Metrics Computed**:
  - `evaluatedDays`: Total market-days tested.
  - `avgNetRealisation`: Mean net realisation achieved by following system recommendations.
  - `baselineNetRealisation`: Mean net realisation achieved by naive `SELL_TODAY` at closest market.
  - `directionalAccuracy`: % of times the predicted price direction ($\Delta > 0$ vs $\Delta \le 0$) matched reality.
  - `coverage`: % of days system issued actionable advice vs `NO_RECOMMENDATION`.

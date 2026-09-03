# TASK CONTRACT: AMAY (Team Lead — Backend, AI/ML, Core Business Logic)

## 1. Role & Identity
- **Name**: Amay
- **Title**: Team Lead & Principal Systems Engineer
- **Core Domain**: Backend architecture, Algorithmic Decision Engine, Data Ingestion Pipeline, Time-Series Modeling, REST APIs, and System Integration.

---

## 2. Mission
Deliver a deterministic, high-performance, and resilient decision backend that:
1. Ingests pre-cleaned historical market data from `/data/processed`.
2. Integrates live price observations from the official data.gov.in Agmarknet API (`Resource ID: 9ef84268-d588-465a-a308-a864a43d0070`).
3. Executes the core algorithms: Haversine $\times$ 1.35 road distance, data quality tiering (`GOOD`, `MODERATE`, `POOR`), v0 heuristic price forecasting (7-day slope + volatility), Net Realisation optimization (factoring distance haulage tariffs and holding depreciation), and the decision policy (`SELL_TODAY`, `WAIT_n_DAYS`, `NO_RECOMMENDATION`).
4. Serves typed REST endpoints adhering strictly to `/src/contracts/api.ts`.
5. Executes the single-holdout empirical backtest with honest numbers and CEDA citation attribution.

---

## 3. Physical Ownership Boundaries

### 100% Owned Directories
- `/src/contracts/` (Canonical source of truth for types)
- `/src/config/` (System hyper-parameters and flags)
- `/src/core/` (Pure mathematical & algorithmic logic)
- `/src/data-pipeline/` (Data normalization, alias tables, market registries)
- `/src/backend/` (Express REST server, controllers, caching, upstream clients)
- `/src/frontend/fixtures/` (Test fixture data contracts for frontend isolation)
- Integration point for `/data/processed`

### Files Amay May Modify
- `/src/contracts/*.ts`
- `/src/config/*.ts`
- `/src/core/*.ts`
- `/src/data-pipeline/*.ts`
- `/src/backend/*.ts`
- `/src/frontend/fixtures/*.ts`
- `package.json`, `tsconfig.json`, `.env.example`
- Root scripts and orchestration files

### Files Amay Must NOT Modify
- `/src/frontend/styles/*` (Owned 100% by Janhvi)
- `/src/frontend/components/*` (Owned 100% by Janhvi)
- `/src/frontend/shell/*` (Owned 100% by Janhvi)
- `/src/frontend/features/entry/*` (Owned 100% by Tanmay)
- `/src/frontend/features/decision/*` (Owned 100% by Tanmay)
- `/src/frontend/features/evidence/*` (Owned 100% by Tanmay)
- `/src/frontend/features/markets/*` (Owned 100% by Purva)
- `/src/frontend/features/settings/*` (Owned 100% by Purva)
- `/src/frontend/features/backtest/*` (Owned 100% by Purva)

---

## 4. Dependencies & Downstream Consumers
- **Upstream Inputs**:
  - Raw/processed historical datasets in `/data/processed` (from the parallel data-sourcing track).
  - Upstream REST API responses from `api.data.gov.in`.
- **Downstream Consumers**:
  - Janhvi: Consumes domain & component contracts in `/src/contracts/`.
  - Tanmay: Consumes `/api/evaluate` for Entry, Decision Card, and Evidence screens.
  - Purva: Consumes `/api/markets/nearby` and `/api/backtest` for Market Shortlist and Backtest screens.

---

## 5. Shared Contracts & Interfaces
Amay produces and maintains:
- `src/contracts/domain.ts`: `Crop`, `Market`, `PriceObservation`, `DataQualityAssessment`, `Forecast`, `NetRealisation`, `MarketEvaluation`, `Recommendation`, `BacktestResult`.
- `src/contracts/api.ts`: `NearbyMarketsResponse`, `LivePriceResponse`, `EvaluateResponse`, `BacktestResponse`.
- `src/contracts/frontend.ts`: Maintained in collaboration with Janhvi.

---

## 6. Exact Task Breakdown & File Map

| Task ID | Component | File Path | Detailed Description |
|---|---|---|---|
| **A-1** | Geodesics | `/src/core/distance.ts` | Verify Haversine formula and 1.35x empirical road distance factor. Ensure positive floating-point outputs. |
| **A-2** | Quality Tiering | `/src/core/data-quality.ts` | Implement data quality rules: GOOD ($\le 2$d, $\ge 70\%$), MODERATE ($\le 5$d, $\ge 40\%$), POOR (all else). Flag `isEligibleForRecommendation`. |
| **A-3** | Forecasting Engine | `/src/core/forecast.ts` | v0 OLS linear regression slope over trailing 7 days + standard deviation of daily percentage price changes. Swappable gate for v1 GBM. |
| **A-4** | Net Realisation | `/src/core/net-realisation.ts` | Deduct transport cost (`road_km * cost_per_km`) and waiting cost (`day * storage_cost_per_day`) from expected price for days 0..3. |
| **A-5** | Decision Engine | `/src/core/decision.ts` | Implement policy: Compare Day 0 best vs future best. Compute `riskAdjustedGain = expectedGain - (k * volatility)`. Apply threshold (₹20). Rule-based confidence assignment. Abstain (`NO_RECOMMENDATION`) if all POOR. |
| **A-6** | Explanations | `/src/core/explain.ts` | Template generator assembling human-readable explanation strings directly from computed numeric variables. |
| **A-7** | Normalization & Aliases | `/src/data-pipeline/aliases.ts` | Normalize APMC names (`Lasalgaon(Niphad)` $\rightarrow$ `lasalgaon`) and commodities (`kanda` $\rightarrow$ `Onion`). |
| **A-8** | APMC Registry | `/src/data-pipeline/registry.ts` | Verified coordinates for Maharashtra APMCs (Nashik, Lasalgaon, Pimpalgaon, Yeola, Pune). |
| **A-9** | Live API Client | `/src/backend/agmarknet-client.ts` | data.gov.in REST fetcher with DD/MM/YYYY date normalization, 10-record pagination, and circuit breaker. |
| **A-10** | Caching Layer | `/src/backend/cache.ts` | In-memory TTL cache (1h) protecting external API rate limits and guaranteeing demo resilience. |
| **A-11** | REST Controllers | `/src/backend/controllers.ts` | Implement HTTP controllers for `/api/markets/nearby`, `/api/prices/live`, `/api/evaluate`, and `/api/backtest`. |
| **A-12** | Express Server | `/src/backend/server.ts` | Express HTTP server listening on Port 3001 with CORS, JSON body parser, and healthcheck. |
| **A-13** | Backtest Runner | `/src/core/backtest.ts` | Single time-based holdout backtest engine evaluating net realisation vs naive sell-today baseline across historical series. |

---

## 7. Algorithms & Processing Logic

### 1. Road Distance
$$\text{Distance}_{\text{road}} = \text{Haversine}(\text{lat}_1, \text{lon}_1, \text{lat}_2, \text{lon}_2) \times 1.35$$

### 2. v0 Price Forecast (0..3 Days)
For horizon $d \in \{0, 1, 2, 3\}$:
$$\hat{P}_{t+d} = P_t + (S_{7d} \times d)$$
where $S_{7d} = \frac{n\sum xy - \sum x \sum y}{n\sum x^2 - (\sum x)^2}$ across the 7 trailing reporting prices.
$$\text{Volatility } \sigma = \text{StdDev}\left(\frac{P_i - P_{i-1}}{P_{i-1}}\right) \times P_t$$

### 3. Net Realisation
$$\text{NetRealisation}(m, d) = \hat{P}(m, d) - (\text{Distance}_{\text{road}}(m) \times C_{\text{km}}) - (d \times C_{\text{storage}})$$

### 4. Decision Policy & Confidence
$$\text{Gain}_{\text{expected}} = \max_{m \in \text{Eligible}, d \in \{1,2,3\}} \text{NetRealisation}(m, d) - \max_{m \in \text{Eligible}} \text{NetRealisation}(m, 0)$$
$$\text{Gain}_{\text{risk-adjusted}} = \text{Gain}_{\text{expected}} - (1.0 \times \sigma_{\text{chosen}})$$
- If $\text{Eligible} = \emptyset \implies \text{NO\_RECOMMENDATION}$
- Else if $\text{Gain}_{\text{risk-adjusted}} > \text{₹}20.0 \implies \text{WAIT\_n\_DAYS}$
- Else $\implies \text{SELL\_TODAY}$

---

## 8. Real Data Interfaces
- **Live**: data.gov.in Agmarknet API (`Resource ID: 9ef84268-d588-465a-a308-a864a43d0070`).
- **Historical**: CEDA Agri-Market Data / Agmarknet exports in `/data/processed`.
- **Attribution**: Serve CEDA citation string on all backtest endpoints: *"CEDA Agri Market Data (CEDA-AMD), 2000-2023. Centre for Economic Data & Analysis, Ashoka University"*.

---

## 9. Error Handling & Edge Cases
- **Upstream 5xx / Timeout**: Serve cached data with `isStale: true`. If unprimed, serve verified offline fallback.
- **No mandis within search radius**: Return HTTP 200 with `NO_RECOMMENDATION` and clear explanation reason.
- **All mandis have POOR data quality**: Return HTTP 200 with `NO_RECOMMENDATION` stating data staleness and pointing to nearest better reporting APMC.
- **Outlier Prices**: Filter records with modal price $> 3\sigma$ from rolling mean.

---

## 10. Step-by-Step Implementation Order & Timeboxing (24-Hour Hackathon)

```
Hours 00:00 - 03:00  [COMPLETED] Phase 1-3: Contracts, Architecture, Scaffolding
Hours 03:00 - 06:00  Core Decision Engine: distance, data-quality, forecast, net-realisation, decision policy
Hours 06:00 - 09:00  APMC Registry, Alias Mapping, Live Agmarknet Client & In-memory Cache
Hours 09:00 - 12:00  Express Server & Controllers wiring (/api/evaluate, /api/markets, /api/backtest)
Hours 12:00 - 15:00  Integration Checkpoint 1: Verify Endpoints with curl / Postman
Hours 15:00 - 18:00  Historical Ingestion & Backtest Runner integration with /data/processed
Hours 18:00 - 21:00  Integration Checkpoint 2: End-to-end frontend hookup with Tanmay & Purva
Hours 21:00 - 24:00  Final Smoke Testing, Performance Tuning & Presentation Dry Run
```

---

## 11. Definition of Done & Smoke Tests
1. `GET /api/health` returns status `healthy`.
2. `GET /api/markets/nearby?lat=19.9975&lon=73.7898` returns Maharashtra APMCs sorted by road distance.
3. `POST /api/evaluate` with `{ commodity: "Onion", latitude: 19.9975, longitude: 73.7898 }` returns valid `Recommendation` and `evaluations` array in $< 200\text{ ms}$.
4. Simulating POOR data quality triggers `NO_RECOMMENDATION` with explicit abstention reasons.
5. `GET /api/backtest?commodity=Onion` returns empirical metrics and mandatory CEDA citation notice.

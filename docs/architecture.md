# Technical Architecture & Stack

Complete architecture reference for the MandiMitra hackathon build.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA INGESTION LAYER                         │
│                                                                     │
│  data.gov.in mandi API ──┐                                         │
│  Open-Meteo archive ─────┼──► Ingest + Normalise ──► Prices Store  │
│  OSRM distance matrix ───┘    (DD/MM/YYYY → ISO,     (Postgres /   │
│                                dedupe, validate)       SQLite)      │
└────────────────────────────────────┬────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        FEATURE BUILDER                              │
│                                                                     │
│  Price lags (1d, 3d, 7d, 14d)                                      │
│  Price direction (Δ over windows)                                   │
│  Rolling volatility                                                 │
│  Weather features (temp, precip, humidity)                           │
│  Missing-value flag (days since last report)                        │
│  Outlier flag (IQR-based)                                           │
│  Data-quality score (coverage ratio over 14-day window)             │
└────────────────────────────────────┬────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DECISION ENGINE                              │
│                                                                     │
│  Direction Classifier ──► UP / FLAT / DOWN (2-3 day horizon)       │
│  (Gradient Boosted)        + calibrated confidence                  │
│       │                                                             │
│       ▼                                                             │
│  Abstention Gate ────────► If coverage < threshold → REFUSE         │
│       │                    Redirect to nearest reliable mandi       │
│       ▼                                                             │
│  Net-Realisation Ranker ─► For each candidate mandi:               │
│                            ₹-in-hand = predicted_modal_price       │
│                                      − transport_cost/quintal       │
│                            Rank and select best                     │
└────────────────────────────────────┬────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           REST API                                  │
│                                                                     │
│  GET /api/decision                                                  │
│    ?commodity=Onion&district=Nashik&quantity=20                     │
│    → { decision, confidence, best_mandi, net_realisation,          │
│        why: { trend, weather, distance_cost, data_quality },       │
│        alternatives: [...], backtest_summary: {...} }              │
│                                                                     │
│  GET /api/prices/live     → live API call to data.gov.in           │
│  GET /api/prices/history  → cached historical data                  │
│  GET /api/backtest        → walk-forward evaluation metrics         │
└────────────────────────────────────┬────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           PWA FRONTEND                              │
│                                                                     │
│  Decision Card ─── "WAIT 2 DAYS · Lasalgaon · +₹X/q · MEDIUM"    │
│  Why Panel ─────── Trend, weather, distance cost, data quality     │
│  Backtest Panel ── N days, ₹/quintal vs baseline, hit-rate         │
│  Abstention View ─ "Cannot advise — reason — nearest reliable"     │
│  Voice Output ──── Marathi/Hindi TTS                               │
│  i18n ──────────── Marathi / Hindi / English                       │
│                                                                     │
│  Mobile-first · Low-literacy · Three-colour · One-number           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Vite + Vanilla TypeScript SPA | Ultra-fast lightweight bundle, zero-framework overhead, modular component views |
| **Backend** | Node.js + Express (TypeScript) | Strongly-typed domain contract layer, microsecond route latency |
| **ML Engine** | Python (scikit-learn GBM + OLS heuristic) | Walk-forward expanding window training, causal lag feature matrix |
| **Database** | Supabase (PostgreSQL) + Local JSON/CSV | Cloud persistence for pools/alerts + ultra-fast local disk caching |
| **Distance** | OSRM / Nominatim (calibrated pre-computed matrix) | Pre-computed road distance matrix for 82 Maharashtra mandis |
| **Weather** | Open-Meteo ERA5 API | Official historical archive & real-time rural agro-weather |
| **Infrastructure** | Single container / Local dev runner | Zero GPU requirements, runs CPU-native on edge hardware |

---

## Database Schema (Hackathon)

### `prices` table
```sql
CREATE TABLE prices (
    id            SERIAL PRIMARY KEY,
    state         TEXT NOT NULL,
    district      TEXT NOT NULL,
    market        TEXT NOT NULL,
    commodity     TEXT NOT NULL,
    variety       TEXT,
    grade         TEXT,
    arrival_date  DATE NOT NULL,          -- normalised from DD/MM/YYYY
    min_price     NUMERIC,                -- ₹/quintal
    max_price     NUMERIC,                -- ₹/quintal
    modal_price   NUMERIC NOT NULL,       -- ₹/quintal — the key field
    source        TEXT DEFAULT 'ogd',     -- 'ogd' | 'ceda' | 'kaggle'
    created_at    TIMESTAMP DEFAULT NOW(),
    UNIQUE(market, commodity, variety, arrival_date)
);
```

### `markets` table
```sql
CREATE TABLE markets (
    id            SERIAL PRIMARY KEY,
    market_name   TEXT NOT NULL UNIQUE,
    district      TEXT NOT NULL,
    state         TEXT NOT NULL,
    latitude      NUMERIC,
    longitude     NUMERIC
);
```

### `distance_matrix` table (or JSON file)
```sql
CREATE TABLE distance_matrix (
    origin_district   TEXT NOT NULL,
    destination_market TEXT NOT NULL,
    distance_km       NUMERIC NOT NULL,
    transport_cost_per_quintal NUMERIC NOT NULL,  -- distance_km × rate
    PRIMARY KEY (origin_district, destination_market)
);
```

### `weather` table
```sql
CREATE TABLE weather (
    district      TEXT NOT NULL,
    date          DATE NOT NULL,
    temp_mean     NUMERIC,        -- °C
    precip_sum    NUMERIC,        -- mm
    humidity_mean NUMERIC,        -- %
    PRIMARY KEY (district, date)
);
```

---

## API Contract (Frozen by Hour 3)

### Decision Request
```json
// GET /api/decision?commodity=Onion&district=Nashik&quantity=20

{
  "decision": "WAIT",
  "wait_days": 2,
  "best_mandi": {
    "name": "Lasalgaon",
    "district": "Nashik",
    "distance_km": 35,
    "current_modal_price": 2340,
    "predicted_direction": "UP",
    "predicted_modal_price": 2520,
    "transport_cost_per_quintal": 45,
    "net_realisation_per_quintal": 2475,
    "last_reported_date": "2026-09-01",
    "data_quality_score": 0.85
  },
  "confidence": "MEDIUM",
  "why": {
    "trend": "Prices rose 4.2% over last 7 days",
    "weather": "No rain forecast — supply steady",
    "transport": "35 km via NH-160, ₹45/quintal",
    "data_quality": "Lasalgaon reported 12 of last 14 days"
  },
  "alternatives": [
    {
      "name": "Pimpalgaon",
      "net_realisation_per_quintal": 2380,
      "distance_km": 18,
      "data_quality_score": 0.71
    }
  ],
  "abstained": false,
  "backtest_summary": {
    "held_out_days": 2000,
    "rupees_per_quintal_vs_baseline": 47,
    "direction_hit_rate": 0.64,
    "vs_persistence_hit_rate": 0.58
  }
}
```

### Abstention Response
```json
{
  "decision": "CANNOT_ADVISE",
  "reason": "Mandi Manmad has not reported prices in 9 days",
  "abstained": true,
  "fallback": {
    "nearest_reliable_mandi": "Lasalgaon",
    "data_quality_score": 0.85,
    "distance_km": 42
  }
}
```

---

## AI/ML Design

### Model: Gradient Boosted Direction Classifier

| Aspect | Choice | Rationale |
|--------|--------|-----------|
| **Algorithm** | GradientBoostingClassifier (sklearn) | Trains in seconds on CPU; handles small, gappy, tabular data well |
| **Output** | 3-class: UP / FLAT / DOWN (2-3 day horizon) | Direction is actionable; point estimates are misleading |
| **Why NOT deep learning** | Short, gappy, per-mandi series with a few hundred usable points. Gradient boosting beats deep sequence models at this data size. |
| **Why NOT LSTM** | Trains slowly, needs GPU, overfits on small series, and is a black box — the "why" panel requires interpretability |

### Feature Set

| Feature | Source | Type |
|---------|--------|------|
| `price_lag_1d` | Prices table | Numeric |
| `price_lag_3d` | Prices table | Numeric |
| `price_lag_7d` | Prices table | Numeric |
| `price_lag_14d` | Prices table | Numeric |
| `price_direction_3d` | Computed | Numeric (% change) |
| `price_direction_7d` | Computed | Numeric (% change) |
| `rolling_volatility_7d` | Computed | Numeric |
| `days_since_last_report` | Prices table | Integer — **data quality feature** |
| `coverage_ratio_14d` | Computed | Float (0-1) — **data quality feature** |
| `is_outlier` | Computed (IQR) | Boolean — **data quality feature** |
| `temp_mean` | Weather table | Numeric |
| `precip_sum` | Weather table | Numeric |
| `humidity_mean` | Weather table | Numeric |
| `day_of_week` | Date | Categorical |
| `month` | Date | Categorical |

### Evaluation

| Metric | Against | Purpose |
|--------|---------|---------|
| **Direction hit-rate** | Persistence baseline (~60%) | Must beat this to be useful |
| **₹/quintal realised** | Harvest-day-sale baseline | The headline number |
| **Correct abstention rate** | Ground truth sparse coverage | Measures system honesty |

### Walk-Forward Backtest

```
Training window: sliding, e.g. 180 days
Test window: next 3 days
Step: 1 day forward
NO future rows in any feature window (no lookahead leakage)
```

### Abstention Gate

```python
if coverage_ratio_14d < THRESHOLD:  # e.g. 0.4 (tuned during hackathon)
    return CANNOT_ADVISE, fallback_to_nearest_reliable_mandi
```

---

## Infrastructure

| Component | Hackathon Setup |
|-----------|----------------|
| **Server** | Single machine / laptop |
| **Container** | Docker (optional) |
| **GPU** | Not needed |
| **Training time** | Seconds on CPU |
| **External dependencies** | 1 critical (data.gov.in) — mitigated by cached snapshot |
| **Offline capability** | Full demo works from cache if network fails |

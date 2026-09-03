# TASK CONTRACT: PURVA (Frontend Feature Engineer — Markets & Trust Vertical)

## 1. Role & Identity
- **Name**: Purva
- **Title**: Frontend Feature Engineer
- **Core Domain**: Feature Vertical 2 — Markets & Trust: Candidate Mandis Shortlist (`/markets`), Logistics & Cost Settings (`/settings`), and Empirical Backtest Evidence (`/backtest`).

---

## 2. Mission
Deliver the trust, verification, and logistics customization experience for MandiMitra:
1. Build the **Nearby Markets Shortlist Screen** (`/markets`): Display shortlisted mandis within the search radius, geodesic road distance, and data quality tier tags (`GOOD`, `MODERATE`, `POOR`).
2. Build the **Logistics & Cost Settings Screen** (`/settings`): Allow farmers to customize transport cost (default: ₹3.00/km/qtl), storage/holding depreciation (default: ₹10.00/day/qtl), and search radius (default: 100 km). Persist settings in `store.costConfig`.
3. Build the **Backtest Evidence Screen** (`/backtest`): Display honest empirical metrics from single-holdout evaluation (tested market-days, net gain vs baseline, directional accuracy %, decision coverage %) with mandatory CEDA citation notice and logo.
4. Seamlessly integrate with `/src/frontend/api-client` and `/src/frontend/state/store.ts`.

---

## 3. Physical Ownership Boundaries

### 100% Owned Directories
- `/src/frontend/features/markets/` (Nearby markets shortlist view & items)
- `/src/frontend/features/settings/` (Logistics & cost configuration view)
- `/src/frontend/features/backtest/` (Empirical backtest evidence view)

### Files Purva May Modify
- `/src/frontend/features/markets/*.ts`
- `/src/frontend/features/settings/*.ts`
- `/src/frontend/features/backtest/*.ts`

### Files Purva Must NOT Modify
- `/src/frontend/styles/*` (Owned by Janhvi; use existing CSS tokens & classes)
- `/src/frontend/components/*` (Owned by Janhvi; import and mount, do not edit)
- `/src/frontend/shell/*` (Owned by Janhvi; do not modify router or navigation)
- `/src/frontend/features/entry/*` (Owned 100% by Tanmay)
- `/src/frontend/features/decision/*` (Owned 100% by Tanmay)
- `/src/frontend/features/evidence/*` (Owned 100% by Tanmay)
- `/src/backend/*`, `/src/core/*`, `/src/contracts/*` (Owned by Amay)

---

## 4. Dependencies & Downstream Consumers
- **Upstream Inputs**:
  - Contracts in `/src/contracts/domain.ts` and `/src/contracts/api.ts`.
  - Shared UI components from Janhvi: `renderQualityBadge()`, `renderStatCard()`.
  - Shared state store from Janhvi: `store`.
  - API client boundary: `apiClient.getNearbyMarkets()`, `apiClient.getBacktest()`.
  - Development test fixtures: `DEV_FIXTURE_BACKTEST`, `DEV_FIXTURE_EVALUATION_WAIT`.
- **Downstream Consumers**:
  - The farmer / judge: Verifies market shortlist, adjusts cost parameters, and reviews backtest integrity.

---

## 5. Shared Contracts & Interfaces
Purva consumes:
- `Market`: `{ id, name, state, district, lat, lon, estimatedRoadDistanceKm }`
- `DataQualityAssessment`: `{ tier, daysSinceLastReport, coverage30d, missingDays }`
- `BacktestResult`: `{ commodity, modelVersion, evaluatedDays, avgNetRealisation, baselineNetRealisation, netGainVsBaseline, directionalAccuracy, coverage, evaluatedPeriod }`
- `BacktestResponse`: `{ result, citationNotice }`

---

## 6. Exact Task Breakdown & File Map

| Task ID | Screen / Component | File Path | Detailed Description |
|---|---|---|---|
| **P-1** | Markets Shortlist Screen | `/src/frontend/features/markets/MarketsView.ts` | Displays candidate mandis sorted by distance. Shows market name, district, estimated road km, and mounts Janhvi's `renderQualityBadge()`. Highlights the recommended market. Includes quick-link to Settings. |
| **P-2** | Settings Screen | `/src/frontend/features/settings/SettingsView.ts` | Interactive form allowing farmers to override: (1) Transport tariff (₹/km/qtl), (2) Storage holding cost (₹/day/qtl), (3) Maximum driving radius (km). Validates positive numbers, updates `store.costConfig`, and triggers recalculation. |
| **P-3** | Backtest Screen | `/src/frontend/features/backtest/BacktestView.ts` | Calls `apiClient.getBacktest(commodity)`. Renders 4 `StatCard` atoms: Tested Market-Days, Net Gain vs Baseline, Directional Accuracy %, and Decision Coverage %. Explains methodology and renders mandatory CEDA citation notice. |

---

## 7. UI Workflows & Edge Cases
1. **Mandatory CEDA Citation Requirement**: Per CEDA terms of use, `/backtest` MUST display:
   > *"Data Source: CEDA Agri Market Data (CEDA-AMD), 2000-2023. Centre for Economic Data & Analysis, Ashoka University."*
2. **Zero Evaluation State in Markets View**: If navigated to before running an evaluation, display friendly empty state advising the farmer to select a crop on the Home screen.
3. **Settings Persistence**: Form inputs are initialized from `store.getState().costConfig`. Submitting updates the global store and redirects to Home (`#/`) so new evaluations use the updated parameters.
4. **Offline Backtest Fallback**: If backend API is not responding during development, gracefully render metrics using `DEV_FIXTURE_BACKTEST`.

---

## 8. Step-by-Step Implementation Order & Timeboxing (24-Hour Hackathon)

```
Hours 00:00 - 03:00  [COMPLETED] Phase 1-3: Contracts, Architecture, Scaffolding
Hours 03:00 - 06:00  Settings Screen: Form inputs, validation, store integration
Hours 06:00 - 09:00  Markets Screen: List layout, distance tags, QualityBadge integration
Hours 09:00 - 12:00  Backtest Screen: Mount StatCards, methodology explanation, CEDA citation notice
Hours 12:00 - 15:00  Integration Checkpoint 1: Test Markets & Backtest with DEV_FIXTURE_BACKTEST
Hours 15:00 - 18:00  Connect to live backend API (/api/backtest, /api/markets/nearby)
Hours 18:00 - 21:00  Integration Checkpoint 2: Verify custom cost settings change evaluation outputs
Hours 21:00 - 24:00  Final polish, typography tuning, presentation rehearsal
```

---

## 9. Definition of Done & Smoke Tests
1. Navigating to `http://localhost:3000/#/markets` renders candidate APMCs with correct distance indicators.
2. Changing Transport Cost from ₹3.00 to ₹5.00 in `#/settings` updates `store.costConfig` and impacts subsequent Net Realisation calculations.
3. Navigating to `#/backtest` fetches empirical results from `/api/backtest` and populates the 4 metric cards.
4. CEDA citation notice is visibly displayed at the bottom of the Backtest view.
5. All layout elements are fully responsive and styled according to `tokens.css`.

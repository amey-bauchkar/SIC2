# TASK CONTRACT: TANMAY (Frontend Feature Engineer — Decision & Evidence Vertical)

## 1. Role & Identity
- **Name**: Tanmay
- **Title**: Frontend Feature Engineer
- **Core Domain**: Feature Vertical 1 — Decision & Evidence: Crop/Location Entry (`/`), Primary Recommendation Screen (`/decision`), and Granular "Why?" Explanation Screen (`/evidence`).

---

## 2. Mission
Deliver the core farmer decision workflow from initial input to final actionable recommendation:
1. Build the **Crop & Location Entry Screen** (`/`): Commodity selector, farmer district/location entry, geodesic coordinate resolution, and evaluation trigger.
2. Build the **Primary Decision Screen** (`/decision`): Mount Janhvi's shared `DecisionCard`, display action (`SELL_TODAY` / `WAIT_n_DAYS` / `NO_RECOMMENDATION`), confidence tier, expected net gain, and navigation buttons.
3. Build the **Evidence ("Why?") Screen** (`/evidence`): Display the full algorithmic reasons, granular Net Realisation breakdown table (Day 0..3: Price $-$ Transport $-$ Holding $=$ Net Return), and data quality badges for evaluated mandis.
4. Seamlessly integrate with `/src/frontend/api-client` and `/src/frontend/state/store.ts`.

---

## 3. Physical Ownership Boundaries

### 100% Owned Directories
- `/src/frontend/features/entry/` (Crop & Location entry view & components)
- `/src/frontend/features/decision/` (Decision card view & action handlers)
- `/src/frontend/features/evidence/` (Evidence / "Why?" breakdown screen)

### Files Tanmay May Modify
- `/src/frontend/features/entry/*.ts`
- `/src/frontend/features/decision/*.ts`
- `/src/frontend/features/evidence/*.ts`

### Files Tanmay Must NOT Modify
- `/src/frontend/styles/*` (Owned by Janhvi; use existing CSS tokens & utility classes)
- `/src/frontend/components/*` (Owned by Janhvi; import and mount, do not edit)
- `/src/frontend/shell/*` (Owned by Janhvi; do not modify router or navigation)
- `/src/frontend/features/markets/*` (Owned 100% by Purva)
- `/src/frontend/features/settings/*` (Owned 100% by Purva)
- `/src/frontend/features/backtest/*` (Owned 100% by Purva)
- `/src/backend/*`, `/src/core/*`, `/src/contracts/*` (Owned by Amay)

---

## 4. Dependencies & Downstream Consumers
- **Upstream Inputs**:
  - Contracts in `/src/contracts/domain.ts` and `/src/contracts/api.ts`.
  - Shared UI components from Janhvi: `renderDecisionCard()`, `renderQualityBadge()`.
  - Shared state store from Janhvi: `store`.
  - API client boundary: `apiClient.evaluate()`.
  - Development test fixtures: `DEV_FIXTURE_EVALUATION_WAIT`, `DEV_FIXTURE_EVALUATION_ABSTAIN`.
- **Downstream Consumers**:
  - The farmer user: Navigates from `/` $\rightarrow$ `/decision` $\rightarrow$ `/evidence`.

---

## 5. Shared Contracts & Interfaces
Tanmay consumes:
- `EvaluateRequestBody`: `{ commodity, latitude, longitude, transportCostPerKmPerQtl?, storageCostPerDayPerQtl?, radiusKm? }`
- `EvaluateResponse`: `{ recommendation, evaluations, commodity, evaluatedAt, userParameters }`
- `Recommendation`: `{ action, market, confidence, expectedGainPerQtl, reasons }`
- `MarketEvaluation`: `{ market, dataQuality, netRealisationByDay }`

---

## 6. Exact Task Breakdown & File Map

| Task ID | Screen / Component | File Path | Detailed Description |
|---|---|---|---|
| **T-1** | Entry Screen | `/src/frontend/features/entry/EntryView.ts` | Form with dropdown for supported commodities (Onion, Tomato, Soyabean, Wheat, Gram), text input for district/location, submit button triggering `apiClient.evaluate()`. Manages loading state and error messaging. |
| **T-2** | Decision Screen | `/src/frontend/features/decision/DecisionView.ts` | Displays primary recommendation. Mounts Janhvi's `renderDecisionCard()`. Handles "Why This Decision?" click $\rightarrow$ navigates to `#/evidence`. Handles "Change Crop" click $\rightarrow$ navigates to `#/`. |
| **T-3** | Evidence Screen | `/src/frontend/features/evidence/EvidenceView.ts` | Comprehensive "Why?" screen. Renders: (1) Algorithmic rationale bullets, (2) Net Realisation breakdown table across days 0..3 showing price, transport deduction, holding cost, and net return, (3) Data quality assessment badges for candidate mandis. |

---

## 7. UI Workflows & Edge Cases
1. **Empty State / Direct Navigation**: If user navigates directly to `#/decision` or `#/evidence` without running an evaluation, render a polite empty state with button: "Go to Crop Selection".
2. **Abstention State (`NO_RECOMMENDATION`)**: When backend abstains due to POOR data quality:
   - Decision screen shows red warning badge: "Cannot Recommend (Data Stale or Sparse)".
   - Primary reasons explicitly describe why data is untrustworthy.
   - Evidence screen displays quality badges showing exact coverage % and days since last report.
3. **Network Failure**: If `/api/evaluate` fails, display clear user feedback banner without crashing the UI.
4. **Zero Inline Calculation**: Tanmay's screens consume pre-computed values (`netRealisation`, `expectedGainPerQtl`) directly from `EvaluateResponse`. No financial arithmetic in presentation code.

---

## 8. Step-by-Step Implementation Order & Timeboxing (24-Hour Hackathon)

```
Hours 00:00 - 03:00  [COMPLETED] Phase 1-3: Contracts, Architecture, Scaffolding
Hours 03:00 - 06:00  Entry Screen: Form styling, crop dropdown, location defaults, validation
Hours 06:00 - 09:00  Decision Screen: Mount DecisionCard, wire store integration, test with DEV_FIXTURES
Hours 09:00 - 12:00  Evidence Screen: Build Net Realisation table, format rationale list, mount QualityBadges
Hours 12:00 - 15:00  Integration Checkpoint 1: Verify complete Entry -> Decision -> Evidence flow with mock fixtures
Hours 15:00 - 18:00  Connect to live backend API (/api/evaluate)
Hours 18:00 - 21:00  Integration Checkpoint 2: Test live Onion/Tomato scenarios including Abstention
Hours 21:00 - 24:00  UX Polish, mobile touch optimization, presentation rehearsal
```

---

## 9. Definition of Done & Smoke Tests
1. Navigating to `http://localhost:3000/#/` renders the crop selection form.
2. Submitting "Onion" triggers `/api/evaluate`, updates `store.evaluationData`, and navigates to `#/decision`.
3. `#/decision` renders the recommendation card with correct action title and confidence badge.
4. Clicking "Why This Decision?" navigates to `#/evidence` and displays the Net Realisation table.
5. All amounts are formatted in INR currency (`₹X.XX/qtl`).
6. Abstention scenario displays honest refusal reasons with zero UI errors.

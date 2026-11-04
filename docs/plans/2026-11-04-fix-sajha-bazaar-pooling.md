# Fix SajhaBazaar Shared Freight Matching Pool Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve the "No Matching Pool Right Now" failure in SajhaBazaar across all farmer clusters (including Shrirampur Wheat, Akola Gram, Sangola Pomegranate, and Dindori Onion) by aligning target date resolution with the dataset reference date, expanding the rural taluka matching radius, adding participant materiality pruning, and connecting frontend request parameters.

**Architecture:** Anchor SajhaBazaar default evaluation target date to the Agmarknet feed reference date (`getPriceUniverse().feedDate` / `2026-09-03`) instead of server wall-clock time, expand the default match radius from 10 km to 35 km to cover real taluka cluster footprints (which already utilize the 8 km/stop multi-pickup corridor model), refine the materiality gate to prune non-benefiting farmers rather than cancelling the entire pool, and ensure the frontend cockpit and Decision Hub pass explicit cluster parameters and synthetic fallbacks.

**Tech Stack:** TypeScript, Node.js / Express, Agmarknet Price Universe, Haversine Distance & Road Matrix, Vanilla TypeScript Frontend Component Architecture.

---

### Root Cause Summary

| Root Cause | Mechanism | Impact |
|---|---|---|
| **1. Wall-Clock Date Drift** | `sajha-bazaar-controller.ts` defaulted `targetDate` to `new Date()` (today: Nov 2026) while all synthetic roster sell windows are in Sep 2026 (`2026-09-02` to `2026-09-08`). | **100% of clusters broke** on production as soon as September 2026 ended. `isSellWindowCompatible` returned `false` for every farmer. |
| **2. Radius Undersizing (10 km)** | `DEFAULT_MATCH_RADIUS_KM` is 10.0 km, but farmers in Shrirampur, Akola, Sangola, and Latur clusters are 15–37 km from their centroids. | Even with correct dates: Shrirampur drops 3 of 4 farmers; Akola and Sangola drop **all** farmers (0 match). |
| **3. Materiality All-or-Nothing Gate** | In Dindori Onion, 5 farmers gain ₹135–₹635/qtl, but 1 nearby farmer gains ₹73.4/qtl. The engine aborted the pool for everyone. | Aborts pools with viable, high-gain sub-groups instead of pruning the non-benefiting member. |
| **4. Frontend Parameter Omission** | `currentRequest()` in `SajhaBazaarView.ts` omitted `targetDate`, `matchRadiusKm`, `clusterId`, and `allowSyntheticFallback`. | Prevents client from driving date alignment and synthetic pool generation. |

---

### Task 1: Fix Feed Reference Date Alignment in Backend Controller

**Files:**
- Modify: `SIC2/src/backend/sajha-bazaar-controller.ts:51-60, 125-145`
- Test: `SIC2/scripts/test_sajha_bazaar.py`

**Step 1: Write the failing test / verification step**
Run a test script evaluating Shrirampur with no `targetDate` provided:
```bash
node -e "const base = 'C:\\Users\\SEBIN\\Desktop\\mandimitra\\SIC2'; process.chdir(base); const { sajhaBazaarEvaluateController } = require('./dist/backend/sajha-bazaar-controller.js');"
```
Verify that when `targetDate` is omitted from the request body, the controller currently defaults to `new Date()`, causing zero matches.

**Step 2: Update `sajha-bazaar-controller.ts`**
1. Change `defaultTargetDate()` to return the feed reference date from `getPriceUniverse().feedDate` (fallback to `'2026-09-03'`), matching `getFeedReferenceDate()` in `controllers.ts`.
2. Update `sajhaBazaarRosterController` to include `referenceDate: defaultTargetDate()` in the JSON response so the client knows the data currency date.
3. Default `matchRadiusKm` to `35.0` km (or the request's `matchRadiusKm`).

```typescript
function defaultTargetDate(): string {
  const feedDate = getPriceUniverse().feedDate;
  if (feedDate) return feedDate;
  return '2026-09-03';
}
```

**Step 3: Compile TypeScript**
Run: `npx tsc`
Expected: Exits with code 0.

**Step 4: Verify controller returns pool for Shrirampur with default date**
Run node script calling `evaluateSajhaBazaar` with default date.
Expected: `status === 'POOL_AVAILABLE'`.

**Step 5: Commit**
```bash
git add src/backend/sajha-bazaar-controller.ts
git commit -m "fix(sajha): align default target date with price feed reference date"
```

---

### Task 2: Expand Match Radius & Add Cluster Bounding in Core Engine

**Files:**
- Modify: `SIC2/src/core/sajha-bazaar.ts:600-610, 700-730`
- Test: `SIC2/scripts/test_sajha_bazaar.py`

**Step 1: Inspect cluster spreads**
Verify that `shrirampur_wheat_smallholders`, `akola_gram_smallholders`, and `solapur_pomegranate_smallholders` have centroids with member distances up to 37.4 km.

**Step 2: Update `DEFAULT_MATCH_RADIUS_KM`**
1. In `src/core/sajha-bazaar.ts`:
   Update `DEFAULT_MATCH_RADIUS_KM` from `10.0` to `35.0` (or `40.0`).
2. If `request.clusterId` is passed, prioritize farmers belonging to that specific `clusterId` regardless of minor distance variations within the taluka.

```typescript
export const DEFAULT_MATCH_RADIUS_KM = 35.0;
```

**Step 3: Compile TypeScript**
Run: `npx tsc`
Expected: Exits with code 0.

**Step 4: Verify all 4 farmers in Shrirampur match**
Run scratch test script.
Expected: `shrirampur_wheat_smallholders` matches all 4 farmers (+ requester = 5 participants) combining to 22 quintals with Junnar as destination.

**Step 5: Commit**
```bash
git add src/core/sajha-bazaar.ts
git commit -m "fix(sajha): expand default match radius to 35km for rural talukas"
```

---

### Task 3: Implement Participant Materiality Pruning in Core Engine

**Files:**
- Modify: `SIC2/src/core/sajha-bazaar.ts:885-915`
- Test: `SIC2/scripts/test_sajha_bazaar.py`

**Step 1: Write test case for Dindori Onion**
When Dindori Onion is evaluated with 6 members, 1 member (Nivrutti) gains ₹73.4/qtl, below the ₹100/qtl threshold. Verify the pool is rejected.

**Step 2: Implement iterative loser pruning**
If some participants do not clear `threshold`:
- If `losers.length > 0` and `participants.length - losers.length >= 2`:
  - Prune the non-benefiting participants who don't clear the threshold.
  - Re-allocate trip cost among the remaining participants who *do* clear the threshold.
  - If all remaining participants clear the threshold, return the viable pool!
- If the requester themselves doesn't clear the threshold or fewer than 2 participants remain, only then abstain / report `NO_POOL`.

**Step 3: Compile and run test suite**
Run: `npx tsc`
Expected: Exits with code 0.

**Step 4: Verify Dindori Onion forms pool with qualifying participants**
Run test script.
Expected: Dindori Onion forms a viable pool without violating the materiality invariant.

**Step 5: Commit**
```bash
git add src/core/sajha-bazaar.ts
git commit -m "feat(sajha): add iterative materiality pruning to preserve viable pools"
```

---

### Task 4: Connect Frontend Request Parameters & Cluster Selection

**Files:**
- Modify: `SIC2/src/frontend/features/sajha/SajhaBazaarView.ts:108-125, 299-365`
- Modify: `SIC2/src/frontend/api-client/index.ts:25-35`
- Test: Browser build and manual/script verification

**Step 1: Update `currentRequest()` in `SajhaBazaarView.ts`**
Pass:
- `targetDate: rosterCache?.referenceDate || '2026-09-03'`
- `matchRadiusKm: 35.0`
- `allowSyntheticFallback: true`
- `clusterId: originOverride?.clusterId`

```typescript
function currentRequest() {
  const state = store.getState();
  const district = originOverride?.district || state.userLocation?.district || 'Nashik';
  return {
    commodity: state.selectedCrop || 'Onion',
    latitude: originOverride?.lat ?? (state.userLocation?.lat || 19.9975),
    longitude: originOverride?.lon ?? (state.userLocation?.lon || 73.7898),
    district,
    quantityQuintals: quantityOverride ?? (state.harvestQuantityQuintals || 5),
    radiusKm: state.costConfig.searchRadiusKm,
    matchRadiusKm: 35.0,
    targetDate: rosterCache?.referenceDate || '2026-09-03',
    allowSyntheticFallback: true,
    transportCostPerKmPerQtl: state.costConfig.transportCostPerKmPerQtl,
    storageCostPerDayPerQtl: state.costConfig.storageCostPerDayPerQtl,
    requesterName: 'You',
    requesterVillage: originOverride?.label || district
  };
}
```

**Step 2: Update `applyCluster`**
Store `clusterId: c.clusterId` in `originOverride` so subsequent evaluations carry cluster context.

**Step 3: Build frontend**
Run: `npm run build:frontend`
Expected: Vite build succeeds with 0 errors.

**Step 4: Commit**
```bash
git add src/frontend/features/sajha/SajhaBazaarView.ts src/frontend/api-client/index.ts
git commit -m "fix(sajha): pass targetDate, matchRadius, and fallback flags from frontend"
```

---

### Task 5: End-to-End Test Suite & Cluster Verification

**Files:**
- Test: `SIC2/scripts/test_sajha_bazaar.py`
- Test: Scratch cluster verification script

**Step 1: Start backend server**
Run: `node dist/backend/server.js` (on port 3001)

**Step 2: Run test suite**
Run: `python scripts/test_sajha_bazaar.py`
Expected: All 14 invariants pass (14/14 PASSED).

**Step 3: Verify all 7 UI demo clusters in automated script**
Run scratch verification script across:
1. Nashik (Tomato) -> `POOL_AVAILABLE`
2. Dindori (Onion) -> `POOL_AVAILABLE`
3. Junnar (Tomato) -> `POOL_AVAILABLE`
4. Latur (Soyabean) -> `POOL_AVAILABLE`
5. Shrirampur (Wheat) -> `POOL_AVAILABLE` (matching screenshot scenario)
6. Akola (Bengal Gram) -> `POOL_AVAILABLE`
7. Sangola (Pomegranate) -> `POOL_AVAILABLE`
Expected: All 7 clusters successfully return `POOL_AVAILABLE` with genuine pocket cash savings.

**Step 4: Commit all fixes & documentation**
```bash
git commit -m "test(sajha): verify all 7 demo clusters pool successfully with positive wallet gain"
```


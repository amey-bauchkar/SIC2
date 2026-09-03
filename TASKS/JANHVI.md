# TASK CONTRACT: JANHVI (Frontend Lead — UI/UX, App Shell, Shared Component System)

## 1. Role & Identity
- **Name**: Janhvi
- **Title**: Frontend Lead & Design Systems Engineer
- **Core Domain**: Main UI/UX, Design System, CSS Token Architecture, Application Shell, Navigation & Routing, Reusable Component Primitives, Global Client State, and Frontend Integration Foundation.

---

## 2. Mission
Deliver a stunning, modern, responsive, and robust application foundation that:
1. Implements a curated agricultural design system in Vanilla CSS using custom properties (vibrant emeralds, harvest golds, slate neutrals, glassmorphic card elevations).
2. Provides the root layout container and responsive mobile-first navigation shell.
3. Provides a clean client-side hash router managing the 6 structural routes (`/`, `/markets`, `/decision`, `/evidence`, `/backtest`, `/settings`).
4. Manages the lightweight reactive global client store (`/src/frontend/state/store.ts`).
5. Establishes rock-solid, pure presentation UI primitives (`DecisionCard`, `QualityBadge`, `StatCard`) that consume domain contracts with zero business logic or API dependencies.
6. Empowers Tanmay and Purva to develop their feature verticals in complete independence.

---

## 3. Physical Ownership Boundaries

### 100% Owned Directories
- `/src/frontend/styles/` (All CSS tokens, reset rules, layout styles)
- `/src/frontend/shell/` (AppShell, Navigation, Hash Router)
- `/src/frontend/components/` (Shared visual components and primitives)
- `/src/frontend/state/` (Client reactive state store)
- `/src/frontend/index.html` (Root HTML document)
- `/src/frontend/main.ts` (Client bootstrapping script)
- `/src/frontend/dev-server.js` (Local frontend dev runner & reverse proxy)

### Files Janhvi May Modify
- `/src/frontend/styles/*.css`
- `/src/frontend/shell/*.ts`
- `/src/frontend/components/*.ts`
- `/src/frontend/state/*.ts`
- `/src/frontend/index.html`
- `/src/frontend/main.ts`
- `/src/frontend/dev-server.js`

### Files Janhvi Must NOT Modify
- `/src/contracts/*` (Owned by Amay; Janhvi requests changes via Contract Change Event)
- `/src/backend/*` (Owned by Amay)
- `/src/core/*` (Owned by Amay)
- `/src/data-pipeline/*` (Owned by Amay)
- `/src/frontend/features/entry/*` (Owned 100% by Tanmay)
- `/src/frontend/features/decision/*` (Owned 100% by Tanmay)
- `/src/frontend/features/evidence/*` (Owned 100% by Tanmay)
- `/src/frontend/features/markets/*` (Owned 100% by Purva)
- `/src/frontend/features/settings/*` (Owned 100% by Purva)
- `/src/frontend/features/backtest/*` (Owned 100% by Purva)

---

## 4. Dependencies & Downstream Consumers
- **Upstream Inputs**:
  - Domain, API, and Frontend contracts defined in `/src/contracts/`.
  - Development test fixtures in `/src/frontend/fixtures/` for UI preview and component testing.
- **Downstream Consumers**:
  - **Tanmay**: Mounts `renderDecisionCard()` and uses CSS tokens/classes in Entry, Decision, and Evidence screens.
  - **Purva**: Mounts `renderQualityBadge()`, `renderStatCard()`, and uses CSS tokens/classes in Markets, Settings, and Backtest screens.

---

## 5. Shared Contracts & Interfaces
Janhvi develops against:
- `src/contracts/frontend.ts`:
  - `AppRoute`: `'/' | '/markets' | '/decision' | '/evidence' | '/backtest' | '/settings'`
  - `AppState`: Current route, selected crop, user location, cost configuration, evaluation data, loading/error states.
  - `DecisionCardProps`: Recommendation action, confidence, market name, net gain, callback buttons.
  - `QualityBadgeProps`: Assessment tier (`GOOD` | `MODERATE` | `POOR`), 30-day coverage %, latency days.
  - `StatCardProps`: Metric label, numerical value, subtext, visual variant.

---

## 6. Exact Task Breakdown & File Map

| Task ID | Component | File Path | Detailed Description |
|---|---|---|---|
| **J-1** | Design System Tokens | `/src/frontend/styles/tokens.css` | Define color palette (`--color-brand-primary`, status colors, surface neutrals), typography scale, spacing tokens, elevations, and transition timing. |
| **J-2** | Global Layout & Theme | `/src/frontend/styles/main.css` | CSS resets, mobile-first responsive container (`max-width: 640px`), card elevations, button variants (`btn-primary`, `btn-outline`), form input styles. |
| **J-3** | Client State Store | `/src/frontend/state/store.ts` | Reactive pub/sub store holding session state, crop selection, coordinates, cost configuration, and evaluation payload. |
| **J-4** | Client Hash Router | `/src/frontend/shell/Router.ts` | Listens to `hashchange` events, synchronizes with `store.currentRoute`, mounts target view, updates active navigation styling. |
| **J-5** | Main Application Shell | `/src/frontend/shell/AppShell.ts` | Root layout holding header, brand logo, navigation links (`Home`, `Markets`, `Backtest`, `Settings`), router viewport, and footer. |
| **J-6** | QualityBadge Primitive | `/src/frontend/components/QualityBadge.ts` | Renders a color-coded status badge (`GOOD`, `MODERATE`, `POOR`) with optional detailed reporting stats. |
| **J-7** | DecisionCard Primitive | `/src/frontend/components/DecisionCard.ts` | Hero presentation card rendering action (`SELL_TODAY` / `WAIT_n_DAYS` / `NO_RECOMMENDATION`), confidence, market name, net gain, and primary reasons. |
| **J-8** | StatCard Primitive | `/src/frontend/components/StatCard.ts` | Visual metric card for displaying backtest accuracy, gains, or tested market-days. |
| **J-9** | Client Entrypoint | `/src/frontend/main.ts` | Initializes AppShell and starts Router on `DOMContentLoaded`. |
| **J-10** | Dev Server & Proxy | `/src/frontend/dev-server.js` | Zero-dependency Node server serving frontend static files on port 3000 and reverse-proxying `/api` requests to backend on port 3001. |

---

## 7. Design & UI Foundation Invariants
1. **Zero Business Logic in Visual Components**: Components accept pure props; they do not perform arithmetic, distance factoring, or price calculations.
2. **Zero API Calls in Shared Components**: Shared components do not fetch data; they receive typed data from parent feature views.
3. **No Scattered Design Values**: All colors, margins, fonts, and shadows MUST reference CSS custom properties defined in `tokens.css`.
4. **Rich Aesthetic Standard**: Modern typography (Inter), glassmorphic card elevations, smooth CSS transitions on hover, clear contrast ratios for outdoor farmer smartphone readability.

---

## 8. Error Handling & Edge Cases
- **Invalid Route / Unknown Hash**: Router defaults to `/` (Home Entry view).
- **Global Loading State**: AppShell displays a sleek top-progress bar or card skeleton when `store.isLoading` is true.
- **Global Error Banner**: Displays user-friendly error message when `store.errorMessage` is populated.

---

## 9. Step-by-Step Implementation Order & Timeboxing (24-Hour Hackathon)

```
Hours 00:00 - 03:00  [COMPLETED] Phase 1-3: Contracts, Architecture, Scaffolding
Hours 03:00 - 06:00  CSS Tokens & Global Styles (tokens.css, main.css)
Hours 06:00 - 09:00  Shared Component System: QualityBadge, DecisionCard, StatCard
Hours 09:00 - 12:00  Client Store & Hash Router wiring across all 6 route stubs
Hours 12:00 - 15:00  Integration Checkpoint 1: Verify Shell & components with Tanmay & Purva using DEV_FIXTURES
Hours 15:00 - 18:00  Visual Polish: Animations, Responsive adjustments, contrast checks
Hours 18:00 - 21:00  Integration Checkpoint 2: End-to-end integration with live backend
Hours 21:00 - 24:00  Cross-browser verification, UI defect fixes, Demo Presentation Polish
```

---

## 10. Definition of Done & Smoke Tests
1. `npm run dev:frontend` serves on `http://localhost:3000` without console errors.
2. Navigation header links cleanly toggle between `#/'`, `#/markets`, `#/backtest`, and `#/settings`.
3. `renderDecisionCard` renders `WAIT_2_DAYS`, `SELL_TODAY`, and `NO_RECOMMENDATION` with correct status colors using `DEV_FIXTURE_EVALUATION_WAIT` and `DEV_FIXTURE_EVALUATION_ABSTAIN`.
4. Quality badge displays `GOOD` in green, `MODERATE` in amber, and `POOR` in red.
5. UI layout is fully responsive on mobile viewports (360px - 430px wide).

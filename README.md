# MandiMitra 🌾

> **Smart Crop Price Selling Decision Support System**  
> IGNITE 8.0 Hackathon — Problem Statement SIC 2

MandiMitra is a farmer-centric decision support application that assists growers in determining the optimal time and market to sell their harvest. Rather than presenting raw nominal prices, MandiMitra computes true **Net Realisation** (nominal price minus road-adjusted haulage costs and storage holding depreciation), enforces **Data Quality Tiering** to abstain when information is stale, and offers transparent, verifiable single-holdout backtesting.

---

## 👥 Team & Ownership

- **Amay (Team Lead)**: Backend REST services, algorithmic decision engine, v0/v1 forecasting, data quality tiering, historical pipeline integration, and backtest runner.
- **Janhvi (Frontend Lead)**: Application shell, responsive layout, CSS design token system, shared component primitives, and client-side routing.
- **Tanmay (Frontend Feature Engineer)**: Feature Vertical 1 — Crop & Location Entry (`/`), Decision Card (`/decision`), and Granular "Why?" Explanation Screen (`/evidence`).
- **Purva (Frontend Feature Engineer)**: Feature Vertical 2 — Market Shortlist & Quality Tiers (`/markets`), Cost Configuration (`/settings`), and Backtest Empirical Audits (`/backtest`).

---

## 🏛️ Core Architecture & Tech Stack

- **Frontend**: Vanilla TypeScript + Component-scoped Vanilla CSS design system + Semantic HTML5.
- **Backend**: Node.js + Express + TypeScript.
- **Data Sources**:
  - Live Mandi Prices: data.gov.in Agmarknet API (`Resource ID: 9ef84268-d588-465a-a308-a864a43d0070`).
  - Historical Prices & Arrivals: CEDA Agri-Market Data (CEDA-AMD, Ashoka University).
  - Geodesics: Earth Haversine $\times$ 1.35 Road Factor approximation.

---

## 📁 Repository Structure

```
/
├── docs/                     # Authoritative system documentation
│   ├── problem-statement.md  # Verbatim problem statement & domain analysis
│   ├── solution.md           # Ingested solution spec & capability mapping
│   └── architecture.md       # Complete architectural and algorithmic design
├── data/                     # Managed by parallel data track (DO NOT TOUCH)
│   ├── raw/                  # Raw exports from Agmarknet & CEDA
│   └── processed/            # Cleaned, standardized historical time-series
├── src/
│   ├── contracts/            # Canonical domain & API TypeScript interfaces
│   ├── config/               # System configuration & operational defaults
│   ├── core/                 # Pure mathematical & business logic engines
│   ├── data-pipeline/        # Ingestion, cleaning & alias resolution
│   ├── backend/              # Express REST controllers & external clients
│   └── frontend/             # Client application
│       ├── shell/            # App shell & routing
│       ├── styles/           # CSS design tokens & global themes
│       ├── components/       # Janhvi: Shared visual primitives
│       ├── state/            # Reactive client state management
│       ├── fixtures/         # Strongly-typed development test fixtures
│       └── features/         # Isolated feature verticals
│           ├── entry/        # Tanmay: Crop & location entry
│           ├── decision/     # Tanmay: Primary recommendation card
│           ├── evidence/     # Tanmay: "Why?" explanation screen
│           ├── markets/      # Purva: Market shortlist & quality badges
│           ├── settings/     # Purva: Cost & radius overrides
│           └── backtest/     # Purva: Real backtest performance display
├── TEAM-RULES.md             # Collaboration & contract protection protocols
├── .github/CODEOWNERS        # Strict physical ownership mappings
├── .env.example              # Environment variables template
└── package.json              # Project dependencies & launch scripts
```

---

## 🚀 Quickstart

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Update DATA_GOV_IN_API_KEY if testing live fetch
   ```

3. **Run Development Mode**:
   ```bash
   npm run dev
   ```
   - Backend runs on `http://localhost:3001`
   - Frontend runs on `http://localhost:3000`

---

## 🔒 Attribution Requirements

Per CEDA API Terms of Use, any chart, table, or visualization derived from CEDA data displays:
> *"CEDA Agri Market Data (CEDA-AMD), 2000-2023. Centre for Economic Data & Analysis, Ashoka University"*

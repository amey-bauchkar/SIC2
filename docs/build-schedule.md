# 24-Hour Build Schedule & Team Parallelization

---

## Team Assignments

| Member | Module | Owns |
|--------|--------|------|
| **Amey** | Core | Ingestion, normalisation, feature builder, direction model, abstention gate, API, integration |
| **Janhavi** | UI/UX | PWA, decision card, why-panel, backtest panel, multilingual strings, low-literacy visual language, voice output |
| **Purva** | Feature 1 — Net Realisation | Distance matrix, transport-cost model, multi-mandi ranking by ₹-in-hand, "best mandi" selection |
| **Tanmay** | Feature 2 — Evidence & Trust | Walk-forward backtest harness, baselines (harvest-day, persistence), metrics, data-quality scoring per mandi/commodity, abstention rationale text |

---

## Hour-by-Hour Schedule

### Phase 0: Setup (Hours 0–1)

| Time | Amey | Janhavi | Purva | Tanmay |
|------|------|---------|-------|--------|
| 0–1h | Freeze scope. Verify API key returns 200. Freeze the decision JSON contract. | Wireframe decision card | Confirm mandi lat/lon list | Confirm CEDA download works, check newest date |

**Gate:** By hour 1, the JSON contract is frozen. No changes after this without emergency consensus.

### Phase 1: Foundation (Hours 1–3)

| Time | Amey | Janhavi | Purva | Tanmay |
|------|------|---------|-------|--------|
| 1–3h | Repo, DB schema, API skeleton, ingestion job pulling real history to disk. Date normalisation (DD/MM/YYYY → ISO). | PWA shell against frozen JSON contract. Begin decision card design. | Pre-compute distance matrix (OSRM), cache it. | Load historical CSV, build train/test split. |

**Gate:** By hour 3, prices store is populated and a stub API returns the frozen JSON shape.

### Phase 2: Core Build — PARALLEL (Hours 3–8)

| Time | Amey | Janhavi | Purva | Tanmay |
|------|------|---------|-------|--------|
| 3–8h | Feature builder (price lags, weather, **missing-value flag, outlier flag**), direction classifier, abstention gate | Decision card, why-panel, i18n strings. **Decision card visually finished by hour 8.** | Transport-cost model, multi-mandi ₹-in-hand ranking | Walk-forward backtest harness + baselines (harvest-day, persistence) |

**Critical:** Amey ships a **dummy predictor** by hour 4 so Purva and Tanmay can integrate without blocking.

**Gate:** By hour 8, all four modules work independently. Decision card looks right at phone width from 3 metres.

### Phase 3: Integration (Hours 8–14)

| Time | Amey | Janhavi | Purva | Tanmay |
|------|------|---------|-------|--------|
| 8–14h | Integration behind the frozen contract. First end-to-end run on real data. Wire the backtest panel. | Wire real data into UI. Fix rendering bugs. | Hand off ranking API. Integration testing. Edge cases (no nearby mandi). | Hand off metrics API. Verify backtest numbers are reproducible. |

**Integration order:** Net-realisation first → backtest second → UI wiring third.

**Gate:** By hour 14, end-to-end works. The backtest exists and produces a number.

### Phase 4: Polish (Hours 14–18)

| Time | Amey | Janhavi | Purva | Tanmay |
|------|------|---------|-------|--------|
| 14–18h | Tune abstention threshold. Fix date-format and missing-day bugs. | Marathi/Hindi strings. Empty & error states. Voice output line. Offline fallback. | Edge cases (no nearby mandi, single mandi, all mandis stale). | Data-quality score per mandi/commodity. Verify backtest with different date ranges. |

**Gate:** By hour 18, **FEATURE FREEZE.** Cache the real demo snapshot.

### Phase 5: Hardening (Hours 18–22)

| Time | Amey | Janhavi | Purva | Tanmay |
|------|------|---------|-------|--------|
| 18–22h | **Freeze. Cache the real demo snapshot.** Rehearse with network unplugged, twice. Kill anything that breaks. | Visual polish ONLY. No new components. | Demo path testing. | Verify backtest numbers match across runs. |

**Rules:**
- ❌ No new features after hour 18
- ❌ No new dependencies
- ✅ Only bug fixes and polish
- ✅ Rehearse the 3-minute demo twice with network disconnected

### Phase 6: Presentation (Hours 22–24)

| Time | Amey | Janhavi | Purva | Tanmay |
|------|------|---------|-------|--------|
| 22–24h | Q&A prep (judge-qa.md answers). Hostile Q&A rehearsal. | Slides: problem → evidence → what exists → gap → live demo → backtest → limitations → roadmap | Slides support | Numbers for slides. Final backtest screenshot. |

---

## Parallelization Analysis

- **Parallelisable:** ~70% of the work
- **Module boundaries:** Clean. Purva's module takes `(origin, candidate_mandis, predicted_prices)` → ranked list. Tanmay's takes `(model, history)` → metrics. Neither touches the other's code.
- **Shared contracts:** One JSON decision object + one prices table schema. Frozen by hour 3.
- **Dependencies:** Purva and Tanmay both need the prices store (hour 3) and a stub model (hour 4) — Amey ships a dummy predictor early so neither blocks.
- **Integration points:** Hours 8–14, one module at a time.
- **Merge conflicts:** Low risk — four separate directories, one shared types file.
- **Sequential:** Ingestion → features → model (Amey's chain), and final demo hardening.

---

## Critical Path

```
Ingestion (h1-3) → Feature Builder (h3-5) → Direction Model (h5-8) → Integration (h8-14) → Demo (h18+)
                                                                          ↑
                    Stub Predictor (h4) ──→ Purva integrates (h8-14) ─────┘
                                       ──→ Tanmay integrates (h8-14) ────┘
                    Janhavi: UI parallel from h1 against frozen contract ──┘
```

---

## Scope Explosion Prevention

| Risk | Mitigation |
|------|-----------|
| "Let's add a chatbot" | **NO.** Every hour on a chatbot is an hour not on the backtest. |
| "Let's add user auth" | **NO.** No auth, no login, no accounts. |
| "Let's support 10 commodities" | **NO.** 3 commodities max. Pick after checking data coverage. |
| "Let's add notifications" | **NO.** Not in 24 hours. |
| "The model isn't good enough, let's try LSTM" | **NO.** Report the honest number. A modest edge, correctly measured, beats a suspicious one. |
| "Let's make the UI fancier" | Only if the decision card, why-panel, and backtest panel are done. |

**Rule:** Freeze scope at hour 3. Refuse additions after hour 14. Treat every "what if we also..." as a threat to the backtest.

---

## Finishing Probability: HIGH

- Shorter critical path than FSD 2
- Narrower statement scope (sell/wait binary)
- Five subsystems in FSD 2 vs one coherent pipeline here
- The realistic failure mode is scope creep, not technical impossibility

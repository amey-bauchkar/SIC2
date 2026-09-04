# MandiMitra — Smart Crop Price Selling Decision Support System

**Problem Statement:** SIC 2 — IGNITE 8.0, SVKM Shri Bhagubhai Mafatlal Polytechnic & CoE  
**Event:** 24-hour hackathon · 3–4 September 2026 · Vile Parle, Mumbai  
**Team:** Amey (Architecture/Backend/AI-ML) · Janhavi (UI-UX) · Purva (Feature 1) · Tanmay (Feature 2)

---

## What Is MandiMitra?

A **decision-support system** that tells a farmer: **Sell today, or wait? At which mandi? For how many more rupees in hand after transport?**

It is NOT a price chart. It is NOT an LSTM prediction dashboard. It is a **net-realisation decision engine with calibrated abstention** — it optimises ₹-in-hand after transport cost, knows when Agmarknet's data is too thin to advise, and says so openly.

## Repository Structure

```
docs/
├── problem-statement.md          # Full problem statement context & analysis
├── data-sources.md               # All verified data sources with API details
├── competitors.md                # Existing solutions & gap analysis
├── evidence.md                   # Statistical evidence & academic references
├── differentiation.md            # What makes our approach unique
├── architecture.md               # Technical architecture & stack decisions
├── build-schedule.md             # 24-hour build timeline & team split
├── demo-script.md                # 3-minute demo flow
├── judge-qa.md                   # 18 anticipated judge questions with answers
├── risks-and-mitigations.md      # Red team analysis & mitigation strategies
├── known-limitations.md          # Honest limitations to disclose
├── mandi-rush-forecast.md        # Bhed Vivek: predicted mandi crowd (replaces the guess + hardcoded PCS table)
├── pre-hackathon-checklist.md    # Pre-event preparation tasks
research/
├── FSD2_vs_SIC2_Head_to_Head.md  # Original comparison analysis
└── IGNITE_8_PS_Selection_Report.md # Original selection report
```

## Core Thesis

> Price **display** is solved. Transport-adjusted, uncertainty-aware, **evaluated** decision-making is not — and no shipped product publishes an accuracy number anyone can audit.

## Key Differentiators

1. **Net realisation, not price** — rank mandis by ₹-in-hand after transport
2. **Data-quality-aware modelling** — missing values and outliers as model features
3. **Calibrated abstention** — refuses to advise when data is too sparse
4. **Direction with confidence** — not point prediction
5. **A backtested rupee number** — verifiable, on real held-out data
6. **A predicted mandi crowd** — per-mandi, per-day arrival-pressure forecast from live outlet
   scarcity, measured yard absorption, the published harvest calendar and a live rainfall forecast,
   so the farmer knows whether to expect a queue *before* loading the trolley
   (see [docs/mandi-rush-forecast.md](docs/mandi-rush-forecast.md))

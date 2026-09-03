# Problem Statement — SIC 2: MandiMitra

## Official Problem Statement

**ID:** SIC 2  
**Domain:** Social Impact Challenges (SIC)  
**Title:** MandiMitra — Smart Crop Price Selling Decision Support System  
**Event:** IGNITE 8.0 — SVKM Shri Bhagubhai Mafatlal Polytechnic & CoE  
**Format:** 24-hour hackathon (18h build + 6h evaluation) · 4 members · 3 September 2026

---

## Problem Context

### The Decision Farmers Face

A farmer has harvested produce. They face a binary decision with compound variables:

1. **SELL TODAY** at the nearest mandi at today's quoted price, OR
2. **WAIT** 2–3 days hoping for a better price — risking spoilage, storage cost, and further decline

Compounding this:
- **Which mandi?** The nearest may not offer the best net return after transport cost
- **Is today's price representative?** Some mandis haven't reported in days
- **How confident should they be?** No existing tool tells them

### Why This Matters

- Sale price is the **primary determinant of crop income** for a smallholder
- The decision recurs **every harvest cycle** with a window of days
- The consequence of a bad decision is **distress selling** into a depressed local rate, with knock-on effects on debt servicing
- This affects a sector with **well-documented agrarian distress**

### The Gap

**Price DISPLAY is solved** — comprehensively, by the government (Agmarknet, Kisan Suvidha, eNAM).

**Price DECISION-MAKING is not:**
- Government apps stop at displaying a number
- No app converts a price into a **transport-adjusted, confidence-scored sell/wait/where recommendation**
- No shipped competitor publishes an **accuracy claim** anyone can check
- The one consumer app making a "sell or wait" claim publishes no methodology

---

## Target Users

### Primary User
- Small and marginal farmers with harvested produce and a sell-or-hold decision
- Plus the household member who actually operates the phone

### Secondary Users
- **FPOs (Farmer Producer Organisations):** Negotiating on behalf of members — the better adoption wedge
- **Village aggregators:** Making the same decision for collections
- **Agri extension officers:** Advising farmers on market timing
- **Commission agents (arthiyas):** As a check on quoted rates

### Stakeholders
- **DMI / Agmarknet:** Data provider
- **APMC mandis:** Data reporters
- **Transporters:** Whose cost determines whether a "better" mandi is actually better

---

## Current Farmer Workflow

1. Ask neighbours and the local trader about today's rates
2. Or take the produce to the nearest mandi on harvest day and accept the rate offered
3. Some check Kisan Suvidha or a portal and read a single number — with no context on whether that number is reliable, whether the transport to a farther mandi nets more, or whether waiting would help

---

## What We Are Building

A system that outputs a **decision**, not a number:

```
INPUT:  Commodity + Location + Quantity
OUTPUT: "WAIT 2 DAYS · sell at Lasalgaon · +₹X/quintal after transport · confidence: medium"
        + Why: trend direction, weather feature, distance cost, data-quality note
        OR
        "CANNOT ADVISE — Mandi X has not reported in 9 days. Nearest reliable: Mandi Y."
```

### Core Capabilities
1. **Net-realisation ranking** — rank mandis by ₹-in-hand = expected modal price − transport cost/quintal
2. **Direction classification** — up/flat/down over 2–3 day horizon with confidence
3. **Data-quality gate** — abstain when data is too sparse
4. **Walk-forward backtest** — prove the advice on real held-out history
5. **Low-literacy UX** — three colours, one number, voice output in Marathi/Hindi

### What We Are NOT Building
- User accounts and login
- SMS/IVR gateway
- Crop disease detection
- Chatbot
- Marketplace/trading
- Admin dashboards
- Notifications infrastructure
- More than 3 commodities

---

## Scoring Context

### Within the Deck (10 Problem Statements)

| Rank | PS ID | Score /100 | Status |
|------|-------|-----------|--------|
| **1** | **SIC 2 — MandiMitra** | **84.7** | ✅ CHOSEN |
| 2 | FSD 2 — Civic Issue Reporting | 64.8 | ❌ Rejected (BMC MARG incumbent + no real data) |
| 3 | AIM 2 — Audit Anomaly Detection | 62.4 | ❌ Rejected (no accessible Indian SME data) |
| 4 | SIC 1 — CrisisConnect | 60.0 | ❌ Rejected (no real data, COVID-era prior art) |
| 5 | FSD 1 — Gig Worker Identity | 56.8 | ❌ Rejected (no platform APIs exist) |
| 6 | FSD 4 — Code Mafia (game) | 56.4 | ❌ Rejected (not a 24h build) |
| 7 | AIM 3 — Misinformation Detection | 56.3 | ❌ Rejected (most saturated hackathon PS) |
| 8 | SIC 3 — CareerMitra | 52.5 | ❌ Rejected (LLM-wrapper risk) |
| 9 | FSD 3 — Appointment Queue | 50.5 | ❌ Rejected (CRUD + timer, no gap) |
| 10 | AIM 1 — Career Counselling | 47.2 | ❌ Rejected (AI is decorative) |

### Head-to-Head vs Runner-Up (FSD 2)

**Final Score: SIC 2 — 82.0 vs FSD 2 — 56.5** (gap widened after MyBMC MARG discovery)

| Criterion | Weight | SIC 2 | FSD 2 |
|-----------|--------|-------|-------|
| Problem severity | 10% | 9 | 8 |
| Real data availability | 15% | **9** | **3** |
| API / integration reliability | 10% | 7 | 7 |
| Existing-solution gap | 15% | **7** | **4** |
| 24-hour technical feasibility | 10% | 9 | 6 |
| Differentiation potential | 10% | 7 | 5 |
| Demo potential | 10% | 9 | 8 |
| Measurable impact | 5% | **9** | **4** |
| Team fit | 5% | 9 | 8 |
| Judge appeal | 5% | 8 | 6 |
| Reliability / failure risk | 5% | 8 | 6 |

### Why FSD 2 Was Rejected

1. **MyBMC MARG** — launched 22 April 2026 in Mumbai (same city as judges): 114 complaint categories, geo-tagged photos, real-time tracking, field staff "after" photo upload, ward-wise analytics dashboards. In June 2026 BMC merged Pothole QuickFix into it.
2. **Zero real data** — BMC does not publish complaint data (RTI required). Every complaint in the demo would be fabricated, violating the team's zero-mock-data constraint.
3. **Judges may have the app on their phone** — the event is in Vile Parle, Mumbai.

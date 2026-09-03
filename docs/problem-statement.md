# MandiMitra — Problem Statement

## 1. Problem Metadata

| Field | Value |
|---|---|
| **Problem ID** | SIC 2 |
| **Title** | MandiMitra – Smart Crop Price Selling Decision Support System |
| **Organization / Track** | IGNITE 8.0 |
| **Hackathon Duration** | 24 hours |
| **Track Profile** | Data-driven agricultural decision support; web-based full-stack + AI/ML |

---

## 2. Source Problem Statement (Verbatim)

> SIC 2 MandiMitra – Smart Crop Price Selling Decision Support System
>
> Develop a farmer-friendly crop price decision-support system that helps farmers make informed decisions about when and where to sell their produce by providing reliable and timely mandi price information. The platform should allow farmers to select their crop and nearby market, retrieve current and historical market prices from reliable sources such as Agmarknet, analyze recent price trends, and present a simple actionable recommendation such as "Sell Today" or "Wait 2–3 Days," helping farmers reduce dependence on middlemen, improve price awareness, and potentially increase their returns.

---

## 3. Problem Understanding

### 3.1 SOURCE-CONFIRMED FACTS

These are directly stated in the problem statement text:

1. The system is a **crop price decision-support system** — not a marketplace, not a trading platform, not a dashboard.
2. The system must be **farmer-friendly** — this is the first adjective used, signaling that usability for non-technical users is a primary constraint.
3. The system helps with **two decisions**: _when_ to sell and _where_ to sell.
4. It must provide **reliable and timely mandi price information** — reliability is explicitly called out.
5. Farmers should be able to **select their crop** — user-initiated, not auto-detected.
6. Farmers should be able to select **nearby market** — geographic proximity matters, not just any market.
7. The system must **retrieve current and historical market prices** — both temporal dimensions are required.
8. The data source must be **reliable** — "reliable sources such as Agmarknet" is named as a reference.
9. The system must **analyze recent price trends** — not just display raw prices.
10. The output must be a **simple actionable recommendation** — "Sell Today" or "Wait 2–3 Days" are the exemplars.
11. Goals: **reduce dependence on middlemen**, **improve price awareness**, **potentially increase returns**.

### 3.2 RESEARCH-VERIFIED FINDINGS

These come from domain research into Indian agricultural markets:

1. **Mandi system structure:** Indian agricultural produce is sold through regulated Agricultural Produce Market Committees (APMCs). Each mandi reports daily prices (min, max, modal) and arrival quantities to the Directorate of Marketing & Inspection (DMI), which feeds the AGMARKNET portal.
2. **Data availability:** Real mandi price data is publicly available via data.gov.in (REST API), CEDA Ashoka (historical + arrivals), and Kaggle mirrors. Data quality varies — mandis don't report every day, naming is inconsistent, outliers from manual entry are common.
3. **Price ≠ decision:** Showing a farmer the raw modal price at a market is not a decision. The farmer needs to know _net_ value after accounting for transport cost, waiting/storage cost, and data reliability. This is the gap in existing apps.
4. **Middleman information asymmetry:** Middlemen (commission agents / arthiyas) typically have better price information across markets than individual farmers. The system directly addresses this asymmetry.
5. **Geographic constraints:** Farmers cannot practically sell at distant mandis — transport cost, perishability, and road access limit practical market radius.
6. **Temporal constraints:** Agricultural produce (especially perishables) has a limited window for sale. "Wait 5 days" may not be viable for many crops.

### 3.3 INFERRED ASSUMPTIONS

These are reasonable inferences not directly stated:

1. The system is **web-based** (implied by "platform", hackathon context, and team composition being frontend-heavy).
2. The primary interface language is **English** for the hackathon demo, with regional language support (Marathi/Hindi) as a future goal.
3. The farmer has **basic smartphone/web access** — the system cannot rely on offline-only delivery.
4. The recommendation window is **0–3 days** — "Wait 2–3 Days" in the problem statement suggests a short horizon, not weekly/monthly forecasting.
5. The system targets **a specific geographic region** (likely Maharashtra, given team context) for the demo, not all of India simultaneously.
6. "Nearby market" implies the system needs **the farmer's location** or a location input.

### 3.4 UNKNOWN / UNRESOLVED ITEMS

1. **Exact evaluation criteria** for the hackathon — how will judges weight technical depth vs. UX vs. real-world viability?
2. **Demo scenario** — which crop(s) and which market(s) will be used for the live demo? (Team should decide and freeze early.)
3. **Connectivity assumptions** — should the system work with intermittent connectivity? (Assumed: requires connectivity for live prices, historical data is pre-loaded.)
4. **Crop scope** — should the demo support all 370+ commodities, or a curated subset? (Inferred: curated subset for quality.)

---

## 4. Key Domain Terms & Terminology

| Term | Definition |
|---|---|
| **Mandi** | A regulated wholesale agricultural market (APMC market) where farmers sell produce. |
| **APMC** | Agricultural Produce Market Committee — the regulatory body governing mandis. |
| **AGMARKNET** | The DMI's Agriculture Marketing Information Network — the national system for collecting and disseminating mandi price data. |
| **Modal Price** | The most frequently observed transaction price for a commodity in a mandi on a given day. More stable than min/max. |
| **Arrival Quantity** | The volume (in quintals) of a commodity arriving at a mandi on a given day. Indicates supply pressure. |
| **Net Realisation** | The effective amount a farmer receives after subtracting transport cost, waiting/storage cost, and other deductions from the market price. This is the decision-relevant metric, not raw price. |
| **Quintal (Qtl)** | A unit of weight = 100 kg. Standard unit for mandi price reporting in India. |
| **Arthiya / Commission Agent** | A middleman who facilitates transactions in mandis, typically with superior price information. |
| **Abstention** | The system's explicit refusal to recommend when data quality is insufficient. A first-class outcome, not an error. |
| **Data Quality Tier** | A classification (GOOD / MODERATE / POOR) of how trustworthy a market's recent price data is, based on recency and coverage. |
| **Haversine Distance** | Great-circle distance between two geographic points. Used as a proxy for road distance (with a correction factor) when routing APIs aren't available. |
| **DMI** | Directorate of Marketing & Inspection, Ministry of Agriculture & Farmers Welfare, Government of India. |
| **CEDA** | Centre for Economic Data & Analysis, Ashoka University — source of enriched historical mandi data with arrival quantities. |

---

## 5. Real-World Problem Context

Indian farmers face a persistent information asymmetry when selling agricultural produce:

1. **Price opacity:** A farmer in a village typically knows the price at their nearest mandi but has little visibility into prices at alternative mandis within practical reach. Middlemen exploit this gap.

2. **Timing pressure:** Perishable and semi-perishable crops create urgency. A farmer must decide _today_ whether to sell now or hold for potentially better prices tomorrow — with no reliable tool to inform that timing decision.

3. **Existing apps fail at the decision layer:** Apps like Kisan Suvidya, eNAM, and Agmarknet's own portal show raw prices. But raw price at Market A being ₹50/qtl higher than Market B means nothing if Market A is 80 km farther away. The _decision_ — factoring in transport, waiting cost, data reliability — is the unsolved problem.

4. **Trust deficit:** Farmers have been burned by unreliable information. A system that confidently recommends "Wait 3 Days" based on stale or sparse data destroys trust. Honest abstention when data is poor is more valuable than a false confident recommendation.

5. **Scale of impact:** India has 7,000+ regulated mandis and 120M+ farming households. Even marginal improvement in selling decisions can translate to meaningful income improvement at scale.

---

## 6. Known Problem Space

### 6.1 Why Naive Approaches Fail

| Naive Approach | Why It Fails |
|---|---|
| Show raw mandi prices | Raw price ≠ net realisation. A higher-priced distant market may net less after transport cost. |
| Show price trends as graphs | A graph doesn't tell a farmer what to _do_. It shifts the analysis burden to someone without statistical training. |
| Predict tomorrow's price with ML | Mandi prices are noisy, irregularly reported, and influenced by local supply shocks. A model that overfits on training data will give confidently wrong recommendations. |
| Recommend the market with the highest price | Ignores transport cost, data staleness, waiting cost, and data reliability. The "best" market on stale 5-day-old data may not be the best market today. |
| Use deep learning (LSTM, Transformer) | Overkill for 0–3 day horizon on noisy daily data. Training risk in a 24-hour hackathon. A simple heuristic with honest uncertainty is more trustworthy. |

### 6.2 Domain Constraints

- Mandis don't report every day — weekends, holidays, and irregular reporting create gaps.
- Market/commodity naming is inconsistent across sources (casing, suffixes, transliterations).
- Manual data entry at mandis introduces outliers and errors.
- Perishability limits the practical wait window to 0–3 days for most crops.
- Farmers' transport options and costs vary — the system must allow user-editable assumptions.
- Data.gov.in API has known quirks (DD/MM/YYYY dates, default 10-record pagination, occasional downtime).

### 6.3 Important Failure Modes

1. **Stale data presented as current** — recommending based on a price that's 5+ days old.
2. **False precision** — showing ₹2,347.23/qtl predicted price when the underlying data has ±₹200 volatility.
3. **Missing abstention** — forcing a recommendation when data quality is POOR.
4. **Transport cost blindness** — recommending a distant market without accounting for the cost to get there.
5. **Overfitting in forecasting** — a model that performs well on training data but fails on unseen market-days.

---

## 7. Research Questions

### 7.1 Domain / Policy

- How does the APMC mandi system actually work for price discovery?
- What are the real costs a farmer incurs (transport, mandi fees, commission, storage)?
- What is the practical radius within which a farmer considers alternative markets?
- What legal/regulatory constraints exist on price data usage (data.gov.in NDSAP, CEDA citation requirements)?

### 7.2 Algorithmic / Technical

- What forecasting approach is appropriate for a 0–3 day horizon on irregularly-spaced, noisy daily data?
- How should data quality be quantified to trigger abstention vs. recommendation?
- What is a defensible threshold for "the gain from waiting is worth the risk"?
- How should volatility be incorporated into confidence estimation?

### 7.3 Data / Input Representation

- How should inconsistent market/commodity names be reconciled across data.gov.in, CEDA, and Kaggle sources?
- What constitutes "sufficient" historical data for a market-commodity pair?
- How should missing days in price series be handled — interpolation, or gap acknowledgment?
- What date normalization is needed across sources (DD/MM/YYYY vs. ISO)?

### 7.4 Compute / AI Feasibility

- Is the v0 heuristic (7-day linear extrapolation) competitive with ML approaches on this data?
- What is the minimum viable backtest to credibly evaluate forecasting approaches?
- Can LightGBM/XGBoost be trained, validated, and integrated within the hackathon timeline?
- What features (beyond price history) meaningfully improve short-term price forecasting?

### 7.5 Integration / Deployment

- What is the data.gov.in API's reliability and latency during the demo window?
- What fallback exists if the live API is down during the demo?
- How should historical data be pre-loaded (build-time bundling vs. runtime fetch)?
- What is the deployment target (local demo, hosted web app)?

---

## 8. System Invariants

### 8.1 HARD INVARIANTS

These must never be violated:

1. **I-1: No fabricated recommendations.** The system must never generate a recommendation from insufficient, stale, or fabricated data. If data quality is POOR for all candidate markets, the system MUST output `NO_RECOMMENDATION`.
2. **I-2: No fabricated data.** The system must never present synthetic/generated data as real mandi prices, real market data, or real statistics.
3. **I-3: Abstention is a first-class outcome.** `NO_RECOMMENDATION` is a valid, expected system output — not an error state, not a null, not a fallback. It must be visually presented as a deliberate, trustworthy response.
4. **I-4: Net realisation, not raw price.** All market comparisons and sell/wait decisions must be based on net realisation (price minus transport and waiting costs), never on raw modal price alone.
5. **I-5: Data quality assessment is mandatory.** Every market-commodity pair used in a recommendation must have an assessed data quality tier. Markets with POOR data quality must never be recommended.
6. **I-6: Decisions are explainable.** Every recommendation must be accompanied by the specific reasons that produced it, using template-based language derived from the actual computation — never generated, invented, or hallucinated explanations.
7. **I-7: Real data only.** The production system must consume real mandi price data from verified sources. Development/test fixtures must be explicitly isolated and labeled.

### 8.2 SOFT PREFERENCES

These are desirable but may be relaxed under time pressure:

1. **S-1:** Backtest results should be displayed to build user trust — but the core recommendation works without the backtest screen.
2. **S-2:** User-editable transport/storage cost assumptions are preferred — but sensible defaults are acceptable for the demo.
3. **S-3:** The v1 GBM forecaster is preferred if it beats v0 in the backtest — but v0 ships by default and is fully acceptable.
4. **S-4:** Multi-fold walk-forward validation is preferred for backtesting — but single holdout is acceptable for the hackathon.
5. **S-5:** Regional language support (Marathi/Hindi) is preferred for real-world deployment — but English-only is acceptable for the demo.

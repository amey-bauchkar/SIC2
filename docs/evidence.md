# Evidence Base — Statistical & Academic References

All evidence supporting the problem statement, the approach, and the counter-evidence we must carry honestly.

---

## 1. NSO Situation Assessment Survey — 77th Round (Report 587)

### Citation
NSO (2021). *Situation Assessment of Agricultural Households and Land and Livestock Holdings of Households in Rural India, 2019.* Report No. 587 (77th Round, January–December 2019). National Statistical Office, Ministry of Statistics & Programme Implementation, Government of India.

### Key Findings Used

| Statistic | Detail | Source |
|-----------|--------|--------|
| ~75% local-market sales | Among rice-growing households that sold produce in kharif 2018-19, approximately three-quarters made their major sale in **local markets** | NSO Report 587 |
| ~16% to formal channels | Only ~16% sold to APMC mandis/cooperatives/government agencies | NSO Report 587 |
| ~41% MSP awareness | Only approximately 41% of agricultural households were aware of MSP | NSO Report 587 |
| ~30% procurement awareness | Only ~30% were aware of procurement agencies | NSO Report 587 |
| 0.5% chose on price | Only 0.5% sold in markets because the market price beat MSP | NSO Report 587 |
| 23.7% paddy at MSP (Kharif) | Percentage of paddy sold under MSP during Kharif season | NSO Report 587 |
| 9.7% wheat at MSP | Percentage of wheat households selling to government procurement at MSP | NSO Report 587 |

### Why This Matters for MandiMitra
These numbers prove that the vast majority of Indian farmers are making selling decisions in local markets **without decision support**, without MSP access, and often without even awareness of what the MSP is. MandiMitra targets exactly this population — the ~75% selling into local markets where timing and market choice are the only levers they can actually pull.

---

## 2. Counter-Evidence: Foundation for Agrarian Studies (FAS)

### Citation
Foundation for Agrarian Studies (FAS). Analysis of NSO SAS-77 data.

### Their Argument
- FAS reads the **same** SAS-77 data and argues that low procurement access reflects **absence of choice**, not absence of information
- Many farmers had no procurement agency available at all — it's a structural/infrastructure problem
- They argue for **strengthening and extension of MSP and procurement operations**, not just better information tools
- The barriers are systemic: geographic concentration of procurement (mainly wheat and paddy in specific regions), lack of infrastructure

### How We Must Respond
> **We are not claiming to fix procurement access. We are claiming that for the ~75% who sell into local markets anyway, timing and market choice are levers we can move, and we've measured how much.**

- Saying this yourself, first, is worth more than a feature
- Overclaiming here is the fastest way to lose a knowledgeable judge
- Scope our claim precisely: for farmers already selling in local markets, better timing = better price

---

## 3. Agmarknet Missing Data Report

### What It Is
Agmarknet publishes its own **"Statewise Marketwise Missing data Reported – Daily Report"** — an official acknowledgment that mandi reporting has gaps.

### What It Confirms
- Data is manually keyed by mandi operators
- Known missing days (mandis don't report every day)
- Known outliers from data-entry errors
- This is NOT a flaw we discovered — it's documented by the data provider itself

### How We Use It
This is why our **abstention gate** exists. We treat data defects as signal, not noise:
- Missing-value flags become model features
- Outlier flags become model features
- Below a coverage threshold, the system refuses to advise

---

## 4. Academic Framework — Crop Price Forecasting in Emerging Economies

### Citation
arXiv:2009.04171 — *"A Framework for Crop Price Forecasting in Emerging Economies by Analyzing the Quality of Time-series Data"*

### Key Contributions

| Aspect | Detail |
|--------|--------|
| **Data source** | AGMARKNET — same as ours |
| **Problem identified** | Missing values and outliers due to manual entry, market closures (Sundays) |
| **Missing value handling** | Spline-based imputation technique |
| **Outlier detection** | IQR method with threshold of 1 |
| **Features used** | Historical price + market arrival volume + weather (temperature, humidity, rainfall) |
| **Key finding** | Weather features improve crop-price models |
| **Framework approach** | Quality-of-data analysis as integral part of the forecasting pipeline |

### How We Use It
- Validates our decision to encode data-quality features in the model
- Validates weather features as useful inputs
- Provides methodological precedent for our approach
- We cite it; we don't copy it — our contribution is the decision framing and abstention

---

## 5. Penn State / Amulya Yadav — Where and When to Sell

### Citation
Amulya Yadav et al., Pennsylvania State University. Presented at AAAI Conference on Artificial Intelligence.

### Key Contributions

| Aspect | Detail |
|--------|--------|
| **Scale** | Deep learning models over 1,300+ markets × 11 years |
| **Output** | Recommends *where and when* to sell — e.g. "wait five days and travel 40 km" |
| **Approach** | Deep learning on historical price data across all mandis |
| **Status** | Published research; **never shipped to farmers** |

### How We Use It
- Proves the "where and when" decision approach **works**
- Validates that transport-adjusted recommendations are the right framing
- Our contribution is shipping it, not inventing the concept
- We use gradient boosting (not deep learning) because our per-mandi series are too short and gappy for deep sequence models

---

## 6. Naive Persistence Baseline

### What It Is
The simplest possible "forecast": tomorrow's price = today's price.

### Key Statistic
Naive persistence is correct about **~60% of the time** for price direction — and tells the farmer **nothing actionable**.

### Why This Matters
- This is the baseline our backtest must beat
- An RMSE metric is meaningless against persistence — we use **direction hit-rate** and **₹/quintal realised**
- A model that barely beats persistence is honestly reported; a model that claims 95% accuracy on Agmarknet data is lying

---

## 7. NITI Aayog — Gig Worker Statistics (Context Only)

### Citation
NITI Aayog (2022). Report on India's gig and platform economy.

### Key Statistic
- 7.7 million gig workers in 2020-21, projected to reach 23.5 million by 2029-30
- ~2.6% → 6.7% of non-agricultural workforce
- Ministry of Labour has repeated this in Parliament

### Relevance
Context only — used in the selection report for FSD 1 comparison. Not directly relevant to MandiMitra.

---

## Evidence Hierarchy for the Pitch

| Claim | Evidence Level | Source |
|-------|---------------|--------|
| "75% sell in local markets" | **STRONG** — primary government statistics | NSO SAS-77 |
| "Only 41% aware of MSP" | **STRONG** — primary government statistics | NSO SAS-77 |
| "Agmarknet data has gaps" | **VERIFIED** — self-reported by data provider | Agmarknet Missing Data Report |
| "Weather features improve models" | **STRONG** — peer-reviewed framework | arXiv:2009.04171 |
| "Where-and-when decisions work" | **STRONG** — published at top venue | Penn State / AAAI |
| "No competitor publishes accuracy" | **STRONG** — direct audit of all apps | Team analysis, mid-2026 |
| "Information alone doesn't fix access" | **STRONG** — counter-evidence we carry | FAS analysis |
| "Our backtest shows ₹X/quintal" | **TBD** — computed during hackathon | Walk-forward evaluation |

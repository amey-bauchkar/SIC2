# Competitors & Existing Solutions — Gap Analysis

A complete audit of every existing solution that touches mandi price information for Indian farmers, and precisely what each does and does NOT do.

---

## COMPETITOR 1 — Agmarknet Portal (Government)

| Field | Detail |
|-------|--------|
| **Owner** | DMI, Ministry of Agriculture & Farmers Welfare |
| **URL** | `https://agmarknet.gov.in` |
| **Status** | Live, national |
| **What It Does** | Publishes daily min/max/modal prices and arrivals per market. The **primary data source** for every other app and tool. |
| **What It Does NOT Do** | Any decision. No forecast. No comparison. No transport adjustment. Unusable UX for a farmer in a field. Raw data portal. |
| **Threat Level** | None — it is the data pipe, not a product |

---

## COMPETITOR 2 — Kisan Suvidha (Government)

| Field | Detail |
|-------|--------|
| **Owner** | Department of Agriculture, Government of India |
| **URL** | `https://kisansuvidha.gov.in` |
| **Platforms** | Android (Play Store), iOS (App Store) |
| **Status** | Live, multilingual (Hindi, English, Punjabi, Tamil, Gujarati, and more) |
| **What It Does** | |
| | • Shows **latest price** of crops in the farmer's district |
| | • Plus max price in state and India (comparative view) |
| | • 5-day weather forecast with extreme weather alerts |
| | • Plant protection guidance (pest/disease, photo upload for expert advice) |
| | • Agro-advisories (sowing to harvesting) |
| | • Dealer/machinery listings, Custom Hiring Centres |
| | • Soil Health Card info |
| | • Direct connect to Kisan Call Centre (KCC) |
| **What It Does NOT Do** | |
| | • ❌ No forecast / prediction |
| | • ❌ No "sell now or wait" recommendation |
| | • ❌ No transport-adjusted comparison |
| | • ❌ No confidence score |
| | • ❌ No data-quality awareness |
| | • ❌ Documented UX and stability complaints |
| **Threat Level** | **LOW** — shows prices, not decisions. A judge will know about it. Name it yourself first. |

---

## COMPETITOR 3 — eNAM (Government)

| Field | Detail |
|-------|--------|
| **Owner** | Ministry of Agriculture |
| **URL** | `https://enam.gov.in` |
| **Status** | Live — **1,656 mandis** integrated across 23 states and 4 UTs (as of March 2026) |
| **Scale** | 1.80 crore farmers, 2.73 lakh traders, 4,724 FPOs; ₹4.84 lakh crore cumulative trade value |
| **Commodities** | 247 tradable agricultural commodities |
| **What It Does** | |
| | • Pan-India electronic trading portal networking APMC mandis |
| | • Real-time price discovery via competitive online bidding |
| | • Agmarknet price dashboard integration |
| | • Direct bank payments (RTGS/NEFT/UPI) |
| | • FPO Trading Module |
| | • Logistics integration |
| | • e-NWR (warehouse receipt) integration — store now, sell later |
| | • AI/ML-based assaying machines in some mandis |
| **What It Does NOT Do** | |
| | • ❌ Does not tell a farmer **when** to sell |
| | • ❌ Helps you *transact*; doesn't help you *decide* |
| | • ❌ Irrelevant to the ~75% selling outside APMC channels |
| **Threat Level** | **LOW-MEDIUM** — a judge will mention it. Have the answer ready: "eNAM helps you transact; we help you decide. A farmer outside the eNAM network — the majority — gets nothing from it." |

---

## COMPETITOR 4 — FarmerAI (Private — Play Store)

| Field | Detail |
|-------|--------|
| **Owner** | Independent developer |
| **Platform** | Google Play Store |
| **Status** | Live as of mid-2026 |
| **What It Advertises** | |
| | • "Sell now or wait" advice |
| | • Best mandi recommendation |
| | • Price trends |
| | • Risk level |
| | • AI-based crop disease detection |
| | • "Sell Smart" feature |
| **What It Does NOT Do / Publish** | |
| | • ❌ No published methodology |
| | • ❌ No accuracy claim or backtest |
| | • ❌ No visible data-quality handling |
| | • ❌ No transparent transport economics |
| **Threat Level** | **MEDIUM** — the closest competitor by far. If a judge knows about it, have this answer: "It makes the same promise. We publish a backtest. Ask them for theirs." |

---

## COMPETITOR 5 — Other Play Store Apps

| App | Key Features | Gap |
|-----|-------------|-----|
| **KisanDeals (Mandi Bhav)** | Live APMC/eNAM rates, compare up to 10 markets, smart price alerts | No decision engine, no transport cost, no forecast |
| **FassalkartAI** | Live mandi prices from data.gov.in, AI farm assistant (16 languages), "Smart Decision Engine" for sell/hold/wait | Newer entrant — methodology unknown, no published backtest |
| **All India Mandi Rates** | Daily APMC rates, nearby market finder | Pure display, no intelligence |
| **NaPanta (Smart Kisan)** | Pan-India price comparisons, crop management | Advisory but no transport-adjusted decision |

---

## COMPETITOR 6 — Academic Prior Art

| Source | Detail |
|--------|--------|
| **Penn State / Amulya Yadav (AAAI)** | Deep learning models over 1,300+ markets × 11 years. Recommends *where and when* to sell — e.g. "wait five days and travel 40 km." |
| **Status** | Research paper, presented at AAAI. **Never shipped** as a farmer-usable product. |
| **Framework Paper (arXiv:2009.04171)** | "A Framework for Crop Price Forecasting in Emerging Economies by Analyzing the Quality of Time-series Data" — addresses Agmarknet's missing values and outliers using spline imputation and IQR outlier detection. Uses historical price + market arrivals + weather features. |
| **Significance** | Proves the approach works. Provides methodological foundation. Both pieces validate our design decisions. |

---

## Gap Analysis Summary

| Capability | Agmarknet | Kisan Suvidha | eNAM | FarmerAI | Academic | **MandiMitra** |
|-----------|-----------|---------------|------|----------|----------|-----------|
| Display current prices | ✅ | ✅ | ✅ | ✅ | N/A | ✅ |
| Historical prices | ✅ | ❌ | ❌ | ❓ | ✅ | ✅ |
| Sell/Wait recommendation | ❌ | ❌ | ❌ | ✅ (unverified) | ✅ (not shipped) | **✅** |
| Transport-adjusted comparison | ❌ | ❌ | ❌ | ❌ | ✅ (paper only) | **✅** |
| Net realisation (₹ in hand) | ❌ | ❌ | ❌ | ❌ | ❌ | **✅** |
| Confidence score | ❌ | ❌ | ❌ | ❌ | ❌ | **✅** |
| Data-quality awareness | ❌ | ❌ | ❌ | ❌ | ✅ (framework) | **✅** |
| Calibrated abstention | ❌ | ❌ | ❌ | ❌ | ❌ | **✅** |
| Published backtest | ❌ | ❌ | ❌ | ❌ | ✅ (paper) | **✅** |
| Farmer-usable UX | ❌ | ✅ | Partial | ✅ | ❌ | **✅** |
| Multilingual voice | ❌ | ✅ | ❌ | ❌ | ❌ | **✅** |

### The Exact Gap We Fill

> Price **display** is solved. Transport-adjusted, uncertainty-aware, **evaluated** decision-making is not, and nothing shipped publishes an accuracy number anyone can audit.

### Likelihood a Judge Says "This Already Exists"

**MEDIUM.** They will say "mandi price apps exist" — true, and we agree. We name Kisan Suvidha, eNAM, and FarmerAI on our own slide. Then we show the backtest. Nobody in that room can point to a Mumbai-launched government app from four months ago that does what we're doing (unlike FSD 2, where MyBMC MARG is exactly that).

---

## Slide: "What Exists" — Present This Proactively

> **We know these exist. Here is precisely what they don't do.**
>
> - **Kisan Suvidha** — shows today's price in your district. No forecast, no sell/wait, no transport cost.
> - **eNAM** — helps you trade at enrolled mandis. Doesn't help you decide *when*. Doesn't help the 75% outside APMC.
> - **FarmerAI** — promises "sell now or wait." Publishes no method and no accuracy.
> - **Our gap:** the decision layer, not the data layer. And a backtest to prove it.

# Known Limitations — Disclose on the Slide

These are limitations we disclose **proactively** in the presentation. Saying them ourselves, first, is worth more than a feature.

---

## Limitation 1: No Arrival Volumes in the Public API

| | |
|-|-|
| **What** | The OGD price resource (`data.gov.in`) carries prices but **not arrival quantity** (supply-side data) |
| **Impact** | The model uses price-history + weather + data-quality features, not volume. Volume would strengthen supply-side signals. |
| **Why It Matters** | An expert judge might expect quantity-aware models |
| **CEDA Has It** | The CEDA Ashoka portal (`agmarknet.ceda.ashoka.edu.in`) carries both prices and arrivals |
| **Post-Hackathon Path** | Portal-side arrivals ingestion — add arrival quantity as a model feature |
| **What to Say** | "The public API gives us prices but not volumes. CEDA has arrivals — that's our first post-hackathon integration. For this demo, we model with price-history, weather, and data-quality features." |

---

## Limitation 2: Manual Data Entry and Reporting Gaps

| | |
|-|-|
| **What** | Agmarknet is manually keyed by mandi operators. Known missing days and outliers from data-entry errors. Agmarknet publishes its own *"Statewise Marketwise Missing data Reported – Daily Report"* confirming this. |
| **Impact** | Some mandis don't report for days. Some entries are data-entry errors. |
| **Why It's a Feature, Not Just a Bug** | This is precisely why the **abstention gate** exists. We treat these defects as signal — missing-value and outlier flags are model features. |
| **What to Say** | "Agmarknet is manually keyed with documented reporting gaps — which is why the abstention gate exists. The government itself publishes a daily missing-data report. We designed for this." |

---

## Limitation 3: Price Information ≠ Procurement Access

| | |
|-|-|
| **What** | Agrarian-studies researchers (FAS) argue from the same NSO SAS-77 data that low MSP uptake reflects **lack of choice** (no procurement agency available), not lack of information. |
| **Impact** | Price information is **necessary but not sufficient**. For farmers who genuinely cannot reach a procurement channel, better timing advice doesn't change the binding constraint. |
| **Our Scope** | For the **~75% who sell into local markets anyway**, timing and market choice ARE the levers we can move. We do not claim to fix procurement access. |
| **What to Say** | "We know this. FAS makes this argument from the same data. They're right about procurement access. We're scoping our claim to the 75% already selling in local markets, where timing is the lever." |

---

## Limitation 4: Three-Day Forecasting Is Genuinely Hard

| | |
|-|-|
| **What** | Crop price direction over 2-3 days is a difficult prediction problem. Naive persistence is right ~60% of the time. |
| **Impact** | The backtest may show only a modest edge over persistence. |
| **Why This Is OK** | A modest edge, correctly measured and honestly reported, is what real ML looks like. Claiming 95% accuracy on Agmarknet data is lying. |
| **What to Say** | "We report the honest number. A small, correctly measured edge over [N] real days beats a suspicious claim nobody can check." |

---

## Limitation 5: Three Commodities Only

| | |
|-|-|
| **What** | The hackathon demo covers only 3 pre-selected commodities in 2 districts |
| **Impact** | A farmer growing a different crop can't use it |
| **Why** | Deliberate scope control — chose commodities with the densest recent data coverage |
| **Scalability** | Adding commodities is **configuration, not code** — ingest-and-cache is horizontal |
| **What to Say** | "We pre-loaded the 3 commodities with the densest recent coverage. Adding 50 more is a config change and an overnight data pull, not a code change." |

---

## Limitation 6: Rate Limits Unverified

| | |
|-|-|
| **What** | The OGD India API rate limits are unverified — no published documentation found |
| **Impact** | Unknown throttling risk during rapid ingestion |
| **Mitigation** | Pre-pull and cache. Design as if rate limits are tight. On stage, make only one live call. |
| **What to Say** | Only if asked: "Rate limits aren't published. We designed for tight limits — pre-cache everything, make one live call." |

---

## Slide Template: "Known Limitations"

> **What we don't do (yet):**
>
> 1. The public price API doesn't carry **arrival volumes** — CEDA does; that's our first integration post-hackathon
> 2. Agmarknet has **reporting gaps** — which is why the abstention gate exists
> 3. We **don't fix procurement access** — we scope to the 75% selling locally, where timing is the lever
> 4. We cover **3 commodities** — adding more is config, not code
>
> *Saying this ourselves, before anyone asks, is deliberate.*

---

## The Philosophy

> A team that pre-empts all six of its own weaknesses reads as **senior**. A team that hides them reads as naive. Disclose early, disclose precisely, disclose with the mitigation in the same sentence.

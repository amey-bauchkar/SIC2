# Differentiation Strategy

What makes our MandiMitra different from the generic "crop price prediction" project that every hackathon team builds, and why another competent team cannot replicate it in the last hour.

---

## The Generic Version (What Everyone Else Will Build)

If 10 teams pick SIC 2, the default project looks like:

- A crop dropdown + mandi dropdown
- A line chart of historical prices
- An LSTM model producing a price number
- A "SELL TODAY" badge
- Maybe a chatbot

**This loses.** It is interchangeable, unverifiable, and a judge has seen it 50 times.

---

## Our 5 Structural Differentiators

### 1. Net Realisation, Not Price

| Generic Approach | Our Approach |
|-----------------|--------------|
| Compare raw modal prices across mandis | Rank by **₹-in-hand** = expected modal price − transport cost/quintal to that mandi |
| "Lasalgaon has a higher price" | "Lasalgaon nets you ₹180 more per quintal **after the ₹40/km transport**" |
| Ignores that the "best" mandi might cost more to reach | Every recommendation is a **net number** |

**Why others won't have it:** Requires pre-computed distance matrix, transport cost model, and a fundamentally different ranking function. Not a feature you add — it changes the core metric.

### 2. Data-Quality-Aware Modelling

| Generic Approach | Our Approach |
|-----------------|--------------|
| Clean the data and pretend it's perfect | Encode **missing-value flags and outlier flags as model features** |
| Ignore that some mandis haven't reported in 9 days | The model learns that "no data for 5 days" is itself informative |
| Impute and move on | Follow the published framework for crop-price forecasting in emerging economies |

**Why others won't have it:** Requires reading the arXiv literature before the event. Hackathon teams don't read papers.

### 3. Calibrated Abstention

| Generic Approach | Our Approach |
|-----------------|--------------|
| Always produce a prediction, regardless of data quality | **Refuse to advise** below a coverage threshold |
| Confidently wrong on sparse data | On screen: "Cannot advise — Mandi X has not reported in 9 days. Nearest reliable: Mandi Y." |
| Treats silence as confidence | A model that knows when to stay silent reads as **engineering maturity** |

**Why others won't have it:** It's counter-intuitive to build a system that deliberately refuses to answer. It requires a coverage metric, a threshold, a fallback path, and the confidence to leave a gap in the demo.

### 4. Direction With Confidence, Not Point Prediction

| Generic Approach | Our Approach |
|-----------------|--------------|
| "Tomorrow's price will be ₹2,340" (point estimate) | "Prices are likely to **go UP** in 2–3 days · confidence: **MEDIUM**" |
| RMSE as the evaluation metric | Direction **hit-rate** as the metric |
| Sounds precise, is fragile | Honest about uncertainty |

**Why others won't have it:** Requires understanding that RMSE is meaningless when persistence is right 60% of the time. Requires a different model output (classification, not regression) and a different evaluation framework.

### 5. A Backtested Rupee Number

| Generic Approach | Our Approach |
|-----------------|--------------|
| "Our model has 92% accuracy" (training set, unverifiable) | "On 2,000 held-out real market-days, following our advice would have realised **₹X more per quintal** than selling on harvest day" |
| Metrics on training data | Walk-forward backtest on held-out data |
| No one can check | **Checkable, reproducible, honest** |

**Why others won't have it:** Requires a walk-forward evaluation harness with no lookahead leakage, two baselines (harvest-day sale, persistence), and the willingness to report whatever number comes out — even if it's modest.

---

## Why These Can't Be Bolted On in the Last Hour

Items 1–5 change the **model**, the **evaluation**, and the **interface** all at once:

- Net realisation changes the ranking function and requires transport-cost data
- Data-quality features change the feature set and require understanding the domain
- Abstention requires a coverage metric, threshold tuning, fallback logic, and UI for it
- Direction classification changes the model output type and evaluation metric
- The backtest requires a walk-forward harness built separately from the model

**Your edge is preparation, not typing speed.** FSD 2 rewards implementation speed; SIC 2 rewards preparation.

---

## The Differentiation Test

### If asked: "10 teams picked this. What's different about yours?"

> "Everyone shows prices. We optimise **₹ in hand after transport**, we model the data's known defects as features instead of ignoring them, our system openly **refuses to advise** when the government's data is too thin, and we backtest our advice on real held-out days and show you the rupee number. We also named every competitor on our own slide before you asked."

### If asked: "How is this better than FarmerAI?"

> "They make the same promise. They publish no method and no accuracy. We publish a walk-forward backtest against two baselines. Ask them for theirs."

---

## What Does NOT Differentiate Us

Be honest about what's commodity:
- The data source (everyone has access to data.gov.in)
- The basic UI pattern (crop dropdown, price display)
- The existence of a "recommendation" feature

**The differentiation is in the objective function, the abstention policy, and the evaluation discipline — not in having more features.**

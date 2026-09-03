# Judge Q&A — 18 Anticipated Questions with Answers

Prepared answers for every question a judge is likely to ask. Rehearse these.

---

## Q1: "Why does this need to exist when Kisan Suvidha already shows mandi prices?"

> Kisan Suvidha shows the **latest price** in your district and the max in the state. It does not tell you whether to sell today, does not net out the cost of reaching a farther mandi, and does not tell you how confident it is. **We built the decision, not the display.**

---

## Q2: "Isn't eNAM already solving this?"

> eNAM is a trading platform for enrolled mandis — 1,656 as of March 2026. It helps you **transact**; it doesn't help you choose **when**. A farmer selling in a local market outside eNAM — the majority, per NSO SAS-77 — gets nothing from it.

---

## Q3: "There's an app on the Play Store that says exactly this."

> There is — FarmerAI. And it publishes **no methodology** and **no accuracy figure**. We publish a walk-forward backtest against two baselines. Ask them for theirs.

---

## Q4: "Where does your data come from?"

> The Government of India's open data platform — resource ID `9ef84268-d588-465a-a308-a864a43d0070` — generated from Agmarknet by the Directorate of Marketing and Inspection. Free API key. **We can call it live right now.** [If not already demonstrated, call it.]

---

## Q5: "Is your data real?"

> **Yes, all of it.** The live prices are from the government API. The historical series is a real pull from the CEDA Ashoka portal. The weather data is from Open-Meteo. The distance matrix is computed from OpenStreetMap. The only cached data is a real historical pull we made before the event so a network failure can't kill the demo.

---

## Q6: "What happens if the data is wrong?"

> That's **designed for**. Agmarknet is manually keyed and publishes its own missing-data report. We encode missing-value and outlier flags as **model features**, we score each mandi/commodity pair for reliability, and below threshold we **abstain and redirect** to the nearest reliable mandi rather than guessing. [Show the abstention screen if not already demonstrated.]

---

## Q7: "Why AI/ML at all — isn't this a moving average?"

> A moving average can't give you a **calibrated confidence** or an **abstention decision**, and a persistence rule is right about 60% of the time while telling the farmer nothing. We classify direction with confidence and evaluate against exactly those baselines.

---

## Q8: "Why this model and not a deep network?"

> Short, gappy, per-mandi series with a few hundred usable points. Gradient boosting on engineered features **beats a deep sequence model at this data size**, trains in seconds, and is interpretable — which the farmer-facing "why" panel requires.

---

## Q9: "How accurate is it?"

> [Live number from the backtest.] Reported as **direction hit-rate** versus persistence and **₹/quintal** versus harvest-day sale, on held-out days the model never saw. We report it whatever it is.

*If the number is modest:* "A small but correctly measured edge over [N] real days is what honest looks like. Nobody else in this room can show you a real number at all."

---

## Q10: "What about edge cases — a mandi that hasn't reported in ten days?"

> [Demonstrate live.] The system **refuses to advise** and says why. Then redirects to the nearest reliable mandi. This isn't a limitation — it's a feature.

---

## Q11: "Farmers don't have smartphones / can't read."

> The interface is **three colours, one number, and a voice line in Marathi**. The scale path is IVR/SMS and distribution through FPOs, who make this decision for hundreds of members.

---

## Q12: "Doesn't the real problem lie in procurement access, not information?"

> Agrarian-studies researchers make exactly that argument from the same SAS-77 data, and they're right about the binding constraint for MSP access. **We're not claiming to fix procurement.** We're claiming that for the **~75% who sell into local markets anyway**, timing and market choice are levers we can move, and we've measured how much.

*This answer pre-empts the most sophisticated critique possible. Saying it ourselves, first, reads as intellectual honesty.*

---

## Q13: "How will this scale?"

> Commodities and districts are **configuration**, not code. The heavy path is ingest-and-cache, which is horizontal. Distance matrices are pre-computed once per district. Adding 50 more commodities is a config change and an overnight data pull.

---

## Q14: "What stops a competitor copying you?"

> Nothing technical, and we won't pretend otherwise. The defensible asset is the **evaluation discipline** (the backtest) and **FPO distribution** (reaching farmers who make this decision for hundreds), not the code.

---

## Q15: "What happens after the hackathon?"

> 1. Add **arrivals** from the Agmarknet portal (the OGD API doesn't carry volume)
> 2. Widen commodity coverage
> 3. Run a pilot with **one FPO**
> 4. Publish the backtest so users can audit the claim

---

## Q16: "Who pays for it?"

> Farmer-side **free**. The payers are FPOs and state agri-marketing boards, who already fund market intelligence work — **Karnataka**, for example, has moved to set up a market intelligence cell for exactly this class of decision.

---

## Q17: "What's the measurable impact?"

> Three metrics, all on real held-out data:
> 1. **₹/quintal** realised versus harvest-day baseline
> 2. **Direction hit-rate** versus persistence
> 3. **Correct-abstention rate** on low-quality data
>
> All three are computed, not claimed.

---

## Q18: "Why should we believe your backtest isn't leaking?"

> Walk-forward split — no future rows in any feature window. The code is in the repo. **Happy to run it on a date range you choose.**

---

## Bonus Questions

### "This is a college project everyone has done."

> The generic version is — a price chart with an LSTM. We don't do that. We optimise **₹ in hand after transport**, we model the data's known defects, and the system **refuses to advise** when data is thin. Name another team that built abstention.

### "What's your team's background?"

> Amey does architecture, backend, and ML. Janhavi does UX — she designed the low-literacy decision card. Purva built the transport-cost module. Tanmay built the backtest. Four clean modules, integrated.

### "Can you run it for a different commodity right now?"

> If we have it loaded: "Absolutely — let's try [commodity]."
> If not: "We pre-loaded 3 commodities with the densest recent coverage. Adding more is a config change and a data pull."

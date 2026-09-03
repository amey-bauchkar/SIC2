# Risks & Mitigations — Red Team Analysis

Every way MandiMitra could fail, and how to prevent each one.

---

## RISK 1: "This is a college project everyone has done"

| | |
|-|-|
| **Severity** | HIGH |
| **Likelihood** | HIGH |
| **Type** | Perception |
| **Description** | Mandi price prediction is one of the most common Indian student projects. A judge may pattern-match to that in the first ten seconds and stop listening. |
| **Mitigation** | The net-realisation reframing is NOT what the common student project does. Open with the decision, not with the chart. Show the abstention beat in the demo — no generic project does that. Name the competitors yourself before the judge brings them up. |
| **If it happens** | "You're right that price charts are common. We don't build that. We optimise ₹ in hand after transport, model the data's defects, and refuse to advise when data is thin. Can I show you the abstention?" |

---

## RISK 2: API unavailability on stage

| | |
|-|-|
| **Severity** | HIGH |
| **Likelihood** | LOW-MEDIUM |
| **Type** | Technical |
| **Description** | data.gov.in API goes down or returns an error during the live demo call. The differentiating moment evaporates. |
| **Mitigation** | **Pre-pull a real data snapshot before the event** and cache it on disk. Make one live call; if it fails, silently fall back to the cached snapshot. The cached data IS real government data — just not live. Rehearse the fallback twice with network disconnected. |
| **If it happens** | "We pulled this from the same government API yesterday. Let me show you what we do with it — the decision engine works the same way." |

---

## RISK 3: Weak backtest edge

| | |
|-|-|
| **Severity** | MEDIUM |
| **Likelihood** | MEDIUM |
| **Type** | Technical / Credibility |
| **Description** | Three-day crop-price forecasting is genuinely hard. If the backtest shows only a small edge over persistence, it may look unimpressive. |
| **Mitigation** | **Report the honest number anyway.** Frame it against persistence: "Persistence is right 60% of the time and tells the farmer nothing. We beat it by X percentage points, on N real days, with a system that knows when to stay silent." A modest, correctly measured edge beats a suspicious one. |
| **If it happens** | "This is what honest looks like. A small edge on real data that you can verify is more valuable than a large claim nobody can check." |

---

## RISK 4: "This already exists" — competitor awareness

| | |
|-|-|
| **Severity** | MEDIUM |
| **Likelihood** | HIGH |
| **Type** | Perception |
| **Description** | A judge knows about Kisan Suvidha, eNAM, or FarmerAI and asks "what's new?" |
| **Mitigation** | **Name them on your own slide, in your own words, before anyone asks.** Show the gap matrix. Say: "Everyone shows prices. Nobody ships a transport-adjusted, backtested decision." Being the team that already knew is worth more than being the team with one more feature. |
| **If it happens** | "We know about [X]. Here's precisely what it doesn't do: [gap]. And here's our backtest." |

---

## RISK 5: The information thesis is contestable

| | |
|-|-|
| **Severity** | MEDIUM |
| **Likelihood** | LOW (only a well-read judge) |
| **Type** | Intellectual |
| **Description** | Agrarian-studies researchers argue that low MSP uptake reflects absence of choice, not absence of information. A well-read judge can argue our product doesn't touch the binding constraint. |
| **Mitigation** | **Carry the counter-evidence yourself.** Say: "FAS makes exactly that argument from the same SAS-77 data. They're right about MSP access. We're not claiming to fix procurement. We're claiming that for the ~75% who sell into local markets anyway, timing and market choice are levers we can move." |
| **If it happens** | You've already pre-empted it. A team that cites its own critics reads as senior. |

---

## RISK 6: Missing arrival volumes

| | |
|-|-|
| **Severity** | LOW-MEDIUM |
| **Likelihood** | MEDIUM |
| **Type** | Data completeness |
| **Description** | The OGD price resource carries prices but NOT arrival volumes. An expert judge might expect supply-side features. |
| **Mitigation** | Disclose it on your slide as a known limitation. Say: "CEDA has arrivals; the OGD API doesn't. Post-hackathon path: portal-side arrivals ingestion." Naming the limitation yourself prevents the gotcha. |
| **If it happens** | "Good observation. The public API carries prices only. We've identified the CEDA portal as the arrivals source — that's our first post-hackathon integration." |

---

## RISK 7: Scope creep

| | |
|-|-|
| **Severity** | HIGH |
| **Likelihood** | MEDIUM |
| **Type** | Process |
| **Description** | Someone suggests adding a chatbot, more commodities, user auth, or notifications. Each addition steals time from the backtest. |
| **Mitigation** | **Hard scope freeze at hour 3.** No new features after hour 14. Treat every "what if we also..." as a threat to the backtest, which is the single highest-value artefact. |
| **Prevention** | Print the "What NOT to Build" list from the architecture doc and keep it visible. |

---

## RISK 8: Multiple teams pick SIC 2 — surfaces converge

| | |
|-|-|
| **Severity** | MEDIUM |
| **Likelihood** | MEDIUM-HIGH |
| **Type** | Competition |
| **Description** | Several teams pick SIC 2. The generic version (price chart + prediction badge) becomes interchangeable. |
| **Mitigation** | The differentiation is structural (net realisation, abstention, backtest). These are things another team cannot bolt on in the last hour because they change the model, the evaluation, and the interface all at once. Our edge is preparation, not typing speed. |
| **Key question** | "Can another team build exactly the same demo in 24 hours?" — They could build items 1 and 5 if they thought of them. They will NOT build items 2, 3, and 4, because those require reading the literature before the event. |

---

## RISK 9: Demo clustering false-positive equivalent

| | |
|-|-|
| **Severity** | LOW |
| **Likelihood** | LOW |
| **Type** | Technical |
| **Description** | The model gives a clearly wrong recommendation for a commodity a judge happens to know well (e.g., onion price that every Mumbaikar tracks). |
| **Mitigation** | Choose the demo path carefully. Pre-test the recommendation for the specific commodities and mandis used in the demo. The cached snapshot means we know exactly what the output will be. |

---

## RISK 10: Rate limits on data.gov.in

| | |
|-|-|
| **Severity** | LOW (mitigated) |
| **Likelihood** | UNKNOWN |
| **Type** | Technical |
| **Description** | The OGD API rate limits are unverified. Rapid calls during ingestion could be throttled. |
| **Mitigation** | (a) Pre-pull historical data before the event, (b) cache aggressively, (c) on stage, make only ONE live call. Design as if rate limits are tight. |

---

## Five Ways Another Team Beats Us

1. **They demo real data too, and their model is better evaluated.** → Backtest must be working by hour 14, not hour 22.
2. **They pick FSD 4 (Code Mafia) and pull it off.** → We can't out-spectacle a game; we out-*credential* it with a rupee number from government data.
3. **They out-UX us.** → Decision card must be visually finished by hour 8 and survive being viewed at phone width from 3 metres.
4. **They frame the problem better in the first 30 seconds.** → Open with the concrete farmer and the concrete decision, not statistics.
5. **They pre-empt the "this exists" objection and we don't.** → We name competitors on our own slide.

---

## Survival Summary

| Risk | Survivable? | If We... |
|------|------------|----------|
| "Already exists" perception | ✅ YES | Name competitors first, show the gap |
| API fails on stage | ✅ YES | Cached real snapshot ready |
| Weak backtest | ✅ YES | Report honestly, frame against persistence |
| Scope creep | ✅ YES | Hard freeze at hour 3 |
| Information-vs-access critique | ✅ YES | Carry the counter-evidence |
| Multiple teams converge | ✅ YES | Structural differentiation |
| **Overall** | **✅ YES** | **Every risk is mitigable before hour zero** |

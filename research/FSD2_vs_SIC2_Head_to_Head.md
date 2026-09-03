# IGNITE 8.0 — HEAD-TO-HEAD: FSD 2 vs SIC 2

**Team:** Amey (architecture/backend/AI-ML/APIs) · Janhavi (UI-UX) · Purva (Feature 1) · Tanmay (Feature 2)
**Format:** 24-hour hackathon · 4 people · zero-mock-data as a hard constraint
**Date:** 3 September 2026

> **Where this contradicts the earlier report, it is flagged explicitly.** Two new findings changed the numbers. Both cut against FSD 2.

---

## SECTION 1 — FINAL VERDICT

### WINNER: **SIC 2 — MandiMitra**

### FINAL SCORE: **SIC 2 — 82.0 / 100  vs  FSD 2 — 56.5 / 100**

### ONE-SENTENCE REASON

FSD 2's entire feature set — geo-tagged photo complaints, department routing, real-time tracking, employee **"after" photo** upload, and ward-wise analytics dashboards — was launched as an official BMC app called **MyBMC MARG on 22 April 2026 in Mumbai**, four months before this hackathon and in the same city as the judges, while its core entity (the complaints themselves) has no public data source at all; SIC 2, by contrast, has a real government data pipeline and a core claim that can be *measured on stage in rupees*.

### CORRECTION TO THE PREVIOUS REPORT

The earlier report scored FSD 2 at 64.8 and named Swachhata-MoHUA as the incumbent. That was incomplete. I had not found **MyBMC MARG**, which is far more damaging, far more recent, and far more local. FSD 2's score drops. SIC 2 also drops slightly (84.7 → 82.0) because of the historical-data correction and because I could not verify the data.gov.in rate limits. **The gap widened from ~20 points to ~25.5.**

---

## SECTION 2 — HEAD-TO-HEAD TABLE

| Criterion | Weight | FSD 2 | SIC 2 | Winner |
|---|---|---|---|---|
| Problem severity / real need | 10% | 8 | 9 | SIC 2 (narrow) |
| Real data availability & quality | 15% | 3 | 9 | **SIC 2 (decisive)** |
| API / integration reliability | 10% | 7 | 7 | Tie (see note) |
| Existing-solution gap | 15% | 4 | 7 | **SIC 2 (decisive)** |
| 24-hour technical feasibility | 10% | 6 | 9 | SIC 2 |
| Differentiation potential | 10% | 5 | 7 | SIC 2 |
| Demo potential | 10% | 8 | 9 | SIC 2 (narrow) |
| Measurable impact | 5% | 4 | 9 | **SIC 2** |
| Team fit / parallelization | 5% | 8 | 9 | SIC 2 (narrow) |
| Judge appeal | 5% | 6 | 8 | SIC 2 |
| Reliability / failure risk | 5% | 6 | 8 | SIC 2 |
| **WEIGHTED TOTAL** | **100%** | **56.5** | **82.0** | **SIC 2** |

**Note on the API tie.** FSD 2 scores 7 on integration reliability for a hollow reason: it barely integrates anything external, so there is little to fail. SIC 2 scores 7 because it has one genuinely critical dependency with unverified rate limits, fully mitigable by caching. Equal number, opposite meaning — FSD 2's reliability comes from having no real data to depend on.

---

## SECTION 3 — REAL DATA AUDIT

### SIC 2 — MandiMitra

**Source 1 — Live prices**
| Field | Detail |
|---|---|
| Source | Current Daily Price of Various Commodities from Various Markets (Mandi) |
| Owner | Directorate of Marketing & Inspection (DMI), Dept. of Agriculture & Farmers Welfare — generated from the AGMARKNET portal, released under NDSAP |
| URL | `data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi` · resource id `9ef84268-d588-465a-a308-a864a43d0070` |
| Data fields | state, district, market, commodity, variety, grade, arrival_date, min_price, max_price, modal_price |
| Current / historical | **Current snapshot.** The resource is literally named "Current Daily Price." Production projects built on it keep live API and historical data as *separate* stores. |
| API | REST GET, `format=json`, `limit`/`offset`, server-side `filters[state]` / `filters[commodity]` |
| Auth | Free `api-key` from data.gov.in registration |
| Rate limits | **UNVERIFIED.** I searched for published OGD India quotas and found only the unrelated US `api.data.gov` documentation. Treat as unknown; design as if tight. |
| Accessibility | I was **blocked from calling it directly** (the endpoint refuses automated access from my tooling). Verification is therefore indirect. |
| Quality | Manual mandi entry. Known missing days and outliers — Agmarknet publishes its own *"Statewise Marketwise Missing data Reported – Daily Report."* Peer-reviewed and preprint work confirms missing values and outliers in these series. **No arrival quantity in this resource.** |
| Verification status | **[STRONG EVIDENCE], not [VERIFIED FACT].** Catalogue entry confirmed; resource id and field schema consistent across a dozen independent working projects; a third-party scraper page showed a live record with `arrival_date: 15/07/2026`. |

**Source 2 — Historical prices + arrivals**
| Field | Detail |
|---|---|
| Source | CEDA Agri-Market Data, Centre for Economic Data and Analysis, Ashoka University |
| Owner | Compiled from DMI, Ministry of Agriculture (source attribution stated on the portal) |
| URL | `agmarknet.ceda.ashoka.edu.in` |
| Data fields | Modal / min / max price **and arrival quantity**, daily / monthly / yearly, national / state / district |
| API | No public REST API; portal with date-range selection and a **Download Data** button |
| Auth | None |
| Accessibility | **[VERIFIED FACT] — I loaded the portal directly. It is live.** |
| Quality note | Default date range on load ended October 2025 — could be a stale default or a data lag. **Check the newest date in your download before relying on it.** |
| Verification status | **VERIFIED live; recency UNVERIFIED.** |

**Source 3 — Insurance**
Kaggle Agmarknet mirrors, including one covering 2001–2026 with 370+ commodities in CSV and Parquet, last updated April 2026. Real underlying government data, third-party provenance. Use only as demo fallback, never as the headline source.

**Supporting:** Open-Meteo (free, no key, historical archive) for weather features — the published crop-price forecasting framework for India shows weather features improve these models. OSRM/Nominatim for mandi distance, pre-computed and cached.

> **Can we build the core demo using real data without fabricating the central entities?**
> **YES.** The central entities are prices, markets and dates. All three are real, government-sourced, and obtainable before the event. Nothing central is invented.

---

### FSD 2 — Civic

| Field | Detail |
|---|---|
| Core entity | Citizen complaints: photo + GPS + timestamp + status + resolution + after-photo |
| Public source | **NONE FOUND.** |
| BMC / MCGM | **[VERIFIED FACT]** BMC does not publish complaint data. Citizen Matters reports that Praja had to file **RTI applications** to obtain it, and explicitly contrasts this with NYC's 311 portal, which publishes open and recently-closed service requests on a public map. India has no equivalent. |
| Other municipalities | Pune Municipal Corporation runs an open-data portal under NDSAP — **[UNVERIFIED]** whether it contains per-complaint records with photos and GPS. Even if it did, it would not cover Mumbai. |
| Aggregate data | State/ministry grievance counts exist on OGD, but they are aggregates — useless for clustering, priority scoring or spam detection, all of which need record-level data. |
| Partial real source | **RDD2022** (figshare, DOI-registered, IIT Roorkee / Univ. of Tokyo): 47,420 road images from six countries **including India**, 55,000+ annotated damage instances across longitudinal / transverse / alligator cracks and potholes. **[VERIFIED FACT]** — real, public, downloadable. |
| RDD2022 limitation | It is dashcam imagery with bounding-box damage annotations. **No GPS in the released annotations, no timestamps, no reporter identity, no status lifecycle, no before/after pairs.** It can seed *pictures*. It cannot seed *complaints*. |
| Auth / rate limits | N/A — nothing to authenticate against |
| Verification status | **RED for the core entity.** |

> **Can we build the core demo using real data without fabricating the central entities?**
> **NO.** Every complaint, every duplicate, every priority score, every spam pattern and every resolution in your demo would be authored by your team minutes before you present. You cannot demonstrate that your duplicate-detection works when you wrote both duplicates. You cannot demonstrate spam detection when you wrote the spam. This is a direct violation of your stated hard constraint, and it hits the *most interesting* parts of the statement.

---

## SECTION 4 — EXISTING SOLUTION AUDIT

### FSD 2 — the finding that decides this

**Strongest existing solution: MyBMC MARG (Management and Redressal of Grievances), Municipal Corporation of Greater Mumbai.**

| | |
|---|---|
| Launched | **22 April 2026**, inaugurated at BMC headquarters by Mayor Ritu Tawde. Android package `com.esri.ugms_bmc` (ESRI-built). |
| What it does | **114 complaint categories** including potholes, solid waste, sewerage, water supply, road maintenance, gardens, public health, pest control, encroachment, street lighting. **Geo-tagged photo upload.** Real-time status tracking from "Logged" to "Resolved" with transparent timelines. GIS integration. Citizen feedback on closure. **Employee side:** instant assignment to field staff, a dedicated interface to update progress and **upload "After" photos** and close tasks, and **analytical dashboards for supervisors to monitor ward-wise performance and identify recurring civic bottlenecks.** |
| Recent development | In **June 2026** BMC merged its standalone **Pothole QuickFix** app (which watermarked photos with latitude, longitude and contact number, and allowed reopening within 24 hours of resolution) into MyBMC MARG, creating a single-window system, and publicly urged Mumbaikars to report all potholes through it. |
| What it does NOT do | Automatic duplicate clustering by image similarity + geolocation; an explicit computed priority score using proximity to schools/hospitals, duplicate count and complaint age; algorithmic spam / fake-report detection; automated image-comparison verification of the repair (the after-photo is uploaded, but nothing appears to compare it to the before-photo). |
| Exact remaining gap | Four features, layered on top of an official municipal platform that already owns the workflow, the users, and the data. |

**Second incumbent:** **Swachhata-MoHUA** (MoHUA + Janaagraha) — national, photo + auto-location capture, routing to ward sanitary inspector/engineer, **upvoting other people's complaints** (manual dedup), push notification carrying the *resolved image*, and complaint reopening.

**Likelihood a judge says "this already exists": VERY HIGH.** You are in Vile Parle. Your judges live in Mumbai. BMC ran a public campaign in June 2026 telling Mumbaikars to use MyBMC MARG for potholes. There is a live chance a judge has the app on their phone.

### SIC 2

| | |
|---|---|
| **Agmarknet portal** (DMI) | Publishes the daily prices. Solves data availability. Gives a farmer no decision and an unusable interface. |
| **Kisan Suvidha** (Dept. of Agriculture) | Shows the **latest price** in the farmer's district plus the max price in state and India. Multilingual. **No forecast, no sell/wait call, no transport-adjusted comparison, no confidence.** Documented UX and stability complaints. |
| **eNAM** | Pan-India electronic trading portal networking APMC mandis, with an Agmarknet price dashboard. Helps you *transact*; doesn't help you choose *when*. Irrelevant to the ~75% selling outside APMC channels. |
| **"FarmerAI"** (Play Store, live mid-2026) | Advertises "sell now or wait", best mandi, trend, risk level, simple explanation. **The closest competitor by far.** No published methodology, no accuracy claim, no visible data-quality handling, no transparent transport economics. |
| **Academic prior art** (Penn State / arXiv) | Deep models over 1,300+ markets × 11 years recommending *where and when* to sell — e.g. wait five days and travel 40 km. Proves the approach; never shipped to farmers. |
| Exact remaining gap | Price **display** is solved. Transport-adjusted, uncertainty-aware, **evaluated** decision-making is not, and nothing shipped publishes an accuracy number anyone can audit. |

**Likelihood a judge says "this already exists": MEDIUM.** They will say "mandi price apps exist" — true, and you agree, then show them the backtest. Nobody in that room can point to a *Mumbai-launched government app from four months ago* that does what you're doing.

---

## SECTION 5 — 24-HOUR BUILD TEST

### SIC 2 — critical path: ingest → features → model → decision → UI

| Window | Amey | Janhavi | Purva (F1: Net Realisation) | Tanmay (F2: Evidence & Trust) |
|---|---|---|---|---|
| 0–1h | Freeze scope. Verify API key returns 200. Freeze the decision JSON contract. | Wireframe decision card | Confirm mandi lat/lon list | Confirm CEDA download works, check newest date |
| 1–3h | Repo, DB schema, ingestion job, date normalisation (DD/MM/YYYY → ISO) | PWA shell against frozen contract | Pre-compute distance matrix (OSRM), cache it | Load historical CSV, build train/test split |
| 3–8h | Feature builder (price lags, weather, **missing-value flag, outlier flag**), direction classifier | Decision card, why-panel, i18n | Transport-cost model, multi-mandi ₹-in-hand ranking | Walk-forward backtest harness + baselines (harvest-day, persistence) |
| 8–14h | Integration, abstention gate | Wire real data into UI | Hand off ranking API | Hand off metrics API |
| 14–18h | Tune abstention threshold | Marathi/Hindi, empty & error states, voice line | Edge cases (no nearby mandi) | Data-quality score per mandi/commodity |
| 18–22h | **Freeze. Cache the real demo snapshot.** Rehearse with network unplugged, twice. | Visual polish only | Demo path testing | Verify backtest numbers are reproducible |
| 22–24h | Q&A prep (Section 9 answers) | Slides | Slides | Numbers for slides |

**Parallelisable: ~70%.** Purva and Tanmay both need only the prices store (h3) and a stub predictor (h4) — Amey ships a dummy predictor early so neither blocks. Scope-explosion risk: **LOW**, because the statement itself is narrowly scoped ("Sell Today" / "Wait 2–3 Days").

### FSD 2 — critical path: seed data → clustering → priority → workflow → verification → UI

| Window | Amey | Janhavi | Purva | Tanmay |
|---|---|---|---|---|
| 0–1h | Scope freeze, schema | Wireframes | — | — |
| 1–3h | Auth + roles, DB, upload pipeline | Citizen report flow | **Build a fake-complaint seeder** | Overpass query for schools/hospitals |
| 3–8h | Perceptual hash / embedding + geo clustering | Authority dashboard | Priority scoring | Before/after image comparison |
| 8–14h | Integration | Wire up | Tune weights | Tune thresholds |
| 14–18h | Spam detection | Polish | Demo data curation | Verification tuning |
| 18–22h | Hardening | Polish | Rehearse | Rehearse |
| 22–24h | Slides + Q&A | Slides | — | — |

**Parallelisable: ~60%.** Everything depends on the seeder, which is on the critical path *and* is the thing that violates your data rule. Scope-explosion risk: **MEDIUM-HIGH** — five substantial subsystems (clustering, scoring, workflow, spam, verification) all wanted in one day.

**Finishing probability: SIC 2 clearly higher.**

---

## SECTION 6 — 3-MINUTE DEMO COMPARISON

### SIC 2
1. **0:00–0:20** "A farmer in Nashik has 20 quintals of onion. Sell today, or wait?"
2. **0:20–0:50** **Live call to data.gov.in on stage.** Today's real modal prices at four nearby mandis with their real reporting dates.
3. **0:50–1:40** Decision card: **"WAIT 2 DAYS · sell at Lasalgaon · +₹X/quintal after transport · confidence: medium."** Open the why-panel: trend, weather, distance cost, data-quality note.
4. **1:40–2:15** Switch to a mandi with a nine-day reporting gap. **The system refuses to advise**, explains why, redirects to the nearest reliable mandi. *Credibility beat.*
5. **2:15–2:50** Backtest panel: N real held-out market-days, our advice vs sell-on-harvest-day vs persistence, in ₹/quintal and hit-rate.
6. **2:50–3:00** Marathi voice output on a phone-width screen.

### FSD 2
1. Report a pothole with photo + GPS from a phone.
2. Report a second, near-identical one — watch them auto-cluster.
3. Priority score jumps because the location is near a school.
4. Authority dashboard: assign → resolve → upload after-photo → image comparison confirms.
5. Spam pattern flagged and suppressed.

Visually satisfying, easy to follow. And every object on screen was created by your team.

| Axis | FSD 2 | SIC 2 |
|---|---|---|
| First 30 seconds | 9 | 9 |
| Visual impact | 9 | 8 |
| Technical depth | 7 | 9 |
| **Real-data proof** | **2** | **10** |
| Wow factor | 7 | 8 |
| Clarity | 9 | 9 |
| Reliability | 6 (live clustering can mis-merge on stage) | 8 (with cached real snapshot) |

FSD 2 wins on pure *visual* appeal. SIC 2 wins the demo overall because of one moment FSD 2 structurally cannot produce: a number computed from real government data that nobody in the room can accuse you of authoring.

---

## SECTION 7 — DIFFERENTIATION TEST

### If 10 teams pick SIC 2, what makes ours different?
1. **Net realisation, not price.** Rank by ₹-in-hand = expected modal price − transport cost/quintal, over a 3-day horizon. Everyone else compares raw prices and calls the far mandi "better."
2. **Data-quality-aware modelling.** Missing-value and outlier flags as *model features*, following the published crop-price forecasting framework for emerging economies. Nobody else treats Agmarknet's defects as signal.
3. **Calibrated abstention.** Refuse to advise below a coverage threshold, on screen, with the reason.
4. **Direction with confidence, not point prediction** — because naive persistence is right ~60% of the time and useless, so RMSE is a meaningless metric here.
5. **A backtested rupee number.**

**Could another competent team build essentially the same demo in 24 hours? Harsh answer: they could build items 1 and 5 if they thought of them. They will not build 2, 3 and 4, because those require reading the literature before the event, and hackathon teams don't.** Your edge is preparation, not typing speed.

### If 10 teams pick FSD 2, what makes ours different?
Better clustering, a smarter priority formula, working spam detection. All four teams doing FSD 2 will have the same feature list, because the problem statement *is* the feature list — it enumerates clustering, priority, verification and spam detection explicitly.

**Could another competent team build essentially the same demo in 24 hours? Yes, and probably will.** FSD 2 rewards implementation speed, which is not your differentiator and is the one axis where a bigger or more caffeinated team beats you.

---

## SECTION 8 — RED TEAM

### FSD 2
- **Biggest hidden risk:** a Mumbai judge opens MyBMC MARG on their phone during your Q&A.
- **Biggest data risk:** the core entity is 100% fabricated, and BMC actively does not release the real version (RTI required).
- **Biggest technical risk:** image-similarity duplicate clustering mis-merging two genuinely different potholes live.
- **Biggest competition risk:** the PS enumerates its own features, so every team converges.
- **Biggest judge objection:** *"BMC launched this in April. What are you adding?"* Your honest answer is four incremental features.
- **Biggest demo failure:** clustering false-positive on stage, or being asked to add a complaint the judge chooses and watching it not cluster.
- **Biggest reason not to choose it:** it fails your own zero-mock-data rule at the level of the system's central object, not at the edges.
- **SURVIVES? NO.**

### SIC 2
- **Biggest hidden risk:** being dismissed as the standard Indian student project.
- **Biggest data risk:** the live endpoint's rate limits are **unverified**, and I could not personally get a 200 back. The historical series needs a second source (CEDA), whose recency I could not confirm.
- **Biggest technical risk:** a weak backtest edge over persistence.
- **Biggest competition risk:** several teams pick it; surfaces converge.
- **Biggest judge objection:** *"Kisan Suvidha shows prices and there's an app doing sell/wait."*
- **Biggest demo failure:** API outage at the exact moment of the live call.
- **Biggest reason not to choose it:** it looks unambitious on the title slide.
- **SURVIVES? YES** — every one of these is mitigable before hour zero: verify the key, cache a real snapshot, pull CEDA history, name the competitors on your own slide, and report the honest backtest number whatever it is. A modest edge, correctly measured, beats a suspicious one.

---

## SECTION 9 — THE DECISION

**1. Highest probability of finishing?** SIC 2. Shorter critical path, narrower statement, five subsystems vs one pipeline.

**2. Highest probability of impressing judges?** SIC 2. FSD 2 is prettier for 30 seconds; SIC 2 survives the next three minutes and the Q&A.

**3. Strongest real-data story?** SIC 2, not close. Real core entity vs zero real core entity.

**4. Least likely to look generic?** SIC 2 — but only if you build the differentiated version. The generic version of SIC 2 loses to a well-built FSD 2. The differentiated version of SIC 2 beats everything.

**5. Easiest to defend in Q&A?**
- *"Why doesn't an existing solution already solve this?"* → **SIC 2.** For FSD 2 the honest answer is "BMC's April 2026 app mostly does."
- *"Why should I believe your data is real?"* → **SIC 2.** "Watch, I'll call the government API right now." FSD 2 has no answer.
- *"What is technically innovative here?"* → **SIC 2.** Modelling the data's known defects as features, and a system calibrated to abstain. FSD 2's honest answer is "perceptual hashing plus a weighted score," which is competent engineering, not innovation.

**6. Better upside if executed exceptionally well?** SIC 2 — the ceiling is a verifiable impact claim. FSD 2's ceiling is a polished clone of a live municipal app.

**7. Safer?** SIC 2. Its single external dependency is fully cacheable; FSD 2's risk is a judge's phone, which you cannot mitigate.

**8. Which would I choose for this exact team?** **SIC 2.** Amey's strength is research and pipeline design, which SIC 2 rewards and FSD 2 doesn't. Janhavi gets a harder, more distinctive UX problem (low-literacy, multilingual, number-light) than another admin dashboard. Purva and Tanmay get two clean, self-contained, genuinely differentiating modules rather than "tune the clustering threshold."

---

## SECTION 10 — MESSAGE TO THE TEAM

> We're going with **SIC 2 (MandiMitra)** over FSD 2, and the reason isn't that crop prices are more interesting — it's that FSD 2 is already built. BMC launched **MyBMC MARG** on 22 April 2026: 114 complaint categories, geo-tagged photos, real-time tracking, field staff uploading "after" photos, ward-wise analytics dashboards. In June they folded Pothole QuickFix into it and publicly told Mumbaikars to report every pothole through it. Our judges are in Mumbai; some of them may have it installed. On top of that, BMC doesn't release complaint data — Praja had to file RTIs to get it — so every complaint, duplicate, spam pattern and resolution in our demo would be one we typed ourselves five minutes earlier. We'd be demoing a fabricated version of a real app that already exists in this city. SIC 2 gives us the opposite: a live government API we can call **on stage**, real historical data we can pull from the Ashoka CEDA portal beforehand, and one thing no other team will have — a **backtest**. We'll show that on real held-out market-days, our recommendation would have earned a farmer ₹X more per quintal than selling on harvest day. Real data, real number, checkable. And we're not building the usual price chart: we rank mandis by **rupees in hand after transport cost**, we feed Agmarknet's known missing-days and outliers into the model as features, and the system **refuses to advise** when the data is too thin — which is the moment that'll make the judges sit up. Four clean workstreams: Amey on pipeline and model, Janhavi on a low-literacy multilingual decision card, Purva on the transport-cost mandi ranking, Tanmay on the backtest. **82 vs 56.5 on the weighted rubric.** Not close.

---

## PRE-HACKATHON CHECKLIST (do this week, ~1 hour)

1. Register a data.gov.in API key. **Make one real call.** Confirm 200, confirm the newest `arrival_date` is within days of today, and check whether any date filter returns older records. Note any `X-RateLimit-*` headers.
2. Download one commodity–district series from `agmarknet.ceda.ashoka.edu.in`. **Check the newest date in the file.** If it stops in 2025, say so on the slide.
3. Pick your 3 commodities and 2 districts *after* steps 1 and 2 — choose whichever pairs have the densest recent coverage in both.
4. Pre-compute and cache the OSRM distance matrix for those mandis.
5. Pull the Open-Meteo history for the same districts.
6. Install Kisan Suvidha and find the FarmerAI Play Store listing. Screenshot both. They go on your "what exists" slide, in your words, before anyone asks.

## KNOWN LIMITATIONS TO DISCLOSE ON THE SLIDE

- The public price resource carries prices but **not arrival volumes** (CEDA has arrivals; the OGD API doesn't). Path: portal-side arrivals ingestion post-hackathon.
- Agmarknet is manually keyed with documented reporting gaps — which is why the abstention gate exists.
- Price information doesn't fix procurement access. Agrarian-studies researchers argue from the same NSO SAS-77 data that low MSP uptake reflects lack of *choice*, not lack of information. **Scope your claim to the ~75% who sell into local markets anyway.** Saying this yourself, first, is worth more than a feature.

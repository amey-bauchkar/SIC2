# IGNITE 8.0 — Problem Statement Selection Committee Report

**Team:** Amey (architecture / backend / AI-ML / integrations), Janhavi (UI-UX), Purva (Feature 1), Tanmay (Feature 2)
**Scope parsed:** 10 problem statements — FSD 1–4, AIM 1–3, SIC 1–3 (single official deck, SVKM / Shri Bhagubhai Mafatlal Polytechnic & CoE)
**Date of analysis:** 3 September 2026
**Constraint applied:** zero-mock-data as a hard rule; 24-hour build window

---

## SECTION A — EXECUTIVE VERDICT

### WINNER

**Problem Statement ID:** SIC 2
**Problem Statement:** MandiMitra — Smart Crop Price Selling Decision Support System
**Domain:** Social Impact Challenges (SIC)

**Why this is the strongest choice for our team.**

SIC 2 is the only problem statement in the entire deck whose core data source is a **verified, publicly accessible, currently-live government API that the problem statement itself names**. Every other candidate either has no real data at all (FSD 2, FSD 3, FSD 4, SIC 1), depends on private data a student team cannot obtain (FSD 1, AIM 2), or has real data attached to a problem that is so saturated that differentiation is nearly impossible (AIM 3, AIM 1, SIC 3).

That single fact reshapes everything. With real data guaranteed on hour zero, the team spends its 24 hours on *modelling and decision quality* rather than on inventing a fake world to demo against. It also means the team can do something almost no hackathon team ever does: **backtest the product against real history and put a rupee number on the screen** — "on 2,000 held-out real market-days, following our advice would have realised ₹X more per quintal than selling on harvest day." That is a measurable, verifiable, defensible impact claim rather than a slogan.

The residual risk — that SIC 2 looks "simple" or that six other teams pick it — is real and is answered not by picking a harder problem but by changing *what we build*. The generic version of this PS is a price chart plus an LSTM. Our version is a **net-realisation decision engine with calibrated abstention**: it optimises rupees-in-hand after transport cost across candidate mandis and dates, it knows when Agmarknet's data is too thin to advise, and it says so out loud. That is a research-grounded angle, not a feature list.

---

## SECTION B — TOP 10 OVERALL RANKING

All 10 statements in the deck, scored on the weighted framework in Section 16 of the brief.

| Rank | PS ID | Domain | Short Problem | Score /100 | Confidence | Main Reason |
|---|---|---|---|---|---|---|
| 1 | **SIC 2** | Social Impact | MandiMitra — crop price sell/wait decision support | **84.7** | HIGH | Only PS with a verified live government API as its core data source; decision-support gap over existing display-only apps is real |
| 2 | FSD 2 | Full Stack | Smart Civic Issue Reporting & Resolution | 64.8 | HIGH | Genuine full-stack depth and good demo, but Swachhata-MoHUA already ships the core nationally and all report data must be self-generated |
| 3 | AIM 2 | AI/ML | Financial Audit Anomaly Detection | 62.4 | MEDIUM | Excellent unsolved gap and real AI value, but Indian SME ledger/GST data is structurally inaccessible — fatal under our data rule |
| 4 | SIC 1 | Social Impact | CrisisConnect — emergency assistance platform | 60.0 | MEDIUM | High severity, but no real data, heavy COVID-era prior art, and verification (the hard part) can't be demonstrated |
| 5 | FSD 1 | Full Stack | Digital Identity for Gig Workers | 56.8 | HIGH | Problem is well documented by NITI Aayog, but the "verified consolidation" premise requires platform APIs that do not publicly exist |
| 6 | FSD 4 | Full Stack | Code Mafia — multiplayer debugging game | 56.4 | MEDIUM | Highest differentiation and wow-factor in the deck, but real-time collab editing + sandboxed execution + game sync is not a 24h build |
| 7 | AIM 3 | AI/ML | Misinformation Detection & Credibility | 56.3 | HIGH | Real APIs exist, but this is the single most saturated hackathon PS in circulation and the core task invites hallucination |
| 8 | SIC 3 | Social Impact | CareerMitra — rural career navigator | 52.5 | MEDIUM | Near-duplicate of AIM 1; no verified job-demand data source; LLM-wrapper risk |
| 9 | FSD 3 | Full Stack | Smart Appointment Queue Management | 50.5 | HIGH | Buildable and reliable, but it is CRUD plus a timer; almost no defensible gap |
| 10 | AIM 1 | AI/ML | AI-Driven Personalized Career Counselling | 47.2 | HIGH | AI is decorative, data is unverifiable, and "personality → career" claims are hard to defend under questioning |

---

## SECTION C — DOMAIN WINNERS

**Best Full Stack Problem**
ID: **FSD 2** — Smart Civic Issue Reporting & Resolution Platform
Score: 64.8
Why: It is the only FSD statement with genuine backend substance that isn't a game. Duplicate clustering by geo + image similarity, a multi-factor priority score, role-based verify/assign/resolve workflow, and before/after image verification give Amey real architecture to defend. FSD 1 has a better problem but an impossible data premise; FSD 3 is CRUD; FSD 4 is the most interesting engineering in the deck but not survivable in 24 hours.

**Best AI/ML Problem**
ID: **AIM 2** — AI-Powered Financial Audit Anomaly Detection Platform
Score: 62.4
Why: It is the only AI/ML statement where AI is genuinely CORE rather than decorative. Unsupervised anomaly detection over journal entries is an active research area with published, non-trivial methods, the users (CAs) have a concrete daily pain, and the explainability requirement in the PS is exactly what distinguishes a good solution from a bad one. It loses on one axis only — data — and that axis is weighted 12%.

**Best Social Impact Problem**
ID: **SIC 2** — MandiMitra
Score: 84.7
Why: Real users, real documented pain, real verified data, real measurable outcome, and a scope small enough to finish. It is the rare social-impact statement where impact can be *computed* rather than asserted.

### Direct comparison of the three domain winners

| | SIC 2 (MandiMitra) | FSD 2 (Civic) | AIM 2 (Audit) |
|---|---|---|---|
| Core data on hour zero | Live gov API, verified | None — must be seeded by us | None accessible for Indian SMEs |
| Can impact be measured? | Yes — backtest in ₹/quintal | Only simulated | Only on injected anomalies |
| Existing product overlap | Display-only apps; decision layer thin | Swachhata-MoHUA ships most of it | Enterprise tools (IDEA/ACL) — not SME-priced |
| 24h completion odds | High | Medium | Medium |
| "10 teams build the same thing" risk | Medium-high, but beatable by *how* | Medium | Low |
| Judge's first 30 seconds | Instant comprehension | Instant comprehension | Needs domain setup |

FSD 2 loses to SIC 2 because a judge who knows Swachhata exists will ask "why not just improve Swachhata?" and because every report in our demo will have been created by us five minutes earlier. AIM 2 loses to SIC 2 because the honest answer to "is your data real?" is "no, our anomalies are injected into a foreign public-sector ledger." SIC 2 answers both questions cleanly.

---

## SECTION D — FINAL TOP 5 DEEP COMPARISON

| Criterion | SIC 2 MandiMitra | FSD 2 Civic | AIM 2 Audit | SIC 1 CrisisConnect | FSD 1 Gig Identity |
|---|---|---|---|---|---|
| Problem severity | 9 — income-critical, recurring | 8 — chronic urban harm | 7 — professional inefficiency | 9 — life-critical when it bites | 8 — credit/livelihood exclusion |
| Evidence quality | Strong (NSO SAS-77, arXiv, Agmarknet's own missing-data report) | Strong (municipal grievance systems, app reviews) | Moderate (research literature, no Indian statistics found) | Moderate (COVID-era reporting) | Strong (NITI Aayog 2022, Code on Social Security 2020) |
| User pain | 8 — every harvest cycle | 8 — weekly, unresolved | 7 — every audit season | 8 — rare but extreme | 7 — continuous, invisible |
| Existing-solution gap | 7 — apps display prices, none decide well | 5 — Swachhata covers report/track/verify-by-photo | 7 — enterprise tools price out SMEs | 4 — many prior platforms, most dead | 7 — nothing consolidates, but for structural reasons |
| Real data | **10 — verified live gov API** | 4 — OSM/POI real, reports synthetic | 3 — no Indian SME ledger data public | 3 — none | 2 — no platform APIs exist |
| APIs | data.gov.in resource + Open-Meteo + Nominatim/OSRM | OSM/Overpass, Nominatim | None usable | Maps only | None |
| Technical feasibility | 9 | 7 | 6 | 7 | 5 |
| 24h feasibility | 9 | 6 | 6 | 6 | 4 |
| Differentiation | 7 (via net-realisation + abstention) | 6 | 7 | 4 | 6 |
| Demo | 9 — live real prices, ₹ backtest | 8 — visual before/after | 7 — good table, weak drama | 7 — map + matching | 6 — profile screens |
| Judge appeal | 8 | 7 | 7 | 7 | 7 |
| Risk | 8 (low) | 6 | 5 | 5 | 3 |
| Team fit | 9 | 8 | 7 | 8 | 7 |
| Measurable impact | 9 — computable in ₹ | 6 | 6 | 5 | 6 |

---

## SECTION E — REAL DATA AUDIT (TOP 5)

### SIC 2 — MandiMitra 🟢

| Field | Detail |
|---|---|
| Data Source | Current Daily Price of Various Commodities from Various Markets (Mandi) |
| Source Owner | Ministry of Agriculture & Farmers Welfare, DMI — published on OGD India (data.gov.in), generated from the AGMARKNET portal |
| URL | `https://www.data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi` · API resource id `9ef84268-d588-465a-a308-a864a43d0070` |
| Data Type | State, district, market, commodity, variety, grade, arrival_date, min_price, max_price, modal_price |
| Historical / Real-Time | Daily; refreshed as mandis report |
| Access Method | REST GET, `format=json`, `limit`/`offset` paging, server-side `filters[state]` / `filters[commodity]` |
| Authentication | Free `api-key` from data.gov.in registration |
| Availability | **VERIFIED** — third-party tooling shows live records with `arrival_date` of 15/07/2026, i.e. the feed was returning current data ~6 weeks before this analysis |
| Quality | Manual mandi entry; known missing days and outliers. Agmarknet publishes its own *"Statewise Marketwise Missing data Reported – Daily Report"* — we treat this as a feature, not a footnote |
| Relevance | Exactly the source the problem statement names |
| Hackathon Feasibility | Very high — key in minutes, no approval workflow |
| Verification Status | **GREEN** |

Supporting sources for SIC 2:
- **Open-Meteo** (free, no-key weather + historical archive) — 🟢 for the weather features that the arXiv framework shows improve crop-price models.
- **OSM Nominatim / OSRM** for mandi geocoding and road distance to compute transport cost — 🟡 (rate-limited; cache aggressively, or pre-compute the distance matrix for the demo districts before the event).
- **Known limitation, stated honestly:** the OGD price resource exposes prices but **not arrival quantity**, while the Agmarknet portal itself carries arrivals. Our model therefore uses price-history + weather + data-quality features, not volume. Flag this in the deck before a judge finds it. 🟡

### FSD 2 — Civic 🟡 / 🔴
- OSM/Overpass for school & hospital proximity — 🟢 real, free.
- **The complaint reports themselves — 🔴.** No public, per-report municipal pothole/garbage dataset with photos was verified. Every report in the demo would be created by us. Under the team's zero-mock-data rule this is disqualifying for the *core* entity of the system.

### AIM 2 — Audit 🔴
- Research-grade real general ledgers exist but are explicitly **confidential and unshareable** (stated in the literature).
- One genuine open GL dataset was identified: a **US state government open-data general ledger, quarterly CSV, CC BY**. 🟡 — real, but public-sector, foreign, and carries no GST, round-tripping or Indian SME semantics. The PS's headline patterns (GST-to-book mismatch, backdated entries) cannot be demonstrated on it without injecting anomalies.
- GSTN transaction-level data: not publicly accessible to a student team. 🔴

### SIC 1 — CrisisConnect 🔴
No verified real-time feed of genuine live emergency requests is publicly available. Every request, verification and match in the demo is fabricated.

### FSD 1 — Gig Identity 🔴
No public API from Zomato, Swiggy, Uber, Ola, Urban Company or comparable platforms exposes worker earnings, ratings or work history for consumption by a third party. Account Aggregator is a regulated framework requiring FIU status — **[ASSUMPTION]** that a student team cannot onboard within a hackathon, but a well-founded one. The entire premise of the PS is *verified* consolidation; without platform data the demo verifies nothing.

---

## SECTION F — EXISTING SOLUTION / COMPETITOR AUDIT

### SIC 2 — MandiMitra

| Existing solution | Who built it | What it does | Status | Solves | Does NOT solve |
|---|---|---|---|---|---|
| **Agmarknet portal** | DMI, Min. of Agriculture | Publishes daily min/max/modal prices and arrivals per market | Live, national | Data availability | Any decision; unusable UX for a farmer in a field |
| **Kisan Suvidha** | Dept. of Agriculture (GoI) | Weather, advisories, and *latest price* of crops in the farmer's district plus max price in state/India | Live, multilingual | Price visibility | No forecast, no sell/wait call, no transport-adjusted comparison, no confidence; reported UX and stability complaints |
| **eNAM** | Min. of Agriculture | Pan-India electronic trading portal networking APMC mandis; carries an Agmarknet price dashboard | Live | Trading and price discovery for enrolled mandis | Doesn't tell a farmer *when* to sell; participation is mandi-dependent |
| **"FarmerAI" (Play Store)** | Independent developer | Advertises "sell now or wait", best mandi, trend, risk level | Live as of mid-2026 | Same surface promise as this PS | No published methodology, no accuracy evidence, no data-quality handling, no visible transport-cost economics |
| **Academic prototypes** (Penn State / arXiv) | Researchers | Deep models over 1,300+ markets × 11 years recommending *where and when* to sell — e.g. wait five days and travel 40 km | Research, not deployed | Proves the approach works | Never shipped as a farmer-usable product |

**Are we genuinely solving an unsolved problem, or rebuilding an existing product?**

Honest answer: **partially both, and we must say so on stage.** Price *display* is solved — comprehensively, by the government. Price *decision-making* is not: the government apps stop at a number, and the one consumer app making the same promise as this PS publishes no method and no accuracy. Meanwhile the research literature has repeatedly shown the decision framing works and has never been productised for Indian farmers. That is the gap: **the decision layer, not the data layer.** A team that claims "no one shows mandi prices" will be destroyed by any judge with a phone. A team that says "everyone shows prices, nobody converts them into a defensible rupee decision, here is our backtest" wins the same room.

### FSD 2 — Civic
**Swachhata-MoHUA** (MoHUA + Janaagraha/IChangeMyCity, later redeveloped by CMS Computers) already provides: photo-with-mandatory-camera capture, automatic location capture, routing to the ward sanitary inspector/engineer, **upvoting other people's complaints**, push notifications carrying the *resolved image*, and reopening of unresolved complaints. That is the majority of FSD 2's brief, deployed nationally, with an engineer login. What it does **not** do: automatic duplicate clustering (its upvote is manual dedup), a computed priority score using proximity to schools/hospitals and complaint age, algorithmic spam/fake-report detection, or image-comparison verification of the repair. Real gap — but a narrow one, layered on top of a large incumbent.

### AIM 2 — Audit
Enterprise audit analytics (CaseWare IDEA, ACL/Diligent, Big-4 internal platforms) cover this for large clients. The gap is genuine and well-framed: **SME audit practices in India are priced out of those tools**, and the PS's explainability requirement is the exact thing generic anomaly scores fail at. Strong opportunity — blocked only by data.

### SIC 1 — CrisisConnect
A wave of COVID-era resource-matching platforms proved both that the need is real and that the hard parts are *verification* and *decay of stale requests* — the two things a 24-hour demo cannot honestly show.

### FSD 1 — Gig Identity
e-Shram registers unorganised workers and the Code on Social Security, 2020 defines gig/platform workers for the first time, but neither creates a portable, verified, cross-platform reputation record. Gap is real; the blocker is that platforms have no commercial incentive to expose the data, which is a business problem, not an engineering one.

---

## SECTION G — USER & PAIN AUDIT

### SIC 2 — MandiMitra
- **Primary user:** small and marginal farmers with harvested produce and a sell-or-hold decision, plus the household member who actually operates the phone.
- **Secondary users:** FPOs and village aggregators negotiating on behalf of members; agri extension officers; commission agents (as a check on quoted rates).
- **Stakeholders:** DMI/Agmarknet as data provider; APMC mandis as reporters; transporters, whose cost determines whether a "better" mandi is actually better.
- **Current workflow:** ask neighbours and the local trader, or take the produce to the nearest mandi on harvest day and accept the rate offered. Some check Kisan Suvidha or a portal and read a single number.
- **Biggest pain:** the farmer sees a *price* but must guess a *decision* — whether waiting two days or travelling 40 km nets more money after transport, and whether today's quoted rate is even representative.
- **Why current solutions fail:** they output numbers, not recommendations; they don't net out transport; they don't distinguish a reliable price series from a mandi that hasn't reported in nine days; and they don't tell the farmer how confident they are.
- **Severity:** high-impact. Sale price is the primary determinant of crop income for a smallholder.
- **Frequency:** periodic but concentrated — every harvest, with a decision window of days.
- **Consequence:** distress selling into a depressed local rate, with knock-on effects on debt servicing in a sector with well-documented agrarian distress.
- **Evidence [STRONG]:** NSO's Situation Assessment Survey (77th round, ref. year 2018-19, report 587) found that among rice-growing households that sold produce in kharif 2018-19, **three-quarters made their major sale in local markets**, only ~16% to APMC mandis/cooperatives/government agencies; only **~41% were aware of MSP**, falling to **~30%** for awareness of procurement agencies; and only **0.5%** sold in markets because the market price beat MSP.
- **Counter-evidence we must carry honestly [STRONG]:** the Foundation for Agrarian Studies reads the same data as showing *lack of choice* rather than lack of information — many farmers had no procurement agency available at all. So price information is necessary but not sufficient. Our claim must therefore be scoped: **for the ~75% who sell into local markets, timing and market choice are the levers we can actually move.** Overclaiming here is the fastest way to lose a knowledgeable judge.

### FSD 2 — Civic
Primary: any resident; Secondary: ward engineers and municipal supervisors; Pain: complaints vanish into a queue with no prioritisation and no proof of repair; Severity: moderate-to-serious (potholes are a road-safety issue); Frequency: continuous; Consequence: repeat complaints, eroded trust, unsafe roads. Evidence is strong but so is the incumbent.

### AIM 2 — Audit
Primary: CAs running multiple SME audits; Secondary: audit juniors, SME promoters; Pain: sampling-based manual review of ledgers, which the research literature explicitly calls unreliable at modern data volumes; Severity: serious operational; Frequency: seasonal-continuous; Consequence: missed irregularities and wasted senior time.

### SIC 1 — CrisisConnect
Primary: people in acute need and volunteers; Pain: stale and duplicated requests waste volunteer effort; Severity: mission-critical when active; Frequency: rare-but-catastrophic; Consequence: misdirected resources.

### FSD 1 — Gig Identity
Primary: multi-platform gig workers; Secondary: lenders and employers; Pain: no portable proof of income or reputation, so credit access is limited; Severity: high; Frequency: continuous; Consequence: exclusion from formal finance. Evidence [VERIFIED]: NITI Aayog's 2022 report estimated 7.7 million gig workers in 2020-21, projected to reach 23.5 million by 2029-30 (~2.6% → 6.7% of the non-agricultural workforce), a figure the Ministry of Labour has repeated in Parliament.

---

## SECTION H — TECHNICAL FEASIBILITY (TOP 5)

### SIC 2 — MandiMitra — 🟢 GREEN
| Layer | Assessment |
|---|---|
| Frontend | React/Next PWA. Low-literacy, number-light, icon+colour-led, Marathi/Hindi/English. Mobile-first. Straightforward for Janhavi. |
| Backend | FastAPI or Node. Ingest → normalise (`DD/MM/YYYY` → ISO) → cache → feature build → decision. Genuinely designed, not CRUD. |
| Database | Postgres (or SQLite for the hackathon) with one prices table + one markets table with lat/lon; cached distance matrix. |
| APIs | data.gov.in mandi resource (core), Open-Meteo (weather features), OSRM/Nominatim (distance, pre-cached). |
| AI/ML | Gradient-boosted direction classifier (up / flat / down over 2–3 days) with data-quality features + a calibrated abstention threshold. Trains in seconds on CPU. |
| Infrastructure | Single container. No GPU. No training cluster. |
| External dependencies | One critical (data.gov.in). Mitigated by an on-disk snapshot of real historical data pulled before the event. |
| Hardest component | Honest backtesting harness — walk-forward split, no lookahead leakage. |
| Riskiest component | Live API latency/downtime during the demo. |
| MVP complexity | MODERATE |
| 24h feasibility | **HIGH** |

### FSD 2 — Civic — 🟡 YELLOW
Image similarity for duplicate clustering (perceptual hash or a small embedding model) plus geo-clustering, priority scoring, role-based auth, and before/after verification. Each piece is doable; together with a seeding pipeline for demo reports it is a tight 24 hours. Hardest: reliable image-comparison verification. Riskiest: false-positive duplicate merges on stage.

### AIM 2 — Audit — 🟡 YELLOW
Isolation Forest / autoencoder over engineered journal-entry features plus rule-based checks (Benford, weekend/backdated postings, round-number bias, duplicate detection) and SHAP-style explanations. Technically clean and fast. Riskiest and hardest: obtaining data with credible Indian semantics — which is exactly where it fails.

### SIC 1 — CrisisConnect — 🟡 YELLOW
Real-time updates, geo-matching, and role-based verification. Buildable; the hard parts (trust, decay, anti-abuse) are unbuildable in a day and unmeasurable in a demo.

### FSD 1 — Gig Identity — 🔴 RED
Verifiable credentials, consent-driven sharing, and selective disclosure are architecturally interesting and the correct answer — but with no upstream data source, the system verifies self-asserted claims, which the judge will spot immediately.

*(Noted for completeness: FSD 4 Code Mafia would be 🔴 RED at 24 hours — CRDT-based collaborative editing, a sandboxed multi-language execution runner, and synchronised hidden-role game state is a multi-week build, and the demo needs 5–7 live players.)*

---

## SECTION I — DIFFERENTIATION TEST

### SIC 2 — MandiMitra — **7/10**
**Could 10 other teams build essentially the same thing?** They will build the *same surface* — a crop dropdown, a mandi dropdown, a line chart, and a "SELL TODAY" badge. Almost certainly. That is why differentiation must be structural:

1. **Net realisation, not price.** Recommend on ₹-in-hand = expected modal price − transport cost per quintal to that mandi, over a 3-day horizon. Every other team will compare raw prices and call the far mandi "better". This reframing is validated by published research recommending farmers travel to a different market on a later day.
2. **Data-quality-aware modelling.** Agmarknet is manually keyed and has documented missing days and outliers — the platform publishes its own missing-data report. We encode missing-value flags and outlier flags as model features, following the published framework for crop-price forecasting in emerging economies. No other team will treat the data's defects as signal.
3. **Calibrated abstention.** When recent coverage for a mandi/commodity pair is too sparse, the system refuses to advise and falls back to the nearest reliable mandi, on screen, with the reason. A model that knows when to stay silent reads as engineering maturity, not as a limitation.
4. **Direction over point estimate.** Research on this exact data shows naive persistence ("tomorrow = today") is right ~60% of the time and gives farmers nothing actionable — so we classify *direction with confidence* and evaluate against that baseline rather than reporting a meaningless RMSE.
5. **A backtested rupee number.** Walk-forward evaluation on held-out real market-days, reported as ₹/quintal versus the harvest-day-sale baseline and versus persistence.
6. **UX built for the actual user.** Voice output in Marathi/Hindi, three-colour decision, one number, works on a slow connection.

Items 1–5 are things another team cannot bolt on in the last hour, because they change the model, the evaluation and the interface all at once.

### FSD 2 — 6/10. Differentiation would have to come from clustering quality and priority-score design; the workflow itself is commodity.
### AIM 2 — 7/10. Explainability quality is the differentiator, but a weak data story undercuts it.
### SIC 1 — 4/10. Nearly every team builds the same map-and-request-board.
### FSD 1 — 6/10. Verifiable-credential architecture is differentiating; nothing to verify is not.

---

## SECTION J — DEMO TEST (TOP 5)

### SIC 2 — ideal 3-minute demo
1. **0:00–0:20** — One line: "A farmer in Nashik has 20 quintals of onion. Today, does he sell, or wait?" Judge understands instantly.
2. **0:20–0:50** — Live pull from data.gov.in in front of the room. Today's real modal prices at the four nearest mandis appear with their real reporting dates. *This is the moment that separates us from every mock-data team.*
3. **0:50–1:40** — The decision card: **"WAIT 2 DAYS · sell at Lasalgaon · +₹X per quintal after transport · confidence medium."** Then open the "why": recent trend, weather feature, distance cost, and the data-quality note.
4. **1:40–2:15** — Switch to a mandi with a nine-day reporting gap. The system **refuses to advise** and explains why, then redirects to the nearest reliable mandi. This is the credibility beat.
5. **2:15–2:50** — The backtest panel: N held-out real market-days, our advice versus sell-on-harvest-day and versus persistence, in ₹/quintal and hit-rate.
6. **2:50–3:00** — Voice output in Marathi on a phone-width screen.

| Axis | Score |
|---|---|
| Visual impact | 8 |
| Technical depth | 9 |
| User clarity | 10 |
| Real-data demonstration | 10 |
| Wow factor | 8 |
| Reliability | 8 (with cached fallback) |

**FSD 2:** strong visual before/after and a satisfying duplicate-merge animation, but every report was created by us. Visual 9 / depth 7 / real-data 3 / wow 7 / reliability 6.
**AIM 2:** a ranked risk table with explanations is professional but not dramatic, and "we injected these anomalies" is a bad sentence to say out loud. Visual 6 / depth 8 / real-data 3 / wow 6 / reliability 7.
**SIC 1:** map pins matching in real time demos well but proves little. Visual 8 / depth 5 / real-data 2 / wow 6 / reliability 7.
**FSD 1:** profile and consent screens; nothing verifiable happens. Visual 6 / depth 6 / real-data 2 / wow 5 / reliability 7.

---

## SECTION K — RED TEAM (FINAL 3)

### SIC 2 — MandiMitra

**Why it could fail.**
1. **"This is a college project everyone has done."** Mandi price prediction is one of the most common Indian student projects in existence. A judge may pattern-match to that in the first ten seconds and stop listening.
2. **A near-identical consumer app already ships.** A Play Store app was advertising "should you sell now or wait / best mandi / risk level" as of mid-2026. If a judge knows it, "what's new?" arrives immediately.
3. **The information thesis is contestable.** Agrarian-studies researchers argue that low procurement access reflects absence of choice, not absence of information. A well-read judge can argue our product doesn't touch the binding constraint.
4. **Forecast honesty.** Three-day crop-price forecasting is genuinely hard. If our backtest shows only a small edge over persistence, we have to show that number anyway.
5. **API dependency on stage.** One outage and the differentiating moment evaporates.
6. **Missing arrivals data.** The public price resource carries prices but not arrival volumes, weakening a supply-side feature set an expert judge might expect.

**Does it survive? YES** — but only in the specific form recommended here. It survives because (1) the net-realisation reframing is not what the common student project does; (2) the incumbent app publishes no method and we publish a backtest; (3) we voluntarily scope our claim to the ~75% selling into local markets and name the structural limit ourselves before a judge does; (4) an honest small edge, correctly measured, beats a fabricated large one; (5) a pre-pulled real snapshot removes the outage risk; (6) the arrivals gap is disclosed in the deck as a known limitation with a stated path (portal-side arrivals ingestion post-hackathon). A team that pre-empts all six of its own weaknesses reads as senior.

### FSD 2 — Civic

**Why it could fail.** Swachhata-MoHUA already does photo + geolocation + routing to the ward engineer + resolved-image push + reopen, nationally. Our genuine additions (auto-clustering, priority score, spam detection, image-verified resolution) are real but incremental, and every data point on screen is ours. Duplicate clustering can also fail live and merge two distinct potholes in front of the judges. Adoption realism is weak: municipalities don't switch platforms because a student built a better score.

**Does it survive? NO** — not as a winner. It is a solid second choice and would be defensible if the team's differentiator were the clustering/priority engine specifically, but the data story fails the team's own hard constraint.

### AIM 2 — Audit

**Why it could fail.** The whole value rests on running against ledgers that look like Indian SME books, and those are not publicly available; research-grade ledgers are explicitly confidential and unshareable. The one open general-ledger dataset located is a foreign public-sector one with no GST semantics. So the demo becomes "we injected the anomalies we then detect," which is circular, and a judge will say so. Add a false-positive problem the literature specifically warns about — reversals, provisions and year-end adjustments generating red flags that aren't fraud — and a hostile question about explainability quality is hard to answer with confidence.

**Does it survive? NO.** Excellent problem, wrong hackathon. It is the right idea for a team with a partner CA firm willing to share anonymised books; it is the wrong idea for a 24-hour build under a zero-mock-data rule.

---

## SECTION L — FINAL WINNER DEEP DIVE: SIC 2 — MandiMitra

**1. Why this problem?** It is the only statement in the deck where a real, verified, live data source, a real documented user pain, a real unfilled gap, and a 24-hour-sized scope all coincide.

**2. Why now?** The data plumbing is finally public and current — the OGD mandi resource was returning fresh daily records as of July 2026 — while the products sitting on top of it have not moved past displaying a number.

**3. Who suffers?** Small and marginal farmers selling into local markets, which per NSO SAS-77 is roughly three-quarters of rice-selling households, most of whom are not reaching procurement channels at all.

**4. Evidence the problem is real.** NSO Report 587 (77th round): ~16% of rice-selling households made their major sale to APMC/cooperative/government agencies; ~41% MSP awareness, ~30% procurement-agency awareness; 0.5% chose markets because the price beat MSP. Agmarknet publishes its own statewise/marketwise missing-data report, confirming reporting gaps. Peer-reviewed and preprint work documents that Agmarknet series carry missing values and outliers and that naive persistence forecasting is near-useless to a farmer.

**5. Existing solutions.** Agmarknet portal, Kisan Suvidha, eNAM, plus at least one consumer app making the same sell/wait promise. See Section F.

**6. Exact gap.** Price *display* is solved; **transport-adjusted, uncertainty-aware sell/wait/where decisions are not**, and no shipped product publishes an accuracy claim a farmer or a judge can check.

**7. Why our solution can win.** It optimises the right objective (₹ in hand, not ₹ quoted), it treats the data's known defects as modelled features rather than ignoring them, it abstains when it shouldn't speak, and it proves its own value with a walk-forward backtest on real held-out days.

**8. Real data strategy.**
- Register a data.gov.in API key **before** the hackathon.
- Pull a multi-month real history for 2–3 commodities (onion, tomato, soybean) across Nashik/Pune/Ahmednagar district mandis and store it on disk. This is real government data, cached — not mock data.
- Pre-compute the mandi distance matrix via OSRM/Nominatim to avoid rate limits on stage.
- Pull Open-Meteo history for the same districts.
- On stage: one **live** API call for today's prices, with the cached snapshot as a silent fallback.

**9. Technical architecture direction.**
```
data.gov.in mandi API ─┐
Open-Meteo archive ────┼─► ingest + normalise ─► prices store ─► feature builder ─┐
OSRM distance matrix ──┘        (DD/MM/YYYY→ISO, dedupe)                          │
                                                                                   ▼
                                              decision engine: direction model + net-realisation
                                              + data-quality gate + abstention
                                                                                   │
                                              REST API ◄──────────────────────────┘
                                                   │
                                     PWA (decision card · why-panel · backtest · voice)
```

**10. AI/ML role — USEFUL, bordering CORE.** The decision cannot be made well by a threshold rule, because it needs a direction estimate, a confidence, and a quality gate simultaneously. But we should be precise with judges: the *forecast* is a gradient-boosted classifier, deliberately small and interpretable; the *intelligence* is in the objective function and the abstention policy. Claiming more than that invites a takedown.

**11. MVP scope.**
- **MUST HAVE:** live + historical price ingestion; crop & mandi selection; 3-day direction model with confidence; net-realisation comparison across the 3–5 nearest mandis; the decision card with a plain-language why; the data-quality gate and abstention path.
- **SHOULD HAVE:** Marathi/Hindi UI; price history chart; nearest-reliable-mandi fallback.
- **WOW FEATURE:** the **live backtest panel** — "over N real held-out market-days, this advice would have realised ₹X/quintal more than selling on harvest day, and beat persistence Y% of the time." Real data, real number, computed live.
- **CUT:** user accounts and login, SMS/IVR gateway, crop disease detection, chatbot, marketplace/trading, admin dashboards, notifications infrastructure, more than three commodities.

**12. What NOT to build.** Anything that turns this into "dashboard + chatbot + prediction + alerts." Every hour spent on auth is an hour not spent on the backtest that wins the room.

**13. Expected demo flow.** As Section J.

**14. Biggest risks.** (a) API unavailability on stage; (b) a weak backtest edge; (c) the "this already exists" question; (d) over-scoping into a chatbot.

**15. Mitigation.** (a) cached real snapshot + one live call; (b) report the honest number and frame it against persistence — a modest, correctly measured edge is more credible than a suspicious one; (c) open the pitch by naming Kisan Suvidha and eNAM ourselves and stating precisely what they don't do; (d) freeze scope at hour 3 and refuse additions after hour 14.

**16. Scalability path.** Add commodities and districts by configuration, not code. Ingest arrivals from the Agmarknet portal to add supply-side features. Add IVR/SMS for feature-phone reach. Distribute through FPOs, who make the same decision for hundreds of members and are a far better adoption wedge than individual farmers.

**17. Measurable impact.** ₹/quintal realised versus harvest-day baseline on held-out real days; direction hit-rate versus persistence; % of queries where the system correctly abstains on low-quality data. All three are computed, not claimed.

---

## SECTION M — 24-HOUR BUILDABILITY TEST

| Window | Work | Owner |
|---|---|---|
| **0–1h** | Freeze scope. Register/verify data.gov.in key. Confirm live API response. Pick 3 commodities and 8–10 mandis in 2 districts. Agree the decision contract (input → output JSON). | All (Amey leads) |
| **1–3h** | Repo, API skeleton, DB schema, ingestion job pulling real history to disk. Janhavi begins the decision-card design against the frozen JSON contract. Distance matrix pre-computed. | Amey + Janhavi |
| **3–8h** | **Parallel.** Amey: feature builder + direction model + abstention gate. Purva: net-realisation module (transport cost, multi-mandi ranking). Tanmay: backtest harness (walk-forward split, baselines, metrics). Janhavi: PWA shell, decision card, why-panel, i18n strings. | All 4 |
| **8–14h** | Integration behind the frozen contract. First end-to-end run on real data. Wire the backtest panel. Fix the inevitable date-format and missing-day bugs. | All 4 |
| **14–18h** | Tune abstention threshold. Marathi/Hindi strings. Empty states, error states, offline fallback. Cache the demo snapshot. | All 4 |
| **18–22h** | Demo hardening: scripted click path, fallback rehearsal with the network unplugged, dry run twice, kill anything that breaks. **No new features.** | All 4 |
| **22–24h** | Slides (problem → evidence → what exists → our gap → live demo → backtest → limitations → roadmap). Rehearse hostile Q&A from Section O. | Janhavi + Amey |

**Does it survive the schedule? Yes.** The critical path — ingest → features → model → decision → UI — is short, and the three parallel workstreams (net-realisation, backtest, UI) depend only on the frozen JSON contract, not on each other. The realistic failure mode is scope creep, not technical impossibility.

---

## SECTION N — TEAM PARALLELIZATION TEST

| Member | Module | Owns |
|---|---|---|
| **Amey** | Core | Ingestion, normalisation, feature builder, direction model, abstention gate, API, integration |
| **Janhavi** | UI/UX | PWA, decision card, why-panel, backtest panel, multilingual strings, low-literacy visual language, voice output |
| **Purva** | Feature 1 — Net Realisation | Distance matrix, transport-cost model, multi-mandi ranking by ₹-in-hand, "best mandi" selection |
| **Tanmay** | Feature 2 — Evidence & Trust | Walk-forward backtest harness, baselines (harvest-day, persistence), metrics, data-quality scoring per mandi/commodity, the abstention rationale text |

- **Module boundaries:** clean. Purva's module takes `(origin, candidate_mandis, predicted_prices)` and returns a ranked list; Tanmay's takes `(model, history)` and returns metrics; neither touches the other's code.
- **Shared contracts:** one JSON decision object and one prices table schema. Freeze both by hour 3 and treat changes as emergencies.
- **Dependencies:** Purva and Tanmay both need the prices store (hour 3) and a stub model (hour 4) — Amey ships a dummy predictor early so neither blocks.
- **Integration points:** hours 8–14, one at a time: net-realisation first, then backtest, then UI wiring.
- **Merge conflicts:** low risk — four separate directories, one shared types file.
- **Parallelisable:** ~70% of the work.
- **Sequential:** ingestion → features → model (Amey's chain), and final demo hardening.

This is an unusually clean four-way split, which is itself a feasibility advantage.

---

## SECTION O — JUDGE QUESTION STRESS TEST

1. **"Why does this need to exist when Kisan Suvidha already shows mandi prices?"** — Kisan Suvidha shows the latest price in your district and the max in the state. It does not tell you whether to sell today, does not net out the cost of reaching a farther mandi, and does not tell you how confident it is. We built the decision, not the display.
2. **"Isn't eNAM already solving this?"** — eNAM is a trading platform for enrolled mandis. It helps you transact; it doesn't help you choose *when*. A farmer selling in a local market outside eNAM — the majority, per NSO SAS-77 — gets nothing from it.
3. **"There's an app on the Play Store that says exactly this."** — There is, and it publishes no methodology and no accuracy figure. We publish a walk-forward backtest against two baselines. Ask them for theirs.
4. **"Where does your data come from?"** — The Government of India's open data platform, resource `9ef84268-…`, generated from Agmarknet by the Directorate of Marketing and Inspection. Free API key. We can call it live right now.
5. **"Is your data real?"** — Yes, all of it. The only cached data is a real historical pull we made before the event so a network failure can't kill the demo.
6. **"What happens if the data is wrong?"** — That's designed for. Agmarknet is manually keyed and publishes its own missing-data report. We encode missing-value and outlier flags as model features, we score each mandi/commodity pair for reliability, and below threshold we abstain and redirect to the nearest reliable mandi rather than guessing.
7. **"Why AI/ML at all — isn't this a moving average?"** — A moving average can't give you a calibrated confidence or an abstention decision, and a persistence rule is right about 60% of the time while telling the farmer nothing. We classify direction with confidence and evaluate against exactly those baselines.
8. **"Why this model and not a deep network?"** — Short, gappy, per-mandi series with a few hundred usable points. Gradient boosting on engineered features beats a deep sequence model at this data size, trains in seconds, and is interpretable — which the farmer-facing "why" panel requires.
9. **"How accurate is it?"** — [Live number from the backtest.] Reported as direction hit-rate versus persistence and ₹/quintal versus harvest-day sale, on held-out days the model never saw. We report it whatever it is.
10. **"What about edge cases — a mandi that hasn't reported in ten days?"** — Demonstrated live: the system refuses to advise and says why.
11. **"Farmers don't have smartphones / can't read."** — The interface is three colours, one number and a voice line in Marathi. The scale path is IVR/SMS and distribution through FPOs, who make this decision for hundreds of members.
12. **"Doesn't the real problem lie in procurement access, not information?"** — Agrarian-studies researchers make exactly that argument from the same SAS-77 data, and they're right about the binding constraint for MSP access. We're not claiming to fix procurement. We're claiming that for the ~75% who sell into local markets anyway, timing and market choice are levers we can move, and we've measured how much.
13. **"How will this scale?"** — Commodities and districts are configuration. The heavy path is ingest-and-cache, which is horizontal. Distance matrices are pre-computed once per district.
14. **"What stops a competitor copying you?"** — Nothing technical, and we won't pretend otherwise. The defensible asset is the evaluation discipline and FPO distribution, not the code.
15. **"What happens after the hackathon?"** — Add arrivals from the Agmarknet portal, widen commodity coverage, run a pilot with one FPO, and publish the backtest so users can audit the claim.
16. **"Who pays for it?"** — Farmer-side free. The payers are FPOs and state agri-marketing boards, who already fund market intelligence work — Karnataka, for example, has moved to set up a market intelligence cell for exactly this class of decision.
17. **"What's the measurable impact?"** — ₹/quintal realised versus baseline, direction hit-rate, and correct-abstention rate. All three on real held-out data.
18. **"Why should we believe your backtest isn't leaking?"** — Walk-forward split, no future rows in any feature window, and the code is in the repo. Happy to run it on a date range you choose.

---

## SECTION P — "WHAT WOULD MAKE US LOSE?"

**Five ways another team beats us on this problem:**

1. **They demo real data too, and their model is better evaluated.** → We must have the backtest working by hour 14, not hour 22. It is the single highest-value artefact; it is Tanmay's only job for a reason.
2. **They pick FSD 4 (Code Mafia) and somehow pull it off.** A working multiplayer hidden-role debugging game is more memorable than any decision-support tool. → We can't out-spectacle that; we out-*credential* it. Our counter is a rupee number derived from government data — substance where they have theatre. Lead the demo with the live API call and the backtest, not with the chart.
3. **They out-UX us.** Judges reward what they can see. A team with a beautiful, obviously-farmer-usable interface will beat a better model behind an ugly screen. → Janhavi must have the decision card visually finished by hour 8, not hour 18, and it must survive being viewed at phone width from three metres away.
4. **They frame the problem better in the first 30 seconds.** → Open with the concrete farmer and the concrete decision, not with statistics. Statistics come at second 45, once the judge cares.
5. **They pre-empt the "this exists" objection and we don't.** → We name Kisan Suvidha, eNAM and the Play Store competitor on our own slide, in our own words, before anyone asks. Being the team that already knew is worth more than being the team with one more feature.

**What we would need to do differently from the default plan:** cut scope harder than feels comfortable at hour 3, treat the backtest as a P0 deliverable rather than a nice-to-have, and rehearse the demo twice with the network disconnected.

---

## SECTION Q — FINAL DECISION MATRIX

| Dimension | Weight | Winner score /10 | Weighted | Explanation |
|---|---|---|---|---|
| Problem Severity & Real Need | 12% | 9 | 10.8 | Sale price is the primary determinant of smallholder crop income; SAS-77 documents the market-dependence |
| Existing-Solution Gap | 12% | 7 | 8.4 | Display is solved; transport-adjusted, uncertainty-aware decisions are not — but competitors exist and we must be honest |
| Real Data Availability & Quality | 12% | 10 | 12.0 | Verified live government API, named by the PS itself, free key, current as of mid-2026 |
| Technical Feasibility | 10% | 9 | 9.0 | No GPU, no training cluster, one critical dependency |
| 24-Hour MVP Feasibility | 10% | 9 | 9.0 | Short critical path, clean parallel split |
| Differentiation | 10% | 7 | 7.0 | Strong if we build net-realisation + abstention + backtest; weak if we build a chart |
| Demo Potential | 8% | 9 | 7.2 | Live real prices, a live refusal-to-advise, a live rupee number |
| User Pain & Adoption | 7% | 8 | 5.6 | Real and recurring; FPO distribution is a credible wedge |
| Judge Appeal | 6% | 8 | 4.8 | Understood in ten seconds; substance survives questioning |
| Team Fit | 5% | 9 | 4.5 | Maps exactly onto Amey/Janhavi/Purva/Tanmay |
| Scalability | 4% | 8 | 3.2 | Config-driven expansion; ingest is horizontal |
| Reliability / Risk | 4% | 8 | 3.2 | One dependency, fully mitigated by a real cached snapshot |
| **FINAL SCORE** | **100%** | | **84.7 / 100** | |

- **Research Confidence:** HIGH — problem evidence from NSO Report 587 and a counter-reading from FAS; competitor set verified directly; data-quality issues confirmed by Agmarknet's own reporting and by peer-reviewed/preprint literature.
- **Technical Confidence:** HIGH — no component requires unproven technology.
- **Data Confidence:** HIGH — endpoint, schema, field names, auth model and recency all verified from multiple independent sources. Two known limitations documented (no arrival volumes in the public price resource; manual-entry gaps).
- **Demo Confidence:** HIGH, conditional on the cached-snapshot fallback being built and rehearsed.
- **Winning Potential:** HIGH, conditional on execution discipline — specifically on the backtest existing and the scope freeze holding.

---

## SECTION R — FINAL VERDICT

### CHOOSE THIS
**SIC 2 — MandiMitra: Smart Crop Price Selling Decision Support System**

### WHY
1. It is the **only problem statement in the deck** whose core data source is a verified, currently-live, publicly accessible government API — and the problem statement names that source itself, which means the organisers have already validated the data path.
2. The user pain is documented by primary government statistics: per NSO's 77th-round Situation Assessment Survey, roughly three-quarters of rice-selling households made their major sale in local markets, only ~41% were aware of MSP, and only 0.5% chose the market because it beat MSP. These are farmers making a price decision with almost no decision support.
3. The gap is real and precisely locatable: Agmarknet, Kisan Suvidha and eNAM **display** prices; none of them convert a price into a transport-adjusted, confidence-scored sell/wait/where recommendation, and no shipped competitor publishes an accuracy claim anyone can check.
4. It is the only candidate where **impact can be computed rather than claimed** — a walk-forward backtest on real held-out market-days produces a rupee-per-quintal number live on stage.
5. The 24-hour path is short and the four-way parallel split is unusually clean, so the team spends its time on decision quality instead of on fabricating a world to demo against.
6. It satisfies the team's non-negotiable zero-mock-data constraint completely; four of the ten statements in this deck cannot.

### DO NOT CHOOSE
**FSD 2 — Smart Civic Issue Reporting & Resolution Platform** (score 64.8, the strongest alternative).
Reject it because Swachhata-MoHUA already ships photo-plus-geolocation reporting, routing to the ward engineer, complaint upvoting, resolved-image push notifications and complaint reopening, nationally — leaving us with an incremental layer (clustering, priority scoring, spam detection) on top of a large government incumbent. And every complaint in our demo would be one we created ourselves minutes earlier, which fails the team's own data rule at the level of the system's *core entity*.

### BIGGEST RISK
That we build the generic version — a price chart with a "SELL TODAY" badge — and become interchangeable with every other team that picked SIC 2. The problem statement does not differentiate us; the objective function and the abstention policy do.

### BIGGEST ADVANTAGE
We can make a live call to a government API in front of the judges and then show a rupee number computed from real held-out history. Almost no other team in the room, on any problem statement in this deck, can do both.

### WHAT WE MUST PROVE
That following MandiMitra's recommendation would have earned a real farmer measurably more money than selling on harvest day — on real historical data the model never saw. Everything else in the demo is supporting material for that one claim.

### WINNING ANGLE
Don't predict prices — **optimise rupees in hand after transport, and be the only team whose system openly refuses to advise when the government's own data is too thin to justify a recommendation.**

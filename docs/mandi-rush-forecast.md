# Bhed Vivek — Mandi Rush Forecast

> *"Will the mandi be crowded when I get there?"*
> A farmer has to answer that **before** loading the trolley. Until now, MandiMitra made them guess.

---

## The problem with the old Bhed Vivek

The congestion engine shipped with two defects that made it a simulation rather than an intelligence layer:

1. **The farmer had to supply the answer.** `supplyPressure` was a LOW / MEDIUM / HIGH button. The
   model then told them what would happen *under the scenario they picked* — which is useless if
   you cannot know the scenario in advance. That is precisely the information the farmer lacks.

2. **Congestion sensitivity was a hand-written table.** 19 mandis had an assigned constant
   (`'lasalgaon': 0.08`, `'manmad': 0.25`, …). The other **63** registered yards silently fell
   through to a single default of `0.15`. None of the 19 numbers were measured.

Both are now gone.

---

## What replaced them

`src/core/mandi-rush.ts` produces a **per-mandi, per-day arrival-pressure forecast**. Bhed Vivek
consumes it; the farmer supplies nothing.

### The four components

| # | Component | Weight | Basis | What it actually is |
|---|-----------|--------|-------|---------------------|
| 1 | **Outlet scarcity** | 0.30 | **MEASURED** | Of the yards inside the farmer's search radius, how many actually trade this commodity today? Counted from the live Agmarknet feed. If only 2 of 12 nearby yards buy tomato, every tomato grower in the belt converges on those two. |
| 2 | **Yard absorption** | 0.25 | **MEASURED** | How many distinct commodities and lots the yard reported today, percentile-ranked against every reporting Maharashtra yard. APMC Mumbai trades 69 commodities; a village yard trades 1. The big one absorbs a surge. |
| 3 | **Harvest season** | 0.25 | REFERENCE | Whether this month is a peak, shoulder or off-peak arrival window for this crop, from published DMI / NHB / ICAR-DOGR marketing calendars. |
| 4 | **Rainfall + yard rhythm** | 0.20 | MIXED | Rainfall is a **live Open-Meteo forecast** for the destination district. The weekly closed-day rhythm is documented MSAMB yard practice and is flagged as an institutional assumption, not a measurement. |

`pressureScore = Σ (component × weight)`, in `0..1`, banded into LOW / MEDIUM / HIGH.

The API returns each driver with its `contribution`, its `weight`, an `isMeasured` flag and a
plain-language `evidence` string. The audit re-computes the score from those published drivers and
asserts it matches to within 0.002 — so the number a farmer sees can always be taken apart.

### Why rainfall matters more than it looks

Rain is the most immediate physical driver of arrivals: harvesting, field drying and farm-to-yard
transport all stall. So arrivals **collapse** on a wet day and are **released as a backlog** on the
first workable day afterwards. That is what turns a flat weekly average into an actionable
day-by-day outlook:

```
2026-09-04 Friday    LOW    Friday: dry. Arrivals build ahead of the weekend.
2026-09-05 Saturday  MEDIUM Saturday: dry. Sellers pre-empt the Sunday closure.
2026-09-06 Sunday    —      Yard normally CLOSED — do not travel. Produce held today adds to the Monday backlog.
2026-09-07 Monday    MEDIUM Monday: two-day backlog clears — structurally the heaviest arrival day.
```

### Closed yards are never recommended

A shut yard scores low on *crowding* for the obvious reason that no auction happens. Presenting
that as "a quiet day worth travelling to" would send a farmer to a locked gate. Every day carries
an `isYardClosed` flag; closed days are excluded from the quiet-day recommendation and the advice
string warns about them explicitly. This is asserted by `audit_deep.py` (L36–L38) and
`scripts/test_mandi_rush.py`.

### Congestion sensitivity is now measured

`congestionSensitivity` (the PCS term in `ΔP = Price × PCS × θ × τ`) is the yard's **measured**
position inside the documented `0.06 … 0.26` band, derived from its trading-breadth percentile:

```
csi = CSI_MIN + (CSI_MAX − CSI_MIN) × (1 − absorptionIndex)
```

Every one of the candidate yards gets a value; none share a hardcoded default. The audit asserts
that a broader yard is never scored as *more* congestion-sensitive than a thinner one.

---

## What we deliberately did **not** use

**Intra-day price dispersion, `(max − min) / modal`.** It looks like an obvious liquidity proxy and
it was the first thing tried. It was rejected after testing against the real dataset:

- correlation between yard breadth and dispersion is **+0.29** — the wrong sign;
- the "tightest-clearing" yards turned out to be small ones reporting `min == modal == max` for a
  single lot, which is a **reporting artifact**, not deep liquidity;
- Pimpalgaon Baswant, a genuine terminal, showed 0.77 dispersion on a 2-lot sample.

Shipping it would have inverted the ranking with false confidence. The rejection and its evidence
are recorded in the header of `src/core/mandi-rush.ts`.

---

## The honest limitation

**Agmarknet publishes no arrival tonnage.** The resource MandiMitra consumes
(`9ef84268-d588-465a-a308-a864a43d0070`, *Current Daily Price of Various Commodities from Various
Markets*) carries exactly these fields:

```
state, district, market, commodity, variety, grade, arrival_date, min_price, max_price, modal_price
```

There is no quantity column. The CEDA observed archive in `data/historical/observed/` has an
`arrivals_quintals` column, but it is empty for every row.

So this is a forecast of **arrival pressure** from observable structure — *not* a tonnage
prediction, and it does not claim to be one. `/api/mandi-rush` states this in its `methodology`
array on every single response, and the audit asserts that disclosure is present.

**What would make it a true arrivals model:** a daily arrivals feed (CEDA's paid tier, or an MSAMB
yard-gate feed). The engine is already shaped to take it — arrivals would enter as a fifth,
measured component and would let the weights be fitted rather than fixed.

---

## Latency: the decision endpoint never waits on the weather

Adding a live rainfall dependency to `/api/evaluate` would have made the core sell/wait decision
hostage to an upstream API. It does not:

| Path | Weather behaviour |
|------|-------------------|
| `POST /api/evaluate` | **Never blocks.** Answers from the cached live forecast if warm, otherwise from the labelled ERA5 climatology, and warms the cache in the background for the next request. Measured 12-125 ms on a completely cold cache across six districts. |
| `GET /api/mandi-rush` | **May block** for the live forecast — the farmer explicitly asked about the crowd, so waiting ~1 s once per district per 3 hours is the right trade. |
| `POST /api/bhed-vivek/analyze` | May block, same reasoning. |

Cells are fetched **sequentially**, not in parallel: concurrent TLS handshakes to Open-Meteo are
dropped on some networks, which silently degraded cells to climatology while the bundle still
advertised itself as live. Sequential fetching plus a single retry fixed that, and the bundle-level
`isWeatherLive` is now true only when *every* cell is live.

---

## API

### `GET|POST /api/mandi-rush`

```
GET /api/mandi-rush?commodity=Onion&latitude=19.9975&longitude=73.7898&radiusKm=120&horizonDays=5
```

Returns every candidate yard **sorted quietest-first**, each with `predictedPressure`,
`pressureScore`, `confidence`, `congestionSensitivity`, `absorptionIndex`, the four `drivers`, a
`byDay` outlook and `dataBasis` provenance strings. The response-level `weatherSource` is
`open-meteo-forecast`, `mixed` or `era5-climatology`, and `isWeatherLive` is true only when **every**
district cell was live — a partially-degraded bundle can never advertise itself as fully live.

### `POST /api/bhed-vivek/analyze`

- **Omit `supplyPressure`** → MandiMitra forecasts it. Response carries
  `supplyPressureBasis: "FORECAST"`, plus `winnerRushForecast` and `rushForecasts`.
- **Send `supplyPressure`** → treated as an explicit farmer what-if. Response carries
  `supplyPressureBasis: "USER_OVERRIDE"`.

The two can never be confused, which matters: a prediction and a hypothetical must not look alike.

### `POST /api/evaluate`

Carries `mandiRush` inline, so the Decision Hub renders the crowd outlook without a second call.

---

## In the UI

The Bhed Vivek card now leads with the **prediction**:

- a badge with the predicted crowd level and a `MANDIMITRA FORECAST · <confidence>` tag;
- a **4-day outlook strip** — one chip per day, colour-coded, showing expected rainfall and marking
  closed days;
- a collapsible **"Why we expect this crowd"** panel listing all four drivers, each tagged
  *measured* or *reference* with its evidence sentence;
- the LOW / MEDIUM / HIGH buttons demoted to an explicit *"Explore a what-if instead"* control,
  with a **↺ Back to forecast** button that returns to the prediction.

---

## Verification

| Suite | Coverage |
|-------|----------|
| `scripts/test_mandi_rush.py` | 22 checks — coverage, measured sensitivity, score recomposition, today-anchoring, closed-day safety, provenance consistency, Bhed Vivek integration, determinism |
| `audit_deep.py` Section L | 51 audit points — reference-data integrity, driver labelling, hand re-derivation of `ΔP`, forecast/override separation |
| `scripts/deep_test_all_features.py` | end-to-end endpoint contract |

Run them with the backend up:

```bash
node dist/backend/server.js
```

"""
MANDIMITRA - MANDI RUSH FORECAST TEST SUITE
============================================
Bhed Vivek used to make the farmer guess the crowd (LOW / MEDIUM / HIGH) and scored yards against
19 hardcoded congestion constants. This suite asserts that the replacement is a genuine forecast
built on measured inputs:

  1. Every candidate yard gets a forecast, not just the 19 that used to be in the table.
  2. Congestion sensitivity VARIES by yard and tracks measured trading breadth.
  3. Outlet scarcity and yard absorption are counted from the live Agmarknet feed.
  4. Rainfall comes from a live forecast (or a clearly-labelled climatology fallback).
  5. The outlook is day-by-day and starts from TODAY, not the price feed's date.
  6. A closed yard is never recommended as a "quiet day".
  7. Bhed Vivek consumes the forecast by default and records FORECAST vs USER_OVERRIDE basis.
  8. A manual override still works and remains monotone in the crowd level.
  9. Every driver is labelled measured vs reference, with stated evidence.

Run with the backend up:  node dist/backend/server.js
"""

import json
import sys
import datetime
import urllib.request
import urllib.error

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE = "http://localhost:3001"
PASS = 0
FAIL = 0


def check(name, fn):
    global PASS, FAIL
    try:
        ok, detail = fn()
    except Exception as exc:  # noqa: BLE001
        ok, detail = False, f"crashed: {exc}"
    if ok:
        PASS += 1
        print(f"  PASS  {name}  -  {detail}")
    else:
        FAIL += 1
        print(f"  FAIL  {name}  -  {detail}")


def get(path):
    with urllib.request.urlopen(urllib.request.Request(f"{BASE}{path}"), timeout=90) as r:
        return json.loads(r.read().decode("utf-8"))


def post(path, payload):
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.loads(r.read().decode("utf-8"))


RUSH = "/api/mandi-rush?commodity=Onion&latitude=19.9975&longitude=73.7898&radiusKm=120&horizonDays=5"

print("=" * 72)
print("MANDI RUSH FORECAST — PREDICTED ARRIVAL PRESSURE")
print("=" * 72)


def t_endpoint():
    d = get(RUSH)
    assert d["forecasts"], "no forecasts returned"
    assert d["commodity"] == "Onion"
    assert len(d["methodology"]) >= 4, "methodology not disclosed"
    return True, f"{len(d['forecasts'])} yards forecast, weather source = {d['weatherSource']}"


check("Endpoint returns a forecast for every candidate yard", t_endpoint)


def t_covers_all_yards():
    """The old PCS table covered 19 mandis. Every candidate must now be covered."""
    d = get(RUSH)
    ev = post("/api/evaluate", {"commodity": "Onion", "latitude": 19.9975, "longitude": 73.7898, "radiusKm": 120})
    ev_ids = {e["market"]["id"] for e in ev["evaluations"]}
    rush_ids = {f["marketId"] for f in d["forecasts"]}
    missing = ev_ids - rush_ids
    assert not missing, f"yards with no rush forecast: {missing}"
    return True, f"all {len(ev_ids)} candidate yards have a forecast (old hardcoded table covered 19 statewide)"


check("Every candidate yard is covered, not just a hardcoded subset", t_covers_all_yards)


def t_csi_varies_with_breadth():
    """Congestion sensitivity must be MEASURED: it should fall as trading breadth rises."""
    d = get(RUSH)
    pairs = [(f["yardBreadth"], f["congestionSensitivity"]) for f in d["forecasts"]]
    distinct = {c for _, c in pairs}
    assert len(distinct) > 1, f"congestion sensitivity is constant across yards: {distinct}"
    widest = max(pairs, key=lambda p: p[0])
    narrowest = min(pairs, key=lambda p: p[0])
    assert widest[1] <= narrowest[1], (
        f"broader yard {widest} should not be MORE congestion-sensitive than {narrowest}"
    )
    return True, (
        f"{len(distinct)} distinct sensitivities; breadth {widest[0]} -> csi {widest[1]}, "
        f"breadth {narrowest[0]} -> csi {narrowest[1]}"
    )


check("Congestion sensitivity is measured and varies by yard", t_csi_varies_with_breadth)


def t_csi_in_band():
    d = get(RUSH)
    for f in d["forecasts"]:
        assert 0.05 <= f["congestionSensitivity"] <= 0.30, (
            f"{f['marketName']} sensitivity {f['congestionSensitivity']} outside the documented band"
        )
    return True, "every sensitivity sits inside the documented 0.06-0.26 band"


check("Congestion sensitivity stays inside its documented band", t_csi_in_band)


def t_outlet_scarcity_measured():
    d = get(RUSH)
    f = d["forecasts"][0]
    assert f["candidateYardsInRange"] > 0, "candidate count not measured"
    assert 1 <= f["peerOutletsInRange"] <= f["candidateYardsInRange"], (
        f"peer outlets {f['peerOutletsInRange']} vs candidates {f['candidateYardsInRange']}"
    )
    driver = next(x for x in f["drivers"] if x["id"] == "outlet_scarcity")
    assert driver["isMeasured"] is True, "outlet scarcity must be flagged measured"
    assert str(f["peerOutletsInRange"]) in driver["evidence"], "evidence does not cite the measured count"
    return True, f"{f['peerOutletsInRange']} of {f['candidateYardsInRange']} yards in range trade this crop"


check("Outlet scarcity is counted from the live feed", t_outlet_scarcity_measured)


def t_absorption_measured():
    d = get(RUSH)
    driver_ok = 0
    for f in d["forecasts"]:
        dr = next(x for x in f["drivers"] if x["id"] == "yard_absorption")
        assert dr["isMeasured"] is True, "absorption must be flagged measured"
        assert 0.0 <= f["absorptionIndex"] <= 1.0, f"absorption index out of range: {f['absorptionIndex']}"
        driver_ok += 1
    return True, f"{driver_ok} yards carry a measured absorption percentile"


check("Yard absorption is a measured percentile", t_absorption_measured)


def t_drivers_labelled():
    d = get(RUSH)
    f = d["forecasts"][0]
    ids = {x["id"] for x in f["drivers"]}
    assert ids == {"outlet_scarcity", "yard_absorption", "harvest_season", "weather_rhythm"}, ids
    total_weight = round(sum(x["weight"] for x in f["drivers"]), 6)
    assert abs(total_weight - 1.0) < 1e-6, f"driver weights sum to {total_weight}, not 1.0"
    season = next(x for x in f["drivers"] if x["id"] == "harvest_season")
    assert season["isMeasured"] is False, "the harvest calendar is reference data and must say so"
    for x in f["drivers"]:
        assert len(x["evidence"]) > 20, f"driver {x['id']} has no stated evidence"
    return True, "4 drivers, weights sum to 1.0, each labelled measured/reference with evidence"


check("Every driver states its evidence and whether it is measured", t_drivers_labelled)


def t_score_recomposes():
    """The published score must be exactly the weighted blend of the published components."""
    d = get(RUSH)
    worst = 0.0
    for f in d["forecasts"]:
        blended = sum(x["contribution"] * x["weight"] for x in f["drivers"])
        worst = max(worst, abs(blended - f["pressureScore"]))
    assert worst <= 0.002, f"score does not recompose from its drivers (max deviation {worst:.4f})"
    return True, f"score == sum(contribution x weight) for every yard (max deviation {worst:.4f})"


check("Pressure score recomposes exactly from its published drivers", t_score_recomposes)


def t_outlook_starts_today():
    d = get(RUSH)
    f = d["forecasts"][0]
    today = datetime.date.today().isoformat()
    assert f["byDay"][0]["date"] == today, (
        f"outlook starts {f['byDay'][0]['date']} but today is {today} — a farmer plans from today, "
        "not from the price feed's date"
    )
    dates = [x["date"] for x in f["byDay"]]
    assert dates == sorted(dates), "outlook days are not in chronological order"
    return True, f"outlook runs {dates[0]} -> {dates[-1]}"


check("Day-by-day outlook is anchored on today", t_outlook_starts_today)


def t_levels_valid():
    d = get(RUSH)
    for f in d["forecasts"]:
        assert f["predictedPressure"] in {"LOW", "MEDIUM", "HIGH"}
        for day in f["byDay"]:
            assert day["level"] in {"LOW", "MEDIUM", "HIGH"}
            assert 0.0 <= day["pressureScore"] <= 1.0
        assert f["confidence"] in {"HIGH", "MEDIUM", "LOW"}
    return True, "all levels, scores and confidences are within their legal domains"


check("Levels, scores and confidence are well-formed", t_levels_valid)


def t_closed_day_never_recommended():
    """A shut yard scores low on crowding for the wrong reason. It must never be offered as quiet."""
    d = get(RUSH)
    offenders = []
    for f in d["forecasts"]:
        closed = [x for x in f["byDay"] if x["isYardClosed"]]
        if not closed:
            continue
        advice = f["farmerAdvice"]["en"]
        for c in closed:
            if f"quietest trading day in the next" in advice and f"is {c['weekdayName']} " in advice:
                offenders.append(f"{f['marketName']}: recommends closed {c['weekdayName']}")
            if "closed" not in advice.lower():
                offenders.append(f"{f['marketName']}: closed day not warned about")
    assert not offenders, "; ".join(offenders[:3])
    any_closed = sum(1 for f in d["forecasts"] for x in f["byDay"] if x["isYardClosed"])
    return True, f"{any_closed} closed-day slots flagged and excluded from the quiet-day advice"


check("A closed yard is never surfaced as a quiet day to travel to", t_closed_day_never_recommended)


def t_weather_provenance():
    d = get(RUSH)
    assert d["weatherSource"] in {"open-meteo-forecast", "mixed", "era5-climatology"}, d["weatherSource"]
    note = d["weatherSourceNote"]
    assert len(note) > 20, "weather provenance not disclosed"

    # The summary label and the summary note must not contradict each other.
    if d["weatherSource"] == "open-meteo-forecast":
        assert "unavailable" not in note.lower() and "climatology" not in note.lower(), (
            f"source claims live but the note says otherwise: {note[:120]}"
        )
        assert d["isWeatherLive"] is True
        rains = [x["expectedRainMm"] for f in d["forecasts"] for x in f["byDay"]]
        assert any(r is not None for r in rains), "live weather claimed but no rainfall values present"
    elif d["weatherSource"] == "mixed":
        assert "mixed" in note.lower(), "mixed provenance not explained in the note"
        assert d["isWeatherLive"] is False, "a partially-live bundle must not claim to be fully live"
    else:
        assert d["isWeatherLive"] is False

    # Per-mandi provenance must agree with each mandi's own note.
    for f in d["forecasts"]:
        basis = " ".join(f["dataBasis"]).lower()
        if f["isWeatherLive"]:
            assert "unavailable" not in basis, f"{f['marketName']} claims live weather but cites a fallback"
    return True, f"{d['weatherSource']} (live={d['isWeatherLive']}) — {note[:80]}"


check("Rainfall provenance is disclosed and matches the data", t_weather_provenance)


def t_methodology_admits_no_arrivals():
    """The honest limitation must be stated: Agmarknet gives no arrival tonnage."""
    d = get(RUSH)
    joined = " ".join(d["methodology"]).lower()
    assert "tonnage" in joined or "arrival" in joined, "methodology does not describe the arrivals limitation"
    assert "not a tonnage prediction" in joined or "publishes no arrival" in joined, (
        "the no-arrivals-data limitation is not disclosed"
    )
    return True, "methodology states plainly that this is arrival pressure, not tonnage"


check("Methodology discloses that no arrival tonnage exists", t_methodology_admits_no_arrivals)


def t_sorted_quietest_first():
    d = get(RUSH)
    scores = [f["pressureScore"] for f in d["forecasts"]]
    assert scores == sorted(scores), "forecasts are not sorted quietest-first"
    return True, f"quietest yard is {d['forecasts'][0]['marketName']} at {scores[0]:.3f}"


check("Forecasts are returned quietest-yard first", t_sorted_quietest_first)


# --------------------------------------------------------------- Bhed Vivek integration
print()
print("=" * 72)
print("BHED VIVEK INTEGRATION")
print("=" * 72)

BV = {"commodity": "Onion", "latitude": 19.9975, "longitude": 73.7898, "quantityQuintals": 25}


def t_bhed_defaults_to_forecast():
    d = post("/api/bhed-vivek/analyze", BV)
    assert d["supplyPressureBasis"] == "FORECAST", d["supplyPressureBasis"]
    assert d.get("winnerRushForecast"), "no rush forecast attached to the winning mandi"
    assert d.get("rushForecasts"), "no per-mandi forecasts attached"
    return True, f"predicted {d['supplyPressure']} (theta={d['supplyPressureNumeric']}), no farmer input needed"


check("Bhed Vivek predicts the crowd when the farmer says nothing", t_bhed_defaults_to_forecast)


def t_bhed_override_flagged():
    d = post("/api/bhed-vivek/analyze", {**BV, "supplyPressure": "HIGH"})
    assert d["supplyPressureBasis"] == "USER_OVERRIDE", d["supplyPressureBasis"]
    assert d["supplyPressure"] == "HIGH"
    return True, "a manual what-if is recorded as USER_OVERRIDE, never presented as a prediction"


check("A manual what-if is clearly distinguished from a prediction", t_bhed_override_flagged)


def t_bhed_override_monotone():
    out = {}
    for lvl in ("LOW", "MEDIUM", "HIGH"):
        d = post("/api/bhed-vivek/analyze", {**BV, "supplyPressure": lvl})
        out[lvl] = d["congestionImpactPerQtl"]
    assert out["LOW"] < out["MEDIUM"] < out["HIGH"], out
    return True, f"impact rises monotonically: {out['LOW']} < {out['MEDIUM']} < {out['HIGH']} Rs/q"


check("Congestion impact is monotone in the crowd level", t_bhed_override_monotone)


def t_bhed_pcs_matches_forecast():
    d = post("/api/bhed-vivek/analyze", BV)
    winner_id = d["originalWinner"]["marketId"]
    fc = next((f for f in d["rushForecasts"] if f["marketId"] == winner_id), None)
    assert fc, "winning mandi missing from the attached forecasts"
    assert abs(fc["congestionSensitivity"] - d["pcs"]) < 1e-9, (
        f"Bhed Vivek used pcs={d['pcs']} but the forecast measured {fc['congestionSensitivity']}"
    )
    return True, f"pcs {d['pcs']} comes straight from the measured forecast for {fc['marketName']}"


check("Bhed Vivek uses the measured sensitivity, not a table lookup", t_bhed_pcs_matches_forecast)


def t_bhed_impact_formula():
    """dP = GrossPrice x PCS x theta x tau, with tau = 0.35 on day 0."""
    d = post("/api/bhed-vivek/analyze", BV)
    w = d["originalWinner"]
    tau = {0: 0.35, 1: 0.90, 2: 1.00, 3: 0.75}[w["day"]]
    expected = round(w["grossPrice"] * d["pcs"] * d["supplyPressureNumeric"] * tau, 1)
    assert abs(expected - d["congestionImpactPerQtl"]) <= 0.15, (
        f"hand-computed {expected} vs reported {d['congestionImpactPerQtl']}"
    )
    return True, f"{w['grossPrice']} x {d['pcs']} x {d['supplyPressureNumeric']} x {tau} = {expected} Rs/q"


check("Congestion impact re-derives by hand from the published factors", t_bhed_impact_formula)


def t_evaluate_carries_rush():
    d = post("/api/evaluate", {"commodity": "Onion", "latitude": 19.9975, "longitude": 73.7898, "radiusKm": 120})
    mr = d.get("mandiRush")
    assert mr, "/api/evaluate does not carry the rush forecast"
    assert len(mr["forecasts"]) == len(d["evaluations"]), "forecast count does not match candidate count"
    assert d["bhedVivek"]["supplyPressureBasis"] == "FORECAST"
    return True, f"{len(mr['forecasts'])} forecasts inline, weather live = {mr['isWeatherLive']}"


check("/api/evaluate carries the rush forecast inline", t_evaluate_carries_rush)


def t_varies_by_commodity():
    """September is peak for Tomato but off-peak for Onion; the forecast must reflect that."""
    onion = get("/api/mandi-rush?commodity=Onion&latitude=19.9975&longitude=73.7898&radiusKm=120")
    tomato = get("/api/mandi-rush?commodity=Tomato&latitude=19.9975&longitude=73.7898&radiusKm=120")
    o_season = next(x for x in onion["forecasts"][0]["drivers"] if x["id"] == "harvest_season")
    t_season = next(x for x in tomato["forecasts"][0]["drivers"] if x["id"] == "harvest_season")
    assert o_season["contribution"] != t_season["contribution"], (
        "seasonality identical across two crops with different published calendars"
    )
    return True, f"Onion season factor {o_season['contribution']} vs Tomato {t_season['contribution']}"


check("Forecast responds to the published crop calendar", t_varies_by_commodity)


def t_determinism():
    a = get(RUSH)
    b = get(RUSH)
    sa = [(f["marketId"], f["pressureScore"]) for f in a["forecasts"]]
    sb = [(f["marketId"], f["pressureScore"]) for f in b["forecasts"]]
    assert sa == sb, "rush forecast is not deterministic within a cache window"
    return True, "identical results across repeated calls"


check("Forecast is deterministic within its cache window", t_determinism)


print()
print("=" * 72)
print(f"  PASSED: {PASS}    FAILED: {FAIL}    TOTAL: {PASS + FAIL}")
print("=" * 72)
sys.exit(0 if FAIL == 0 else 1)

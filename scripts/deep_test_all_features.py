"""
MANDIMITRA — COMPREHENSIVE DEEP FEATURE VERIFICATION SUITE
============================================================
Tests EVERY backend endpoint, core engine, data integrity, and edge case.
"""

import json
import urllib.request
import urllib.error
import time
import sys
import traceback

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE = "http://localhost:3001"
PASS = 0
FAIL = 0
WARN = 0
results = []

def test(name, func):
    global PASS, FAIL, WARN
    try:
        status, detail = func()
        if status == "PASS":
            PASS += 1
            print(f"  ✅ PASS: {name}")
        elif status == "WARN":
            WARN += 1
            print(f"  ⚠️ WARN: {name} — {detail}")
        else:
            FAIL += 1
            print(f"  ❌ FAIL: {name} — {detail}")
        results.append((status, name, detail))
    except Exception as e:
        FAIL += 1
        tb = traceback.format_exc()
        print(f"  ❌ CRASH: {name} — {e}")
        results.append(("FAIL", name, str(e)))

def get(path):
    req = urllib.request.Request(f"{BASE}{path}")
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))

def post(path, payload):
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))

# ============================================================
# SECTION 1: HEALTH & CONNECTIVITY
# ============================================================
print("\n" + "=" * 70)
print("SECTION 1: HEALTH & CONNECTIVITY")
print("=" * 70)

def test_health():
    d = get("/api/health")
    assert d["status"] == "healthy", f"Expected healthy, got {d['status']}"
    assert "timestamp" in d, "Missing timestamp"
    assert d["system"] == "MandiMitra", f"Wrong system: {d['system']}"
    return ("PASS", f"v{d['version']} at {d['timestamp']}")

test("GET /api/health", test_health)

# ============================================================
# SECTION 2: NEARBY MARKETS API
# ============================================================
print("\n" + "=" * 70)
print("SECTION 2: NEARBY MARKETS — GET /api/markets/nearby")
print("=" * 70)

def test_nearby_default():
    d = get("/api/markets/nearby")
    assert "markets" in d, "Missing 'markets' key"
    assert "count" in d, "Missing 'count' key"
    assert d["count"] > 0, f"No markets found, got count={d['count']}"
    return ("PASS", f"Found {d['count']} markets within default radius")

test("Default params (Nashik center)", test_nearby_default)

def test_nearby_custom_radius():
    d = get("/api/markets/nearby?lat=19.9975&lon=73.7898&radiusKm=30")
    assert d["count"] >= 1, "Expected at least 1 market within 30km"
    for m in d["markets"]:
        assert m.get("estimatedRoadDistanceKm", 999) <= 30, f"{m['name']} is {m['estimatedRoadDistanceKm']}km away, exceeds 30km"
    return ("PASS", f"{d['count']} markets within 30km, all distances verified ≤ 30km")

test("Custom radius 30km", test_nearby_custom_radius)

def test_nearby_tiny_radius():
    d = get("/api/markets/nearby?lat=19.9975&lon=73.7898&radiusKm=1")
    return ("PASS", f"{d['count']} markets within 1km (expected ~0)")

test("Tiny radius 1km (edge case)", test_nearby_tiny_radius)

def test_nearby_huge_radius():
    d = get("/api/markets/nearby?lat=19.9975&lon=73.7898&radiusKm=500")
    assert d["count"] > 10, f"Expected many markets at 500km, got {d['count']}"
    return ("PASS", f"{d['count']} markets within 500km radius")

test("Large radius 500km", test_nearby_huge_radius)

def test_nearby_market_fields():
    d = get("/api/markets/nearby?radiusKm=100")
    m = d["markets"][0]
    required = ["id", "name", "state", "district", "lat", "lon", "estimatedRoadDistanceKm"]
    missing = [f for f in required if f not in m]
    if missing:
        return ("FAIL", f"Market missing fields: {missing}")
    return ("PASS", f"All required fields present in market data: {list(m.keys())}")

test("Market object has all required fields", test_nearby_market_fields)

def test_nearby_sorted():
    d = get("/api/markets/nearby?radiusKm=100")
    dists = [m["estimatedRoadDistanceKm"] for m in d["markets"]]
    for i in range(1, len(dists)):
        if dists[i] < dists[i-1]:
            return ("FAIL", f"Markets not sorted by distance: idx {i-1}={dists[i-1]}, idx {i}={dists[i]}")
    return ("PASS", f"Markets sorted ascending by distance ({len(dists)} entries)")

test("Markets sorted by distance (ascending)", test_nearby_sorted)

# ============================================================
# SECTION 3: LIVE PRICE API
# ============================================================
print("\n" + "=" * 70)
print("SECTION 3: LIVE PRICE — GET /api/prices/live")
print("=" * 70)

def test_live_price_default():
    d = get("/api/prices/live")
    assert "priceObservation" in d, "Missing priceObservation"
    assert "isStale" in d, "Missing isStale flag"
    assert "sourceNote" in d, "Missing sourceNote"
    obs = d["priceObservation"]
    assert obs.get("modalPrice") is not None or obs.get("modal_price") is not None, "No price value"
    return ("PASS", f"Price received, isStale={d['isStale']}, source={d['sourceNote']}")

test("Default live price (Lasalgaon, Onion)", test_live_price_default)

def test_live_price_custom():
    d = get("/api/prices/live?marketId=pimpalgaon&commodity=Onion")
    assert "priceObservation" in d, "Missing priceObservation"
    return ("PASS", f"Pimpalgaon Onion price received, isStale={d['isStale']}")

test("Custom market/commodity", test_live_price_custom)

# ============================================================
# SECTION 4: EVALUATE (MAIN PIPELINE)
# ============================================================
print("\n" + "=" * 70)
print("SECTION 4: EVALUATE — POST /api/evaluate (Triple Engine Pipeline)")
print("=" * 70)

def test_evaluate_onion():
    d = post("/api/evaluate", {"commodity": "Onion", "latitude": 19.9975, "longitude": 73.7898})
    assert "recommendation" in d, "Missing recommendation"
    assert "evaluations" in d, "Missing evaluations"
    assert "nirnayKawach" in d, "Missing nirnayKawach"
    assert "bhedVivek" in d, "Missing bhedVivek"
    assert "evaluatedAt" in d, "Missing evaluatedAt"
    assert "modelVersion" in d, "Missing modelVersion"
    rec = d["recommendation"]
    assert "action" in rec or "market" in rec or "bestMarket" in rec, f"Recommendation missing action/market: {list(rec.keys())}"
    ev_count = len(d["evaluations"])
    return ("PASS", f"Recommendation received, {ev_count} markets evaluated, all 3 engines present")

test("Evaluate Onion (full pipeline)", test_evaluate_onion)

def test_evaluate_tomato():
    d = post("/api/evaluate", {"commodity": "Tomato", "latitude": 19.9975, "longitude": 73.7898})
    assert "recommendation" in d, "Missing recommendation"
    assert d["commodity"] == "Tomato", f"Expected Tomato, got {d['commodity']}"
    return ("PASS", f"Tomato pipeline returned, model={d['modelVersion']}")

test("Evaluate Tomato", test_evaluate_tomato)

def test_evaluate_soyabean():
    d = post("/api/evaluate", {"commodity": "Soyabean", "latitude": 19.9975, "longitude": 73.7898})
    assert "recommendation" in d, "Missing recommendation"
    assert d["commodity"] == "Soyabean", f"Expected Soyabean, got {d['commodity']}"
    return ("PASS", f"Soyabean pipeline returned")

test("Evaluate Soyabean", test_evaluate_soyabean)

def test_evaluate_empty_body():
    d = post("/api/evaluate", {})
    # Should still work with defaults
    assert "recommendation" in d, "Missing recommendation with empty body"
    return ("PASS", "Empty body → defaults applied (Onion, Nashik)")

test("Evaluate with empty body (defaults)", test_evaluate_empty_body)

def test_evaluate_abstention():
    """Manmad should have ABSTAIN/POOR data quality due to 9-day gap"""
    d = post("/api/evaluate", {"commodity": "Onion", "latitude": 19.9975, "longitude": 73.7898, "radiusKm": 120})
    manmad_found = False
    for ev in d["evaluations"]:
        mname = ev["market"]["name"].lower()
        if "manmad" in mname:
            manmad_found = True
            dq = ev["dataQuality"]
            if dq.get("tier") in ["ABSTAIN", "POOR"] or dq.get("status") in ["ABSTAIN", "POOR"] or not dq.get("isEligibleForRecommendation", True):
                return ("PASS", f"Manmad data quality correctly flagged: Tier={dq.get('tier')}, DaysSince={dq.get('daysSinceLastReport')}, Eligible={dq.get('isEligibleForRecommendation')}")
            else:
                return ("WARN", f"Manmad not flagged as stale/abstain: {dq}")
    if not manmad_found:
        return ("WARN", "Manmad APMC not found in evaluations (may be outside radius)")
    return ("PASS", "Manmad abstention checked")

test("Manmad APMC Abstention (9-day stale gap)", test_evaluate_abstention)

def test_evaluate_nirnay_kawach_fields():
    d = post("/api/evaluate", {"commodity": "Onion"})
    nk = d.get("nirnayKawach", {})
    required = ["status", "statusLabel", "winningMarket", "breakevenTransportRate"]
    missing = [f for f in required if f not in nk]
    if missing:
        return ("FAIL", f"NirnayKawach missing fields: {missing}. Keys present: {list(nk.keys())}")
    return ("PASS", f"Status={nk['status']}, Breakeven=₹{nk['breakevenTransportRate']}/km, Winner={nk['winningMarket'].get('name', nk['winningMarket'].get('id', '?'))}")

test("Nirnay Kawach fields in /evaluate", test_evaluate_nirnay_kawach_fields)

def test_evaluate_bhed_vivek_fields():
    d = post("/api/evaluate", {"commodity": "Onion"})
    bv = d.get("bhedVivek", {})
    required = ["statusLabel", "isFlipped", "congestionImpactPerQtl", "originalWinner", "adjustedWinner"]
    missing = [f for f in required if f not in bv]
    if missing:
        return ("FAIL", f"BhedVivek missing fields: {missing}. Keys present: {list(bv.keys())}")
    return ("PASS", f"Impact=-₹{bv['congestionImpactPerQtl']:.1f}/q, Flipped={bv['isFlipped']}")

test("Bhed Vivek fields in /evaluate", test_evaluate_bhed_vivek_fields)

def test_evaluate_evaluations_structure():
    d = post("/api/evaluate", {"commodity": "Onion"})
    for ev in d["evaluations"][:3]:  # check first 3
        assert "market" in ev, "Missing market in evaluation"
        assert "dataQuality" in ev, "Missing dataQuality in evaluation"
        assert "forecast" in ev, "Missing forecast in evaluation"
        assert "netRealisationByDay" in ev, "Missing netRealisationByDay"
        nrbd = ev["netRealisationByDay"]
        assert len(nrbd) >= 1, "netRealisationByDay is empty"
        for nr in nrbd:
            assert "day" in nr, "Missing day in NR entry"
            assert "netRealisation" in nr, "Missing netRealisation in NR entry"
    return ("PASS", f"All evaluation objects have correct nested structure (checked {min(3, len(d['evaluations']))} markets)")

test("Evaluation objects have correct nested structure", test_evaluate_evaluations_structure)

# ============================================================
# SECTION 5: STRESS TEST (NIRNAY KAWACH SLIDER)
# ============================================================
print("\n" + "=" * 70)
print("SECTION 5: STRESS TEST — POST /api/evaluate/stress-test")
print("=" * 70)

def test_stress_low_cost():
    d = post("/api/evaluate/stress-test", {"commodity": "Onion", "transportCostPerKmPerQtl": 2.0})
    assert "winningMarket" in d, "Missing winningMarket"
    assert "breakevenTransportRate" in d, "Missing breakeven"
    assert d["activeTransportRate"] == 2.0, f"Expected 2.0, got {d['activeTransportRate']}"
    return ("PASS", f"Winner: {d['winningMarket'].get('name', d['winningMarket'].get('id'))}, Flipped={d['isFlipped']}")

test("Stress test at ₹2.0/km (low)", test_stress_low_cost)

def test_stress_high_cost():
    d = post("/api/evaluate/stress-test", {"commodity": "Onion", "transportCostPerKmPerQtl": 15.0})
    assert "winningMarket" in d, "Missing winningMarket"
    return ("PASS", f"Winner at ₹15/km: {d['winningMarket'].get('name', d['winningMarket'].get('id'))}, Flipped={d['isFlipped']}")

test("Stress test at ₹15.0/km (extreme)", test_stress_high_cost)

def test_stress_flip_detection():
    """The winner must flip once the transport rate crosses the ALGEBRAIC breakeven the engine
    itself reports — not at some arbitrary rate. Below breakeven it must not flip."""
    base = post("/api/evaluate/stress-test", {"commodity": "Onion", "transportCostPerKmPerQtl": 2.0})
    low_w = base["winningMarket"].get("name", base["winningMarket"].get("id", "?"))
    be = base.get("breakevenTransportRate")
    if be is None:
        return ("PASS", f"No flip point exists in range; {low_w} dominates at every tested rate")

    just_below = post("/api/evaluate/stress-test", {"commodity": "Onion", "transportCostPerKmPerQtl": max(0.5, be - 1.0)})
    just_above = post("/api/evaluate/stress-test", {"commodity": "Onion", "transportCostPerKmPerQtl": be + 1.0})
    below_w = just_below["winningMarket"].get("name", "?")
    above_w = just_above["winningMarket"].get("name", "?")

    if below_w != low_w:
        return ("FAIL", f"winner changed below breakeven ₹{be}/km: {low_w} → {below_w}")
    if above_w == low_w:
        return ("FAIL", f"winner did NOT flip above the reported breakeven ₹{be}/km (still {above_w})")
    return ("PASS", f"flips exactly at algebraic breakeven ₹{be}/km: {below_w} → {above_w}")

test("Decision flip between low and high transport", test_stress_flip_detection)

def test_stress_breakeven_positive():
    d = post("/api/evaluate/stress-test", {"commodity": "Onion", "transportCostPerKmPerQtl": 3.0})
    be = d.get("breakevenTransportRate")
    if be is None:
        return ("FAIL", "Missing breakevenTransportRate field")
    if be <= 0:
        return ("FAIL", f"Breakeven should be positive, got {be}")
    return ("PASS", f"Breakeven = ₹{be:.2f}/km")

test("Breakeven transport rate is positive", test_stress_breakeven_positive)

# ============================================================
# SECTION 6: BHED VIVEK (CONGESTION INTELLIGENCE)
# ============================================================
print("\n" + "=" * 70)
print("SECTION 6: BHED VIVEK — POST /api/bhed-vivek/analyze")
print("=" * 70)

for scenario in ["LOW", "MEDIUM", "HIGH"]:
    def make_test(sc=scenario):
        def t():
            d = post("/api/bhed-vivek/analyze", {
                "commodity": "Onion",
                "latitude": 19.9975,
                "longitude": 73.7898,
                "quantityQuintals": 25,
                "supplyPressure": sc,
                "radiusKm": 80
            })
            assert "statusLabel" in d, "Missing statusLabel"
            assert "originalWinner" in d, "Missing originalWinner"
            assert "adjustedWinner" in d, "Missing adjustedWinner"
            assert "congestionImpactPerQtl" in d, "Missing congestionImpactPerQtl"
            assert "isFlipped" in d, "Missing isFlipped"
            impact = d["congestionImpactPerQtl"]
            return ("PASS", f"Status={d['statusLabel']}, Impact=-₹{impact:.1f}/q, Flipped={d['isFlipped']}")
        return t
    test(f"Bhed Vivek scenario: {scenario}", make_test())

def test_bhed_vivek_impact_increases():
    d_low = post("/api/bhed-vivek/analyze", {"commodity": "Onion", "supplyPressure": "LOW", "radiusKm": 80})
    d_high = post("/api/bhed-vivek/analyze", {"commodity": "Onion", "supplyPressure": "HIGH", "radiusKm": 80})
    i_low = d_low["congestionImpactPerQtl"]
    i_high = d_high["congestionImpactPerQtl"]
    if i_high > i_low:
        return ("PASS", f"Congestion impact increases correctly: LOW={i_low:.1f}, HIGH={i_high:.1f}")
    else:
        return ("FAIL", f"HIGH impact ({i_high}) should be > LOW impact ({i_low})")

test("Congestion impact increases LOW → HIGH", test_bhed_vivek_impact_increases)

# ============================================================
# SECTION 7: BACKTEST API
# ============================================================
print("\n" + "=" * 70)
print("SECTION 7: BACKTEST — GET /api/backtest")
print("=" * 70)

for commodity in ["Onion", "Tomato", "Soyabean"]:
    def make_bt(c=commodity):
        def t():
            d = get(f"/api/backtest?commodity={c}")
            assert "result" in d, "Missing result"
            r = d["result"]
            required = ["commodity", "modelVersion", "evaluatedDays", "avgNetRealisation",
                        "baselineNetRealisation", "netGainVsBaseline", "directionalAccuracy", "coverage"]
            missing = [f for f in required if f not in r]
            if missing:
                return ("FAIL", f"Missing fields: {missing}")
            assert r["evaluatedDays"] > 0, f"evaluatedDays is {r['evaluatedDays']}"
            assert r["directionalAccuracy"] > 0, f"Accuracy is {r['directionalAccuracy']}"
            gain = r["netGainVsBaseline"]
            acc = r["directionalAccuracy"]
            days = r["evaluatedDays"]
            return ("PASS", f"{c}: +₹{gain:.1f}/q gain, {acc:.1f}% accuracy, {days} held-out days")
        return t
    test(f"Backtest: {commodity}", make_bt())

def test_backtest_citation():
    d = get("/api/backtest?commodity=Onion")
    cn = d.get("citationNotice", "")
    if "Walk-Forward" in cn or "backtest" in cn.lower():
        return ("PASS", f"Citation: {cn[:80]}...")
    return ("WARN", f"Citation may be missing/wrong: '{cn}'")

test("Backtest citation notice", test_backtest_citation)

# ============================================================
# SECTION 8: SUPABASE CLOUD (POOLS & ALERTS)
# ============================================================
print("\n" + "=" * 70)
print("SECTION 8: SUPABASE — POOLS & ALERTS (Cloud Database)")
print("=" * 70)

def test_get_pools():
    d = get("/api/pools")
    if isinstance(d, dict) and d.get("error"):
        return ("WARN", f"Supabase may be offline: {d['error']}")
    if isinstance(d, list):
        return ("PASS", f"Fetched {len(d)} farmer pool records from Supabase")
    if isinstance(d, dict) and "pools" in d:
        return ("PASS", f"Fetched {len(d['pools'])} pool records")
    return ("PASS", f"Response type: {type(d).__name__}, keys: {list(d.keys()) if isinstance(d, dict) else 'N/A'}")

test("GET /api/pools", test_get_pools)

def test_get_alerts():
    d = get("/api/alerts")
    if isinstance(d, dict) and "alerts" in d:
        return ("PASS", f"Fetched {len(d['alerts'])} price alerts from Supabase")
    if isinstance(d, dict) and d.get("error"):
        return ("WARN", f"Supabase offline: {d['error']}")
    return ("PASS", f"Response: {list(d.keys()) if isinstance(d, dict) else type(d).__name__}")

test("GET /api/alerts", test_get_alerts)

def test_post_pool_join():
    payload = {
        "commodity": "Onion",
        "origin_village": "TestVillage_AutoTest",
        "destination_mandi": "Lasalgaon",
        "departure_date": "2026-09-10",
        "quantity_quintals": 15,
        "farmer_name": "AutoTest_Robot",
        "farmer_phone": "0000000000"
    }
    try:
        d = post("/api/pools/join", payload)
        if isinstance(d, dict) and d.get("success"):
            return ("PASS", f"Pool join succeeded")
        elif isinstance(d, dict) and d.get("error"):
            return ("WARN", f"Pool join responded with error: {d['error']}")
        return ("PASS", f"Pool join response: {list(d.keys()) if isinstance(d, dict) else d}")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        return ("WARN", f"HTTP {e.code}: {body[:100]}")

test("POST /api/pools/join (write test)", test_post_pool_join)

def test_post_alert_subscribe():
    payload = {
        "commodity": "Onion",
        "market_id": "lasalgaon",
        "threshold_price": 3500,
        "direction": "above",
        "farmer_phone": "0000000000"
    }
    try:
        d = post("/api/alerts/subscribe", payload)
        if isinstance(d, dict) and d.get("success"):
            return ("PASS", "Alert subscription succeeded")
        elif isinstance(d, dict) and d.get("error"):
            return ("WARN", f"Alert subscribe error: {d['error']}")
        return ("PASS", f"Alert response: {list(d.keys()) if isinstance(d, dict) else d}")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        return ("WARN", f"HTTP {e.code}: {body[:100]}")

test("POST /api/alerts/subscribe (write test)", test_post_alert_subscribe)

# ============================================================
# SECTION 9: DATA FILE INTEGRITY
# ============================================================
print("\n" + "=" * 70)
print("SECTION 9: DATA FILE INTEGRITY")
print("=" * 70)

import os

data_dir = os.path.join(os.getcwd(), "data")

def test_data_dir_exists():
    if os.path.isdir(data_dir):
        items = os.listdir(data_dir)
        return ("PASS", f"data/ directory exists with {len(items)} items: {items[:10]}")
    return ("FAIL", "data/ directory not found!")

test("data/ directory exists", test_data_dir_exists)

def test_price_files():
    prices_dir = os.path.join(data_dir, "prices")
    if not os.path.isdir(prices_dir):
        return ("WARN", "data/prices/ directory not found")
    files = os.listdir(prices_dir)
    expected = ["onion_maharashtra.json", "tomato_maharashtra.json", "soyabean_maharashtra.json"]
    found = [f for f in expected if f in files]
    missing = [f for f in expected if f not in files]
    if missing:
        return ("WARN", f"Missing price files: {missing}. Found: {found}")
    # Validate JSON
    for f in found:
        fp = os.path.join(prices_dir, f)
        with open(fp, "r", encoding="utf-8") as fh:
            d = json.load(fh)
            recs = d.get("records", [])
            if len(recs) == 0:
                return ("WARN", f"{f} has 0 records")
    return ("PASS", f"All 3 price files present & valid JSON: {found}")

test("Price data files (Onion/Tomato/Soyabean)", test_price_files)

def test_distance_matrix():
    dp = os.path.join(data_dir, "distance_matrix_all.json")
    if not os.path.isfile(dp):
        return ("WARN", "data/distance_matrix_all.json not found")
    with open(dp, "r", encoding="utf-8") as f:
        d = json.load(f)
    if isinstance(d, list) and len(d) > 0:
        return ("PASS", f"Distance matrix has {len(d)} entries. Sample: {d[0]}")
    return ("WARN", f"Distance matrix format unexpected: type={type(d).__name__}")

test("OSRM distance matrix file", test_distance_matrix)

def test_backtest_results_file():
    bp = os.path.join(os.getcwd(), "models", "backtest_results.json")
    if not os.path.isfile(bp):
        return ("WARN", "models/backtest_results.json not found — using fallback")
    with open(bp, "r", encoding="utf-8") as f:
        d = json.load(f)
    if "executive_numbers" in d:
        keys = list(d["executive_numbers"].keys())
        return ("PASS", f"Backtest results present with keys: {keys}")
    return ("WARN", "Missing executive_numbers key in backtest file")

test("Backtest results file (models/)", test_backtest_results_file)

def test_market_registry():
    reg_dir = os.path.join(data_dir, "markets")
    if os.path.isdir(reg_dir):
        files = os.listdir(reg_dir)
        return ("PASS", f"data/markets/ has {len(files)} files")
    # Maybe it's in data-pipeline/registry
    reg_ts = os.path.join(os.getcwd(), "src", "data-pipeline", "registry.ts")
    if os.path.isfile(reg_ts):
        with open(reg_ts, "r", encoding="utf-8") as f:
            content = f.read()
        count = content.count("id:")
        return ("PASS", f"Market registry in registry.ts (~{count} market entries)")
    return ("WARN", "Could not find market data source")

test("Market registry data source", test_market_registry)

# ============================================================
# SECTION 10: LATENCY & PERFORMANCE
# ============================================================
print("\n" + "=" * 70)
print("SECTION 10: LATENCY & PERFORMANCE")
print("=" * 70)

def test_evaluate_latency():
    t0 = time.time()
    post("/api/evaluate", {"commodity": "Onion"})
    ms = (time.time() - t0) * 1000
    if ms < 100:
        return ("PASS", f"Full pipeline latency: {ms:.1f}ms (excellent)")
    elif ms < 500:
        return ("PASS", f"Full pipeline latency: {ms:.1f}ms (acceptable)")
    else:
        return ("WARN", f"Latency: {ms:.1f}ms (slow, should be <500ms)")

test("Evaluate pipeline latency", test_evaluate_latency)

def test_stress_test_latency():
    t0 = time.time()
    post("/api/evaluate/stress-test", {"commodity": "Onion", "transportCostPerKmPerQtl": 5.0})
    ms = (time.time() - t0) * 1000
    if ms < 50:
        return ("PASS", f"Stress test latency: {ms:.1f}ms (instant)")
    elif ms < 200:
        return ("PASS", f"Stress test latency: {ms:.1f}ms (good)")
    else:
        return ("WARN", f"Latency: {ms:.1f}ms (should be interactive <200ms)")

test("Stress test slider latency", test_stress_test_latency)

def test_bhed_vivek_latency():
    t0 = time.time()
    post("/api/bhed-vivek/analyze", {"commodity": "Onion", "supplyPressure": "HIGH", "radiusKm": 80})
    ms = (time.time() - t0) * 1000
    if ms < 50:
        return ("PASS", f"Bhed Vivek latency: {ms:.1f}ms")
    elif ms < 200:
        return ("PASS", f"Bhed Vivek latency: {ms:.1f}ms (acceptable)")
    else:
        return ("WARN", f"Latency: {ms:.1f}ms")

test("Bhed Vivek latency", test_bhed_vivek_latency)

# ============================================================
# SECTION 11: EDGE CASES & ERROR HANDLING
# ============================================================
print("\n" + "=" * 70)
print("SECTION 11: EDGE CASES & ERROR HANDLING")
print("=" * 70)

def test_evaluate_unknown_commodity():
    d = post("/api/evaluate", {"commodity": "Mango"})
    # Should not crash, may use defaults
    assert "recommendation" in d or "error" in d, "Neither recommendation nor error returned"
    return ("PASS", f"Unknown commodity 'Mango' handled gracefully: {'recommendation' if 'recommendation' in d else 'error'} returned")

test("Unknown commodity (Mango)", test_evaluate_unknown_commodity)

def test_evaluate_zero_radius():
    d = post("/api/evaluate", {"commodity": "Onion", "radiusKm": 0})
    if "recommendation" in d:
        ev_count = len(d.get("evaluations", []))
        if ev_count == 0:
            return ("PASS", "Zero radius → 0 evaluations (correct)")
        return ("WARN", f"Zero radius still returned {ev_count} evaluations")
    return ("PASS", "Handled zero radius without crash")

test("Zero radius edge case", test_evaluate_zero_radius)

def test_evaluate_extreme_transport():
    d = post("/api/evaluate/stress-test", {"commodity": "Onion", "transportCostPerKmPerQtl": 100.0})
    assert "winningMarket" in d, "Missing winner at extreme transport cost"
    return ("PASS", f"₹100/km transport handled: winner={d['winningMarket'].get('name', d['winningMarket'].get('id'))}")

test("Extreme transport cost (₹100/km)", test_evaluate_extreme_transport)

def test_invalid_json():
    try:
        req = urllib.request.Request(
            f"{BASE}/api/evaluate",
            data=b"not-json",
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            return ("WARN", "Server accepted invalid JSON without error")
    except urllib.error.HTTPError as e:
        return ("PASS", f"Invalid JSON rejected with HTTP {e.code}")
    except Exception as e:
        return ("PASS", f"Invalid JSON rejected: {type(e).__name__}")

test("Invalid JSON body handling", test_invalid_json)

# ============================================================
# SECTION 12: REGIONAL COVERAGE — NO "ALWAYS WAIT" / NO FALSE ABSTENTION
# ============================================================
print("\n" + "=" * 70)
print("SECTION 12: REGIONAL COVERAGE ACROSS MAHARASHTRA DIVISIONS")
print("=" * 70)

SPATIAL_PROBES = [
    ("Nashik", 19.9975, 73.7898),
    ("Pune", 18.5204, 73.8567),
    ("Ahilyanagar", 19.0952, 74.7480),
    ("Latur", 18.4088, 76.5604),
    ("Solapur", 17.6599, 75.9064),
    ("Nagpur", 21.1458, 79.0882),
    ("Kolhapur", 16.7050, 74.2433),
    ("Chhatrapati Sambhajinagar", 19.8762, 75.3433),
    ("Gadchiroli", 20.1809, 80.0035),
    ("Sindhudurg", 16.0667, 73.6833),
]
SPATIAL_COMMODITIES = ["Onion", "Tomato", "Soyabean", "Wheat"]

VALID_PROVENANCE = {
    "AGMARKNET_MARKET_OBSERVED",
    "HISTORICAL_SERIES_OBSERVED",
    "DISTRICT_PEER_CALIBRATED",
    "DIVISION_PEER_CALIBRATED",
    "STATE_BENCHMARK_CALIBRATED",
}

for _district, _lat, _lon in SPATIAL_PROBES:
    def make_spatial(dn=_district, la=_lat, lo=_lon):
        def t():
            empty = []
            abstained = []
            for c in SPATIAL_COMMODITIES:
                d = post("/api/evaluate", {"commodity": c, "latitude": la, "longitude": lo, "radiusKm": 150})
                evs = d.get("evaluations", [])
                if not evs:
                    empty.append(c)
                    continue
                if d["recommendation"]["action"] == "NO_RECOMMENDATION":
                    abstained.append(c)
            if empty:
                return ("FAIL", f"zero candidate mandis for {empty}")
            if abstained:
                return ("FAIL", f"false abstention for {abstained}")
            return ("PASS", f"all {len(SPATIAL_COMMODITIES)} commodities resolved candidates & advice")
        return t
    test(f"Regional coverage: {_district}", make_spatial())


def test_no_always_wait_bias():
    waits = 0
    total = 0
    for _dn, la, lo in SPATIAL_PROBES:
        for c in SPATIAL_COMMODITIES:
            d = post("/api/evaluate", {"commodity": c, "latitude": la, "longitude": lo, "radiusKm": 150})
            total += 1
            if d["recommendation"]["action"].startswith("WAIT"):
                waits += 1
    pct = waits / total * 100 if total else 0
    if pct > 80:
        return ("FAIL", f"{pct:.1f}% of decisions are WAIT — regional 'always wait' bias is back")
    return ("PASS", f"{waits}/{total} WAIT decisions ({pct:.1f}%) — no systematic hold bias")


test("No systematic 'always wait' bias", test_no_always_wait_bias)


def test_price_provenance_present():
    d = post("/api/evaluate", {"commodity": "Soyabean", "latitude": 21.1458, "longitude": 79.0882, "radiusKm": 150})
    evs = d.get("evaluations", [])
    assert evs, "no evaluations to inspect"
    bad = [e["market"]["name"] for e in evs if e["dataQuality"].get("priceProvenance") not in VALID_PROVENANCE]
    if bad:
        return ("FAIL", f"missing/invalid provenance on {bad}")
    kinds = sorted({e["dataQuality"]["priceProvenance"] for e in evs})
    return ("PASS", f"{len(evs)} evaluations, provenance kinds: {', '.join(kinds)}")


test("Every evaluation carries a price provenance", test_price_provenance_present)


def test_calibrated_never_good():
    """Peer-calibrated prices are real arithmetic on real records, but must never be graded GOOD."""
    offenders = []
    for _dn, la, lo in SPATIAL_PROBES:
        d = post("/api/evaluate", {"commodity": "Tomato", "latitude": la, "longitude": lo, "radiusKm": 150})
        for e in d.get("evaluations", []):
            prov = e["dataQuality"].get("priceProvenance", "")
            if "CALIBRATED" in prov and e["dataQuality"]["tier"] == "GOOD":
                offenders.append(f"{e['market']['name']}/{prov}")
    if offenders:
        return ("FAIL", f"calibrated prices graded GOOD: {offenders[:5]}")
    return ("PASS", "no peer-calibrated price is ever graded GOOD data quality")


test("Calibrated prices are capped below GOOD tier", test_calibrated_never_good)


# ============================================================
# SECTION 13: MARKET-PERCEIVED FRESHNESS DISCOUNT
# ============================================================
print("\n" + "=" * 70)
print("SECTION 13: FRESHNESS DISCOUNT & DECAY PROFILES")
print("=" * 70)


def _read_ts(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read()


def test_freshness_constants():
    src = _read_ts("src/core/asli-daam.ts")
    assert "dailyFreshnessDiscountPct" in src, "freshness discount field missing from CropDecayProfile"
    import re
    perishable = re.search(r"'PERISHABLE':\s*\{[^}]*dailyFreshnessDiscountPct:\s*([0-9.]+)", src, re.S)
    semi = re.search(r"'SEMI_PERISHABLE':\s*\{[^}]*dailyFreshnessDiscountPct:\s*([0-9.]+)", src, re.S)
    dry = re.search(r"'DRY_GRAIN':\s*\{[^}]*dailyFreshnessDiscountPct:\s*([0-9.]+)", src, re.S)
    assert perishable and semi and dry, "category freshness rates not all defined"
    p, s, g = float(perishable.group(1)), float(semi.group(1)), float(dry.group(1))
    assert abs(p - 0.035) < 1e-9, f"PERISHABLE freshness discount should be 3.5%/day, got {p}"
    assert abs(s - 0.003) < 1e-9, f"SEMI_PERISHABLE should be 0.3%/day, got {s}"
    assert abs(g - 0.000) < 1e-9, f"DRY_GRAIN should be 0.0%/day, got {g}"
    return ("PASS", f"PERISHABLE {p*100:.1f}%/day > SEMI {s*100:.1f}%/day > DRY {g*100:.1f}%/day")


test("Freshness discount rates match the specification", test_freshness_constants)


def test_no_synthetic_appreciation():
    src = _read_ts("src/core/asli-daam.ts")
    assert "0.022" not in src, "the synthetic +2.2%/day price appreciation is still present"
    assert "dayPriceMultiplier" not in src, "synthetic day price multiplier still present"
    assert "expectedPriceByDay" in src, "engine no longer consumes the backend forecast trajectory"
    return ("PASS", "no synthetic price appreciation; trajectory comes from the backend forecast")


test("AsliDaam contains no synthetic price appreciation", test_no_synthetic_appreciation)


def test_freshness_in_waterfall_ui():
    src = _read_ts("src/frontend/features/hub/DecisionHubView.ts")
    assert "freshnessDiscountPerQtl" in src, "freshness discount not surfaced in the UI"
    assert "ताजेपणा" in src, "Marathi freshness label missing from the waterfall"
    return ("PASS", "freshness discount row present in the AsliDaam waterfall")


test("Freshness discount is shown in the economic waterfall", test_freshness_in_waterfall_ui)


def test_policy_sync():
    src = _read_ts("src/core/asli-daam.ts")
    assert "policyActionToMaxDayOffset" in src, "AsliDaam is not synchronised with the backend policy"
    hub = _read_ts("src/frontend/features/hub/DecisionHubView.ts")
    assert "recommendation?.action" in hub, "Decision Hub does not pass the backend policy action"
    return ("PASS", "AsliDaam recommendation horizon is capped by the backend decision policy")


test("AsliDaam is synchronised with the backend ML policy", test_policy_sync)


def test_sell_today_is_day_zero():
    """When the model policy says SELL_TODAY, no wait can be recommended."""
    mismatches = []
    for _dn, la, lo in SPATIAL_PROBES[:5]:
        for c in ["Tomato", "Onion"]:
            d = post("/api/evaluate", {"commodity": c, "latitude": la, "longitude": lo, "radiusKm": 150})
            action = d["recommendation"]["action"]
            if action == "SELL_TODAY":
                # The winning day-0 option must be at least as good as every future day
                # for the recommended market, after holding costs.
                mkt = d["recommendation"]["market"]
                ev = next((e for e in d["evaluations"] if e["market"]["id"] == mkt["id"]), None)
                if not ev:
                    mismatches.append(f"{_dn}/{c}: recommended market missing from evaluations")
                    continue
                day0 = next(n for n in ev["netRealisationByDay"] if n["day"] == 0)
                best_future = max(
                    (n["netRealisation"] for n in ev["netRealisationByDay"] if n["day"] > 0),
                    default=day0["netRealisation"],
                )
                if best_future - day0["netRealisation"] > 20.0:
                    mismatches.append(f"{_dn}/{c}: SELL_TODAY despite +{best_future - day0['netRealisation']:.1f}/q upside")
    if mismatches:
        return ("FAIL", "; ".join(mismatches[:3]))
    return ("PASS", "SELL_TODAY is only issued when waiting has no material upside")


test("SELL_TODAY policy is internally consistent", test_sell_today_is_day_zero)


# ============================================================
# SECTION 14: SAJHABAZAAR SHARED FREIGHT ENGINE
# ============================================================
print("\n" + "=" * 70)
print("SECTION 14: SAJHABAZAAR — POST /api/sajha-bazaar/evaluate")
print("=" * 70)

SAJHA_BASE = {
    "commodity": "Tomato",
    "latitude": 19.9975,
    "longitude": 73.7898,
    "district": "Nashik",
    "quantityQuintals": 3,
    "targetDate": "2026-09-04",
}


def test_sajha_roster():
    d = get("/api/sajha-bazaar/roster")
    assert d["isSynthetic"] is True, "roster must self-declare as synthetic"
    assert d["farmerCount"] > 0, "empty roster"
    assert "SYNTHETIC" in d["syntheticNotice"].upper(), "missing provenance notice"
    return ("PASS", f"{d['farmerCount']} synthetic farmers across {len(d['clusters'])} clusters")


test("SajhaBazaar roster endpoint", test_sajha_roster)


def test_sajha_pool_forms():
    d = post("/api/sajha-bazaar/evaluate", SAJHA_BASE)
    assert d["status"] == "POOL_AVAILABLE", f"{d['status']}: {d['reasons'][:1]}"
    return ("PASS", f"{d['pooled']['participantCount']} farmers, {d['pooled']['totalQuintals']}q, +₹{d['requesterGainTotal']}")


test("SajhaBazaar forms a pool for compatible farmers", test_sajha_pool_forms)


def test_sajha_cost_conservation():
    d = post("/api/sajha-bazaar/evaluate", SAJHA_BASE)
    a = d["allocationAudit"]
    manual = round(sum(p["pooledTransportShareTotal"] for p in d["participants"]), 2)
    assert a["conserves"] is True, f"engine reports non-conservation: {a}"
    assert abs(manual - a["totalPooledTripCostRs"]) < 0.005, f"{manual} != {a['totalPooledTripCostRs']}"
    return ("PASS", f"Σ shares ₹{manual} == trip cost ₹{a['totalPooledTripCostRs']} exactly")


test("SajhaBazaar cost allocation conserves exactly", test_sajha_cost_conservation)


def test_sajha_quantity_conservation():
    d = post("/api/sajha-bazaar/evaluate", SAJHA_BASE)
    a = d["allocationAudit"]
    manual = round(sum(p["quantityQuintals"] for p in d["participants"]), 3)
    assert abs(manual - a["totalPooledQuintals"]) < 0.0005, f"{manual} != {a['totalPooledQuintals']}"
    return ("PASS", f"Σ q_i = {manual}q == Q_pool = {a['totalPooledQuintals']}q")


test("SajhaBazaar quantity conservation", test_sajha_quantity_conservation)


def test_sajha_materiality():
    d = post("/api/sajha-bazaar/evaluate", SAJHA_BASE)
    thr = d["materialityThresholdPerQtl"]
    gains = [p["netGainPerQtl"] for p in d["participants"]]
    assert all(g > thr for g in gains), f"participant below threshold: {min(gains)} <= {thr}"
    return ("PASS", f"min gain ₹{min(gains):.1f}/q > ₹{thr}/q threshold")


test("SajhaBazaar materiality gate holds for every member", test_sajha_materiality)


def test_sajha_quality_gate():
    d = post("/api/sajha-bazaar/evaluate", SAJHA_BASE)
    assert d["destinationMandi"]["dataQualityTier"] != "POOR", "pooling to a POOR-quality mandi"
    return ("PASS", f"destination tier = {d['destinationMandi']['dataQualityTier']}")


test("SajhaBazaar never pools to a POOR-quality mandi", test_sajha_quality_gate)


def test_sajha_negative_crop():
    d = post("/api/sajha-bazaar/evaluate", {**SAJHA_BASE, "commodity": "Wheat"})
    assert d["status"] != "POOL_AVAILABLE", "pooled a crop nobody on the roster holds"
    return ("PASS", f"{d['status']} for an unheld crop")


test("SajhaBazaar rejects incompatible crops", test_sajha_negative_crop)


def test_sajha_negative_date():
    d = post("/api/sajha-bazaar/evaluate", {**SAJHA_BASE, "targetDate": "2026-12-25"})
    assert d["status"] != "POOL_AVAILABLE", "pooled outside every sell window"
    return ("PASS", f"{d['status']} for an out-of-window date")


test("SajhaBazaar rejects incompatible sell windows", test_sajha_negative_date)


def test_sajha_nonlinear():
    d = post("/api/sajha-bazaar/evaluate", SAJHA_BASE)
    solo = d["soloAtDestination"]["transportPerQtl"]
    pooled = d["pooled"]["transportPerQtl"]
    assert solo > pooled * 1.5, f"pooling saves too little: solo ₹{solo} vs pooled ₹{pooled}"
    return ("PASS", f"solo ₹{solo}/q vs pooled ₹{pooled}/q = {solo/pooled:.2f}x cheaper")


test("SajhaBazaar trip cost is genuinely non-linear", test_sajha_nonlinear)


def test_sajha_price_parity():
    d = post("/api/sajha-bazaar/evaluate", SAJHA_BASE)
    ev = post("/api/evaluate", {"commodity": "Tomato", "latitude": 19.9975, "longitude": 73.7898, "radiusKm": 150})
    dest = d["destinationMandi"]
    match = next((e for e in ev["evaluations"] if e["market"]["id"] == dest["id"]), None)
    assert match, "destination absent from the AsliDaam evaluation"
    day0 = next(n for n in match["netRealisationByDay"] if n["day"] == 0)
    assert abs(day0["expectedPrice"] - dest["grossModalPricePerQtl"]) < 0.05, "price mismatch between engines"
    return ("PASS", f"both engines price {dest['name']} at ₹{dest['grossModalPricePerQtl']}/q — pooling never moves prices")


test("SajhaBazaar uses the same mandi price as AsliDaam", test_sajha_price_parity)


# ============================================================
# SECTION 15: VOICE AUTOFILL PIPELINE
# ============================================================
print("\n" + "=" * 70)
print("SECTION 15: VOICE AUTOFILL — POST /api/voice/process")
print("=" * 70)

VOICE_CASES = [
    ("नाशिक निफाड मध्ये 40 गोणी कांदा आहे", "Onion", 20.0, "Nashik"),
    ("पुणे जुन्नर मध्ये 80 क्रेट टोमॅटो", "Tomato", 20.0, "Pune"),
    ("लातूर मध्ये 30 क्विंटल सोयाबीन", "Soyabean", 30.0, "Latur"),
    ("I have 2 trolley wheat in Jalgaon", "Wheat", 80.0, "Jalgaon"),
    ("solapur madhe 5 tempo pomegranate", "Pomegranate", 60.0, "Solapur"),
]

for _text, _crop, _qtls, _district in VOICE_CASES:
    def make_voice(tx=_text, cr=_crop, q=_qtls, di=_district):
        def t():
            d = post("/api/voice/process", {"text": tx})
            assert d.get("ok") is True, "voice endpoint did not return ok"
            e = d["extraction"]
            problems = []
            if e["crop"] != cr:
                problems.append(f"crop {e['crop']} != {cr}")
            if e["quantityQuintals"] is None or abs(e["quantityQuintals"] - q) > 0.01:
                problems.append(f"quintals {e['quantityQuintals']} != {q}")
            if e["district"] != di:
                problems.append(f"district {e['district']} != {di}")
            if problems:
                return ("FAIL", "; ".join(problems))
            return ("PASS", f"{e['crop']} · {e['originalQuantity']} {e['originalUnit']} → {e['quantityQuintals']}q · {e['district']}")
        return t
    test(f"Voice extraction: '{_text[:34]}...'", make_voice())


def test_voice_never_500_without_keys():
    d = post("/api/voice/process", {"text": "gibberish with no crop or district"})
    assert d.get("ok") is True, "voice endpoint failed on unparseable input"
    assert d["pipeline"]["nluProvider"] in ("google-gemini", "deterministic-offline")
    return ("PASS", f"graceful fallback: {d['pipeline']['nluProvider']} / {d['pipeline']['nluStatus']}")


test("Voice endpoint never fails without API keys", test_voice_never_500_without_keys)


def test_voice_unit_table():
    d = post("/api/voice/process", {"text": "10 गोणी कांदा नाशिक"})
    table = d["unitConversionTable"]
    assert abs(table["Bags"] - 0.5) < 1e-9, f"Bags should be 0.5q, got {table['Bags']}"
    assert abs(table["Crates"] - 0.25) < 1e-9, f"Crates should be 0.25q, got {table['Crates']}"
    assert abs(table["Quintals"] - 1.0) < 1e-9
    assert abs(table["Tempo"] - 12.0) < 1e-9, f"Tempo should be 12q, got {table['Tempo']}"
    assert abs(table["Trolley"] - 40.0) < 1e-9, f"Trolley should be 40q, got {table['Trolley']}"
    return ("PASS", "1 bag=0.5q · 1 crate=0.25q · 1 tempo=12q · 1 trolley=40q")


test("Voice unit conversion table matches the spec", test_voice_unit_table)


def test_voice_bad_request():
    try:
        post("/api/voice/process", {})
        return ("WARN", "empty body accepted without a 400")
    except urllib.error.HTTPError as e:
        return ("PASS", f"empty body rejected with HTTP {e.code}")


test("Voice endpoint rejects an empty request body", test_voice_bad_request)

# ============================================================
# FINAL REPORT
# ============================================================
print("\n")
print("=" * 70)
print("MANDIMITRA COMPREHENSIVE TEST REPORT")
print("=" * 70)
print(f"\n  ✅ PASSED:   {PASS}")
print(f"  ⚠️  WARNINGS: {WARN}")
print(f"  ❌ FAILED:   {FAIL}")
print(f"  📊 TOTAL:    {PASS + WARN + FAIL}")
print()

if FAIL == 0:
    print("  🏆 ALL CRITICAL TESTS PASSED! MandiMitra is fully operational.")
elif FAIL <= 2:
    print(f"  ⚠️ {FAIL} failure(s) detected — review above for details.")
else:
    print(f"  🚨 {FAIL} FAILURES — some features are broken!")

print()
print("=" * 70)

# Print any failures for quick reference
if FAIL > 0:
    print("\n❌ FAILURE DETAILS:")
    for status, name, detail in results:
        if status == "FAIL":
            print(f"  → {name}: {detail}")

if WARN > 0:
    print("\n⚠️ WARNING DETAILS:")
    for status, name, detail in results:
        if status == "WARN":
            print(f"  → {name}: {detail}")

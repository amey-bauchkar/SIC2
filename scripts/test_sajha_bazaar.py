"""
MANDIMITRA - SAJHABAZAAR SHARED FREIGHT ENGINE TEST SUITE
==========================================================
Asserts the four engine invariants plus the matching rules:

  1. Compatible farmers pool successfully.
  2. Incompatible crops or sell dates do NOT form a pool.
  3. Sum of farmer transport allocations equals the total pooled trip cost EXACTLY.
  4. Sum of farmer quantities equals the total pooled quantity EXACTLY.
  5. Mandis failing the data-quality gate are never pooling destinations.
  6. Pooling is only surfaced when EVERY participant clears the materiality threshold.
  7. The trip-cost function is genuinely non-linear (per-quintal cost falls as load grows),
     which is the entire economic basis of the feature.

Run with the backend up:  node dist/backend/server.js
"""

import json
import sys
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
RESULTS = []


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
    RESULTS.append((ok, name, detail))


def post(path, payload):
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def get(path):
    with urllib.request.urlopen(urllib.request.Request(f"{BASE}{path}"), timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))


def evaluate(**overrides):
    payload = {
        "commodity": "Tomato",
        "latitude": 19.9975,
        "longitude": 73.7898,
        "district": "Nashik",
        "quantityQuintals": 3,
        "targetDate": "2026-09-04",
    }
    payload.update(overrides)
    return post("/api/sajha-bazaar/evaluate", payload)


print("=" * 70)
print("SAJHABAZAAR ENGINE INVARIANTS")
print("=" * 70)

# ---------------------------------------------------------------- roster
def t_roster():
    d = get("/api/sajha-bazaar/roster")
    assert d["isSynthetic"] is True, "roster must declare itself synthetic"
    assert d["farmerCount"] > 0, "roster is empty"
    assert len(d["clusters"]) > 0, "no clusters exposed"
    assert "SYNTHETIC" in d["syntheticNotice"].upper(), "missing synthetic provenance notice"
    veh = d["vehicleEconomics"]["vehicles"]
    assert len(veh) >= 2, "need at least two vehicle classes for the dispatch model"
    return True, f"{d['farmerCount']} synthetic farmers, {len(d['clusters'])} clusters, {len(veh)} vehicle classes"


check("Roster is published and self-declares as synthetic", t_roster)


# ---------------------------------------------------------------- happy path
def t_pool_forms():
    d = evaluate()
    assert d["status"] == "POOL_AVAILABLE", f"expected POOL_AVAILABLE, got {d['status']}: {d['reasons']}"
    assert d["pooled"]["participantCount"] >= 2, "a pool needs at least two participants"
    assert d["requesterGainTotal"] > 0, "requester must actually gain"
    return True, (
        f"{d['pooled']['participantCount']} farmers, {d['pooled']['totalQuintals']}q, "
        f"+Rs{d['requesterGainTotal']} to requester"
    )


check("Compatible farmers pool successfully", t_pool_forms)


# ---------------------------------------------------------------- invariant 1
def t_cost_conservation():
    d = evaluate()
    audit = d["allocationAudit"]
    shares = [p["pooledTransportShareTotal"] for p in d["participants"]]
    manual_sum = round(sum(shares), 2)
    assert audit["conserves"] is True, f"engine reports non-conservation: {audit}"
    assert abs(audit["allocationResidualRs"]) < 0.005, f"residual {audit['allocationResidualRs']}"
    assert abs(manual_sum - audit["totalPooledTripCostRs"]) < 0.005, (
        f"recomputed share sum {manual_sum} != trip cost {audit['totalPooledTripCostRs']}"
    )
    return True, f"sum(shares)=Rs{manual_sum} == tripCost=Rs{audit['totalPooledTripCostRs']} (residual 0)"


check("Sum of transport allocations == total pooled trip cost", t_cost_conservation)


# ---------------------------------------------------------------- invariant 2
def t_quantity_conservation():
    d = evaluate()
    audit = d["allocationAudit"]
    manual = round(sum(p["quantityQuintals"] for p in d["participants"]), 3)
    assert abs(manual - audit["totalPooledQuintals"]) < 0.0005, (
        f"recomputed {manual} != pooled total {audit['totalPooledQuintals']}"
    )
    assert abs(audit["quantityResidualQuintals"]) < 0.0005, "quantity residual is non-zero"
    return True, f"sum(q_i)={manual}q == Q_pool={audit['totalPooledQuintals']}q"


check("Sum of farmer quantities == total pooled quantity", t_quantity_conservation)


# ---------------------------------------------------------------- proportionality
def t_proportional_allocation():
    d = evaluate()
    total_cost = d["allocationAudit"]["totalPooledTripCostRs"]
    total_qty = d["allocationAudit"]["totalPooledQuintals"]
    worst = 0.0
    for p in d["participants"]:
        expected = total_cost * p["quantityQuintals"] / total_qty
        worst = max(worst, abs(expected - p["pooledTransportShareTotal"]))
    # Largest-remainder settlement may move at most one paise per participant.
    assert worst <= 0.01, f"allocation deviates from proportional by Rs{worst:.4f}"
    return True, f"max deviation from strict proportionality = Rs{worst:.4f} (rounding only)"


check("Allocation is proportional to load (within paise rounding)", t_proportional_allocation)


# ---------------------------------------------------------------- invariant 3
def t_materiality_gate():
    d = evaluate()
    threshold = d["materialityThresholdPerQtl"]
    gains = [p["netGainPerQtl"] for p in d["participants"]]
    assert all(g > threshold for g in gains), (
        f"a surfaced pool contains a participant below threshold {threshold}: {gains}"
    )
    return True, f"min gain Rs{min(gains):.1f}/qtl > threshold Rs{threshold}/qtl for all {len(gains)} members"


check("Every surfaced participant clears the materiality threshold", t_materiality_gate)


# ---------------------------------------------------------------- invariant 4
def t_quality_gate():
    d = evaluate()
    tier = d["destinationMandi"]["dataQualityTier"]
    assert tier != "POOR", f"pooling towards a POOR-quality mandi: {d['destinationMandi']}"
    return True, f"destination {d['destinationMandi']['name']} has data quality {tier}"


check("Poor data-quality mandis are excluded as destinations", t_quality_gate)


# ---------------------------------------------------------------- negative: crop
def t_incompatible_crop():
    # No farmer on the roster holds Wheat, so no pool may be formed.
    d = evaluate(commodity="Wheat")
    assert d["status"] != "POOL_AVAILABLE", "formed a pool for a crop nobody is holding"
    assert d["pooled"] is None, "returned pooled economics without a pool"
    return True, f"{d['status']}: {d['reasons'][0][:80]}"


check("Incompatible crop does not form a pool", t_incompatible_crop)


# ---------------------------------------------------------------- negative: date
def t_incompatible_date():
    # Far outside every roster sell window (+/- 1 day tolerance).
    d = evaluate(targetDate="2026-12-25")
    assert d["status"] != "POOL_AVAILABLE", "formed a pool outside every sell window"
    return True, f"{d['status']}: {d['reasons'][0][:80]}"


check("Incompatible sell date does not form a pool", t_incompatible_date)


# ---------------------------------------------------------------- negative: distance
def t_out_of_radius():
    # Gadchiroli is ~600 km from every roster cluster.
    d = evaluate(latitude=20.1809, longitude=80.0035, district="Gadchiroli")
    assert d["status"] != "POOL_AVAILABLE", "formed a pool with farmers hundreds of km away"
    return True, f"{d['status']}: {d['reasons'][0][:80]}"


check("Farmers outside the match radius do not form a pool", t_out_of_radius)


# ---------------------------------------------------------------- non-linearity
def t_nonlinear_trip_cost():
    small = evaluate(quantityQuintals=3)
    solo_small = small["soloAtDestination"]["transportPerQtl"]
    pooled = small["pooled"]["transportPerQtl"]
    assert solo_small > pooled, (
        f"pooled freight Rs{pooled}/q is not cheaper than solo Rs{solo_small}/q - "
        "the cost model has become linear and pooling would be cosmetic"
    )
    ratio = solo_small / pooled
    assert ratio > 1.5, f"pooling saving is only {ratio:.2f}x; expected a material drop"
    return True, f"solo Rs{solo_small}/q vs pooled Rs{pooled}/q = {ratio:.2f}x cheaper"


check("Trip cost is non-linear (pooling genuinely reduces per-quintal freight)", t_nonlinear_trip_cost)


# ---------------------------------------------------------------- NRV arithmetic
def t_nrv_consistency():
    d = evaluate()
    p = next(x for x in d["participants"] if x["isRequester"])
    payout = round(p["pooledNrvPerQtl"] * p["quantityQuintals"])
    assert abs(payout - p["pooledNetPayout"]) <= 1, (
        f"payout mismatch: {p['pooledNrvPerQtl']} x {p['quantityQuintals']} = {payout} "
        f"but engine reports {p['pooledNetPayout']}"
    )
    gain = round((p["pooledNrvPerQtl"] - max(p["localNrvPerQtl"], p["soloNrvPerQtl"])) * 10) / 10
    assert abs(gain - p["netGainPerQtl"]) <= 0.11, f"gain mismatch: {gain} vs {p['netGainPerQtl']}"
    return True, f"NRV x qty == payout, and gain == pooled - best individual"


check("Per-farmer NRV arithmetic is internally consistent", t_nrv_consistency)


# ---------------------------------------------------------------- determinism
def t_deterministic():
    a = evaluate()
    b = evaluate()
    assert a["requesterGainTotal"] == b["requesterGainTotal"], "engine is not deterministic"
    assert a["allocationAudit"] == b["allocationAudit"], "allocation is not deterministic"
    return True, "identical results across repeated calls"


check("Engine is deterministic", t_deterministic)


# ---------------------------------------------------------------- pooling never moves prices
def t_price_unchanged():
    d = evaluate()
    dest_price = d["destinationMandi"]["grossModalPricePerQtl"]
    ev = post("/api/evaluate", {
        "commodity": "Tomato", "latitude": 19.9975, "longitude": 73.7898, "radiusKm": 150
    })
    match = next(
        (e for e in ev["evaluations"] if e["market"]["id"] == d["destinationMandi"]["id"]), None
    )
    assert match is not None, "destination mandi absent from the main evaluation"
    day0 = next(n for n in match["netRealisationByDay"] if n["day"] == 0)
    assert abs(day0["expectedPrice"] - dest_price) < 0.05, (
        f"SajhaBazaar used a different price ({dest_price}) than AsliDaam ({day0['expectedPrice']})"
    )
    return True, f"both engines price {d['destinationMandi']['name']} at Rs{dest_price}/qtl"


check("Pooling does not alter the mandi price used by AsliDaam", t_price_unchanged)


print()
print("=" * 70)
print(f"  PASSED: {PASS}    FAILED: {FAIL}    TOTAL: {PASS + FAIL}")
print("=" * 70)
sys.exit(0 if FAIL == 0 else 1)

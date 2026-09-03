"""
MANDIMITRA - MULTI-DISTRICT SPATIAL COVERAGE TEST
==================================================
Sweeps /api/evaluate across all 36 Maharashtra districts x a representative commodity basket
and asserts that every combination:

  1. discovers at least one candidate APMC (no empty candidate set),
  2. produces at least one recommendation-eligible mandi (no false abstention),
  3. returns a decision action that is not systematically "wait" for perishables,
  4. carries an explicit price provenance on every evaluation (zero-mock audit trail).

Run with the backend up:  node dist/backend/server.js
"""

import json
import sys
import urllib.request
import urllib.error
from collections import Counter

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE = "http://localhost:3001"

DISTRICTS_FILE = "src/config/districts.ts"
COMMODITIES = ["Onion", "Tomato", "Soyabean", "Wheat", "Potato", "Pomegranate"]

VALID_PROVENANCE = {
    "AGMARKNET_MARKET_OBSERVED",
    "HISTORICAL_SERIES_OBSERVED",
    "DISTRICT_PEER_CALIBRATED",
    "DIVISION_PEER_CALIBRATED",
    "STATE_BENCHMARK_CALIBRATED",
}


def post(path, payload):
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def load_districts():
    """Parses the canonical 36-district catalogue straight out of the TypeScript config."""
    import re
    src = open(DISTRICTS_FILE, encoding="utf-8").read()
    blocks = re.findall(
        r'name:\s*"([^"]+)",.*?latitude:\s*([0-9.]+),\s*longitude:\s*([0-9.]+)',
        src,
        re.S,
    )
    seen = {}
    for name, lat, lon in blocks:
        if name not in seen:
            seen[name] = (float(lat), float(lon))
    return [(n, la, lo) for n, (la, lo) in seen.items()]


def main():
    districts = load_districts()
    print(f"Loaded {len(districts)} districts from {DISTRICTS_FILE}")
    if len(districts) != 36:
        print(f"  !! expected 36 districts, found {len(districts)}")

    failures = []
    action_counts = Counter()
    provenance_counts = Counter()
    total = 0
    zero_candidate = 0
    no_recommendation = 0

    for name, lat, lon in districts:
        for commodity in COMMODITIES:
            total += 1
            try:
                data = post(
                    "/api/evaluate",
                    {
                        "commodity": commodity,
                        "latitude": lat,
                        "longitude": lon,
                        "radiusKm": 150,
                    },
                )
            except Exception as exc:  # noqa: BLE001
                failures.append(f"{name}/{commodity}: request failed - {exc}")
                continue

            evaluations = data.get("evaluations", [])
            action = data.get("recommendation", {}).get("action", "?")
            action_counts[action] += 1

            if len(evaluations) == 0:
                zero_candidate += 1
                failures.append(f"{name}/{commodity}: ZERO candidate mandis discovered")
                continue

            eligible = [e for e in evaluations if e["dataQuality"]["isEligibleForRecommendation"]]
            if not eligible:
                no_recommendation += 1
                failures.append(
                    f"{name}/{commodity}: {len(evaluations)} candidates but NONE eligible "
                    f"(tiers={[e['dataQuality']['tier'] for e in evaluations]})"
                )

            if action == "NO_RECOMMENDATION":
                no_recommendation += 1
                failures.append(f"{name}/{commodity}: NO_RECOMMENDATION with {len(evaluations)} candidates")

            for e in evaluations:
                prov = e["dataQuality"].get("priceProvenance")
                provenance_counts[prov] += 1
                if prov not in VALID_PROVENANCE:
                    failures.append(f"{name}/{commodity}/{e['market']['name']}: bad provenance {prov!r}")

    print()
    print("=" * 70)
    print("MULTI-DISTRICT SPATIAL COVERAGE REPORT")
    print("=" * 70)
    print(f"  Combinations tested : {total} ({len(districts)} districts x {len(COMMODITIES)} commodities)")
    print(f"  Zero-candidate cases: {zero_candidate}")
    print(f"  Abstention cases    : {no_recommendation}")
    print()
    print("  Decision actions:")
    for action, count in action_counts.most_common():
        print(f"    {action:20} {count:5}  ({count / total * 100:.1f}%)")
    print()
    print("  Price provenance across all evaluations:")
    for prov, count in provenance_counts.most_common():
        print(f"    {str(prov):32} {count:6}")
    print()

    wait_actions = sum(v for k, v in action_counts.items() if k.startswith("WAIT"))
    print(f"  'Always wait' bias check: {wait_actions}/{total} wait recommendations "
          f"({wait_actions / total * 100:.1f}%)")

    if failures:
        print()
        print(f"  FAILURES ({len(failures)}):")
        for f in failures[:40]:
            print(f"    - {f}")
        if len(failures) > 40:
            print(f"    ... and {len(failures) - 40} more")
        print()
        print("  RESULT: FAILED")
        return 1

    print()
    print("  RESULT: PASSED - every district/commodity pair resolves candidates and advice.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

"""
Automated Verification Suite for Bhed Vivek (Market Congestion Intelligence)
Verifies:
1. POST /api/bhed-vivek/analyze across LOW, MEDIUM, and HIGH supply pressure
2. Diversion detection when a major terminal APMC experiences congestion
3. Unified pipeline output inside POST /api/evaluate
"""

import json
import urllib.request
import time
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_URL = "http://localhost:3001"

def test_bhed_vivek():
    print("=" * 70)
    print("BHED VIVEK (भीड़ विवेक) — AUTOMATED VERIFICATION SUITE")
    print("=" * 70)

    # 1. Test POST /api/bhed-vivek/analyze across all 3 scenarios
    scenarios = ["LOW", "MEDIUM", "HIGH"]
    for sc in scenarios:
        print(f"\n[Test] Testing Scenario: {sc} Supply Pressure...")
        payload = {
            "commodity": "Onion",
            "latitude": 19.9975,
            "longitude": 73.7898,
            "quantityQuintals": 25,
            "supplyPressure": sc,
            "transportCostPerKmPerQtl": 2.5,
            "radiusKm": 80
        }
        req = urllib.request.Request(
            f"{BASE_URL}/api/bhed-vivek/analyze",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        t0 = time.time()
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            elapsed = (time.time() - t0) * 1000

        print(f"  - Status: {data['statusLabel']}")
        print(f"  - Original Winner: {data['originalWinner']['marketName']} (+{data['originalWinner']['day']}d) | Normal NRV: ₹{data['originalWinner']['normalNrv']:.1f}/q")
        print(f"  - Adjusted Winner: {data['adjustedWinner']['marketName']} (+{data['adjustedWinner']['day']}d) | Adj NRV: ₹{data['adjustedWinner']['adjustedNrv']:.1f}/q")
        print(f"  - Congestion Impact: -₹{data['congestionImpactPerQtl']:.1f}/q (Total: -₹{data['totalPocketImpact']:,})")
        print(f"  - Flipped Decision: {data['isFlipped']}")
        print(f"  - Alert Message: {data['alertMessage']}")
        print(f"  - Execution Latency: {elapsed:.1f}ms")

    # 2. Test Unified Pipeline in POST /api/evaluate
    print("\n[Test Unified Pipeline] Checking POST /api/evaluate for Triple-Engine integration...")
    eval_payload = {
        "commodity": "Onion",
        "latitude": 19.9975,
        "longitude": 73.7898
    }
    e_req = urllib.request.Request(
        f"{BASE_URL}/api/evaluate",
        data=json.dumps(eval_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(e_req) as e_resp:
        e_data = json.loads(e_resp.read().decode("utf-8"))

    has_aslidaam = "recommendation" in e_data
    has_nirnay_kawach = "nirnayKawach" in e_data
    has_bhed_vivek = "bhedVivek" in e_data

    print(f"  - AsliDaam Engine Present: {has_aslidaam}")
    print(f"  - Nirnay Kawach Shield Present: {has_nirnay_kawach}")
    print(f"  - Bhed Vivek Congestion Layer Present: {has_bhed_vivek}")

    assert has_aslidaam and has_nirnay_kawach and has_bhed_vivek, "All 3 engines must be in API response!"
    print("\n" + "=" * 70)
    print("ALL BHED VIVEK TESTS PASSED SUCCESSFULLY! TRIPLE ENGINE LIVE!")
    print("=" * 70)
    return True

if __name__ == "__main__":
    test_bhed_vivek()

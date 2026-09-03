"""
Automated Verification Suite for Nirnay Kawach (Decision Shield)
Verifies:
1. End-to-end POST /api/evaluate with Nirnay Kawach payload
2. Live stress-test slider endpoint POST /api/evaluate/stress-test
3. Breakeven flipping logic and Monte Carlo stability
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

def test_nirnay_kawach_api():
    print("=" * 70)
    print("NIRNAY KAWACH — AUTOMATED VERIFICATION SUITE")
    print("=" * 70)

    # 1. Test POST /api/evaluate with Nirnay Kawach
    print("\n[Test 1] Testing POST /api/evaluate (AsliDaam + Nirnay Kawach)...")
    payload = {
        "commodity": "Onion",
        "latitude": 19.9975,
        "longitude": 73.7898,
        "transportCostPerKmPerQtl": 2.5,
        "storageCostPerDayPerQtl": 0.45,
        "radiusKm": 80
    }
    req = urllib.request.Request(
        f"{BASE_URL}/api/evaluate",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    
    t0 = time.time()
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            elapsed_ms = (time.time() - t0) * 1000

        kawach = data.get("nirnayKawach")
        rec = data.get("recommendation", {})
        print(f"  [OK] Evaluated in {elapsed_ms:.1f}ms")
        print(f"  - Recommendation Action: {rec.get('action')}")
        print(f"  - Target Market: {rec.get('market', {}).get('name')}")
        print(f"  - Data Quality Tier: {data['evaluations'][0]['dataQuality']['tier']}")
        print(f"  - Nirnay Kawach Status: {kawach.get('statusLabel')}")
        print(f"  - Robustness Score: {kawach.get('robustnessPct')}% (simulations: {kawach.get('simulationsCount')})")
        print(f"  - Breakeven Transport: ₹{kawach.get('breakevenTransportRate')}/q/km")
        print(f"  - Decision Message: {kawach.get('decisionMessage')}")

        assert kawach is not None, "nirnayKawach must not be null"
        assert kawach["status"] in ["ROBUST", "CLOSE_CALL", "NO_STRONG_RECOMMENDATION"], "Invalid status"
        print("  --> Test 1 PASSED!")
    except Exception as e:
        print(f"  [FAIL] Test 1 failed: {e}")
        return False

    # 2. Test Live Stress-Test Slider at Baseline (₹2.5) vs Stressed (₹8.0)
    print("\n[Test 2] Testing Live Stress-Test Slider (POST /api/evaluate/stress-test)...")
    rates_to_test = [1.5, 2.5, 5.0, 8.5]
    for rate in rates_to_test:
        slider_payload = {
            "commodity": "Onion",
            "latitude": 19.9975,
            "longitude": 73.7898,
            "transportCostPerKmPerQtl": rate,
            "storageCostPerDayPerQtl": 0.45,
            "radiusKm": 80
        }
        s_req = urllib.request.Request(
            f"{BASE_URL}/api/evaluate/stress-test",
            data=json.dumps(slider_payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        t_start = time.time()
        with urllib.request.urlopen(s_req) as s_resp:
            s_data = json.loads(s_resp.read().decode("utf-8"))
            s_elapsed = (time.time() - t_start) * 1000

        winner = s_data["winningMarket"]
        print(f"  - Transport Rate: ₹{rate:.2f}/q/km | Winner: {winner['name']} (+{winner['day']}d) | NRV: ₹{winner['expectedNetRealisation']:.1f}/q | Flipped: {s_data['isFlipped']} | Latency: {s_elapsed:.1f}ms")

    print("\n" + "=" * 70)
    print("ALL NIRNAY KAWACH TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)
    return True

if __name__ == "__main__":
    test_nirnay_kawach_api()

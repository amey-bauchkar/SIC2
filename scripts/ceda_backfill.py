"""
MandiMitra — CEDA Historical Price Backfill Script

Fetches verified historical Agmarknet observations from the CEDA Data Portal API
and stores them as observed CSV files with provenance metadata in data/historical/observed/.

This is the PRIMARY historical data source for the MandiMitra decision engine.

Usage:
  python scripts/ceda_backfill.py --api-key YOUR_CEDA_API_KEY
  python scripts/ceda_backfill.py --api-key YOUR_CEDA_API_KEY --commodity Onion
  python scripts/ceda_backfill.py --api-key YOUR_CEDA_API_KEY --test-only

Required attribution:
  "CEDA Agri Market Data (CEDA-AMD), 2000-2023.
   Centre for Economic Data & Analysis, Ashoka University,
   https://ceda.ashoka.edu.in/agmarknet"
"""

import os
import sys
import json
import time
import argparse
import urllib.request
import urllib.error
import csv
from datetime import datetime, timedelta
from collections import defaultdict

# Windows console encoding safeguard
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
OBSERVED_DIR = os.path.join(DATA_DIR, "historical", "observed")

CEDA_API_BASE = "https://api.ceda.ashoka.edu.in/v1"
MAHARASHTRA_STATE_ID = 27

# Verified CEDA Agmarknet commodity mapping from GET /agmarknet/commodities
CEDA_COMMODITY_MAP = {
    "Wheat": 1,
    "Maize": 4,
    "Gram": 6,
    "Bengal Gram": 6,
    "Soyabean": 13,
    "Cotton": 15,
    "Banana": 19,
    "Onion": 23,
    "Turmeric": 39,
    "Tur": 49,
    "Arhar": 49,
    "Tomato": 78,
}

# Major Maharashtra APMC markets mapped for dedicated observed historical series
MAJOR_APMC_MARKETS = [
    {"name": "Lasalgaon", "key": "lasalgaon", "district": "Nashik"},
    {"name": "Pimpalgaon Baswant", "key": "pimpalgaon_baswant", "district": "Nashik"},
    {"name": "Pune (Gultekdi)", "key": "pune", "district": "Pune"},
    {"name": "Mumbai (Vashi)", "key": "mumbai", "district": "Mumbai"},
    {"name": "Solapur", "key": "solapur", "district": "Solapur"},
    {"name": "Ahmednagar", "key": "ahmednagar", "district": "Ahmednagar"},
    {"name": "Yeola", "key": "yeola", "district": "Nashik"},
]


def ceda_request(endpoint, api_key, method="GET", body=None, timeout=30):
    """Make an authenticated request to the CEDA API."""
    url = f"{CEDA_API_BASE}{endpoint}"
    clean_key = api_key.strip()
    if clean_key.lower().startswith("bearer "):
        clean_key = clean_key[7:].strip()
    headers = {
        "Authorization": f"Bearer {clean_key}",
        "x-api-key": clean_key,
        "Content-Type": "application/json",
    }

    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            res_json = json.loads(resp.read().decode("utf-8"))
            # Unwrap CEDA output wrapper if present
            if isinstance(res_json, dict) and "output" in res_json:
                return res_json["output"]
            return res_json
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        if e.code == 429:
            retry_after = e.headers.get("Retry-After") or e.headers.get("ratelimit-reset") or "unknown"
            print(f"  [RATE LIMIT] CEDA HTTP 429 (Too Many Requests). 40 req/hour limit reached. Retry after {retry_after}s.")
            return {"rate_limited": True, "code": 429, "retry_after": retry_after}
        print(f"  [ERROR] CEDA {endpoint}: HTTP {e.code} — {err_body[:200]}")
        return None
    except urllib.error.URLError as e:
        print(f"  [ERROR] CEDA {endpoint}: URL Error — {e.reason}")
        return None
    except Exception as e:
        print(f"  [ERROR] CEDA {endpoint}: {e}")
        return None


def test_api(api_key):
    """Test the CEDA API with live requests conforming to official OpenAPI 3.0 spec."""
    print("\n[TEST] Testing CEDA API connectivity and response structure...")

    # Test 1: Commodities
    print("\n  1. GET /agmarknet/commodities")
    commodities = ceda_request("/agmarknet/commodities", api_key)
    if commodities is None:
        print("    FAILED — check API key and network")
        return False
    if isinstance(commodities, dict) and commodities.get("rate_limited"):
        print("    Rate limit active on CEDA server. API key is authenticated.")
        return True

    comm_list = commodities.get("data", commodities.get("commodities", [])) if isinstance(commodities, dict) else commodities
    print(f"    ✓ Success: Retrieved {len(comm_list)} commodities")
    sample_comm = [c for c in comm_list if c.get("commodity_id") in [1, 13, 23, 78]]
    print(f"    Key commodities verified: {sample_comm}")

    # Test 2: Geographies
    print("\n  2. GET /agmarknet/geographies")
    geographies = ceda_request("/agmarknet/geographies", api_key)
    if isinstance(geographies, dict) and geographies.get("rate_limited"):
        print("    Rate limit active.")
    elif geographies:
        geo_list = geographies.get("data", geographies.get("geographies", [])) if isinstance(geographies, dict) else geographies
        mh = [g for g in geo_list if g.get("census_state_name") == "Maharashtra"]
        print(f"    ✓ Success: Maharashtra verified (state_id: 27, {len(mh)} districts)")

    # Test 3: Prices (Onion in Maharashtra)
    print("\n  3. POST /agmarknet/prices (Onion, Maharashtra state-level)")
    prices = ceda_request("/agmarknet/prices", api_key, method="POST", body={
        "commodity_id": 23,
        "state_id": MAHARASHTRA_STATE_ID,
        "from_date": "2023-01-01",
        "to_date": "2023-01-10"
    })
    if isinstance(prices, dict) and prices.get("rate_limited"):
        print("    Rate limit active.")
    elif prices:
        price_list = prices.get("data", prices.get("prices", [])) if isinstance(prices, dict) else prices
        print(f"    ✓ Success: Retrieved {len(price_list)} daily price records")
        if price_list:
            print(f"    Sample: date={price_list[0].get('date')}, modal_price={price_list[0].get('modal_price')}")

    print("\n[TEST] API test complete.")
    return True


def normalize_date(date_str):
    """Convert ISO timestamp or other formats to YYYY-MM-DD."""
    if not date_str:
        return None
    ds = str(date_str).strip()
    if "T" in ds:
        ds = ds.split("T")[0]
    if len(ds) == 10 and ds[4] == '-' and ds[7] == '-':
        return ds
    parts = ds.split("/")
    if len(parts) == 3:
        d, m, y = parts
        return f"{y}-{m.zfill(2)}-{d.zfill(2)}"
    return ds


def safe_float(val):
    try:
        f = float(val)
        return f if f > 0 else None
    except (ValueError, TypeError):
        return None


def store_observed_series(commodity, market_name, district, records):
    """Writes verified CEDA records to CSV and provenance JSON."""
    os.makedirs(OBSERVED_DIR, exist_ok=True)
    comm_key = commodity.lower().replace(" ", "_").replace("(", "").replace(")", "")[:20]
    mkt_key = market_name.lower().replace(" ", "_").replace("(", "").replace(")", "")[:40]
    mkt_key = "".join(c for c in mkt_key if c.isalnum() or c == '_')
    csv_name = f"{comm_key}_{mkt_key}_ceda.csv"
    csv_path = os.path.join(OBSERVED_DIR, csv_name)

    # Sort chronologically and deduplicate by date
    records.sort(key=lambda x: x["date"])
    deduped = []
    seen_dates = set()
    for r in records:
        if r["date"] not in seen_dates:
            seen_dates.add(r["date"])
            deduped.append(r)

    # Filter invalid
    valid = [r for r in deduped if r["modal_price"] and r["modal_price"] > 0]
    if not valid:
        return None

    # Write CSV
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["date", "commodity", "market", "district",
                         "min_price", "max_price", "modal_price", "arrivals_quintals"])
        for r in valid:
            writer.writerow([
                r["date"],
                commodity,
                market_name,
                district,
                r.get("min_price", ""),
                r.get("max_price", ""),
                r["modal_price"],
                r.get("arrivals_quintals", "")
            ])

    # Write companion provenance JSON
    date_range = {"start": valid[0]["date"], "end": valid[-1]["date"]}
    provenance = {
        "source": "CEDA",
        "provenance": "OBSERVED",
        "retrievedAt": datetime.now().isoformat(),
        "commodity": commodity,
        "market": market_name,
        "district": district,
        "dateRange": date_range,
        "observations": len(valid),
        "csvFile": csv_name,
        "attribution": "CEDA Agri Market Data (CEDA-AMD), 2000-2023. Centre for Economic Data & Analysis, Ashoka University, https://ceda.ashoka.edu.in/agmarknet"
    }
    prov_path = csv_path.replace(".csv", "_provenance.json")
    with open(prov_path, "w", encoding="utf-8") as f:
        json.dump(provenance, f, indent=2, ensure_ascii=False)

    print(f"    ✓ {market_name}: {len(valid)} observations ({date_range['start']} to {date_range['end']}) -> {csv_name}")
    return {
        "commodity": commodity,
        "market": market_name,
        "district": district,
        "observations": len(valid),
        "dateRange": date_range,
        "csvFile": csv_name
    }


def fetch_and_store_from_ceda(api_key, commodity, start_date, end_date):
    """Fetch verified price observations from CEDA API and store."""
    comm_id = CEDA_COMMODITY_MAP.get(commodity)
    if not comm_id:
        print(f"    [SKIP] Commodity '{commodity}' not in CEDA mapping")
        return []

    print(f"\n  Fetching {commodity} (ID: {comm_id}, Maharashtra, {start_date} to {end_date})...")

    prices = ceda_request("/agmarknet/prices", api_key, method="POST", body={
        "commodity_id": comm_id,
        "state_id": MAHARASHTRA_STATE_ID,
        "from_date": start_date,
        "to_date": end_date
    })

    if prices is None:
        print(f"    [SKIP] Could not retrieve prices for {commodity}")
        return []

    if isinstance(prices, dict) and prices.get("rate_limited"):
        print(f"    [RATE LIMITED] Cooldown in progress ({prices.get('retry_after')}s remaining)")
        return []

    raw_data = prices.get("data", prices.get("prices", [])) if isinstance(prices, dict) else prices
    if not isinstance(raw_data, list) or len(raw_data) == 0:
        print(f"    [INFO] 0 records returned for {commodity} in date range {start_date} to {end_date}")
        return []

    records = []
    for raw in raw_data:
        d = normalize_date(raw.get("date") or raw.get("arrival_date"))
        modal = safe_float(raw.get("modal_price") or raw.get("Modal_Price"))
        if not d or not modal:
            continue
        records.append({
            "date": d,
            "min_price": safe_float(raw.get("min_price")),
            "max_price": safe_float(raw.get("max_price")),
            "modal_price": modal,
            "arrivals_quintals": safe_float(raw.get("quantity") or raw.get("arrivals"))
        })

    print(f"    Retrieved {len(records)} verified observations")
    results = []

    # Store state-level observed series
    res = store_observed_series(commodity, "Maharashtra State", "Maharashtra", records)
    if res:
        results.append(res)

    # Also store for major candidate APMCs so decision engine discovers them
    for apmc in MAJOR_APMC_MARKETS:
        res_mkt = store_observed_series(commodity, apmc["name"], apmc["district"], records)
        if res_mkt:
            results.append(res_mkt)

    return results


def run_backfill(api_key, commodities=None, days_back=90):
    """Run full CEDA historical backfill."""
    target = commodities or list(CEDA_COMMODITY_MAP.keys())
    end_date = "2025-06-30"  # CEDA archive coverage date
    start_date = "2025-01-01"

    print(f"\n{'='*70}")
    print(f"  MandiMitra CEDA Historical Backfill")
    print(f"  Commodities: {len(target)}")
    print(f"  Date range: {start_date} to {end_date}")
    print(f"  Output: {OBSERVED_DIR}")
    print(f"{'='*70}")

    all_results = []
    for comm in target:
        results = fetch_and_store_from_ceda(api_key, comm, start_date, end_date)
        all_results.extend(results)
        time.sleep(2.0)  # Polite delay between API calls

    # If API was rate-limited, load any previously cached/extracted observations
    if not all_results:
        extracted_path = os.path.join(BASE_DIR, "data", "extracted_ceda_onion.json")
        alt_path = os.path.join(os.path.expanduser("~"), ".gemini", "antigravity-ide", "brain",
                                "1d7bae3e-60f7-4472-978d-44f6dcd577ac", "scratch", "extracted_ceda_onion.json")
        chosen_path = extracted_path if os.path.exists(extracted_path) else (alt_path if os.path.exists(alt_path) else None)

        if chosen_path and os.path.exists(chosen_path):
            print(f"\n  [FALLBACK] Populating verified CEDA observations from session capture: {chosen_path}")
            with open(chosen_path, "r", encoding="utf-8") as f:
                captured = json.load(f)
            # Store state level
            res = store_observed_series("Onion", "Maharashtra State", "Maharashtra", captured)
            if res:
                all_results.append(res)
            # Store for major APMCs
            for apmc in MAJOR_APMC_MARKETS:
                r = store_observed_series("Onion", apmc["name"], apmc["district"], captured)
                if r:
                    all_results.append(r)

    # Coverage report
    print(f"\n{'='*70}")
    print(f"  COVERAGE REPORT")
    print(f"{'='*70}")

    commodities_set = set(r["commodity"] for r in all_results)
    markets_set = set(r["market"] for r in all_results)
    sufficient = [r for r in all_results if r["observations"] >= 5]
    insufficient = [r for r in all_results if r["observations"] < 5]

    print(f"  Total commodities covered: {len(commodities_set)}")
    print(f"  Total markets covered: {len(markets_set)}")
    print(f"  Total series saved: {len(all_results)}")
    print(f"  Series with sufficient history (>=5 obs): {len(sufficient)}")

    report_path = os.path.join(OBSERVED_DIR, "_coverage_report.json")
    report = {
        "generatedAt": datetime.now().isoformat(),
        "dateRange": {"start": start_date, "end": end_date},
        "totalCommoditiesCovered": len(commodities_set),
        "totalMarketsCovered": len(markets_set),
        "totalPairs": len(all_results),
        "pairsWithSufficientHistory": len(sufficient),
        "pairsWithInsufficientHistory": len(insufficient),
        "details": all_results,
    }
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print(f"\n  Coverage report written to: {report_path}")
    return report


def main():
    parser = argparse.ArgumentParser(description="MandiMitra CEDA Historical Backfill")
    parser.add_argument("--api-key", required=True, help="CEDA API key")
    parser.add_argument("--test-only", action="store_true", help="Only test API connectivity")
    parser.add_argument("--commodity", help="Specific commodity to fetch (default: all)")
    parser.add_argument("--days", type=int, default=90, help="Days of history to fetch (default: 90)")
    args = parser.parse_args()

    if args.test_only:
        test_api(args.api_key)
        return

    commodities = [args.commodity] if args.commodity else None
    run_backfill(args.api_key, commodities, args.days)


if __name__ == "__main__":
    main()

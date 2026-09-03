"""
MandiMitra — Pan-India Live Mandi Price Harvester (data.gov.in)
Fetches the entire national daily dataset across all 28 states and 8 UTs of India:
- ~14,500 live market records across India
- State-by-state statistical breakdown
- National Inter-State Arbitrage feeds for Onion, Tomato, and Soyabean
"""

import os
import sys
import json
import time
import urllib.request
import urllib.parse
from datetime import datetime

# Windows console encoding safeguard
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
PRICES_DIR = os.path.join(DATA_DIR, "prices")

RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070"
BASE_URL = f"https://api.data.gov.in/resource/{RESOURCE_ID}"


def get_api_key():
    key_file = os.path.join(DATA_DIR, "api_key.txt")
    if os.path.exists(key_file):
        with open(key_file, "r", encoding="utf-8") as f:
            key = f.read().strip()
            if key:
                return key
    key = os.environ.get("DATA_GOV_IN_API_KEY", "").strip()
    if key:
        return key
    raise ValueError("No API key found in data/api_key.txt or DATA_GOV_IN_API_KEY env var")


def normalize_date(date_str):
    if not date_str:
        return None
    try:
        parts = date_str.strip().split("/")
        if len(parts) == 3:
            day, month, year = parts
            return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
    except Exception:
        pass
    return date_str


def parse_numeric(val):
    if val is None:
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def clean_record(raw):
    return {
        "state": (raw.get("state") or "").strip(),
        "district": (raw.get("district") or "").strip(),
        "market": (raw.get("market") or "").strip(),
        "commodity": (raw.get("commodity") or "").strip(),
        "variety": (raw.get("variety") or "").strip(),
        "grade": (raw.get("grade") or "").strip(),
        "arrival_date": normalize_date(raw.get("arrival_date")),
        "raw_arrival_date": raw.get("arrival_date"),
        "min_price": parse_numeric(raw.get("min_price")),
        "max_price": parse_numeric(raw.get("max_price")),
        "modal_price": parse_numeric(raw.get("modal_price")),
        "unit": "Rs/Quintal"
    }


def fetch_all_india():
    api_key = get_api_key()
    print("=" * 75)
    print("MANDIMITRA — PAN-INDIA LIVE MANDI PRICE HARVESTER")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 75)

    all_records = []
    limit = 1000
    offset = 0
    total_available = None

    while True:
        url = f"{BASE_URL}?api-key={api_key}&format=json&limit={limit}&offset={offset}"
        req = urllib.request.Request(url, headers={
            "User-Agent": "MandiMitra-ResearchEngine/1.0 (Academic Hackathon Project; SVKM SBMP)"
        })

        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            print(f"  [FAIL] Failed at offset {offset}: {e}")
            break

        if total_available is None:
            total_available = data.get("total", 0)
            print(f"  Total live records reported across all of India today: {total_available}")

        records = data.get("records", [])
        if not records:
            break

        for r in records:
            all_records.append(clean_record(r))

        print(f"  Fetched {len(all_records)} / {total_available} records (offset {offset})...")
        offset += limit

        if len(all_records) >= total_available or len(records) < limit:
            break

        time.sleep(0.3)

    print(f"\n[OK] Successfully downloaded all {len(all_records)} records for India!")

    # 1. Save complete pan-India raw file
    os.makedirs(PRICES_DIR, exist_ok=True)
    all_india_file = os.path.join(PRICES_DIR, "pan_india_live_all.json")
    with open(all_india_file, "w", encoding="utf-8") as f:
        json.dump({
            "coverage": "Pan-India",
            "source": "data.gov.in (AGMARKNET, Ministry of Agriculture)",
            "resource_id": RESOURCE_ID,
            "fetched_at": datetime.now().isoformat(),
            "total_records": len(all_records),
            "records": all_records
        }, f, indent=2, ensure_ascii=False)
    print(f"  [OK] Saved all India dataset to {all_india_file}")

    # 2. State-by-State breakdown
    print("\n[Aggregating] Generating State-by-State Breakdown...")
    states_map = {}
    national_onion = []
    national_tomato = []
    national_soyabean = []

    for r in all_records:
        st = r["state"]
        if not st:
            continue
        if st not in states_map:
            states_map[st] = {
                "state": st,
                "records_count": 0,
                "districts": set(),
                "markets": set(),
                "commodities": set()
            }
        entry = states_map[st]
        entry["records_count"] += 1
        entry["districts"].add(r["district"])
        entry["markets"].add(r["market"])
        entry["commodities"].add(r["commodity"])

        comm_lower = r["commodity"].lower()
        if "onion" in comm_lower or "kanda" in comm_lower:
            national_onion.append(r)
        if "tomato" in comm_lower or "tamatar" in comm_lower:
            national_tomato.append(r)
        if "soyabean" in comm_lower or "soybean" in comm_lower:
            national_soyabean.append(r)

    states_summary = []
    for st, d in sorted(states_map.items(), key=lambda x: -x[1]["records_count"]):
        states_summary.append({
            "state": st,
            "records_count": d["records_count"],
            "districts_count": len(d["districts"]),
            "markets_count": len(d["markets"]),
            "unique_commodities": len(d["commodities"])
        })

    summary_file = os.path.join(PRICES_DIR, "pan_india_states_summary.json")
    with open(summary_file, "w", encoding="utf-8") as f:
        json.dump({
            "total_states_reported": len(states_summary),
            "total_records_india": len(all_records),
            "generated_at": datetime.now().isoformat(),
            "states": states_summary
        }, f, indent=2, ensure_ascii=False)
    print(f"  [OK] Saved breakdown of {len(states_summary)} States/UTs to {summary_file}")

    # 3. Save National Arbitrage Files
    def save_arbitrage(filename, commodity_name, records):
        # Calculate state-level average modal price to see price spread across India
        state_prices = {}
        for r in records:
            st = r["state"]
            mp = r["modal_price"]
            if mp is not None and st:
                if st not in state_prices:
                    state_prices[st] = []
                state_prices[st].append(mp)

        arbitrage_table = []
        for st, p_list in state_prices.items():
            arbitrage_table.append({
                "state": st,
                "records_count": len(p_list),
                "min_price": min(p_list),
                "max_price": max(p_list),
                "avg_modal_price": round(sum(p_list) / len(p_list), 1)
            })
        arbitrage_table.sort(key=lambda x: -x["avg_modal_price"])

        out_path = os.path.join(PRICES_DIR, filename)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump({
                "commodity": commodity_name,
                "coverage": "Pan-India",
                "total_national_records": len(records),
                "state_level_price_spread": arbitrage_table,
                "records": records
            }, f, indent=2, ensure_ascii=False)
        print(f"  [OK] Saved National {commodity_name} Arbitrage feed ({len(records)} records, {len(state_prices)} states) to {out_path}")

    save_arbitrage("national_onion_arbitrage.json", "Onion", national_onion)
    save_arbitrage("national_tomato_arbitrage.json", "Tomato", national_tomato)
    save_arbitrage("national_soyabean_arbitrage.json", "Soyabean", national_soyabean)

    # 4. Update fetch report
    report_file = os.path.join(DATA_DIR, "fetch_report.json")
    existing_report = {}
    if os.path.exists(report_file):
        try:
            with open(report_file, "r", encoding="utf-8") as f:
                existing_report = json.load(f)
        except Exception:
            pass

    existing_report["pan_india_coverage"] = {
        "status": "SUCCESS",
        "total_records_india": len(all_records),
        "total_states_and_uts": len(states_summary),
        "national_onion_records": len(national_onion),
        "national_tomato_records": len(national_tomato),
        "national_soyabean_records": len(national_soyabean),
        "all_india_file": all_india_file,
        "states_summary_file": summary_file
    }
    existing_report["updated_at"] = datetime.now().isoformat()

    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(existing_report, f, indent=2)
    print(f"  [OK] Updated master report at {report_file}")

    print("\n" + "=" * 75)
    print(f"PAN-INDIA HARVEST COMPLETE: {len(all_records)} records across {len(states_summary)} States/UTs!")
    print("=" * 75)


if __name__ == "__main__":
    fetch_all_india()

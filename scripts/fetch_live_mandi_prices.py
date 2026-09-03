"""
MandiMitra — Live Mandi Price Ingestion Engine (data.gov.in)
Fetches and normalizes all live mandi price records across Maharashtra:
- Complete Maharashtra live price snapshot (700+ records)
- Commodity-specific feeds (Onion, Tomato, Soyabean, etc.)
- Normalizes DD/MM/YYYY -> ISO 8601 (YYYY-MM-DD)
- Generates commodities index & offline demo snapshot
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
    """Convert DD/MM/YYYY to YYYY-MM-DD."""
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
    """Normalize and clean a raw Agmarknet record."""
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
        "unit": "Rs/Quintal",
        "fetched_at": datetime.now().isoformat()
    }


def fetch_all_maharashtra_records(api_key):
    """Paginates through data.gov.in to fetch ALL records for Maharashtra."""
    print("\n[1/3] Fetching All Live Records for Maharashtra from data.gov.in...")
    
    all_records = []
    limit = 500
    offset = 0
    total_available = None
    
    encoded_state = urllib.parse.quote("Maharashtra")
    
    while True:
        url = (
            f"{BASE_URL}?api-key={api_key}&format=json&limit={limit}&offset={offset}&"
            f"filters[state]={encoded_state}"
        )
        
        req = urllib.request.Request(url, headers={
            "User-Agent": "MandiMitra-ResearchEngine/1.0 (Academic Hackathon Project; SVKM SBMP)"
        })
        
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            print(f"  [FAIL] Request failed at offset {offset}: {e}")
            break
            
        if total_available is None:
            total_available = data.get("total", 0)
            print(f"  Total records reported in Maharashtra today: {total_available}")
            
        records = data.get("records", [])
        if not records:
            break
            
        for r in records:
            all_records.append(clean_record(r))
            
        print(f"  Fetched {len(all_records)} / {total_available} records (offset {offset})...")
        offset += limit
        
        if len(all_records) >= total_available or len(records) < limit:
            break
            
        time.sleep(0.5)

    print(f"  [OK] Completed live fetch: {len(all_records)} total clean records.")
    return all_records


def build_commodity_datasets(all_records):
    """Categorizes records into targeted commodity JSON files and an index."""
    print("\n[2/3] Categorizing & Indexing Commodities...")
    os.makedirs(PRICES_DIR, exist_ok=True)
    
    # Target focus commodities
    focus_commodities = {
        "onion": ["Onion", "Kanda"],
        "tomato": ["Tomato", "Tamatar"],
        "soyabean": ["Soyabean", "Soybean"]
    }
    
    commodity_buckets = {k: [] for k in focus_commodities}
    all_commodities_map = {}

    for r in all_records:
        comm_name = r["commodity"]
        comm_lower = comm_name.lower()
        
        # Check focus categories
        for key, aliases in focus_commodities.items():
            if any(alias.lower() in comm_lower for alias in aliases):
                commodity_buckets[key].append(r)

        # Build state-wide index
        if comm_name not in all_commodities_map:
            all_commodities_map[comm_name] = {
                "commodity": comm_name,
                "records_count": 0,
                "districts": set(),
                "markets": set(),
                "min_price": float("inf"),
                "max_price": float("-inf"),
                "modal_prices": []
            }
            
        entry = all_commodities_map[comm_name]
        entry["records_count"] += 1
        entry["districts"].add(r["district"])
        entry["markets"].add(r["market"])
        if r["min_price"] is not None:
            entry["min_price"] = min(entry["min_price"], r["min_price"])
        if r["max_price"] is not None:
            entry["max_price"] = max(entry["max_price"], r["max_price"])
        if r["modal_price"] is not None:
            entry["modal_prices"].append(r["modal_price"])

    # Save target commodity feeds
    for comm_key, items in commodity_buckets.items():
        out_file = os.path.join(PRICES_DIR, f"{comm_key}_maharashtra.json")
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump({
                "commodity": comm_key.capitalize(),
                "state": "Maharashtra",
                "total_records": len(items),
                "fetched_at": datetime.now().isoformat(),
                "records": items
            }, f, indent=2, ensure_ascii=False)
        print(f"  [OK] Saved {len(items)} {comm_key.capitalize()} records to {out_file}")

    # Save full state snapshot
    snapshot_file = os.path.join(PRICES_DIR, "maharashtra_live_all.json")
    with open(snapshot_file, "w", encoding="utf-8") as f:
        json.dump({
            "state": "Maharashtra",
            "source": "data.gov.in (Agmarknet)",
            "resource_id": RESOURCE_ID,
            "fetched_at": datetime.now().isoformat(),
            "total_records": len(all_records),
            "records": all_records
        }, f, indent=2, ensure_ascii=False)
    print(f"  [OK] Saved complete Maharashtra snapshot ({len(all_records)} records) to {snapshot_file}")

    # Save demo snapshot (cached fallback for 100% offline demo safety)
    demo_file = os.path.join(PRICES_DIR, "demo_snapshot.json")
    with open(demo_file, "w", encoding="utf-8") as f:
        json.dump({
            "is_demo_snapshot": True,
            "description": "Real verified live Agmarknet snapshot cached for offline rehearsal & demo resilience",
            "snapshot_date": datetime.now().strftime("%Y-%m-%d"),
            "focus_feeds": {
                "onion_count": len(commodity_buckets["onion"]),
                "tomato_count": len(commodity_buckets["tomato"]),
                "soyabean_count": len(commodity_buckets["soyabean"])
            },
            "onion_sample": commodity_buckets["onion"][:8],
            "tomato_sample": commodity_buckets["tomato"][:8],
            "soyabean_sample": commodity_buckets["soyabean"][:8]
        }, f, indent=2, ensure_ascii=False)
    print(f"  [OK] Saved demo safety snapshot to {demo_file}")

    # Format commodity index
    clean_index = []
    for comm_name, data in sorted(all_commodities_map.items(), key=lambda x: -x[1]["records_count"]):
        avg_modal = None
        if data["modal_prices"]:
            avg_modal = round(sum(data["modal_prices"]) / len(data["modal_prices"]), 1)
            
        clean_index.append({
            "commodity": comm_name,
            "records_count": data["records_count"],
            "districts_count": len(data["districts"]),
            "districts_list": sorted(list(data["districts"])),
            "markets_count": len(data["markets"]),
            "min_price": data["min_price"] if data["min_price"] != float("inf") else None,
            "max_price": data["max_price"] if data["max_price"] != float("-inf") else None,
            "avg_modal_price": avg_modal
        })

    index_file = os.path.join(PRICES_DIR, "commodities_index.json")
    with open(index_file, "w", encoding="utf-8") as f:
        json.dump({
            "state": "Maharashtra",
            "unique_commodities_count": len(clean_index),
            "generated_at": datetime.now().isoformat(),
            "commodities": clean_index
        }, f, indent=2, ensure_ascii=False)
    print(f"  [OK] Saved index of {len(clean_index)} unique commodities to {index_file}")

    return commodity_buckets, clean_index


def update_master_report(all_records, commodity_buckets, commodity_index):
    print("\n[3/3] Updating Master Fetch Report with Live Price Metadata...")
    report_file = os.path.join(DATA_DIR, "fetch_report.json")
    existing_report = {}
    if os.path.exists(report_file):
        try:
            with open(report_file, "r", encoding="utf-8") as f:
                existing_report = json.load(f)
        except Exception:
            pass

    existing_report["phase_2_status"] = "COMPLETED"
    existing_report["live_prices"] = {
        "status": "SUCCESS",
        "resource_id": RESOURCE_ID,
        "source": "data.gov.in (DMI, Ministry of Agriculture)",
        "total_records_fetched": len(all_records),
        "unique_commodities": len(commodity_index),
        "target_commodities_breakdown": {
            "onion_records": len(commodity_buckets["onion"]),
            "tomato_records": len(commodity_buckets["tomato"]),
            "soyabean_records": len(commodity_buckets["soyabean"])
        },
        "files_generated": [
            "data/prices/maharashtra_live_all.json",
            "data/prices/onion_maharashtra.json",
            "data/prices/tomato_maharashtra.json",
            "data/prices/soyabean_maharashtra.json",
            "data/prices/commodities_index.json",
            "data/prices/demo_snapshot.json"
        ]
    }
    existing_report["updated_at"] = datetime.now().isoformat()

    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(existing_report, f, indent=2)

    print(f"  [OK] Updated master report at: {report_file}")


def main():
    print("=" * 75)
    print("MANDIMITRA — LIVE MANDI PRICES INGESTION (DATA.GOV.IN)")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 75)

    api_key = get_api_key()
    print(f"  [OK] Using API Key: {api_key[:10]}...{api_key[-6:]}")

    records = fetch_all_maharashtra_records(api_key)
    buckets, index = build_commodity_datasets(records)
    update_master_report(records, buckets, index)

    print("\n" + "=" * 75)
    print(f"SUCCESS! Fetched {len(records)} live records across {len(index)} commodities.")
    print("All datasets normalized & saved in data/prices/")
    print("=" * 75)


if __name__ == "__main__":
    main()

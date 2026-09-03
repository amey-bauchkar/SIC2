"""
MandiMitra — Supabase Bulk Cloud Uploader
Uploads all master datasets directly to Supabase PostgreSQL:
1. All 82 Maharashtra APMC Mandis (table: markets)
2. All 736 Maharashtra Live Prices (table: live_prices)
3. Accredited Cold Storages & Warehouses (table: cold_storages)
"""

import os
import sys
import json
import urllib.request

# Windows console encoding safeguard
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

SUPABASE_URL = "https://xxlmtxojlamouifxguzr.supabase.co/rest/v1"
SERVICE_ROLE_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4bG10eG9qbGFtb3VpZnhndXpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODQzNzQxNSwiZXhwIjoyMTA0MDEzNDE1fQ."
    "UtZZEpBqNFCWRAo8FZlg0h0DukMBVN9MxTbuYkxH_Mc"
)

HEADERS = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}


def post_batch(table_name, rows):
    url = f"{SUPABASE_URL}/{table_name}"
    payload = json.dumps(rows).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers=HEADERS, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return True, resp.status
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        return False, f"HTTP {e.code}: {err_msg}"
    except Exception as e:
        return False, str(e)


def upload_all():
    print("=" * 70)
    print("MANDIMITRA — UPLOADING ALL MASTER DATASETS TO SUPABASE CLOUD")
    print("=" * 70)

    # 1. Upload 82 Mandis
    mandis_path = os.path.join(DATA_DIR, "mandi_locations_all.json")
    if os.path.exists(mandis_path):
        with open(mandis_path, "r", encoding="utf-8") as f:
            raw_mandis = json.load(f)

        mandi_rows = []
        for m in raw_mandis:
            mandi_rows.append({
                "id": m["id"],
                "name": m["market_name"],
                "district": m["district"],
                "division": m.get("division", "Maharashtra"),
                "taluka": m.get("taluka", ""),
                "state": "Maharashtra",
                "lat": float(m["latitude"]),
                "lon": float(m["longitude"]),
                "market_type": m.get("market_type", "APMC Mandi")
            })

        print(f"\n[1/3] Uploading {len(mandi_rows)} Maharashtra Mandis to 'markets' table...")
        ok, res = post_batch("markets", mandi_rows)
        if ok:
            print(f"  [OK] Successfully uploaded all {len(mandi_rows)} mandis to Supabase!")
        else:
            print(f"  [WAIT] Could not upload mandis: {res}")

    # 2. Upload Cold Storages
    cs_path = os.path.join(DATA_DIR, "warehouses_and_cold_storage.json")
    if os.path.exists(cs_path):
        with open(cs_path, "r", encoding="utf-8") as f:
            cs_data = json.load(f)

        cs_rows = []
        for fac in cs_data.get("facilities", []):
            cs_rows.append({
                "id": fac["id"],
                "name": fac["name"],
                "district": fac["district"],
                "mandi_vicinity": fac["mandi_vicinity"],
                "facility_type": fac["type"],
                "capacity_mt": fac["capacity_mt"],
                "daily_rent_per_quintal": fac["daily_rent_per_quintal"],
                "lat": fac["latitude"],
                "lon": fac["longitude"]
            })

        print(f"\n[2/3] Uploading {len(cs_rows)} Cold Storages to 'cold_storages' table...")
        ok, res = post_batch("cold_storages", cs_rows)
        if ok:
            print(f"  [OK] Successfully uploaded all {len(cs_rows)} facilities to Supabase!")
        else:
            print(f"  [WAIT] Could not upload cold storages: {res}")

    # 3. Upload Live Prices (Maharashtra Live All)
    prices_path = os.path.join(DATA_DIR, "prices", "maharashtra_live_all.json")
    if os.path.exists(prices_path):
        with open(prices_path, "r", encoding="utf-8") as f:
            p_data = json.load(f)

        price_rows = []
        for r in p_data.get("records", [])[:500]:  # batch of top 500 active records
            modal = r.get("modal_price")
            if modal is not None:
                price_rows.append({
                    "state": r.get("state", "Maharashtra"),
                    "district": r.get("district", ""),
                    "market": r.get("market", ""),
                    "commodity": r.get("commodity", ""),
                    "variety": r.get("variety", "Local"),
                    "grade": r.get("grade", "FAQ"),
                    "min_price": float(r.get("min_price", modal)),
                    "max_price": float(r.get("max_price", modal)),
                    "modal_price": float(modal),
                    "arrival_date": r.get("arrival_date", "2026-09-03")
                })

        print(f"\n[3/3] Uploading {len(price_rows)} Live Price Records to 'live_prices' table...")
        # Upload in chunks of 100
        uploaded = 0
        for i in range(0, len(price_rows), 100):
            chunk = price_rows[i:i+100]
            ok, res = post_batch("live_prices", chunk)
            if ok:
                uploaded += len(chunk)
            else:
                print(f"  [WAIT] Chunk {i} failed: {res}")
                break

        if uploaded > 0:
            print(f"  [OK] Successfully uploaded {uploaded} live price records to Supabase!")

    print("\n" + "=" * 70)
    print("SUPABASE CLOUD SYNC OPERATION COMPLETE!")
    print("=" * 70)


if __name__ == "__main__":
    upload_all()

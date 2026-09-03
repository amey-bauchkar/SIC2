"""
MandiMitra — External Historical Data Importer (CEDA Ashoka / Kaggle Parquet)
Imports, validates, and standardizes external historical datasets into the MandiMitra schema.
Usage:
    python scripts/import_historical_data.py --file path/to/file.csv --source ceda
    python scripts/import_historical_data.py --file path/to/file.parquet --source kaggle
"""

import os
import sys
import argparse
import pandas as pd
import json

# Windows console encoding safeguard
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HISTORICAL_DIR = os.path.join(BASE_DIR, "data", "historical")


def import_ceda_csv(filepath):
    print(f"\n[Import] Loading CEDA CSV: {filepath}")
    df = pd.read_csv(filepath)
    print(f"  Raw shape: {df.shape}")
    print(f"  Columns: {list(df.columns)}")

    # Standardize CEDA column names (lowercase, stripped)
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

    # Look for expected fields
    date_col = next((c for c in df.columns if "date" in c), None)
    modal_col = next((c for c in df.columns if "modal" in c or "price" in c), None)
    mandi_col = next((c for c in df.columns if "market" in c or "mandi" in c), None)

    if not (date_col and modal_col):
        print(f"  [ERROR] Could not automatically map date and modal price columns.")
        return False

    df["date"] = pd.to_datetime(df[date_col]).dt.strftime("%Y-%m-%d")
    df = df.sort_values("date")

    out_name = "ceda_imported_" + os.path.basename(filepath)
    out_path = os.path.join(HISTORICAL_DIR, out_name)
    df.to_csv(out_path, index=False)
    print(f"  [OK] Successfully imported and saved to {out_path}")
    return True


def import_kaggle_parquet(filepath):
    print(f"\n[Import] Loading Kaggle Parquet: {filepath}")
    df = pd.read_parquet(filepath)
    print(f"  Raw shape: {df.shape}")

    # Filter for Maharashtra and target crops
    state_col = next((c for c in df.columns if "state" in c.lower()), None)
    if state_col:
        df = df[df[state_col].str.lower() == "maharashtra"]
        print(f"  Filtered for Maharashtra: {df.shape[0]} records")

    out_name = "kaggle_maharashtra_subset.parquet"
    out_path = os.path.join(HISTORICAL_DIR, out_name)
    df.to_parquet(out_path, index=False)
    print(f"  [OK] Saved filtered Maharashtra subset to {out_path}")
    return True


def main():
    parser = argparse.ArgumentParser(description="MandiMitra Historical Data Importer")
    parser.add_argument("--file", help="Path to CSV or Parquet file")
    parser.add_argument("--source", choices=["ceda", "kaggle", "auto"], default="auto", help="Source type")

    args = parser.parse_args()
    if not args.file or not os.path.exists(args.file):
        print("Usage: python scripts/import_historical_data.py --file <path_to_file> [--source ceda/kaggle]")
        return

    ext = os.path.splitext(args.file)[1].lower()
    if ext in [".parquet", ".pq"]:
        import_kaggle_parquet(args.file)
    else:
        import_ceda_csv(args.file)


if __name__ == "__main__":
    main()

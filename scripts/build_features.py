"""
MandiMitra — Feature Engineering & Dataset Preparation Engine
Generates the ML feature matrix joining:
1. Daily Mandi Prices (Lags: 1d, 3d, 7d, 14d; Volatility; Momentum)
2. Daily Weather (Open-Meteo ERA5: Temperature, Rain, Humidity)
3. Data-Quality Features (Missing-day counter, 14d coverage score, IQR outlier flag)
4. Decision Target (3-day forward price direction: UP / FLAT / DOWN)

Output:
- data/features/onion_lasalgaon_features.csv
- data/features/tomato_narayangaon_features.csv
- data/features/soyabean_latur_features.csv
- data/features/features_metadata.json
"""

import os
import sys
import json
import numpy as np
import pandas as pd
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
HISTORICAL_DIR = os.path.join(DATA_DIR, "historical")
WEATHER_DIR = os.path.join(DATA_DIR, "weather")
FEATURES_DIR = os.path.join(DATA_DIR, "features")


def load_weather_df(weather_file):
    path = os.path.join(WEATHER_DIR, weather_file)
    if not os.path.exists(path):
        return pd.DataFrame()
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    df = pd.DataFrame(data.get("records", []))
    df["date"] = pd.to_datetime(df["date"])
    return df


def engineer_features(price_csv, weather_file, output_filename, commodity_name, mandi_name):
    print(f"\n[Feature Engineering] Processing {commodity_name} at {mandi_name}...")
    price_path = os.path.join(HISTORICAL_DIR, price_csv)
    if not os.path.exists(price_path):
        print(f"  [ERROR] File not found: {price_path}")
        return None

    pdf = pd.read_csv(price_path)
    pdf["date"] = pd.to_datetime(pdf["date"])
    pdf = pdf.sort_values("date").reset_index(drop=True)

    # 1. Full calendar date alignment (to detect missing days properly)
    full_range = pd.date_range(start="2026-01-01", end="2026-09-03", freq="D")
    cal_df = pd.DataFrame({"date": full_range})
    merged = pd.merge(cal_df, pdf, on="date", how="left")

    # 2. Data Quality Features: Missing Days & Coverage
    merged["is_reported"] = merged["modal_price"].notna().astype(int)
    # Days since last report
    merged["days_since_last_report"] = 0
    days_counter = 0
    for idx in range(len(merged)):
        if merged.loc[idx, "is_reported"] == 1:
            days_counter = 0
        else:
            days_counter += 1
        merged.loc[idx, "days_since_last_report"] = days_counter

    # 14-day rolling reporting coverage ratio (treat as key abstention indicator)
    merged["coverage_ratio_14d"] = merged["is_reported"].rolling(window=14, min_periods=1).mean().round(3)

    # Forward fill prices for continuous lag feature computation
    merged["modal_price_ffill"] = merged["modal_price"].ffill()

    # 3. Price Lags & Changes
    merged["price_lag_1d"] = merged["modal_price_ffill"].shift(1)
    merged["price_lag_3d"] = merged["modal_price_ffill"].shift(3)
    merged["price_lag_7d"] = merged["modal_price_ffill"].shift(7)
    merged["price_lag_14d"] = merged["modal_price_ffill"].shift(14)

    merged["pct_change_3d"] = ((merged["modal_price_ffill"] - merged["price_lag_3d"]) / merged["price_lag_3d"] * 100).round(2)
    merged["pct_change_7d"] = ((merged["modal_price_ffill"] - merged["price_lag_7d"]) / merged["price_lag_7d"] * 100).round(2)
    merged["volatility_7d"] = merged["modal_price_ffill"].rolling(window=7, min_periods=3).std().round(2)

    # 4. Outlier Detection (Interquartile Range - IQR)
    q25 = merged["modal_price"].quantile(0.25)
    q75 = merged["modal_price"].quantile(0.75)
    iqr = q75 - q25
    lower_bound = q25 - 1.5 * iqr
    upper_bound = q75 + 1.5 * iqr
    merged["is_outlier"] = ((merged["modal_price"] < lower_bound) | (merged["modal_price"] > upper_bound)).astype(int)

    # 5. Join Weather Features
    wdf = load_weather_df(weather_file)
    if not wdf.empty:
        merged = pd.merge(merged, wdf, on="date", how="left")
    else:
        merged["temperature_mean_c"] = 26.0
        merged["precipitation_mm"] = 0.0
        merged["relative_humidity_pct"] = 65

    # 6. Target Variable: 3-Day Forward Direction
    # Shift(-3) looks 3 days into the future (only used as label during training!)
    merged["future_price_3d"] = merged["modal_price_ffill"].shift(-3)
    merged["future_delta_pct"] = ((merged["future_price_3d"] - merged["modal_price_ffill"]) / merged["modal_price_ffill"] * 100).round(2)

    # Direction Classification threshold: +2.5% UP, -2.5% DOWN, otherwise FLAT
    def classify_direction(val):
        if pd.isna(val):
            return None
        if val > 2.5:
            return "UP"
        elif val < -2.5:
            return "DOWN"
        else:
            return "FLAT"

    merged["target_direction_3d"] = merged["future_delta_pct"].apply(classify_direction)

    # Add Calendar Features
    merged["day_of_week"] = merged["date"].dt.dayofweek
    merged["month"] = merged["date"].dt.month

    # Filter to reported market days for clean model training
    clean_features = merged[merged["is_reported"] == 1].copy()
    clean_features["date"] = clean_features["date"].dt.strftime("%Y-%m-%d")

    out_path = os.path.join(FEATURES_DIR, output_filename)
    clean_features.to_csv(out_path, index=False)
    print(f"  [OK] Generated {len(clean_features)} feature rows with {clean_features.shape[1]} columns -> {out_path}")
    return clean_features


def main():
    print("=" * 75)
    print("MANDIMITRA — PHASE 3 FEATURE ENGINEERING & PREPARATION")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 75)

    os.makedirs(FEATURES_DIR, exist_ok=True)

    # 1. Onion — Lasalgaon
    f1 = engineer_features("onion_lasalgaon_2026.csv", "nashik_north_mh.json", "onion_lasalgaon_features.csv", "Onion", "Lasalgaon")
    # 2. Tomato — Junnar/Narayangaon
    f2 = engineer_features("tomato_narayangaon_2026.csv", "pune_paschim_mh.json", "tomato_narayangaon_features.csv", "Tomato", "Junnar")
    # 3. Soyabean — Latur
    f3 = engineer_features("soyabean_latur_2026.csv", "sambhajinagar_marathwada.json", "soyabean_latur_features.csv", "Soyabean", "Latur")

    # Save feature metadata
    metadata = {
        "timestamp": datetime.now().isoformat(),
        "phase": "PHASE_3_FEATURE_ENGINEERING",
        "features_list": [
            "price_lag_1d", "price_lag_3d", "price_lag_7d", "price_lag_14d",
            "pct_change_3d", "pct_change_7d", "volatility_7d",
            "days_since_last_report", "coverage_ratio_14d", "is_outlier",
            "temperature_mean_c", "precipitation_mm", "relative_humidity_pct",
            "day_of_week", "month"
        ],
        "target": "target_direction_3d (UP / FLAT / DOWN)",
        "datasets": {
            "onion_lasalgaon": len(f1) if f1 is not None else 0,
            "tomato_narayangaon": len(f2) if f2 is not None else 0,
            "soyabean_latur": len(f3) if f3 is not None else 0
        }
    }

    meta_path = os.path.join(FEATURES_DIR, "features_metadata.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print("\n" + "=" * 75)
    print("PHASE 3 COMPLETE: Feature tables ready for ML Direction Model and Backtesting!")
    print("=" * 75)


if __name__ == "__main__":
    main()

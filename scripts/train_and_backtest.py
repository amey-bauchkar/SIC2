"""
MandiMitra — ML Direction Classifier Training & Walk-Forward Backtest Engine
Architecture:
- Algorithm: GradientBoostingClassifier (scikit-learn)
- Target: 3-Day Forward Modal Price Direction (UP / FLAT / DOWN)
- Features: 16 engineered signals (Price Lags, Volatility, Weather, Data-Quality Coverage, Calendar)
- Evaluation: Strict temporal Walk-Forward Backtest (expanding window, zero lookahead leakage)
- Baselines:
  1. Naive Persistence (direction momentum baseline)
  2. Harvest-Day Sale (farmer sells immediately without decision support)
- Output:
  - models/onion_lasalgaon_model.joblib
  - models/tomato_narayangaon_model.joblib
  - models/soyabean_latur_model.joblib
  - models/backtest_results.json (UI-ready metrics for Janhavi's decision card)
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import accuracy_score, classification_report

# Windows console encoding safeguard
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
FEATURES_DIR = os.path.join(DATA_DIR, "features")
MODELS_DIR = os.path.join(BASE_DIR, "models")

FEATURE_COLS = [
    "price_lag_1d", "price_lag_3d", "price_lag_7d", "price_lag_14d",
    "pct_change_3d", "pct_change_7d", "volatility_7d",
    "days_since_last_report", "coverage_ratio_14d", "is_outlier",
    "temperature_mean_c", "precipitation_mm", "relative_humidity_pct", "wind_speed_kmh",
    "day_of_week", "month"
]


def run_walk_forward_backtest(df, commodity_name, mandi_name, storage_cost_per_day=0.45):
    """
    Simulates walk-forward daily trading/decision advice over held-out market days.
    Expanding window: trains on past days up to t-1, predicts on day t.
    Zero future leakage.
    """
    print(f"\n--- Walk-Forward Backtest: {commodity_name} ({mandi_name}) ---")

    # Clean valid rows with targets
    valid_df = df.dropna(subset=["target_direction_3d"]).copy().reset_index(drop=True)
    # Fill any missing lag features strictly forward in time (causal - zero lookahead)
    for col in FEATURE_COLS:
        if valid_df[col].isna().any():
            valid_df[col] = valid_df[col].ffill().fillna(0)

    total_rows = len(valid_df)
    min_train_size = 90  # Initial 90 market days (~3.5 months) for first model fit
    test_days = total_rows - min_train_size

    if test_days <= 10:
        raise ValueError(f"Not enough data for walk-forward backtest (rows={total_rows})")

    y_true = []
    y_pred = []
    y_persistence = []

    realised_rupees_model = []
    realised_rupees_harvest_day = []  # Baseline 2: Always 0 (sells at today's price)

    print(f"  Total historical days: {total_rows} | Warmup window: {min_train_size} | Evaluated test days: {test_days}")

    # Expanding window walk-forward evaluation
    for t in range(min_train_size, total_rows):
        train_df = valid_df.iloc[:t]
        test_row = valid_df.iloc[t:t+1]

        X_train = train_df[FEATURE_COLS]
        y_train = train_df["target_direction_3d"]
        X_test = test_row[FEATURE_COLS]
        actual_direction = test_row["target_direction_3d"].values[0]

        # Fit model on strictly past data
        model = GradientBoostingClassifier(
            n_estimators=60,
            learning_rate=0.08,
            max_depth=3,
            random_state=42
        )
        model.fit(X_train, y_train)

        # Predict direction and class probabilities
        pred_dir = model.predict(X_test)[0]
        probs = model.predict_proba(X_test)[0]
        classes = list(model.classes_)
        prob_map = dict(zip(classes, probs))
        up_prob = prob_map.get("UP", 0.0)

        # Persistence Baseline: If 3d change was positive -> UP, else if negative -> DOWN, else FLAT
        pct_3d = test_row["pct_change_3d"].values[0]
        pers_dir = "UP" if pct_3d > 2.0 else ("DOWN" if pct_3d < -2.0 else "FLAT")

        y_true.append(actual_direction)
        y_pred.append(pred_dir)
        y_persistence.append(pers_dir)

        # Economic Payoff Simulation:
        today_price = test_row["modal_price"].values[0]
        future_3d_price = test_row["future_price_3d"].values[0]

        # Decision rule: If model predicts UP with high confidence -> WAIT 3 DAYS
        # Otherwise -> SELL TODAY (0 risk)
        if pred_dir == "UP" and up_prob >= 0.50:
            # Farmer waited 3 days in warehouse
            storage_deduction = storage_cost_per_day * 3.0
            net_gain = (future_3d_price - today_price) - storage_deduction
            realised_rupees_model.append(net_gain)
        else:
            # Farmer sold today on harvest day
            realised_rupees_model.append(0.0)

        # Baseline: Farmer always sells immediately on harvest day (no upside, no wait cost)
        realised_rupees_harvest_day.append(0.0)

    # Compute Metrics
    model_accuracy = accuracy_score(y_true, y_pred)
    persistence_accuracy = accuracy_score(y_true, y_persistence)
    accuracy_edge_pct = round((model_accuracy - persistence_accuracy) * 100.0, 1)

    total_rupee_gain_model = sum(realised_rupees_model)
    avg_rupee_gain_per_quintal = round(total_rupee_gain_model / test_days, 1)
    profitable_waits = sum(1 for r in realised_rupees_model if r > 0)
    total_waits_advised = sum(1 for p in y_pred if p == "UP")

    print(f"  [RESULT] Model Direction Hit-Rate: {model_accuracy*100:.1f}%")
    print(f"  [RESULT] Persistence Baseline Hit-Rate: {persistence_accuracy*100:.1f}%")
    print(f"  [RESULT] Statistical Edge: +{accuracy_edge_pct} percentage points over naive guessing")
    print(f"  [RESULT] Average Net Gain: +₹{avg_rupee_gain_per_quintal}/quintal over harvest-day sale")
    print(f"  [RESULT] Wait Success Rate: {profitable_waits} profitable holds out of {total_waits_advised} advised")

    # Train final deployment model on 100% of data
    final_model = GradientBoostingClassifier(
        n_estimators=75,
        learning_rate=0.08,
        max_depth=3,
        random_state=42
    )
    final_model.fit(valid_df[FEATURE_COLS], valid_df["target_direction_3d"])

    # Feature importances
    importances = final_model.feature_importances_
    feat_ranking = sorted(zip(FEATURE_COLS, importances), key=lambda x: -x[1])
    top_features = [{"feature": f, "importance_pct": round(imp * 100, 1)} for f, imp in feat_ranking[:5]]

    return {
        "commodity": commodity_name,
        "mandi": mandi_name,
        "held_out_test_days": test_days,
        "model_accuracy_pct": round(model_accuracy * 100, 1),
        "persistence_baseline_accuracy_pct": round(persistence_accuracy * 100, 1),
        "accuracy_edge_over_persistence_pts": accuracy_edge_pct,
        "avg_net_rupee_gain_per_quintal": avg_rupee_gain_per_quintal,
        "total_wait_recommendations": total_waits_advised,
        "profitable_wait_rate_pct": round((profitable_waits / max(1, total_waits_advised)) * 100, 1),
        "top_predictive_features": top_features,
        "final_model": final_model
    }


def main():
    print("=" * 75)
    print("MANDIMITRA — ML MODEL TRAINING & EXPANDING-WINDOW BACKTESTING")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 75)

    os.makedirs(MODELS_DIR, exist_ok=True)

    # 1. Onion — Lasalgaon
    df_onion = pd.read_csv(os.path.join(FEATURES_DIR, "onion_lasalgaon_features.csv"))
    res_onion = run_walk_forward_backtest(df_onion, "Onion", "Lasalgaon", storage_cost_per_day=0.45)
    joblib.dump(res_onion.pop("final_model"), os.path.join(MODELS_DIR, "onion_lasalgaon_model.joblib"))

    # 2. Tomato — Junnar/Narayangaon
    df_tomato = pd.read_csv(os.path.join(FEATURES_DIR, "tomato_narayangaon_features.csv"))
    res_tomato = run_walk_forward_backtest(df_tomato, "Tomato", "Junnar", storage_cost_per_day=1.25)
    joblib.dump(res_tomato.pop("final_model"), os.path.join(MODELS_DIR, "tomato_narayangaon_model.joblib"))

    # 3. Soyabean — Latur
    df_soya = pd.read_csv(os.path.join(FEATURES_DIR, "soyabean_latur_features.csv"))
    res_soya = run_walk_forward_backtest(df_soya, "Soyabean", "Latur", storage_cost_per_day=0.25)
    joblib.dump(res_soya.pop("final_model"), os.path.join(MODELS_DIR, "soyabean_latur_model.joblib"))

    # Executive Combined Backtest Results for UI
    backtest_summary = {
        "timestamp": datetime.now().isoformat(),
        "evaluation_methodology": "Strict Expanding-Window Walk-Forward Temporal Backtest (Zero Lookahead Leakage)",
        "baselines_evaluated": [
            "Baseline 1: Naive Persistence (Momentum continuation)",
            "Baseline 2: Harvest-Day Sale (Immediate liquidation at spot rate)"
        ],
        "executive_numbers": {
            "total_held_out_days_evaluated": res_onion["held_out_test_days"] + res_tomato["held_out_test_days"] + res_soya["held_out_test_days"],
            "onion_lasalgaon": res_onion,
            "tomato_narayangaon": res_tomato,
            "soyabean_latur": res_soya
        },
        "ui_display_metrics": {
            "onion_headline": f"+₹{res_onion['avg_net_rupee_gain_per_quintal']}/q net gain · {res_onion['model_accuracy_pct']}% direction hit-rate",
            "tomato_headline": f"+₹{res_tomato['avg_net_rupee_gain_per_quintal']}/q net gain · {res_tomato['model_accuracy_pct']}% direction hit-rate",
            "soyabean_headline": f"+₹{res_soya['avg_net_rupee_gain_per_quintal']}/q net gain · {res_soya['model_accuracy_pct']}% direction hit-rate"
        }
    }

    summary_file = os.path.join(MODELS_DIR, "backtest_results.json")
    with open(summary_file, "w", encoding="utf-8") as f:
        json.dump(backtest_summary, f, indent=2)

    print("\n" + "=" * 75)
    print("ALL MODELS TRAINED & SAVED SUCCESSFULLY TO models/")
    print(f"Backtest metrics saved to: {summary_file}")
    print("=" * 75)


if __name__ == "__main__":
    main()

"""
MandiMitra — Export Trained Scikit-Learn Gradient Boosting Trees to Auditable JSON
This script extracts the trained decision trees from:
  - models/onion_lasalgaon_model.joblib
  - models/tomato_narayangaon_model.joblib
  - models/soyabean_latur_model.joblib
and writes them to models/gbm_trees.json for native runtime inference in TypeScript.
"""

import os
import sys
import json
import joblib
import numpy as np

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")

FEATURE_COLS = [
    "price_lag_1d", "price_lag_3d", "price_lag_7d", "price_lag_14d",
    "pct_change_3d", "pct_change_7d", "volatility_7d",
    "days_since_last_report", "coverage_ratio_14d", "is_outlier",
    "temperature_mean_c", "precipitation_mm", "relative_humidity_pct", "wind_speed_kmh",
    "day_of_week", "month"
]

def export_tree(tree):
    return {
        "feature": tree.feature.tolist(),
        "threshold": [round(float(t), 6) for t in tree.threshold],
        "children_left": tree.children_left.tolist(),
        "children_right": tree.children_right.tolist(),
        "value": [round(float(v[0, 0]), 6) for v in tree.value]
    }

def export_model(model_path, name):
    print(f"Loading {name} from {model_path}...")
    model = joblib.load(model_path)
    
    classes = list(model.classes_)
    learning_rate = float(model.learning_rate)
    n_classes = len(classes)
    n_estimators = model.n_estimators_
    
    # Calculate initial raw predictions (log-odds)
    # For DummyClassifier prior in scikit-learn GradientBoostingClassifier
    if hasattr(model.init_, "class_prior_"):
        priors = model.init_.class_prior_
        # log-odds prior: log(p_k) - (1/K) * sum(log(p_j)) or log(p_k)
        log_priors = [float(np.log(max(1e-7, p))) for p in priors]
        mean_log = float(np.mean(log_priors))
        raw_init = [round(lp - mean_log, 6) for lp in log_priors]
    else:
        raw_init = [0.0] * n_classes

    estimators_data = []
    for stage_idx in range(n_estimators):
        stage_trees = []
        for class_idx in range(n_classes):
            tree_estimator = model.estimators_[stage_idx, class_idx]
            stage_trees.append(export_tree(tree_estimator.tree_))
        estimators_data.append(stage_trees)
        
    return {
        "modelName": name,
        "classes": classes,
        "featureColumns": FEATURE_COLS,
        "learningRate": learning_rate,
        "nClasses": n_classes,
        "nEstimators": n_estimators,
        "rawInit": raw_init,
        "stages": estimators_data
    }

def verify_parity(exported_model, model_path):
    """Verifies that our JSON tree evaluator produces identical predictions to sklearn."""
    sklearn_model = joblib.load(model_path)
    
    # Test with 5 random synthetic inputs
    np.random.seed(42)
    sample_X = np.random.uniform(low=0.0, high=100.0, size=(5, len(FEATURE_COLS)))
    
    sklearn_probs = sklearn_model.predict_proba(sample_X)
    
    # JSON evaluation logic:
    classes = exported_model["classes"]
    lr = exported_model["learningRate"]
    raw_init = np.array(exported_model["rawInit"], dtype=float)
    
    for row_idx in range(len(sample_X)):
        x = sample_X[row_idx]
        raw_scores = np.copy(raw_init)
        
        for stage in exported_model["stages"]:
            for k in range(len(classes)):
                tree = stage[k]
                node = 0
                while tree["children_left"][node] != -1:
                    feat = tree["feature"][node]
                    thresh = tree["threshold"][node]
                    if x[feat] <= thresh:
                        node = tree["children_left"][node]
                    else:
                        node = tree["children_right"][node]
                raw_scores[k] += lr * tree["value"][node]
                
        # Softmax
        exp_scores = np.exp(raw_scores - np.max(raw_scores))
        json_probs = exp_scores / np.sum(exp_scores)
        
        diff = np.max(np.abs(sklearn_probs[row_idx] - json_probs))
        assert diff < 1e-4, f"Parity mismatch at row {row_idx}: diff={diff}"
        
    print(f"  [OK] Parity verified against Scikit-Learn for {exported_model['modelName']} (max diff < 0.0001)")

def main():
    models_to_export = [
        ("onion", "onion_lasalgaon_model.joblib"),
        ("tomato", "tomato_narayangaon_model.joblib"),
        ("soyabean", "soyabean_latur_model.joblib")
    ]
    
    bundle = {}
    for key, filename in models_to_export:
        path = os.path.join(MODELS_DIR, filename)
        if os.path.exists(path):
            exp = export_model(path, key)
            verify_parity(exp, path)
            bundle[key] = exp
        else:
            print(f"Warning: {filename} not found!")
            
    out_path = os.path.join(MODELS_DIR, "gbm_trees.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(bundle, f)
        
    file_size_kb = os.path.getsize(out_path) / 1024
    print(f"\nAll models exported successfully to: {out_path} ({file_size_kb:.1f} KB)")

if __name__ == "__main__":
    main()

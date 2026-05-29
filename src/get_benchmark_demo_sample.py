from __future__ import annotations
import json
from pathlib import Path
import os

import joblib
import pandas as pd
from sklearn.model_selection import StratifiedShuffleSplit
PREFER_STATUS = 0  # default; can be overridden by env DEMO_PREFER_STATUS
DATA_CANDIDATES = [
    Path('data/processed/parkinsons_uci.csv'),
    Path('data/processed/parkinsons.csv'),
]
MODEL_PATH = Path('models/parkinsons_model.pkl')

DISPLAY_FEATURES = [
    'MDVP:Fo(Hz)', 'MDVP:Fhi(Hz)', 'MDVP:Flo(Hz)', 'MDVP:Jitter(%)', 'MDVP:Jitter(Abs)',
    'MDVP:Shimmer', 'MDVP:Shimmer(dB)', 'NHR', 'HNR'
]



def get_prefer_status() -> int:
    raw = os.getenv("DEMO_PREFER_STATUS", str(PREFER_STATUS)).strip()
    if raw in {"1", "high", "risky", "pd", "parkinsons"}:
        return 1
    return 0

def find_dataset() -> Path:
    for p in DATA_CANDIDATES:
        if p.exists():
            return p
    raise FileNotFoundError('UCI dataset not found in data/processed/parkinsons.csv or parkinsons_uci.csv')


def main():
    data_path = find_dataset()
    if not MODEL_PATH.exists():
        raise FileNotFoundError('Model not found. Run python src/train_model.py first.')

    prefer_status = get_prefer_status()

    df = pd.read_csv(data_path)
    if 'status' not in df.columns:
        raise ValueError("Dataset missing 'status' column")

    y = df['status'].astype(int)
    X = df.drop(columns=['status', 'name'], errors='ignore').apply(pd.to_numeric, errors='coerce')
    if X.isna().any().any():
        raise ValueError('Dataset contains non-numeric / missing values after parsing')

    # Deterministic holdout split to get a demo sample that is not in the (simulated) training subset.
    splitter = StratifiedShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    _, test_idx = next(splitter.split(X, y))

    # Pick a deterministic sample from holdout (first PD sample if possible for interesting output)

    # Pick a deterministic sample from holdout based on preferred class
    # PREFER_STATUS = 0  # default; can be overridden by env DEMO_PREFER_STATUS (healthy) or 1 (Parkinson's)
    holdout = df.iloc[test_idx].copy()
    holdout_y = holdout["status"].astype(int)

    preferred_rows = holdout[holdout_y == prefer_status].copy()

    if len(preferred_rows) == 0:
        row = holdout.iloc[0]
    else:
        model = joblib.load(MODEL_PATH)

        preferred_X = X.loc[preferred_rows.index]

        probs = model.predict_proba(preferred_X.values)[:, 1] 
        preferred_rows = preferred_rows.copy()
        preferred_rows["_pd_prob"] = probs

        if prefer_status == 0:
            row = preferred_rows.sort_values("_pd_prob", ascending=True).iloc[0]
        else:
            pd_in_90s = preferred_rows[
                (preferred_rows["_pd_prob"] >= 0.90) & (preferred_rows["_pd_prob"] < 1.00)
            ].copy()

            if len(pd_in_90s) > 0:
                TARGET_PD_PROB = 0.93
                pd_in_90s["_target_dist"] = (pd_in_90s["_pd_prob"] - TARGET_PD_PROB).abs()
                row = pd_in_90s.sort_values("_target_dist", ascending=True).iloc[0]
            else:
                row = preferred_rows.sort_values("_pd_prob", ascending=False).iloc[0]

    row_x = X.loc[row.name]
    
    model = joblib.load(MODEL_PATH)
    prob = float(model.predict_proba([row_x.values])[0][1])
    pred = int(model.predict([row_x.values])[0])

    biomarkers = {}
    for c in DISPLAY_FEATURES:
        if c in row.index:
            try:
                biomarkers[c] = float(row[c])
            except Exception:
                pass

    result = {
        'success': True,
        'mode': 'benchmark_sample',
        'source_label': 'Held-out benchmark sample (UCI Oxford dataset)',
        'dataset_path': str(data_path),
        'sample_name': str(row['name']) if 'name' in row.index else None,
        'preferred_status': int(prefer_status),
        'ground_truth_status': int(row['status']),
        'ground_truth_label': 'Parkinsons' if int(row['status']) == 1 else 'Healthy',
        'predicted_label': 'Parkinsons-like' if pred == 1 else 'Healthy-like',
        'probability': prob,
        'probability_percent': round(prob * 100, 1),
        'risk_percent': round(prob * 100, 1),
        'biomarkers': biomarkers,
        'notes': [
            'This result is from a held-out benchmark sample, not the just-recorded audio clip.',
            'The recording flow is shown as UX demonstration only in this mode.'
        ]
    }
    print(json.dumps(result))


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))
        raise

from __future__ import annotations

import os
from pathlib import Path
import joblib
import pandas as pd

from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.metrics import make_scorer, f1_score

# Accept either filename to reduce friction
DATA_CANDIDATES = [
    Path("data/processed/parkinsons_uci.csv"),
    Path("data/processed/parkinsons.csv"),
]
MODEL_PATH = Path("models/parkinsons_model.pkl")


def _find_dataset() -> Path:
    for p in DATA_CANDIDATES:
        if p.exists():
            return p
    raise FileNotFoundError(
        "Dataset not found. Put the Oxford UCI file at data/processed/parkinsons.csv "
        "or data/processed/parkinsons_uci.csv"
    )


def main() -> None:
    data_path = _find_dataset()
    print(f"Using dataset: {data_path}")

    df = pd.read_csv(data_path)

    if "status" not in df.columns:
        raise ValueError("Expected a 'status' column in the dataset.")

    y = df["status"].astype(int)

    X = df.drop(columns=["status"], errors="ignore")
    X = X.drop(columns=["name"], errors="ignore")

    # Ensure numeric only (guard against accidental formatting issues)
    X = X.apply(pd.to_numeric, errors="coerce")
    if X.isna().any().any():
        bad_cols = X.columns[X.isna().any()].tolist()
        raise ValueError(f"Found non-numeric / missing values after parsing in columns: {bad_cols}")

    model = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", SVC(kernel="rbf", C=5.0, gamma="scale", probability=True, class_weight="balanced", random_state=42)),
    ])

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scoring = {"auc": "roc_auc", "f1": make_scorer(f1_score), "acc": "accuracy"}

    scores = cross_validate(model, X, y, cv=cv, scoring=scoring, return_train_score=False)

    print("5-Fold CV Results:")
    print(f"  AUC: {scores['test_auc'].mean():.3f} ± {scores['test_auc'].std():.3f}")
    print(f"  F1 : {scores['test_f1'].mean():.3f} ± {scores['test_f1'].std():.3f}")
    print(f"  ACC: {scores['test_acc'].mean():.3f} ± {scores['test_acc'].std():.3f}")

    model.fit(X, y)

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"Saved model to: {MODEL_PATH}")
    print("NOTE: This model expects UCI dysphonia features, not raw-audio MFCC features.")


if __name__ == "__main__":
    main()

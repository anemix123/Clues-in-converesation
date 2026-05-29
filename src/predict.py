# src/predict.py

import joblib
import numpy as np

MODEL_PATH = "models/parkinsons_model.pkl"

_model = None

def load_model():
    global _model
    if _model is None:
        _model = joblib.load(MODEL_PATH)
    return _model

def predict_risk_from_features(features_1d: np.ndarray) -> float:
    """
    Returns probability (0..1) for Parkinson's class.
    features_1d must match the feature layout used in training.
    """
    model = load_model()
    proba = model.predict_proba([features_1d])[0][1]
    return float(proba)
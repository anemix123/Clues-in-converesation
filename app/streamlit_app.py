from __future__ import annotations

import sys
from pathlib import Path
import streamlit as st
import pandas as pd
import joblib

# Ensure imports work when running `streamlit run app/streamlit_app.py`
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.elevenlabs_agent import speak
from src.record_audio import record_audio
from src.extract_features import extract_features

MODEL_PATH = ROOT / "models" / "parkinsons_model.pkl"
AUDIO_PATH = ROOT / "data" / "raw" / "session.wav"
DATASET_PATHS = [ROOT / "data" / "processed" / "parkinsons.csv", ROOT / "data" / "processed" / "parkinsons_uci.csv"]

st.set_page_config(page_title="NeuroVoice Parkinson Risk (Demo)", layout="centered")
st.title("NeuroVoice Parkinsonian Speech Risk Screening")
st.caption("Demo app for pitch video. UCI model is trained on tabular dysphonia features, not recorded audio.")

# Dataset-backed prediction demo (works now)
st.subheader("1) Dataset-backed risk estimate (reliable demo)")
row_idx = st.number_input("Pick a sample row from UCI dataset", min_value=0, value=0, step=1)

if st.button("Run Dataset Sample Inference"):
    ds = next((p for p in DATASET_PATHS if p.exists()), None)
    if ds is None:
        st.error("UCI dataset not found in data/processed/")
    elif not MODEL_PATH.exists():
        st.error("Model file missing. Run: python src/train_model.py")
    else:
        df = pd.read_csv(ds)
        if row_idx >= len(df):
            st.error(f"Row index out of range. Dataset has {len(df)} rows.")
        else:
            model = joblib.load(MODEL_PATH)
            row = df.iloc[int(row_idx)].copy()
            true_label = int(row.get("status", -1))
            name = row.get("name", f"row_{row_idx}")
            x = row.drop(labels=[c for c in ["name", "status"] if c in row.index]).astype(float).values
            prob = model.predict_proba([x])[0][1] * 100
            pred = int(prob >= 50)
            st.metric("Estimated Parkinsonian Speech Risk", f"{prob:.2f}%")
            st.write({"sample": str(name), "predicted_status": pred, "true_status": true_label})

# Optional record-only block for pitch video (no inference)
st.subheader("2) Record a conversation clip (for pitch video)")
duration = st.slider("Recording duration (seconds)", 5, 30, 10)
if st.button("Speak Prompt + Record"):
    speak("Hello. Please describe your morning routine in detail.")
    try:
        record_audio(str(AUDIO_PATH), duration=duration)
        feat = extract_features(str(AUDIO_PATH))
        st.success(f"Recorded to {AUDIO_PATH}")
        st.write(f"Extracted {len(feat)} demo audio features (MFCC/spectral) for visualization.")
        st.audio(str(AUDIO_PATH))
    except Exception as e:
        st.error(f"Recording failed: {e}")

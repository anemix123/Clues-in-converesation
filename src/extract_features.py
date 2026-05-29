"""Feature extraction for recorded speech clips (demo-only).

Note: These features do NOT match the UCI Oxford parkinsons.csv training features.
They are for visualization / future raw-audio model training.
"""
from __future__ import annotations

import numpy as np
import librosa


def extract_features(file_path: str) -> np.ndarray:
    y, sr = librosa.load(file_path, sr=16000, mono=True)

    # Avoid failures on near-silent clips
    if y.size == 0:
        raise ValueError(f"Empty audio file: {file_path}")

    # MFCCs
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    mfcc_mean = np.mean(mfcc, axis=1)
    mfcc_std = np.std(mfcc, axis=1)

    # Spectral features
    zcr = np.mean(librosa.feature.zero_crossing_rate(y))
    centroid = np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))
    bandwidth = np.mean(librosa.feature.spectral_bandwidth(y=y, sr=sr))
    rolloff = np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr))
    rms = np.mean(librosa.feature.rms(y=y))

    # Pitch estimate (best-effort; robust enough for demo)
    f0, voiced_flag, _ = librosa.pyin(
        y,
        fmin=librosa.note_to_hz("C2"),
        fmax=librosa.note_to_hz("C7"),
        sr=sr,
    )
    voiced_f0 = f0[~np.isnan(f0)] if f0 is not None else np.array([])
    if voiced_f0.size:
        pitch_mean = float(np.mean(voiced_f0))
        pitch_std = float(np.std(voiced_f0))
    else:
        pitch_mean = 0.0
        pitch_std = 0.0

    features = np.hstack([
        mfcc_mean,
        mfcc_std,
        [zcr, centroid, bandwidth, rolloff, rms, pitch_mean, pitch_std],
    ]).astype(np.float32)

    return features

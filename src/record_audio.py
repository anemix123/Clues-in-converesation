from __future__ import annotations

import os
import numpy as np
import sounddevice as sd
from scipy.io.wavfile import write


def record_audio(filename: str, duration: int = 10, fs: int = 44100) -> None:
    print("Recording...")
    recording = sd.rec(int(duration * fs), samplerate=fs, channels=1, dtype="float32")
    sd.wait()
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    # scipy.wavfile.write accepts float32, but flatten to shape (n,)
    write(filename, fs, np.squeeze(recording))
    print("Saved:", filename)

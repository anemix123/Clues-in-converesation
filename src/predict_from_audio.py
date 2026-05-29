import argparse
from pathlib import Path
import numpy as np
from extract_features import extract_features
from predict import predict_risk_from_features


def main():
    parser = argparse.ArgumentParser(description='Predict Parkinsonian speech risk from a WAV/recorded audio file.')
    parser.add_argument('audio_path', help='Path to audio file')
    args = parser.parse_args()
    path = Path(args.audio_path)
    if not path.exists():
      raise FileNotFoundError(path)

    try:
      features = extract_features(str(path))
      risk = predict_risk_from_features(np.array(features))
      print(f'Predicted risk (NOTE: only valid if model was trained on matching features): {risk*100:.2f}%')
    except Exception as e:
      print('Could not run direct audio inference with current model.')
      print('Reason:', e)
      print('Your current UCI model expects dysphonia/tabular features, not MFCC live-audio features.')
      print('Use the recording for UX demo and show dataset-backed inference in the pitch video.')

if __name__ == '__main__':
    main()

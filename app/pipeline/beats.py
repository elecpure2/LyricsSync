"""Tempo / beat / kick-onset analysis.

Primary: Beat This! transformer tracker (robust to tempo changes & breaks).
Fallback: librosa beat tracking. Kick onsets come from the drum stem's
low band via librosa onset detection.
"""
from __future__ import annotations

import numpy as np


def analyze_beats(audio_path: str, drums_path: str | None,
                  progress=lambda msg: None) -> dict:
    import librosa

    out: dict = {"bpm": None, "beats": [], "downbeats": [], "kicks": []}

    progress("비트 분석 중...")
    try:
        from beat_this.inference import File2Beats
        import torch
        f2b = File2Beats(checkpoint_path="final0",
                         device="cuda" if torch.cuda.is_available() else "cpu",
                         dbn=False)
        beats, downbeats = f2b(audio_path)
        out["beats"] = [round(float(b), 4) for b in beats]
        out["downbeats"] = [round(float(b), 4) for b in downbeats]
    except Exception:
        y, sr = librosa.load(audio_path, sr=22050, mono=True)
        tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units="time")
        out["beats"] = [round(float(b), 4) for b in beats]

    if len(out["beats"]) > 1:
        intervals = np.diff(out["beats"])
        med = float(np.median(intervals))
        if med > 0:
            out["bpm"] = round(60.0 / med, 2)

    if drums_path:
        try:
            progress("킥 온셋 분석 중...")
            y, sr = librosa.load(drums_path, sr=22050, mono=True)
            # low band ~ kick
            import scipy.signal as ss
            sos = ss.butter(4, 150, "lowpass", fs=sr, output="sos")
            low = ss.sosfilt(sos, y)
            onset_env = librosa.onset.onset_strength(y=low, sr=sr)
            kicks = librosa.onset.onset_detect(
                onset_envelope=onset_env, sr=sr, units="time",
                backtrack=False, delta=0.35)
            out["kicks"] = [round(float(k), 4) for k in kicks]
        except Exception:
            pass

    return out

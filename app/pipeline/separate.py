"""Stem separation via audio-separator.

Vocals: BS-RoFormer (current best-in-class for vocal isolation) — feeds the
forced aligner. Drums: htdemucs_ft 4-stem — feeds kick/beat analysis.
"""
from __future__ import annotations

import os

VOCAL_MODEL = "model_bs_roformer_ep_317_sdr_12.9755.ckpt"
DEMUCS_MODEL = "htdemucs_ft.yaml"


def separate(audio_path: str, out_dir: str, progress=lambda msg: None) -> dict:
    """Return {'vocals': path, 'instrumental': path, 'drums': path|None}."""
    from audio_separator.separator import Separator

    os.makedirs(out_dir, exist_ok=True)
    result = {}

    progress("보컬 분리 중 (BS-RoFormer)...")
    sep = Separator(output_dir=out_dir, output_format="wav")
    sep.load_model(model_filename=VOCAL_MODEL)
    files = sep.separate(audio_path, custom_output_names={
        "Vocals": "vocals", "Instrumental": "instrumental"})
    for f in files:
        p = os.path.join(out_dir, os.path.basename(f))
        if "vocals" in os.path.basename(f).lower():
            result["vocals"] = p
        else:
            result["instrumental"] = p

    try:
        progress("드럼 분리 중 (htdemucs)...")
        sep.load_model(model_filename=DEMUCS_MODEL)
        files = sep.separate(audio_path, custom_output_names={
            "Drums": "drums", "Bass": "bass", "Other": "other", "Vocals": "vocals_demucs"})
        for f in files:
            base = os.path.basename(f).lower()
            if base.startswith("drums"):
                result["drums"] = os.path.join(out_dir, os.path.basename(f))
            elif base.startswith(("bass", "other", "vocals_demucs")):
                # not needed; delete to save disk
                try:
                    os.remove(os.path.join(out_dir, os.path.basename(f)))
                except OSError:
                    pass
    except Exception:
        result.setdefault("drums", None)

    return result

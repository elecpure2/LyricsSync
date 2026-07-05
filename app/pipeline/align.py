"""Forced alignment of lyric units against the (separated) vocal track.

Uses torchaudio's MMS_FA wav2vec2 CTC model. The ground-truth lyrics are
romanized per unit and force-aligned to the audio, which is both more
accurate than ASR-then-match and lets us re-align arbitrary sub-ranges for
the anchor workflow: align(units, t0, t1) works on any slice.

Emissions for the whole song are computed once (chunked) and cached, so
anchor re-alignment is near-instant — only the trellis is recomputed.
"""
from __future__ import annotations

import threading

import numpy as np
import torch
import torchaudio

from .romanize import romanize_unit

SR = 16000
_CHUNK_S = 20.0  # emission chunk length


class Aligner:
    _instance = None
    _lock = threading.Lock()

    @classmethod
    def get(cls) -> "Aligner":
        with cls._lock:
            if cls._instance is None:
                cls._instance = Aligner()
            return cls._instance

    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        bundle = torchaudio.pipelines.MMS_FA
        self.model = bundle.get_model(with_star=False).to(self.device).eval()
        self.dictionary = bundle.get_dict(star=None)
        self.blank = 0

    # ---------- emissions ----------

    def compute_emissions(self, wav_path: str) -> tuple[np.ndarray, float]:
        """Return (log_probs [T, V] float32, frame_duration_seconds)."""
        try:
            import soundfile as sf
            data, sr = sf.read(wav_path, dtype="float32", always_2d=True)
            wav = torch.from_numpy(data.T).mean(0, keepdim=True)
        except Exception:  # formats libsndfile can't open
            import librosa
            y, sr = librosa.load(wav_path, sr=SR, mono=True)
            wav = torch.from_numpy(y).unsqueeze(0)
        if sr != SR:
            wav = torchaudio.functional.resample(wav, sr, SR)
        n = wav.shape[1]
        chunk = int(_CHUNK_S * SR)
        outs = []
        with torch.inference_mode():
            for s in range(0, n, chunk):
                piece = wav[:, s:s + chunk].to(self.device)
                if piece.shape[1] < 400:
                    break
                em, _ = self.model(piece)
                outs.append(torch.log_softmax(em[0], dim=-1).cpu())
        emission = torch.cat(outs, dim=0)
        frame_dur = (n / SR) / emission.shape[0]
        return emission.numpy().astype(np.float32), frame_dur

    # ---------- alignment ----------

    def _tokens(self, word: str) -> list[int]:
        return [self.dictionary[c] for c in word if c in self.dictionary]

    def align_units(self, emission: np.ndarray, frame_dur: float,
                    units: list[dict], t0: float, t1: float) -> list[dict]:
        """Force-align `units` inside window [t0, t1].

        Returns [{id, start, end, conf}] in absolute seconds. Units whose
        romanization is empty get interpolated positions afterwards.
        """
        f0 = max(0, int(t0 / frame_dur))
        f1 = min(emission.shape[0], int(t1 / frame_dur))
        if f1 - f0 < 4 or not units:
            return []
        em = torch.from_numpy(emission[f0:f1])

        words, owners = [], []  # owners[i] -> index into units
        for i, u in enumerate(units):
            tok = romanize_unit(u["text"])
            if tok:
                words.append(self._tokens(tok))
                owners.append(i)
        words = [w for w in words if w]
        if not words:
            return []
        flat, word_of_tok = [], []
        for wi, w in enumerate(words):
            flat.extend(w)
            word_of_tok.extend([wi] * len(w))

        targets = torch.tensor([flat], dtype=torch.int32)
        try:
            paths, scores = torchaudio.functional.forced_align(
                em.unsqueeze(0), targets, blank=self.blank)
        except Exception:
            return []
        path = paths[0].tolist()
        score = scores[0].exp().tolist()

        # collapse frame path -> per-token spans
        spans: list[list] = [[None, None, []] for _ in flat]  # start_f, end_f, scores
        tok_i = -1
        prev = None
        for f, p in enumerate(path):
            if p == self.blank:
                prev = None
                continue
            if p != prev:
                tok_i += 1
                prev = p
            if tok_i >= len(flat):
                break
            sp = spans[tok_i]
            if sp[0] is None:
                sp[0] = f
            sp[1] = f + 1
            sp[2].append(score[f])

        # token spans -> word spans -> unit results
        results = []
        wi_seen: dict[int, list] = {}
        for ti, sp in enumerate(spans):
            if sp[0] is None:
                continue
            wi = word_of_tok[ti]
            agg = wi_seen.setdefault(wi, [sp[0], sp[1], []])
            agg[0] = min(agg[0], sp[0])
            agg[1] = max(agg[1], sp[1])
            agg[2].extend(sp[2])
        for wi, (fs, fe, sc) in wi_seen.items():
            ui = owners[wi]
            results.append({
                "id": units[ui]["id"],
                "start": round(t0 + fs * frame_dur, 4),
                "end": round(t0 + fe * frame_dur, 4),
                "conf": round(float(np.mean(sc)) if sc else 0.0, 4),
            })

        # interpolate units that had no alignable token
        got = {r["id"] for r in results}
        by_id = {r["id"]: r for r in results}
        for i, u in enumerate(units):
            if u["id"] in got:
                continue
            prev_t = next((by_id[units[j]["id"]]["end"] for j in range(i - 1, -1, -1)
                           if units[j]["id"] in by_id), t0)
            next_t = next((by_id[units[j]["id"]]["start"] for j in range(i + 1, len(units))
                           if units[j]["id"] in by_id), t1)
            mid = (prev_t + next_t) / 2
            results.append({"id": u["id"], "start": round(prev_t, 4),
                            "end": round(min(mid, prev_t + 0.5), 4), "conf": 0.0})
        order = {u["id"]: i for i, u in enumerate(units)}
        results.sort(key=lambda r: order[r["id"]])
        return results

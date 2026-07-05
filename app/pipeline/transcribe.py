"""Automatic lyrics extraction (when the user provides no lyrics).

Whisper large-v3-turbo transcribes the separated vocal stem; each segment
becomes one lyric line. The transcript then flows through the exact same
forced-alignment path as user-provided lyrics, so per-character timing
quality is identical — only the text itself depends on Whisper accuracy.
"""
from __future__ import annotations

MODEL_NAME = "large-v3-turbo"


def transcribe_lyrics(vocals_path: str, language: str | None = None,
                      progress=lambda msg: None) -> str:
    import torch
    import whisper

    progress("가사 자동 추출 중 (Whisper 모델 로드)...")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = whisper.load_model(MODEL_NAME, device=device)

    progress("가사 자동 추출 중 (음성 인식)...")
    result = model.transcribe(
        vocals_path,
        task="transcribe",
        language=language,      # None = auto-detect (handles mixed songs)
        beam_size=5,
        condition_on_previous_text=False,  # avoids loop hallucinations in songs
        no_speech_threshold=0.5,
    )

    lines: list[str] = []
    for seg in result.get("segments", []):
        text = seg.get("text", "").strip()
        if not text:
            continue
        # collapse whisper's occasional repeated-line hallucination
        if lines and lines[-1] == text:
            continue
        lines.append(text)

    del model
    if device == "cuda":
        torch.cuda.empty_cache()

    return "[Auto]\n" + "\n".join(lines) if lines else ""

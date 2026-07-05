"""Romanize alignable units into MMS_FA-compatible latin tokens.

MMS forced-alignment vocabulary is lowercase a-z plus apostrophe, so every
unit (Korean syllable, English word, glitch text) is mapped to one latin
token. Units that end up empty are skipped during alignment and later
interpolated between neighbours.
"""
from __future__ import annotations

import re

try:
    import uroman as _ur
    _UROMAN = _ur.Uroman()
except Exception:  # pragma: no cover
    _UROMAN = None

_DIGITS = {
    "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four",
    "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine",
}
_ALLOWED = re.compile(r"[^a-z']")
_cache: dict[str, str] = {}


def _spell_digits(text: str) -> str:
    return " ".join(_DIGITS.get(c, c) for c in text) if any(c.isdigit() for c in text) else text


def romanize_unit(text: str) -> str:
    """One unit -> one lowercase latin token ('' if unalignable)."""
    if text in _cache:
        return _cache[text]
    s = text.strip()
    s = "".join(_DIGITS[c] if c.isdigit() else c for c in s)
    if _UROMAN is not None:
        s = str(_UROMAN.romanize_string(s))
    s = _ALLOWED.sub("", s.lower())
    _cache[text] = s
    return s

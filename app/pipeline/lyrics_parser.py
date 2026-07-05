"""Parse Suno-style lyrics into sections / lines / alignable units.

Unit types:
  char  - one Korean syllable block (= one glyph, one sung syllable)
  word  - one latin/other word (English, numbers, glitch text)
Lines wrapped fully in parentheses are marked as adlibs (background vocals).
[Tag] lines become section headers (structure hints), never aligned.
"""
from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field, asdict

TAG_RE = re.compile(r"^\s*\[(?P<tag>[^\]]+)\]\s*$")
# scripts where one glyph = one sung syllable -> per-character units
# (hangul, hiragana, katakana, CJK ideographs + extensions/compat)
_CJK = ("가-힣"                 # hangul syllables
        "ぁ-ゖ"        # hiragana
        "ァ-ヺー"  # katakana + prolonged mark
        "㐀-䶿"        # CJK ext A
        "一-鿿"        # CJK unified
        "豈-﫿")       # CJK compatibility
CHAR_SCRIPT_RE = re.compile(f"[{_CJK}]")
# everything else alphabetic (latin, cyrillic, greek, ...) -> per-word units
_W = f"[^\\W_{_CJK}]"
WORD_RE = re.compile(f"{_W}+(?:['\\-]{_W}+)*", re.UNICODE)

# Section names (vs. style hints like [piano only])
SECTION_HINT = re.compile(
    r"intro|verse|chorus|pre[- ]?chorus|bridge|outro|hook|break|build|drop|"
    r"refrain|interlude|solo|final", re.I)

# rough timecode hints: "[Chorus @ 1:23]" tag suffix, or a standalone
# "@1:23" / "@83.5" / "1:23" line — used to window the initial alignment
TAG_TIME_RE = re.compile(r"^(?P<name>.*?)\s*@\s*(?P<time>\d+:\d{1,2}(?:\.\d+)?|\d+(?:\.\d+)?)\s*$")
HINT_LINE_RE = re.compile(r"^(?:@\s*(\d+:\d{1,2}(?:\.\d+)?|\d+(?:\.\d+)?)|(\d+:\d{1,2}(?:\.\d+)?))$")


def _to_seconds(s: str) -> float:
    if ":" in s:
        m, sec = s.split(":")
        return int(m) * 60 + float(sec)
    return float(s)


@dataclass
class Unit:
    id: str
    text: str
    kind: str          # 'char' | 'word'
    line_id: str
    start: float | None = None
    end: float | None = None
    conf: float | None = None
    anchored: bool = False


@dataclass
class Line:
    id: str
    section_id: str
    text: str
    adlib: bool = False
    unit_ids: list[str] = field(default_factory=list)


@dataclass
class Section:
    id: str
    name: str
    hints: list[str] = field(default_factory=list)
    line_ids: list[str] = field(default_factory=list)


def _split_line(text: str) -> list[tuple[str, str]]:
    """Return [(unit_text, kind)] for one lyric line."""
    units: list[tuple[str, str]] = []
    i = 0
    while i < len(text):
        ch = text[i]
        if CHAR_SCRIPT_RE.match(ch):
            units.append((ch, "char"))
            i += 1
            continue
        m = WORD_RE.match(text, i)
        if m:
            units.append((m.group(0), "word"))
            i = m.end()
            continue
        i += 1  # punctuation / space / em-dash etc.
    return units


def parse_lyrics(raw: str) -> dict:
    sections: list[Section] = []
    lines: list[Line] = []
    units: list[Unit] = []

    cur: Section | None = None
    time_hints: list[dict] = []
    pending_time: float | None = None

    def new_section(name: str) -> Section:
        s = Section(id=f"s{len(sections)}", name=name)
        sections.append(s)
        return s

    for raw_line in raw.splitlines():
        text = raw_line.strip()
        if not text or text == "```":
            continue
        hm = HINT_LINE_RE.match(text)
        if hm:
            pending_time = _to_seconds(hm.group(1) or hm.group(2))
            continue
        m = TAG_RE.match(text)
        if m:
            tag = m.group("tag").strip()
            tm = TAG_TIME_RE.match(tag)
            if tm:
                pending_time = _to_seconds(tm.group("time"))
                tag = tm.group("name").strip() or tag
            if SECTION_HINT.search(tag):
                cur = new_section(tag)
            else:
                if cur is None:
                    cur = new_section("Intro")
                cur.hints.append(tag)
            continue
        if cur is None:
            cur = new_section("Song")

        adlib = bool(re.fullmatch(r"\(.*\)", text))
        clean = text.strip("()") if adlib else text
        lid = f"l{len(lines)}"
        line = Line(id=lid, section_id=cur.id, text=text, adlib=adlib)
        for utext, kind in _split_line(clean):
            uid = f"u{len(units)}"
            units.append(Unit(id=uid, text=utext, kind=kind, line_id=lid))
            line.unit_ids.append(uid)
        if line.unit_ids:
            lines.append(line)
            cur.line_ids.append(lid)
            if pending_time is not None:
                time_hints.append({"line_id": lid, "time": round(pending_time, 3)})
                pending_time = None

    return {
        "sections": [asdict(s) for s in sections],
        "lines": [asdict(l) for l in lines],
        "units": [asdict(u) for u in units],
        "time_hints": time_hints,
    }

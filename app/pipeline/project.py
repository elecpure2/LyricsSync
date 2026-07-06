"""Project storage + analysis orchestration + anchor re-alignment."""
from __future__ import annotations

import json
import os
import re
import shutil
import threading
import time
import traceback

import numpy as np

from .lyrics_parser import parse_lyrics

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROJECTS_DIR = os.path.join(ROOT, "projects")
os.makedirs(PROJECTS_DIR, exist_ok=True)

_progress: dict[str, dict] = {}          # pid -> {stage, detail, error}
_locks: dict[str, threading.Lock] = {}


def _lock(pid: str) -> threading.Lock:
    return _locks.setdefault(pid, threading.Lock())


def _pdir(pid: str) -> str:
    return os.path.join(PROJECTS_DIR, pid)


def _pjson(pid: str) -> str:
    return os.path.join(_pdir(pid), "project.json")


def load(pid: str) -> dict:
    with open(_pjson(pid), encoding="utf-8") as f:
        return json.load(f)


def save(pid: str, data: dict) -> None:
    tmp = _pjson(pid) + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    os.replace(tmp, _pjson(pid))


def list_projects() -> list[dict]:
    out = []
    for pid in sorted(os.listdir(PROJECTS_DIR)):
        try:
            p = load(pid)
            out.append({"id": pid, "name": p["name"], "status": p["status"],
                        "created": p.get("created")})
        except Exception:
            continue
    return out


def get_progress(pid: str) -> dict:
    return _progress.get(pid, {})


def create_project(name: str, audio_path: str, lyrics: str,
                   song_lang: str = "auto") -> str:
    pid = re.sub(r"[^\w\-가-힣]+", "_", name).strip("_") or f"proj_{int(time.time())}"
    if os.path.exists(_pdir(pid)):
        pid = f"{pid}_{int(time.time())}"
    os.makedirs(_pdir(pid), exist_ok=True)
    ext = os.path.splitext(audio_path)[1].lower() or ".mp3"
    dest = os.path.join(_pdir(pid), "source" + ext)
    shutil.copy2(audio_path, dest)
    # drag&drop fallback uploads land in temp — clean up once copied
    if "lyricssync_uploads" in audio_path.replace("\\", "/"):
        try:
            os.remove(audio_path)
        except OSError:
            pass

    parsed = parse_lyrics(lyrics)
    data = {
        "id": pid, "name": name, "created": time.strftime("%Y-%m-%d %H:%M"),
        "status": "created", "audio": os.path.basename(dest),
        "lyrics_raw": lyrics, "stems": {}, "beats": {},
        "duration": None, "fps": 30, "anchors": {}, "song_lang": song_lang,
        **parsed,
    }
    save(pid, data)
    return pid


def delete_project(pid: str) -> None:
    """Remove the whole project folder (source copy, stems, emissions, json)."""
    with _lock(pid):
        target = _pdir(pid)
        if os.path.isdir(target) and os.path.abspath(target).startswith(
                os.path.abspath(PROJECTS_DIR)):
            shutil.rmtree(target, ignore_errors=True)
        _progress.pop(pid, None)


def start_analysis(pid: str) -> None:
    t = threading.Thread(target=_analyze, args=(pid,), daemon=True)
    t.start()


def _set_stage(pid: str, stage: str, detail: str = "") -> None:
    _progress[pid] = {"stage": stage, "detail": detail}


def _analyze(pid: str) -> None:
    from .separate import separate
    from .align import Aligner
    from .beats import analyze_beats
    import soundfile as sf

    try:
        data = load(pid)
        data["status"] = "analyzing"
        save(pid, data)
        pdir = _pdir(pid)
        audio = os.path.join(pdir, data["audio"])

        info = sf.info(audio)
        data["duration"] = round(info.frames / info.samplerate, 3)

        _set_stage(pid, "separate", "보컬/드럼 분리 중... (첫 실행은 모델 다운로드 포함)")
        stems = separate(audio, os.path.join(pdir, "stems"),
                         progress=lambda m: _set_stage(pid, "separate", m))
        data["stems"] = {k: (os.path.relpath(v, pdir) if v else None)
                         for k, v in stems.items()}
        save(pid, data)

        # no lyrics given -> extract them automatically from the vocal stem
        if not data["units"]:
            from .transcribe import transcribe_lyrics
            _set_stage(pid, "transcribe", "가사 자동 추출 중...")
            lang = data.get("song_lang") or "auto"
            auto = transcribe_lyrics(
                stems["vocals"],
                language=None if lang == "auto" else lang,
                progress=lambda m: _set_stage(pid, "transcribe", m))
            if not auto:
                raise RuntimeError("가사를 추출하지 못했어요 (보컬이 감지되지 않음)")
            data["lyrics_raw"] = auto
            data["auto_lyrics"] = True
            data.update(parse_lyrics(auto))
            save(pid, data)

        _set_stage(pid, "emissions", "정렬 모델 준비 중...")
        aligner = Aligner.get()
        emission, frame_dur = aligner.compute_emissions(stems["vocals"])
        np.savez_compressed(os.path.join(pdir, "emissions.npz"),
                            emission=emission, frame_dur=frame_dur)

        _set_stage(pid, "align", "가사 강제 정렬 중...")
        _initial_align(data, aligner, emission, frame_dur)
        save(pid, data)

        _set_stage(pid, "beats", "BPM/비트 분석 중...")
        data["beats"] = analyze_beats(audio, stems.get("drums"),
                                      progress=lambda m: _set_stage(pid, "beats", m))
        data["status"] = "ready"
        save(pid, data)
        _set_stage(pid, "done", "완료")
    except Exception:
        err = traceback.format_exc()
        _progress[pid] = {"stage": "error", "detail": err}
        try:
            data = load(pid)
            data["status"] = "error"
            save(pid, data)
        except Exception:
            pass


_HINT_SLACK = 3.0  # user timecode hints are approximate — pad the windows


def _initial_align(data: dict, aligner, emission, frame_dur) -> None:
    """First alignment pass. If the lyrics carried rough timecode hints
    ([Chorus @ 1:23] / @1:23 lines), align each hinted segment inside a
    padded window instead of one global pass."""
    units = data["units"]
    duration = data["duration"] or 0.0

    def apply(results, seg):
        by_id = {r["id"]: r for r in results}
        for u in seg:
            r = by_id.get(u["id"])
            if r:
                u["start"], u["end"], u["conf"] = r["start"], r["end"], r["conf"]

    hints = data.get("time_hints") or []
    idx_of_line = {}
    for i, u in enumerate(units):
        idx_of_line.setdefault(u["line_id"], i)

    bounds = []
    for h in hints:
        i = idx_of_line.get(h["line_id"])
        t = min(max(0.0, float(h["time"])), duration)
        if i is not None:
            bounds.append((i, t))
    bounds.sort()
    # keep hints monotonically increasing in time
    filtered, last_t = [], -1.0
    for i, t in bounds:
        if t > last_t:
            filtered.append((i, t))
            last_t = t
    bounds = filtered

    if not bounds:
        apply(aligner.align_units(emission, frame_dur, units, 0.0, duration), units)
        return

    edges = [(0, 0.0)] + bounds + [(len(units), duration)]
    for (i0, t0), (i1, t1) in zip(edges, edges[1:]):
        seg = units[i0:i1]
        if not seg:
            continue
        w0 = max(0.0, t0 - (_HINT_SLACK if t0 > 0 else 0.0))
        w1 = min(duration, t1 + (_HINT_SLACK if t1 < duration else 0.0))
        apply(aligner.align_units(emission, frame_dur, seg, w0, w1), seg)


# ---------------- anchor re-alignment ----------------

def _emissions(pid: str):
    z = np.load(os.path.join(_pdir(pid), "emissions.npz"))
    return z["emission"], float(z["frame_dur"])


def _emissions_mix(pid: str):
    """Emissions computed from the ORIGINAL mix (not the vocal stem).
    Lazily computed and cached — used as a second opinion when the vocal
    stem lost quiet/heavily-processed vocals during separation."""
    path = os.path.join(_pdir(pid), "emissions_mix.npz")
    if os.path.exists(path):
        z = np.load(path)
        return z["emission"], float(z["frame_dur"])
    from .align import Aligner
    data = load(pid)
    audio = os.path.join(_pdir(pid), data["audio"])
    emission, frame_dur = Aligner.get().compute_emissions(audio)
    np.savez_compressed(path, emission=emission, frame_dur=frame_dur)
    return emission, frame_dur


def set_anchor(pid: str, unit_id: str, t: float) -> dict:
    """Pin unit start to t, re-align the neighbouring segments, save."""
    from .align import Aligner
    with _lock(pid):
        data = load(pid)
        data["anchors"][unit_id] = round(float(t), 4)
        _realign_around(data, pid, unit_id)
        save(pid, data)
        return data


def clear_anchor(pid: str, unit_id: str) -> dict:
    with _lock(pid):
        data = load(pid)
        data["anchors"].pop(unit_id, None)
        for u in data["units"]:
            if u["id"] == unit_id:
                u["anchored"] = False
        _realign_around(data, pid, unit_id)
        save(pid, data)
        return data


def _realign_around(data: dict, pid: str, unit_id: str) -> None:
    """Re-align every segment between consecutive anchors that touches unit_id."""
    from .align import Aligner
    units = data["units"]
    idx = {u["id"]: i for i, u in enumerate(units)}
    if unit_id not in idx:
        return
    duration = data["duration"] or 0.0
    anchors = {uid: t for uid, t in data["anchors"].items() if uid in idx}

    # boundary list: (unit_index, time), plus virtual start/end
    bounds = sorted([(idx[uid], t) for uid, t in anchors.items()])
    bounds = [(-1, 0.0)] + bounds + [(len(units), duration)]

    for u in units:
        u["anchored"] = u["id"] in anchors

    emission, frame_dur = _emissions(pid)
    aligner = Aligner.get()
    target = idx[unit_id]

    for (i0, t0), (i1, t1) in zip(bounds, bounds[1:]):
        # segment covers units [i0..i1) ; realign if it touches the change
        if not (i0 <= target <= i1):
            continue
        seg = units[max(i0, 0):i1]
        # keep the left anchor unit inside the segment so its end is computed
        if i0 >= 0:
            seg = units[i0:i1]
        if not seg or t1 - t0 < 0.2:
            continue
        results = aligner.align_units(emission, frame_dur, seg, t0, t1)
        by_id = {r["id"]: r for r in results}
        for u in seg:
            r = by_id.get(u["id"])
            if r:
                u["start"], u["end"], u["conf"] = r["start"], r["end"], r["conf"]
        # clamp anchored unit exactly to its pinned time
        if i0 >= 0:
            au = units[i0]
            t_pin = anchors[au["id"]]
            if au.get("end") is not None and au["end"] < t_pin + 0.05:
                au["end"] = t_pin + 0.05
            au["start"] = t_pin
            au["conf"] = 1.0


def _new_uid(units: list[dict]) -> int:
    return max((int(u["id"][1:]) for u in units if u["id"][1:].isdigit()),
               default=-1) + 1


def insert_units(pid: str, unit_id: str, text: str, before: bool = False) -> dict:
    """Insert new units (parsed from text) next to unit_id, then re-align
    the local segment so they get timestamps."""
    from .lyrics_parser import _split_line
    with _lock(pid):
        data = load(pid)
        units = data["units"]
        idx = {u["id"]: i for i, u in enumerate(units)}
        if unit_id not in idx:
            return data
        i = idx[unit_id]
        ref = units[i]
        line = next(l for l in data["lines"] if l["id"] == ref["line_id"])

        nid = _new_uid(units)
        new_units = []
        for utext, kind in _split_line(text.strip()):
            new_units.append({"id": f"u{nid}", "text": utext, "kind": kind,
                              "line_id": ref["line_id"], "start": None,
                              "end": None, "conf": None, "anchored": False})
            nid += 1
        if not new_units:
            return data

        gpos = i if before else i + 1
        units[gpos:gpos] = new_units
        lpos = line["unit_ids"].index(unit_id) + (0 if before else 1)
        line["unit_ids"][lpos:lpos] = [u["id"] for u in new_units]

        _realign_around(data, pid, new_units[0]["id"])
        save(pid, data)
        return data


def delete_unit(pid: str, unit_id: str) -> dict:
    with _lock(pid):
        data = load(pid)
        data["units"] = [u for u in data["units"] if u["id"] != unit_id]
        for l in data["lines"]:
            if unit_id in l["unit_ids"]:
                l["unit_ids"].remove(unit_id)
        data["lines"] = [l for l in data["lines"] if l["unit_ids"]]
        data["anchors"].pop(unit_id, None)
        save(pid, data)
        return data


def realign_range(pid: str, unit_id: str, direction: str,
                  seconds: float | None = None) -> dict:
    """Re-align a stretch of units starting (or ending) at unit_id.

    direction 'after':  audio window [unit.start, unit.start + seconds]
    direction 'before': audio window [unit.end - seconds, unit.end]
    seconds=None -> up to the next/previous anchor (or song edge).
    The clicked unit's boundary time is trusted as the window edge.
    """
    from .align import Aligner
    with _lock(pid):
        data = load(pid)
        units = data["units"]
        idx = {u["id"]: i for i, u in enumerate(units)}
        if unit_id not in idx:
            return data
        i = idx[unit_id]
        u = units[i]
        duration = data["duration"] or 0.0
        anchor_times = sorted(
            (t, idx[uid]) for uid, t in data["anchors"].items() if uid in idx)

        if direction == "after":
            t0 = u["start"] if u["start"] is not None else 0.0
            t1 = t0 + seconds if seconds else duration
            for at, ai in anchor_times:          # don't cross the next anchor
                if at > t0 + 0.01 and ai > i:
                    t1 = min(t1, at)
                    break
            t1 = min(t1, duration)
            j = i
            while j + 1 < len(units):
                s = units[j + 1].get("start")
                if s is not None and s >= t1:
                    break
                if units[j + 1]["id"] in data["anchors"]:
                    break
                j += 1
            seg = units[i:j + 1]
        else:
            t1 = u["end"] if u["end"] is not None else duration
            t0 = t1 - seconds if seconds else 0.0
            for at, ai in reversed(anchor_times):  # don't cross prev anchor
                if at < t1 - 0.01 and ai < i:
                    t0 = max(t0, at)
                    break
            t0 = max(t0, 0.0)
            j = i
            while j - 1 >= 0:
                e = units[j - 1].get("end")
                if e is not None and e <= t0:
                    break
                if units[j - 1]["id"] in data["anchors"]:
                    break
                j -= 1
            seg = units[j:i + 1]

        if seg and t1 - t0 >= 0.2:
            emission, frame_dur = _emissions(pid)
            results = Aligner.get().align_units(emission, frame_dur, seg, t0, t1)
            by_id = {r["id"]: r for r in results}
            for su in seg:
                r = by_id.get(su["id"])
                if r:
                    su["start"], su["end"], su["conf"] = r["start"], r["end"], r["conf"]
        save(pid, data)
        return data


def realign_window(pid: str, t0: float, t1: float,
                   unit_ids: list[str] | None = None) -> dict:
    """Force-align units into an explicit audio window (waveform drag).

    unit_ids given  -> those units (user picked lyrics + boxed the audio).
    unit_ids absent -> whatever units currently sit inside the window.
    """
    from .align import Aligner
    with _lock(pid):
        data = load(pid)
        units = data["units"]
        t0, t1 = float(min(t0, t1)), float(max(t0, t1))
        if unit_ids:
            wanted = set(unit_ids)
            seg = [u for u in units if u["id"] in wanted]
        else:
            seg = [u for u in units
                   if u.get("start") is not None and t0 <= u["start"] < t1]
        info = {"n": len(seg), "source": "none", "conf": 0.0}
        if seg and t1 - t0 >= 0.2:
            aligner = Aligner.get()

            def mean_conf(rs):
                return (sum(r["conf"] for r in rs) / len(rs)) if rs else -1.0

            # 1st opinion: vocal-stem emissions (same as initial analysis)
            emission, frame_dur = _emissions(pid)
            candidates = [("vocals",
                           aligner.align_units(emission, frame_dur, seg, t0, t1))]
            # 2nd opinion: original mix — separation sometimes destroys
            # quiet/glitched vocals, which is why a part got skipped
            try:
                em_m, fd_m = _emissions_mix(pid)
                candidates.append(("mix",
                                   aligner.align_units(em_m, fd_m, seg, t0, t1)))
            except Exception:
                pass
            source, results = max(candidates, key=lambda c: mean_conf(c[1]))

            # last resort: user explicitly boxed this window, so spread the
            # units evenly inside it instead of leaving them wrong
            if mean_conf(results) < 0.02:
                source = "uniform"
                step = (t1 - t0) / len(seg)
                results = [{"id": u["id"],
                            "start": round(t0 + i * step, 4),
                            "end": round(t0 + (i + 0.9) * step, 4),
                            "conf": 0.0}
                           for i, u in enumerate(seg)]

            info = {"n": len(seg), "source": source,
                    "conf": round(max(0.0, mean_conf(results)), 3)}
            by_id = {r["id"]: r for r in results}
            for su in seg:
                r = by_id.get(su["id"])
                if r:
                    su["start"], su["end"], su["conf"] = r["start"], r["end"], r["conf"]
        save(pid, data)
        return {"project": data, "info": info}


def _udur(u: dict) -> float:
    if u.get("start") is not None and u.get("end") is not None:
        return max(0.03, u["end"] - u["start"])
    return 0.15


# Bead model: pushing is based on START times only, with a tiny fixed gap.
# Audio spans (ends) are display data — alignment sometimes stretches a
# low-confidence unit across a long gap, and that must never block placing
# the next syllable right where the user wants it.
_EPS_GAP = 0.03


def _ripple_forward(units: list, anchors: dict, i: int) -> None:
    """Push following units only when their START would fall behind."""
    min_pos = units[i]["start"] + _EPS_GAP
    for j in range(i + 1, len(units)):
        w = units[j]
        if w.get("start") is None:
            continue
        if w["id"] in anchors:
            break
        if w["start"] >= min_pos - 1e-6:
            break
        wdur = _udur(w)
        w["start"] = round(min_pos, 4)
        w["end"] = round(w["start"] + wdur, 4)
        min_pos = w["start"] + _EPS_GAP


def _ripple_backward(units: list, anchors: dict, i: int) -> None:
    """Push preceding units only when their START would no longer precede."""
    max_pos = units[i]["start"]
    for j in range(i - 1, -1, -1):
        w = units[j]
        if w.get("start") is None:
            continue
        if w["id"] in anchors:
            break
        if w["start"] < max_pos - 1e-6:
            break
        wdur = _udur(w)
        w["start"] = round(max(0.0, max_pos - _EPS_GAP), 4)
        w["end"] = round(w["start"] + wdur, 4)
        max_pos = w["start"]


def _join_units_text(us: list[dict]) -> str:
    parts = []
    for w in us:
        if w["kind"] == "word" and parts:
            parts.append(" ")
        parts.append(w["text"])
        if w["kind"] == "word":
            parts.append(" ")
    return "".join(parts).strip()


def paste_units(pid: str, unit_ids: list[str], at_time: float) -> dict:
    """Duplicate the given units at at_time, preserving their internal
    spacing. The copies become a new lyric line inserted at the matching
    chronological position (for repeated choruses that appear once in the
    written lyrics but twice in the song)."""
    with _lock(pid):
        data = load(pid)
        units = data["units"]
        lines = data["lines"]
        wanted = set(unit_ids)
        src = [u for u in units if u["id"] in wanted and u.get("start") is not None]
        if not src:
            return data
        at_time = max(0.0, float(at_time))
        base = src[0]["start"]

        nid = _new_uid(units)
        lid_n = max((int(l["id"][1:]) for l in lines if l["id"][1:].isdigit()),
                    default=-1) + 1
        lid = f"l{lid_n}"
        clones = []
        for u in src:
            off = u["start"] - base
            clones.append({
                "id": f"u{nid}", "text": u["text"], "kind": u["kind"],
                "line_id": lid,
                "start": round(at_time + off, 4),
                "end": round(at_time + off + _udur(u), 4),
                "conf": u.get("conf"), "anchored": False,
            })
            nid += 1

        # find the line after which the new line belongs (by first-unit time)
        first_start = {}
        for u in units:
            if u.get("start") is not None and u["line_id"] not in first_start:
                first_start[u["line_id"]] = u["start"]
        after_line = None
        for l in lines:
            fs = first_start.get(l["id"])
            if fs is not None and fs <= at_time:
                after_line = l
        new_line = {"id": lid, "section_id": None, "text": _join_units_text(src),
                    "adlib": False, "unit_ids": [c["id"] for c in clones]}

        if after_line is not None:
            new_line["section_id"] = after_line["section_id"]
            last_uid = after_line["unit_ids"][-1]
            u_idx = {u["id"]: i for i, u in enumerate(units)}
            insert_at = u_idx[last_uid] + 1
            lines.insert(lines.index(after_line) + 1, new_line)
            for s in data["sections"]:
                if after_line["id"] in s["line_ids"]:
                    s["line_ids"].insert(
                        s["line_ids"].index(after_line["id"]) + 1, lid)
                    break
        else:
            first_sec = next((s for s in data["sections"] if s["line_ids"]),
                             data["sections"][0] if data["sections"] else None)
            new_line["section_id"] = first_sec["id"] if first_sec else "s0"
            insert_at = 0
            lines.insert(0, new_line)
            if first_sec:
                first_sec["line_ids"].insert(0, lid)

        units[insert_at:insert_at] = clones
        save(pid, data)
        return data


def move_unit(pid: str, unit_id: str, new_start: float) -> dict:
    """Move a unit to new_start and ripple-push neighbours so order stays
    monotonic. Cascades stop at anchored units."""
    with _lock(pid):
        data = load(pid)
        units = data["units"]
        anchors = data["anchors"]
        idx = {u["id"]: i for i, u in enumerate(units)}
        if unit_id not in idx:
            return data
        i = idx[unit_id]
        u = units[i]
        dur = _udur(u)
        u["start"] = round(max(0.0, float(new_start)), 4)
        u["end"] = round(u["start"] + dur, 4)
        _ripple_forward(units, anchors, i)
        _ripple_backward(units, anchors, i)
        save(pid, data)
        return data


def move_group(pid: str, unit_ids: list[str], delta: float) -> dict:
    """Shift a set of units by delta (keeping their internal spacing) and
    ripple-push everything outside the group so order stays monotonic.
    Anchored group members move too — their anchor time follows."""
    with _lock(pid):
        data = load(pid)
        units = data["units"]
        anchors = data["anchors"]
        idx = {u["id"]: i for i, u in enumerate(units)}
        idxs = sorted(idx[uid] for uid in unit_ids if uid in idx)
        idxs = [i for i in idxs if units[i].get("start") is not None]
        if not idxs:
            return data
        delta = float(delta)
        for i in idxs:
            u = units[i]
            dur = _udur(u)
            u["start"] = round(max(0.0, u["start"] + delta), 4)
            u["end"] = round(u["start"] + dur, 4)
            if u["id"] in anchors:
                anchors[u["id"]] = u["start"]
        _ripple_forward(units, anchors, idxs[-1])
        _ripple_backward(units, anchors, idxs[0])
        save(pid, data)
        return data


def edit_unit(pid: str, unit_id: str, text: str, start: float,
              end: float) -> dict:
    """Manual full edit of one unit (text + exact times) from the edit
    dialog. Rebuilds the parent line's display text from its units."""
    with _lock(pid):
        data = load(pid)
        units = {u["id"]: u for u in data["units"]}
        u = units.get(unit_id)
        if u is None:
            return data
        text = (text or "").strip()
        if text:
            u["text"] = text
            from .lyrics_parser import CHAR_SCRIPT_RE
            u["kind"] = "char" if (len(text) == 1 and CHAR_SCRIPT_RE.match(text)) else "word"
        start = max(0.0, float(start))
        end = float(end)
        if end <= start:
            end = start + 0.05
        u["start"], u["end"] = round(start, 4), round(end, 4)
        u["conf"] = 1.0
        if u["id"] in data["anchors"]:
            data["anchors"][u["id"]] = u["start"]
        for line in data["lines"]:
            if line["id"] == u["line_id"]:
                parts = []
                for uid in line["unit_ids"]:
                    w = units.get(uid)
                    if not w:
                        continue
                    if w["kind"] == "word" and parts:
                        parts.append(" ")
                    parts.append(w["text"])
                    if w["kind"] == "word":
                        parts.append(" ")
                line["text"] = "".join(parts).strip()
        save(pid, data)
        return data


def set_unit_time(pid: str, unit_id: str, start: float, end: float | None) -> dict:
    """Manual fine edit of one unit without re-alignment."""
    with _lock(pid):
        data = load(pid)
        for u in data["units"]:
            if u["id"] == unit_id:
                u["start"] = round(float(start), 4)
                if end is not None:
                    u["end"] = round(float(end), 4)
        save(pid, data)
        return data


def restore_units(pid: str, snapshot: dict) -> dict:
    """Undo support: restore full structure (units/lines/anchors) or, in the
    legacy form, just unit times."""
    with _lock(pid):
        data = load(pid)
        if "units_full" in snapshot:
            data["units"] = snapshot["units_full"]
            if snapshot.get("lines"):
                data["lines"] = snapshot["lines"]
            if snapshot.get("sections"):
                data["sections"] = snapshot["sections"]
            else:
                # older snapshots: drop line refs that no longer exist
                # (structural ops like paste also touch section.line_ids)
                valid = {l["id"] for l in data["lines"]}
                for s in data["sections"]:
                    s["line_ids"] = [lid for lid in s["line_ids"] if lid in valid]
            data["anchors"] = snapshot.get("anchors", {})
            save(pid, data)
            return data
        times = snapshot.get("units", {})
        for u in data["units"]:
            s = times.get(u["id"])
            if s:
                u["start"], u["end"] = s.get("start"), s.get("end")
                u["conf"] = s.get("conf", u.get("conf"))
                u["anchored"] = s.get("anchored", False)
        data["anchors"] = snapshot.get("anchors", {})
        save(pid, data)
        return data

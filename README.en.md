# 🎬 LyricsSync

[한국어](README.md) · **English** · [日本語](README.ja.md) · [中文](README.zh.md)

![version](https://img.shields.io/badge/version-v0.9.0--beta-orange) ![platform](https://img.shields.io/badge/platform-Windows-blue) ![license](https://img.shields.io/badge/license-MIT-green)

**Per-syllable lyric timecode extraction & editing for AI music video production**

Drop in a song and its lyrics, and LyricsSync analyzes the waveform to tell you
**exactly when every single character/syllable is sung** — then lets you correct
the result by dragging directly on the waveform. A fully local Windows desktop app.

> **UI languages**: 한국어 / English / 日本語 / 中文 / Español / Français / Deutsch / Русский
> (top-left selector on the home screen; press `?` in-app for the guide).
> **Song analysis is language-universal** — Korean, English, Japanese, Chinese, Russian
> and most languages are aligned via multilingual MMS forced alignment + romanization.
> CJK lyrics are timed per character, alphabet languages per word.

---

## Why this exists

If you make music videos with AI, you keep hitting the same wall:

**"When exactly is this lyric sung?"**

Typography synced to lyrics, lip-sync, scene cuts, motion effects — they all need
syllable-level timing. But feeding the audio to an LLM never nails it. The workaround
was always the same: slice out the audio, ask for an analysis, then fix the result by
hand. Every single time.

LyricsSync removes that loop:

- Analyze the whole song **once** and get a timecode for every character,
- **Drag any section** and instantly get its exact timing,
- Feed the values straight into **After Effects typography, Seedance video generation, or lip-sync**.

Since no automatic alignment is ever perfect, the real heart of this tool is its
**correction workflow**: fix a few big errors yourself, and the rest converges to the
waveform automatically.

---

## Pipeline

```
Audio + lyrics (lyrics optional — AI can auto-transcribe)
   │
   ├─ ① Vocal separation ── BS-RoFormer (SOTA stem separation)
   ├─ ② Auto lyrics ─────── Whisper large-v3-turbo (when lyrics omitted)
   ├─ ③ Forced alignment ── MMS forced alignment (1,100+ languages)
   │                         · CTC-aligns the ground-truth lyrics to the waveform
   │                         · CJK = per character, alphabetic = per word
   │                         · unified via romanization (uroman)
   └─ ④ Beat analysis ───── Beat This! (BPM/beats/downbeats) + kick onsets
   │
   ▼
Per-character timetable (project.json)
```

Instead of ASR "transcription", LyricsSync **force-aligns the lyrics you already know
to be correct** — fundamentally more accurate than speech-recognition-based subtitle
tools. The heavy GPU work (phoneme probability map) is cached at first analysis, so
every later re-alignment finishes in milliseconds.

---

## Features

### Automatic analysis
- **Vocal separation**: BS-RoFormer vocal stem for maximum alignment accuracy; drum stem too (htdemucs)
- **Auto lyrics**: leave lyrics empty and Whisper transcribes them from the vocals (song language selectable, auto-detect by default)
- **BPM/beats/kicks**: Beat This! transformer + librosa onsets, drawn as a grid on the waveform
- **Timecode hints**: write `[Chorus @ 1:23]` or a standalone `@1:23` line in the lyrics — the first analysis searches near that point (±3s); even rough guesses boost accuracy a lot
- **Suno tags**: paste `[Intro]`, `[piano only]` etc. as-is; they become section structure

### Correction workflow (the core)
- **Karaoke highlight**: the currently sung character glows during playback — spot misalignments by ear and eye instantly
- **Anchors (`A` key)**: select a character, press `A` the moment you hear it — it pins (⚓) and **neighboring ranges re-align to the waveform automatically**. Fix the big ones and the small ones converge
- **Direct chip editing** (`가` button): every character appears as a grabbable chip on the waveform; click/drag any chip to move it. Overlapping chips stack up to 4 rows so everything stays grabbable
- **Bead push model**: dragging a character pushes its neighbors in a chain so order can never flip; collisions are judged by start times only, and anchors act as immovable walls
- **Multi-select group move**: marquee-select several characters and move them together with spacing preserved
- **Region re-analysis**: drag on the waveform — units inside light up green, one click re-analyzes. A 3-tier strategy (vocal stem → original mix as second opinion → even spread) with a result report (unit count · confidence · source used) every time
- **Force placement**: shift-select a lyric range, then drag a waveform region to force those lyrics into it — for parts the aligner skipped entirely
- **Right-click realign menu**: realign forward/backward fully, or only N seconds; delete units
- **Insert lyrics**: hover between characters for a `+` button; inserted text re-aligns locally
- **Double-click precision edit**: edit a unit's text and exact start/end seconds
- **Ctrl+Z**: undo everything (anchors, moves, inserts, deletes, re-analyses)

### Export & integration
- **Copy Range**: click → shift+click a range → absolute start + **relative timecodes**
  (first char = 0.000) + frame numbers (configurable fps). Built for After Effects precomp workflows
- **Export with preview**:
  - `TXT` — human-readable timetable (sections/lines/per-char times + frames)
  - `SRT` — standard subtitles, straight into Premiere/AE/YouTube
  - `LRC` — karaoke format with per-character tags
  - `JSON` — full raw data (for LLMs/scripts)
- **LLM integration**: feed `projects/<name>/project.json` directly to Claude etc. for
  AE typography automation (.jsx generation), lip-sync timing, or scene cut lists

### App
- Console-free Windows desktop app (dark theme, DWM-tinted title bar)
- Playback switchable between original / vocals-only / drums-only
- Drag & drop audio input
- GPU auto-detection with CPU fallback — status shown on the home screen
- Complete project deletion (no leftovers)

---

## Shortcuts

| Key | Action |
|---|---|
| `Space` | Play/pause |
| `A` | Anchor selected character at the playhead |
| `Alt+click waveform` | Anchor selected character there |
| `Shift+click` | Range-select lyrics (mirrored on the waveform) |
| Drag waveform | Re-analyze region (labels off) |
| Drag chip | Move character + push neighbors (labels on) |
| Double-click | Precision edit (text/times) |
| Right-click | Realign menu |
| `Esc` | Clear selection/region |
| `Ctrl+Z` | Undo |

---

## Requirements

| Item | Recommended | Minimum |
|---|---|---|
| GPU | NVIDIA (6GB+ VRAM, CUDA 12.x) | none — automatic CPU fallback |
| Analysis speed (3–4 min song) | GPU: ~1–2 min | CPU: ~10–20 min |
| RAM | 16GB | 8GB |
| Disk | ~4GB model cache + 100–200MB stems per song | |
| OS | Windows 11 (WebView2 built in) | Windows 10 + WebView2 runtime |

- AMD/Intel GPUs run in CPU mode (no CUDA).
- First run downloads the AI models (BS-RoFormer, MMS, Whisper turbo, Beat This!).

## Install & run

```
git clone https://github.com/elecpure2/LyricsSync.git
cd LyricsSync
install.bat        ← one double-click (venv + PyTorch + ffmpeg, all automatic)
```

Then double-click the generated `LyricsSync.lnk` (runs without a console window).
Requires Python 3.11+.

## Workflow summary

1. **New project**: name + audio (drag & drop OK) + lyrics (empty = auto-transcribe) → Start
2. **Listen**: find misalignments via the karaoke highlight
3. **Correct**: anchors (A) → chip dragging → region re-analysis → double-click for precision
4. **Extract**: Copy Range (relative timecodes for AE) or export TXT/SRT/LRC/JSON

## Project layout

```
LyricsSync/
├─ main.pyw              # desktop launcher (pywebview; server runs as a separate process)
├─ app/
│  ├─ server.py          # local FastAPI
│  └─ pipeline/          # separation · alignment · beats · parser · project store
├─ ui/                   # editor frontend (8-language i18n)
├─ bin/                  # bundled ffmpeg (downloaded by install.bat)
└─ projects/<name>/      # audio copy · stems · alignment cache · project.json
```

## Tech stack

Python 3.11 · PyTorch (CUDA 12.8) · [BS-RoFormer](https://arxiv.org/abs/2309.02612) (vocal separation) ·
[MMS forced alignment](https://ai.meta.com/blog/multilingual-model-speech-recognition/) (torchaudio) ·
[Whisper large-v3-turbo](https://github.com/openai/whisper) (auto lyrics) ·
[Beat This!](https://github.com/CPJKU/beat_this) (beat tracking) · uroman (romanization) ·
FastAPI + pywebview + wavesurfer.js

---

*Built in a day with Claude, because I needed it for an AI music video.* 🎬

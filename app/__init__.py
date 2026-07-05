import os

# bundled ffmpeg (required by audio-separator)
_BIN = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "bin")
if os.path.isdir(_BIN) and _BIN not in os.environ.get("PATH", ""):
    os.environ["PATH"] = _BIN + os.pathsep + os.environ.get("PATH", "")

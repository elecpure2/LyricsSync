"""LyricsSync desktop launcher — dark native window, no console.

The FastAPI server (and all heavy GPU analysis) runs in a separate
process so the GUI never freezes. Errors are logged to lyricssync.log.

Note: pywebview's frameless mode has a state-change recursion bug on
Windows (freezes on minimize/maximize), so we use a native frame and
recolor the title bar via DWM instead.
"""
import ctypes
import logging
import os
import socket
import subprocess
import sys
import threading
import time
import urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)
os.chdir(ROOT)

# If launched with the system Python (e.g. double-clicking this file),
# re-exec with the venv interpreter that has all dependencies.
_VENV_PYW = os.path.join(ROOT, ".venv", "Scripts", "pythonw.exe")
if os.path.normcase(sys.executable) != os.path.normcase(_VENV_PYW) \
        and os.path.exists(_VENV_PYW):
    subprocess.Popen([_VENV_PYW, os.path.abspath(__file__)], cwd=ROOT)
    sys.exit(0)

logging.basicConfig(
    filename=os.path.join(ROOT, "lyricssync.log"),
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("launcher")

WINDOW_TITLE = "LyricsSync"


def free_port() -> int:
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    return port


def start_server(port: int) -> subprocess.Popen:
    exe = os.path.join(ROOT, ".venv", "Scripts", "python.exe")
    logfile = open(os.path.join(ROOT, "server.log"), "a", encoding="utf-8")
    return subprocess.Popen(
        [exe, "-m", "uvicorn", "app.server:app",
         "--host", "127.0.0.1", "--port", str(port), "--log-level", "warning"],
        cwd=ROOT, stdout=logfile, stderr=logfile,
        creationflags=subprocess.CREATE_NO_WINDOW)


def wait_ready(port: int, proc: subprocess.Popen, timeout: float = 30.0) -> bool:
    t0 = time.time()
    while time.time() - t0 < timeout:
        if proc.poll() is not None:
            log.error("server process exited early (code %s)", proc.returncode)
            return False
        try:
            urllib.request.urlopen(f"http://127.0.0.1:{port}/api/projects",
                                   timeout=1)
            return True
        except Exception:
            time.sleep(0.3)
    return False


def style_titlebar():
    """Recolor the native title bar to match the app (Windows 11 DWM)."""
    def rgb(r, g, b):  # COLORREF is 0x00BBGGRR
        return b << 16 | g << 8 | r

    dwm = ctypes.windll.dwmapi
    for _ in range(50):
        hwnd = ctypes.windll.user32.FindWindowW(None, WINDOW_TITLE)
        if hwnd:
            for attr, val in (
                (20, 1),                    # DWMWA_USE_IMMERSIVE_DARK_MODE
                (35, rgb(0x15, 0x18, 0x23)),  # DWMWA_CAPTION_COLOR  (#151823)
                (34, rgb(0x26, 0x2b, 0x3d)),  # DWMWA_BORDER_COLOR   (#262b3d)
                (36, rgb(0xdb, 0xe1, 0xee)),  # DWMWA_TEXT_COLOR     (#dbe1ee)
            ):
                v = ctypes.c_int(val)
                dwm.DwmSetWindowAttribute(hwnd, attr, ctypes.byref(v),
                                          ctypes.sizeof(v))
            return
        time.sleep(0.1)


class Api:
    def __init__(self):
        self._window = None

    def pick_audio(self):
        import webview
        res = self._window.create_file_dialog(
            webview.OPEN_DIALOG,
            file_types=("오디오 파일 (*.mp3;*.wav;*.flac;*.m4a;*.ogg)",
                        "모든 파일 (*.*)"))
        return res[0] if res else None

    def save_text(self, content: str, filename: str):
        import webview
        ext = os.path.splitext(filename)[1].lstrip(".") or "txt"
        res = self._window.create_file_dialog(
            webview.SAVE_DIALOG, save_filename=filename,
            file_types=(f"{ext.upper()} (*.{ext})", "모든 파일 (*.*)"))
        if not res:
            return None
        dest = res if isinstance(res, str) else res[0]
        with open(dest, "w", encoding="utf-8-sig") as f:
            f.write(content)
        return dest

    def export_json(self, pid: str):
        import webview
        res = self._window.create_file_dialog(
            webview.SAVE_DIALOG, save_filename=f"{pid}_lyrics_timing.json",
            file_types=("JSON (*.json)",))
        if not res:
            return None
        dest = res if isinstance(res, str) else res[0]
        import shutil
        src = os.path.join(ROOT, "projects", pid, "project.json")
        shutil.copy2(src, dest)
        return dest


def main():
    try:
        import webview

        port = free_port()
        log.info("starting server on port %d", port)
        proc = start_server(port)
        if not wait_ready(port, proc):
            log.error("server failed to start; see server.log")
            ctypes.windll.user32.MessageBoxW(
                0, "서버 시작에 실패했어요.\nserver.log 파일을 확인해주세요.",
                "LyricsSync", 0x10)
            proc.kill()
            return

        log.info("server ready, opening window")
        api = Api()
        window = webview.create_window(
            WINDOW_TITLE,
            f"http://127.0.0.1:{port}/",
            js_api=api,
            width=1280, height=860, min_size=(960, 640),
            background_color="#0e1015",
        )
        api._window = window
        threading.Thread(target=style_titlebar, daemon=True).start()
        try:
            webview.start(icon=os.path.join(ROOT, "LyricsSync.ico"))
        finally:
            log.info("window closed, stopping server")
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
    except Exception:
        log.exception("launcher crashed")
        raise


if __name__ == "__main__":
    main()

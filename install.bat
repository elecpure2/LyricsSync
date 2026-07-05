@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ============================================
echo  LyricsSync installer
echo ============================================
echo.

where python >nul 2>nul
if errorlevel 1 (
    echo [!] Python not found. Install Python 3.11+ from https://python.org first.
    pause
    exit /b 1
)

echo [1/5] Creating virtual environment...
if not exist .venv (
    python -m venv .venv
)

echo [2/5] Installing PyTorch (CUDA 12.8 build - works on CPU too)...
.venv\Scripts\pip.exe install torch torchaudio --index-url https://download.pytorch.org/whl/cu128

echo [3/5] Installing dependencies...
.venv\Scripts\pip.exe install -r requirements.txt
.venv\Scripts\pip.exe install git+https://github.com/CPJKU/beat_this.git

echo [4/5] Downloading ffmpeg...
if not exist bin\ffmpeg.exe (
    powershell -NoProfile -Command "Invoke-WebRequest -Uri 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip' -OutFile '%TEMP%\ffmpeg_ls.zip'; Expand-Archive '%TEMP%\ffmpeg_ls.zip' -DestinationPath '%TEMP%\ffmpeg_ls' -Force; $d = Get-ChildItem '%TEMP%\ffmpeg_ls' -Directory | Select-Object -First 1; New-Item -ItemType Directory -Force 'bin' | Out-Null; Copy-Item ($d.FullName + '\bin\ffmpeg.exe'), ($d.FullName + '\bin\ffprobe.exe') 'bin\'; Remove-Item '%TEMP%\ffmpeg_ls.zip', '%TEMP%\ffmpeg_ls' -Recurse -Force"
)

echo [5/5] Creating shortcut...
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $lnk = $ws.CreateShortcut(\"$pwd\LyricsSync.lnk\"); $lnk.TargetPath = \"$pwd\.venv\Scripts\pythonw.exe\"; $lnk.Arguments = \"\"\"$pwd\main.pyw\"\"\"; $lnk.WorkingDirectory = \"$pwd\"; $lnk.IconLocation = \"$pwd\LyricsSync.ico\"; $lnk.Save()"

echo.
echo ============================================
echo  Done! Double-click LyricsSync.lnk to run.
echo  (First analysis downloads AI models ~4GB)
echo ============================================
pause

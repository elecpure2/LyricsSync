"""Local FastAPI server: static UI + project/alignment API."""
from __future__ import annotations

import os

from fastapi import FastAPI, Body, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .pipeline import project as prj

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UI_DIR = os.path.join(ROOT, "ui")

app = FastAPI()


@app.middleware("http")
async def no_cache_static(request, call_next):
    resp = await call_next(request)
    p = request.url.path
    if p == "/" or p.endswith((".js", ".css", ".html")):
        resp.headers["Cache-Control"] = "no-cache"
    return resp


@app.get("/api/system")
def api_system():
    try:
        import torch
        if torch.cuda.is_available():
            p = torch.cuda.get_device_properties(0)
            return {"device": "cuda", "gpu": p.name,
                    "vram_gb": round(p.total_memory / 2**30, 1)}
        return {"device": "cpu", "gpu": None, "vram_gb": None}
    except Exception:
        return {"device": "unknown", "gpu": None, "vram_gb": None}


@app.get("/api/projects")
def api_list():
    return prj.list_projects()


@app.post("/api/projects")
def api_create(payload: dict = Body(...)):
    pid = prj.create_project(payload["name"], payload["audio_path"],
                             payload["lyrics"],
                             payload.get("song_lang", "auto"))
    prj.start_analysis(pid)
    return {"id": pid}


@app.delete("/api/projects/{pid}")
def api_delete(pid: str):
    prj.delete_project(pid)
    return {"ok": True}


@app.get("/api/projects/{pid}")
def api_get(pid: str):
    return prj.load(pid)


@app.get("/api/projects/{pid}/progress")
def api_progress(pid: str):
    return prj.get_progress(pid)


@app.post("/api/projects/{pid}/reanalyze")
def api_reanalyze(pid: str):
    prj.start_analysis(pid)
    return {"ok": True}


@app.post("/api/projects/{pid}/anchor")
def api_anchor(pid: str, payload: dict = Body(...)):
    return prj.set_anchor(pid, payload["unit_id"], payload["time"])


@app.post("/api/projects/{pid}/anchor/clear")
def api_anchor_clear(pid: str, payload: dict = Body(...)):
    return prj.clear_anchor(pid, payload["unit_id"])


@app.post("/api/projects/{pid}/insert")
def api_insert(pid: str, payload: dict = Body(...)):
    return prj.insert_units(pid, payload["unit_id"], payload["text"],
                            payload.get("before", False))


@app.post("/api/projects/{pid}/delete_unit")
def api_delete_unit(pid: str, payload: dict = Body(...)):
    return prj.delete_unit(pid, payload["unit_id"])


@app.post("/api/projects/{pid}/realign_range")
def api_realign_range(pid: str, payload: dict = Body(...)):
    return prj.realign_range(pid, payload["unit_id"], payload["direction"],
                             payload.get("seconds"))


@app.post("/api/projects/{pid}/realign_window")
def api_realign_window(pid: str, payload: dict = Body(...)):
    return prj.realign_window(pid, payload["t0"], payload["t1"],
                              payload.get("unit_ids"))


@app.post("/api/projects/{pid}/edit_unit")
def api_edit_unit(pid: str, payload: dict = Body(...)):
    return prj.edit_unit(pid, payload["unit_id"], payload.get("text", ""),
                         payload["start"], payload["end"])


@app.post("/api/projects/{pid}/paste_units")
def api_paste_units(pid: str, payload: dict = Body(...)):
    return prj.paste_units(pid, payload["unit_ids"], payload["time"])


@app.post("/api/projects/{pid}/move_unit")
def api_move_unit(pid: str, payload: dict = Body(...)):
    return prj.move_unit(pid, payload["unit_id"], payload["start"])


@app.post("/api/projects/{pid}/move_group")
def api_move_group(pid: str, payload: dict = Body(...)):
    return prj.move_group(pid, payload["unit_ids"], payload["delta"])


@app.post("/api/projects/{pid}/unit")
def api_unit(pid: str, payload: dict = Body(...)):
    return prj.set_unit_time(pid, payload["unit_id"], payload["start"],
                             payload.get("end"))


@app.post("/api/projects/{pid}/fps")
def api_fps(pid: str, payload: dict = Body(...)):
    data = prj.load(pid)
    data["fps"] = max(1, min(240, int(payload.get("fps", 30))))
    prj.save(pid, data)
    return {"ok": True, "fps": data["fps"]}


@app.post("/api/projects/{pid}/restore")
def api_restore(pid: str, payload: dict = Body(...)):
    return prj.restore_units(pid, payload)


@app.post("/api/upload")
async def api_upload(file: UploadFile):
    """Fallback for drag&drop when the real file path is unavailable."""
    import tempfile
    updir = os.path.join(tempfile.gettempdir(), "lyricssync_uploads")
    os.makedirs(updir, exist_ok=True)
    dest = os.path.join(updir, os.path.basename(file.filename or "audio"))
    with open(dest, "wb") as f:
        while chunk := await file.read(1 << 20):
            f.write(chunk)
    return {"path": dest}


@app.get("/api/projects/{pid}/audio/{which}")
def api_audio(pid: str, which: str):
    data = prj.load(pid)
    pdir = os.path.join(prj.PROJECTS_DIR, pid)
    if which == "source":
        path = os.path.join(pdir, data["audio"])
    else:
        rel = (data.get("stems") or {}).get(which)
        if not rel:
            return JSONResponse({"error": "no such stem"}, status_code=404)
        path = os.path.join(pdir, rel)
    if not os.path.exists(path):
        return JSONResponse({"error": "missing"}, status_code=404)
    return FileResponse(path)


app.mount("/", StaticFiles(directory=UI_DIR, html=True), name="ui")

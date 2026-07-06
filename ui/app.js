/* LyricsSync editor front-end */
"use strict";

const $ = (s) => document.querySelector(s);
const api = {
  get: (u) => fetch(u).then((r) => r.json()),
  post: (u, body) => fetch(u, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  }).then((r) => r.json()),
};

let project = null;        // full project json
let ws = null;             // wavesurfer
let selId = null;          // selected unit id
let rangeId = null;        // shift-select end unit id
let pickedFile = null;
let undoStack = [];
let pollTimer = null;

function toast(msg, ms = 2200) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("show"), ms);
}
function busy(msg) { $("#busy").textContent = msg || ""; }

/* ---------------- home ---------------- */
async function loadProjects() {
  const list = await api.get("/api/projects");
  const el = $("#projectList");
  el.innerHTML = "";
  if (!list.length) el.innerHTML = `<div style="color:var(--dim)">${t("noProjects")}</div>`;
  for (const p of list) {
    const d = document.createElement("div");
    d.className = "proj-item";
    const stTxt = { ready: t("stReady"), analyzing: t("stAnalyzing"), created: t("stCreated"), error: t("stError") }[p.status] || p.status;
    d.innerHTML = `<span>${p.name}</span><span class="proj-right"><span class="st ${p.status}">${stTxt} · ${p.created || ""}</span><button class="proj-del" title="${t("deleteProj")}">🗑</button></span>`;
    d.onclick = () => openProject(p.id);
    d.querySelector(".proj-del").onclick = async (e) => {
      e.stopPropagation();
      if (!confirm(t("confirmDelete", { name: p.name }))) return;
      await fetch(`/api/projects/${encodeURIComponent(p.id)}`, { method: "DELETE" });
      toast(t("toastProjDeleted"));
      loadProjects();
    };
    el.appendChild(d);
  }
}

function setPicked(path) {
  pickedFile = path;
  $("#npFile").textContent = path.split(/[\\/]/).pop();
  $("#dropZone").classList.add("hasfile");
}

$("#npPick").onclick = async () => {
  const f = await window.pywebview?.api.pick_audio();
  if (f) setPicked(f);
};

const dz = $("#dropZone");
["dragenter", "dragover"].forEach((ev) => dz.addEventListener(ev, (e) => {
  e.preventDefault(); dz.classList.add("dragover");
}));
["dragleave", "drop"].forEach((ev) => dz.addEventListener(ev, (e) => {
  e.preventDefault(); dz.classList.remove("dragover");
}));
dz.addEventListener("drop", async (e) => {
  const f = e.dataTransfer.files[0];
  if (!f) return;
  if (!/\.(mp3|wav|flac|m4a|ogg|opus|aac)$/i.test(f.name)) { toast(t("toastNotAudio")); return; }
  // pywebview exposes the real path on dropped files; fall back to upload
  const real = f.pywebviewFullPath || e.dataTransfer.files[0].path;
  if (real) { setPicked(real); return; }
  toast(t("toastUploading"));
  const fd = new FormData();
  fd.append("file", f);
  const r = await fetch("/api/upload", { method: "POST", body: fd }).then((x) => x.json());
  if (r.path) { setPicked(r.path); toast(t("toastUploaded")); }
  else toast(t("toastUploadFail"));
});

$("#npCreate").onclick = async () => {
  const name = $("#npName").value.trim();
  const lyrics = $("#npLyrics").value.trim();
  if (!name || !pickedFile) { toast(t("needNameFile")); return; }
  $("#npStatus").textContent = lyrics ? t("creating") : t("creatingAuto");
  const r = await api.post("/api/projects", {
    name, audio_path: pickedFile, lyrics,
    song_lang: $("#npLang").value,
  });
  openProject(r.id);
};

/* ---------------- project open / poll ---------------- */
async function openProject(pid) {
  project = await api.get(`/api/projects/${pid}`);
  document.title = `LyricsSync — ${project.name}`;
  if (project.status !== "ready") {
    $("#npStatus").textContent = t("analyzingWait");
    showScreen("home");
    clearInterval(pollTimer);
    pollTimer = setInterval(async () => {
      const pr = await api.get(`/api/projects/${pid}/progress`);
      if (pr.stage === "error") {
        clearInterval(pollTimer);
        $("#npStatus").textContent = t("analysisErr") + "\n" + (pr.detail || "").slice(-800);
        return;
      }
      $("#npStatus").textContent = `${t("analyzingStage")} [${pr.stage || "…"}] ${pr.detail || ""}`;
      if (pr.stage === "done") {
        clearInterval(pollTimer);
        $("#npStatus").textContent = "";
        openProject(pid);
      }
    }, 1500);
    loadProjects();
    return;
  }
  showScreen("editor");
  resetEditorState();   // never carry selection/undo/clipboard across projects
  $("#fpsInput").value = project.fps || 30;
  $("#bpmDisp").textContent = project.beats?.bpm ? `BPM ${project.beats.bpm}` : "BPM ?";
  initWave();
  renderLyrics();
}

function resetEditorState() {
  selId = null; rangeId = null;
  multiSel.clear();
  region = null; mselRange = null;
  unitClipboard = null;
  undoStack = [];
  unitGhostT = null; unitGhostMap = null;
  dragMode = null; wasDrag = false;
  lastPlayingEl = null; lastPlayingLine = null; lastKaraokeT = -1;
  beatSel = null;
  lastBeatHi = { downbeats: -1, beats: -1, kicks: -1 };
  setView("lyrics");
  hideRegionBtn();
  hidePops();
}

function showScreen(name) {
  $("#home").style.display = name === "home" ? "flex" : "none";
  $("#editor").style.display = name === "editor" ? "flex" : "none";
  if (name === "home") loadProjects();
}

/* ---------------- waveform ---------------- */
function stemUrl() {
  return `/api/projects/${project.id}/audio/${$("#stemSel").value}`;
}

function initWave() {
  if (ws) { ws.destroy(); ws = null; }
  ws = WaveSurfer.create({
    container: "#waveform",
    height: 138,
    waveColor: "#3d4668",
    progressColor: "#7dd3fc",
    cursorColor: "#f472b6",
    cursorWidth: 2,
    minPxPerSec: +$("#zoom").value,
    url: stemUrl(),
    autoScroll: true,
  });
  ws.on("timeupdate", (t) => {
    $("#timeDisp").textContent = fmtTime(t);
    drawOverlay();
    updateKaraoke(t);
    updateBeatPlayhead(t);
  });
  ws.on("redrawcomplete", drawOverlay);
  ws.on("scroll", drawOverlay);
  ws.on("zoom", drawOverlay);
  ws.on("ready", drawOverlay);
  ws.on("play", () => $("#btnPlay").innerHTML = "&#10074;&#10074;");
  ws.on("pause", () => $("#btnPlay").innerHTML = "&#9654;");
}

// registered once (NOT inside initWave — it re-runs on stem switch and
// duplicate listeners ate the region selection right after each drag)
$("#waveform").addEventListener("click", (e) => {
  if (wasDrag) { e.stopPropagation(); e.preventDefault(); wasDrag = false; return; }
  // clicks on a chip / selected-unit block select only — they must NOT move
  // the playhead (blocking propagation stops wavesurfer's own seek)
  const p = wrapPos(e);
  const chipHit = showWaveLyrics && labelBoxes.some((b) =>
    p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h);
  const blockHit = !showWaveLyrics && unitBlock &&
    p.x >= unitBlock.x && p.x <= unitBlock.x + unitBlock.w && p.y <= unitBlock.h;
  if (chipHit || blockHit) {
    e.stopPropagation();
    e.preventDefault();
    return;
  }
  if (e.altKey && selId) {
    const t = clickTime(e);
    if (t != null) setAnchor(selId, t);
  } else if (region) {
    region = null; hideRegionBtn(); updateRegionPane(); drawOverlay();
  }
}, true);

/* ---- waveform interactions: region drag, edge handles, unit block ---- */
let region = null;        // {t0, t1}
let dragX0 = null, wasDrag = false;
let dragMode = null;      // "region" | "edgeL" | "edgeR" | "unit" | "mselect" | "group" | null
let unitGhostT = null;    // ghost time while dragging the unit block
let unitGhostMap = null;  // {uid: ghostStart} ripple preview while dragging
let unitBlock = null;     // {x,y,w,h} in wrap coords (set by drawOverlay)
let labelBoxes = [];      // clickable lyric chips on the waveform
let multiMode = false;    // multi-select checkbox state
let multiSel = new Set(); // selected unit ids (group move)
let mselRange = null;     // marquee {t0,t1} while selecting
let groupT0 = null;       // drag start time for group move
let groupDelta = 0;
const waveWrap = document.getElementById("waveWrap");

/* ripple preview — bead model, mirrors the backend exactly: push on START
   collisions only, tiny fixed gap (inflated spans must never claim room) */
const EPS_GAP = 0.03;
function ripplePreview(startIdx, endIdx, ghost) {
  const units = project.units, anchors = project.anchors;
  let minPos = ghost[units[endIdx].id] + EPS_GAP;
  for (let j = endIdx + 1; j < units.length; j++) {
    const w = units[j];
    if (w.start == null) continue;
    if (anchors[w.id] != null) break;
    if (w.start >= minPos - 1e-6) break;
    ghost[w.id] = minPos;
    minPos = ghost[w.id] + EPS_GAP;
  }
  let maxPos = ghost[units[startIdx].id];
  for (let j = startIdx - 1; j >= 0; j--) {
    const w = units[j];
    if (w.start == null) continue;
    if (anchors[w.id] != null) break;
    if (w.start < maxPos - 1e-6) break;
    ghost[w.id] = Math.max(0, maxPos - EPS_GAP);
    maxPos = ghost[w.id];
  }
  return ghost;
}

function previewUnitMove(uid, newT) {
  const i = project.units.findIndex((u) => u.id === uid);
  if (i < 0) return null;
  return ripplePreview(i, i, { [uid]: Math.max(0, newT) });
}

function previewGroupMove(delta) {
  const units = project.units;
  const idxs = [];
  units.forEach((u, i) => { if (multiSel.has(u.id) && u.start != null) idxs.push(i); });
  if (!idxs.length) return null;
  const ghost = {};
  for (const i of idxs) ghost[units[i].id] = Math.max(0, units[i].start + delta);
  return ripplePreview(idxs[0], idxs[idxs.length - 1], ghost);
}

function groupBounds() {
  let min = Infinity, max = -Infinity;
  for (const u of project.units) {
    if (!multiSel.has(u.id) || u.start == null) continue;
    min = Math.min(min, u.start);
    max = Math.max(max, u.end ?? u.start + 0.15);
  }
  return min <= max ? [min, max] : null;
}

function timeToX(t) { return t * ws.options.minPxPerSec - ws.getScroll(); }
function wrapPos(e) {
  const r = waveWrap.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

function chipAt(x, y) {
  // back-to-front so the visually topmost chip wins
  return [...labelBoxes].reverse().find((b) =>
    x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) || null;
}

waveWrap.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 || e.altKey || !ws) return;
  const { x, y } = wrapPos(e);
  wasDrag = false;
  if (multiMode && showWaveLyrics) {
    const t = clickTime(e);
    const hit = chipAt(x, y);
    if (hit && multiSel.has(hit.uid)) {
      // grabbing a selected chip drags the whole group
      dragMode = "group";
      groupT0 = t;
      groupDelta = 0;
      return;
    }
    if (hit) {
      // unselected chip stays individually grabbable even in multi mode
      selId = hit.uid;
      rangeId = null;
      refreshSelection();
      dragMode = "unit";
      return;
    }
    const gb = multiSel.size ? groupBounds() : null;
    if (gb && t >= gb[0] - 0.1 && t <= gb[1] + 0.1) {
      dragMode = "group";
      groupT0 = t;
      groupDelta = 0;
    } else {
      // fresh marquee: drop the previous shift-range so highlights don't mix
      selId = null;
      rangeId = null;
      dragMode = "mselect";
      mselRange = { t0: t, t1: t };
      refreshSelection();
    }
    return;
  }
  if (showWaveLyrics) {
    // chips mode: every lyric label is grabbable; region drag is off
    const hit = chipAt(x, y);
    if (hit) {
      selId = hit.uid;
      rangeId = null;
      refreshSelection();
      dragMode = "unit";
    }
    return;   // plain click on empty waveform still seeks (wavesurfer)
  }
  if (unitBlock && x >= unitBlock.x && x <= unitBlock.x + unitBlock.w && y <= unitBlock.h) {
    dragMode = "unit";
    return;
  }
  if (region) {
    if (Math.abs(x - timeToX(region.t0)) <= 7) { dragMode = "edgeL"; hideRegionBtn(); return; }
    if (Math.abs(x - timeToX(region.t1)) <= 7) { dragMode = "edgeR"; hideRegionBtn(); return; }
  }
  dragMode = "region";
  dragX0 = e.clientX;
});

waveWrap.addEventListener("pointermove", (e) => {
  if (!ws) return;
  if (dragMode === "mselect") {
    if (!mselRange) { dragMode = null; return; }   // Esc mid-drag
    wasDrag = true;
    mselRange.t1 = clickTime(e);
    drawOverlay();
    return;
  }
  if (dragMode === "group") {
    if (!multiSel.size) { dragMode = null; unitGhostMap = null; return; }
    wasDrag = true;
    groupDelta = clickTime(e) - groupT0;
    unitGhostMap = previewGroupMove(groupDelta);
    drawOverlay();
    return;
  }
  if (dragMode === "unit") {
    if (!selId) { dragMode = null; unitGhostT = null; unitGhostMap = null; return; }
    wasDrag = true;
    unitGhostT = Math.max(0, clickTime(e));
    unitGhostMap = previewUnitMove(selId, unitGhostT);
    drawOverlay();
    return;
  }
  if (dragMode === "edgeL") {
    if (!region) { dragMode = null; return; }      // Esc mid-drag
    wasDrag = true;
    region.t0 = Math.max(0, Math.min(clickTime(e), region.t1 - 0.05));
    drawOverlay();
    return;
  }
  if (dragMode === "edgeR") {
    if (!region) { dragMode = null; return; }
    wasDrag = true;
    region.t1 = Math.max(clickTime(e), region.t0 + 0.05);
    drawOverlay();
    return;
  }
  if (dragMode === "region") {
    if (!wasDrag && Math.abs(e.clientX - dragX0) < 7) return;
    wasDrag = true;
    const ta = clickTime({ clientX: dragX0 });
    const tb = clickTime({ clientX: e.clientX });
    region = { t0: Math.max(0, Math.min(ta, tb)), t1: Math.max(ta, tb) };
    hideRegionBtn();
    drawOverlay();
    return;
  }
  // hover affordance
  const { x, y } = wrapPos(e);
  let cur = "default";
  if (showWaveLyrics && labelBoxes.some((b) =>
      x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h)) cur = "grab";
  else if (unitBlock && x >= unitBlock.x && x <= unitBlock.x + unitBlock.w && y <= unitBlock.h) cur = "grab";
  else if (region && (Math.abs(x - timeToX(region.t0)) <= 7 || Math.abs(x - timeToX(region.t1)) <= 7)) cur = "ew-resize";
  waveWrap.style.cursor = cur;
});

window.addEventListener("pointerup", (e) => {
  if (!dragMode) return;
  const mode = dragMode;
  dragMode = null;
  dragX0 = null;
  if (mode === "mselect") {
    if (!mselRange) { setTimeout(() => { wasDrag = false; }, 0); return; }  // Esc mid-drag
    const t0 = Math.min(mselRange.t0, mselRange.t1);
    const t1 = Math.max(mselRange.t0, mselRange.t1);
    mselRange = null;
    multiSel = new Set(project.units
      .filter((u) => u.start != null && u.start >= t0 && u.start <= t1)
      .map((u) => u.id));
    refreshSelection();   // pane highlight too, not just the chips
    if (multiSel.size) toast(t("toastMultiSel", { n: multiSel.size }));
    setTimeout(() => { wasDrag = false; }, 0);
    return;
  }
  if (mode === "group") {
    const delta = groupDelta;
    unitGhostMap = null;
    groupDelta = 0;
    if (wasDrag && Math.abs(delta) > 0.005 && multiSel.size) {
      applyGroupMove(delta);
    } else {
      drawOverlay();
    }
    setTimeout(() => { wasDrag = false; }, 0);
    return;
  }
  if (mode === "unit") {
    if (wasDrag && unitGhostT != null && selId) {
      const newT = unitGhostT;
      unitGhostT = null;
      unitGhostMap = null;
      applyUnitMove(selId, newT);
    } else {
      // plain click on a chip: select only — the playhead stays put
      unitGhostT = null;
      unitGhostMap = null;
      drawOverlay();
    }
    setTimeout(() => { wasDrag = false; }, 0);
    return;
  }
  if (mode === "edgeL" || mode === "edgeR" || mode === "region") {
    if (region && region.t1 - region.t0 >= 0.2 && wasDrag) showRegionBtn(e);
  }
  // let the suppressed click event see wasDrag, then reset it
  setTimeout(() => { wasDrag = false; }, 0);
});

async function applyGroupMove(delta) {
  snapshot();
  busy(t("busyRealign"));
  project = await api.post(`/api/projects/${project.id}/move_group`, {
    unit_ids: [...multiSel],
    delta: +delta.toFixed(4),
  });
  busy("");
  renderLyrics();
  toast(t("toastGroupMoved", { n: multiSel.size, sec: (delta > 0 ? "+" : "") + delta.toFixed(2) }));
}

async function applyUnitMove(uid, newT) {
  const u = unitById(uid);
  snapshot();
  busy(t("busyRealign"));
  project = await api.post(`/api/projects/${project.id}/move_unit`, {
    unit_id: uid,
    start: +newT.toFixed(4),
  });
  busy("");
  renderLyrics();
  toast(t("toastUnitMoved", { text: u.text, time: fmtTime(newT) }));
}

// double-click a waveform chip -> edit dialog (text + exact times)
waveWrap.addEventListener("dblclick", (e) => {
  if (!showWaveLyrics || !ws) return;
  const { x, y } = wrapPos(e);
  const hit = [...labelBoxes].reverse().find((b) =>
    x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
  if (hit) {
    e.preventDefault();
    e.stopPropagation();
    openEditPop(e.clientX, e.clientY, hit.uid);
  }
});

// clicking anywhere outside the waveform cancels the region selection
document.addEventListener("click", (e) => {
  if (region && !wasDrag && !e.target.closest("#waveWrap") && e.target.id !== "regionBtn") {
    region = null;
    hideRegionBtn();
    updateRegionPane();
    drawOverlay();
  }
});

// clicking empty space in the lyrics pane clears the whole selection
$("#lyricsPane").addEventListener("click", (e) => {
  if (e.target.closest(".unit") || e.target.closest(".gap")) return;
  if (selId || rangeId || multiSel.size || region) clearSelection();
});

function regionBtnEl() { return document.getElementById("regionBtn"); }
function hideRegionBtn() { regionBtnEl().style.display = "none"; }

function unitsInRegion() {
  if (!region) return [];
  return project.units.filter((u) =>
    u.start != null && u.start >= region.t0 && u.start < region.t1);
}

function updateRegionPane() {
  refreshSelection();   // one source of truth for all pane highlights
}

function showRegionBtn(e) {
  const btn = regionBtnEl();
  // explicit shift-range selection = "force these lyrics into the region";
  // otherwise the region targets whatever units currently sit inside it
  const useShiftRange = selId && rangeId;
  const n = useShiftRange ? selectedRangeUnits().length : unitsInRegion().length;
  btn.textContent = useShiftRange
    ? t("regionSel", { n })
    : t("regionAll", { n });
  btn.style.display = "block";
  btn.style.left = Math.min(e.clientX, innerWidth - 260) + "px";
  btn.style.top = (waveWrap.getBoundingClientRect().bottom + 6) + "px";
  updateRegionPane();
}

regionBtnEl().onclick = async () => {
  if (!region) return;
  const useShiftRange = selId && rangeId;
  const ids = useShiftRange ? selectedRangeUnits().map((u) => u.id) : null;
  snapshot();
  busy(t("busyRegion"));
  const r = await api.post(`/api/projects/${project.id}/realign_window`, {
    t0: region.t0, t1: region.t1, unit_ids: ids,
  });
  const info = r.info;
  project = r.project ?? r;
  busy("");
  region = null;
  hideRegionBtn();
  renderLyrics();
  if (info && info.n) {
    toast(t("toastRegionInfo", {
      n: info.n, conf: info.conf.toFixed(2), src: t("src_" + info.source),
    }), 3500);
  } else {
    toast(t("toastRegionDone", { t0: "", t1: "" }));
  }
};

function clickTime(e) {
  if (!ws) return null;
  const rect = $("#waveform").getBoundingClientRect();
  const x = e.clientX - rect.left + ws.getScroll();
  return x / ws.options.minPxPerSec;
}

$("#stemSel").onchange = () => { const t = ws.getCurrentTime(); initWave(); ws.on("ready", () => ws.setTime(t)); };
$("#zoom").oninput = () => ws && ws.zoom(+$("#zoom").value);
$("#btnPlay").onclick = () => ws && ws.playPause();
$("#btnBack").onclick = () => { ws?.pause(); showScreen("home"); };

/* overlay: beat grid + kicks + anchors */
function drawOverlay() {
  const cv = $("#overlay");
  const wrap = $("#waveWrap");
  if (!ws || !project) return;
  cv.width = wrap.clientWidth; cv.height = wrap.clientHeight;
  const ctx = cv.getContext("2d");
  ctx.clearRect(0, 0, cv.width, cv.height);
  const pps = ws.options.minPxPerSec, scroll = ws.getScroll();
  const t2x = (t) => t * pps - scroll;
  // drag-selected region + edge grips
  if (region) {
    const x0 = t2x(region.t0), x1 = t2x(region.t1);
    ctx.fillStyle = "rgba(125,211,252,.14)";
    ctx.fillRect(x0, 0, x1 - x0, cv.height);
    ctx.strokeStyle = "rgba(125,211,252,.85)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0, cv.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, 0); ctx.lineTo(x1, cv.height); ctx.stroke();
    ctx.lineWidth = 1;
    ctx.fillStyle = "rgba(125,211,252,.95)";
    for (const xe of [x0, x1]) {
      ctx.beginPath();
      ctx.roundRect(xe - 4, cv.height / 2 - 12, 8, 24, 3);
      ctx.fill();
    }
  }
  const beats = project.beats || {};
  ctx.strokeStyle = "rgba(125,211,252,.16)";
  for (const b of beats.beats || []) {
    const x = t2x(b); if (x < 0 || x > cv.width) continue;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, cv.height); ctx.stroke();
  }
  ctx.strokeStyle = "rgba(167,139,250,.45)";
  for (const b of beats.downbeats || []) {
    const x = t2x(b); if (x < 0 || x > cv.width) continue;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, cv.height); ctx.stroke();
  }
  ctx.fillStyle = "rgba(251,191,36,.8)";
  for (const k of beats.kicks || []) {
    const x = t2x(k); if (x < 0 || x > cv.width) continue;
    ctx.fillRect(x - 1, cv.height - 5, 2, 5);
  }
  // marquee while multi-selecting
  if (mselRange) {
    const x0 = t2x(mselRange.t0), x1 = t2x(mselRange.t1);
    ctx.fillStyle = "rgba(74,222,128,.12)";
    ctx.fillRect(Math.min(x0, x1), 0, Math.abs(x1 - x0), cv.height);
    ctx.strokeStyle = "rgba(74,222,128,.7)";
    ctx.strokeRect(Math.min(x0, x1), 0, Math.abs(x1 - x0), cv.height);
  }
  // per-unit lyric chips on the waveform (toggle) — clickable/draggable boxes
  labelBoxes = [];
  if (showWaveLyrics && project.units) {
    const rangeSet = rangeSelSet();   // pane shift-range mirrored onto the chips
    ctx.font = "11px 'Segoe UI', 'Malgun Gothic', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const BH = 17;
    const NROWS = 4;   // stack overlapping chips upward so each stays grabbable
    const rowY = Array.from({ length: NROWS },
      (_, r) => cv.height - 8 - BH - r * (BH + 4));
    const rowLastRight = Array(NROWS).fill(-1e9);
    for (const u2 of project.units) {
      const st = unitGhostMap?.[u2.id] ?? u2.start;
      if (st == null) continue;
      const x = t2x(st);
      if (x < -30 || x > cv.width + 30) continue;
      const label = u2.kind === "word" ? u2.text[0] : u2.text;
      const bw = Math.max(17, ctx.measureText(label).width + 9);
      let row = rowY.findIndex((_, r) => x - bw / 2 > rowLastRight[r] + 2);
      if (row < 0) continue;              // all rows crowded at this zoom
      rowLastRight[row] = x + bw / 2;
      const y = rowY[row];
      const ghosted = unitGhostMap && unitGhostMap[u2.id] != null;
      const inGroup = multiSel.has(u2.id) || rangeSet.has(u2.id) ||
        (region && !(selId && rangeId) && st >= region.t0 && st < region.t1);
      const isSel = u2.id === selId || u2.id === rangeId;
      // tick from chip down to the waveform baseline
      ctx.strokeStyle = "rgba(251,191,36,.35)";
      ctx.beginPath();
      ctx.moveTo(x, y + BH);
      ctx.lineTo(x, cv.height - 4);
      ctx.stroke();
      // chip
      ctx.fillStyle = isSel ? "#4ade80" : inGroup ? "rgba(74,222,128,.25)"
        : ghosted ? "rgba(251,191,36,.3)" : "rgba(14,16,21,.88)";
      ctx.strokeStyle = isSel ? "#4ade80" : inGroup ? "#4ade80"
        : u2.anchored ? "#f472b6" : ghosted ? "#fbbf24" : "rgba(251,191,36,.55)";
      ctx.beginPath();
      ctx.roundRect(x - bw / 2, y, bw, BH, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = isSel ? "#0e1015"
        : u2.anchored ? "#f472b6"
        : ghosted || inGroup ? "#fff" : "rgba(251,191,36,.95)";
      ctx.fillText(label, x, y + BH / 2 + 0.5);
      if (u2.id === selId && ghosted) {   // live time while dragging a chip
        ctx.fillStyle = "#fbbf24";
        ctx.fillText(fmtTime(st), x, y - 8);
      }
      labelBoxes.push({ uid: u2.id, x: x - bw / 2, y, w: bw, h: BH });
    }
  }
  // anchors
  ctx.fillStyle = "#f472b6";
  for (const [uid, t] of Object.entries(project.anchors || {})) {
    const x = t2x(t); if (x < 0 || x > cv.width) continue;
    ctx.beginPath();
    ctx.moveTo(x - 5, 0); ctx.lineTo(x + 5, 0); ctx.lineTo(x, 7);
    ctx.closePath(); ctx.fill();
  }
  // range / multi selection markers on the waveform (non-chip mode) — so a
  // shift-range or group selection in the pane is visible up here too
  if (!showWaveLyrics) {
    const selSet = new Set([...rangeSelSet(), ...multiSel]);
    selSet.delete(selId);   // selId gets the bright draggable block below
    if (selSet.size) {
      ctx.font = "600 12px 'Segoe UI', 'Malgun Gothic', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const bh = 19;
      for (const uid of selSet) {
        const w = unitById(uid);
        if (!w || w.start == null) continue;
        const x = t2x(w.start);
        if (x < -20 || x > cv.width + 20) continue;
        const bw = Math.max(22, ctx.measureText(w.text).width + 12);
        ctx.fillStyle = "rgba(74,222,128,.22)";
        ctx.strokeStyle = "#4ade80";
        ctx.beginPath(); ctx.roundRect(x - bw / 2, 2, bw, bh, 5); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#dfffe9";
        ctx.fillText(w.text, x, 2 + bh / 2 + 0.5);
      }
    }
  }
  // selected unit: draggable mini-block + line (chips replace it when labels are on)
  const u = unitById(selId);
  if (u && u.start != null && !showWaveLyrics) {
    const tSel = unitGhostT ?? u.start;
    const x = t2x(tSel);
    const ghost = unitGhostT != null;
    ctx.strokeStyle = ghost ? "#fbbf24" : "#4ade80";
    ctx.lineWidth = ghost ? 2 : 1;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, cv.height); ctx.stroke();
    ctx.lineWidth = 1;
    ctx.font = "600 12px 'Segoe UI', 'Malgun Gothic', sans-serif";
    const bw = Math.max(26, ctx.measureText(u.text).width + 14);
    const bh = 19;
    ctx.fillStyle = ghost ? "#fbbf24" : "#4ade80";
    ctx.beginPath();
    ctx.roundRect(x - bw / 2, 2, bw, bh, 5);
    ctx.fill();
    ctx.fillStyle = "#0e1015";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(u.text, x, 2 + bh / 2 + 0.5);
    unitBlock = { x: x - bw / 2, y: 0, w: bw, h: bh + 4 };
    if (ghost) {
      ctx.fillStyle = "#fbbf24";
      ctx.textBaseline = "top";
      ctx.fillText(fmtTime(tSel), x, bh + 6);
    }
  } else {
    unitBlock = null;
  }
}

/* ---------------- lyrics rendering ---------------- */
function unitById(id) { return project?.units.find((u) => u.id === id); }
function unitIndex(id) { return project?.units.findIndex((u) => u.id === id); }

function renderLyrics() {
  const pane = $("#lyricsPane");
  pane.innerHTML = "";
  const linesById = Object.fromEntries(project.lines.map((l) => [l.id, l]));
  const unitsById = Object.fromEntries(project.units.map((u) => [u.id, u]));
  for (const sec of project.sections) {
    if (!sec.line_ids.length) continue;
    const h = document.createElement("div");
    h.className = "sec-header";
    h.innerHTML = `[${sec.name}] <span class="sec-hints">${(sec.hints || []).join(" · ")}</span>`;
    pane.appendChild(h);
    for (const lid of sec.line_ids) {
      const line = linesById[lid];
      if (!line) continue;   // stale ref after structural undo — skip safely
      const row = document.createElement("div");
      row.className = "line" + (line.adlib ? " adlib" : "");
      const first = unitsById[line.unit_ids[0]];
      const lt = document.createElement("span");
      lt.className = "line-time mono";
      lt.textContent = first?.start != null ? fmtTime(first.start) : "--:--";
      row.appendChild(lt);
      const addGap = (uid, before) => {
        const g = document.createElement("span");
        g.className = "gap";
        g.textContent = "+";
        g.title = t("btnAdd");
        g.onclick = (e) => { e.stopPropagation(); openInsertPop(e, uid, before); };
        row.appendChild(g);
      };
      line.unit_ids.forEach((uid, k) => {
        const u = unitsById[uid];
        if (!u) return;   // stale ref — skip safely
        if (k === 0) addGap(uid, true);
        const el = document.createElement("span");
        el.className = "unit";
        el.dataset.uid = uid;
        if (u.anchored) el.classList.add("anchored");
        if (u.conf === 0) el.classList.add("noalign");
        else if (u.conf != null && u.conf < 0.35) el.classList.add("lowconf");
        el.innerHTML = `<span class="t">${u.text}</span><span class="ts">${u.start != null ? u.start.toFixed(2) : "–"}</span>`;
        el.onclick = (e) => onUnitClick(uid, e);
        el.ondblclick = (e) => { e.preventDefault(); openEditPop(e.clientX, e.clientY, uid); };
        el.oncontextmenu = (e) => { e.preventDefault(); openCtxMenu(e, uid); };
        row.appendChild(el);
        addGap(uid, false);
      });
      pane.appendChild(row);
    }
  }
  refreshSelection();
}

// ids covered by the current shift-range selection (empty unless a range exists)
function rangeSelSet() {
  const i0 = unitIndex(selId), i1 = unitIndex(rangeId);
  if (i0 < 0 || i1 < 0) return new Set();
  const [a, b] = [Math.min(i0, i1), Math.max(i0, i1)];
  return new Set(project.units.slice(a, b + 1).map((u) => u.id));
}

function refreshSelection() {
  const i0 = unitIndex(selId), i1 = unitIndex(rangeId);
  const regionIds = (region && !(selId && rangeId))
    ? new Set(unitsInRegion().map((u) => u.id)) : new Set();
  document.querySelectorAll(".unit").forEach((el) => {
    el.classList.remove("selected", "inrange", "inregion");
    const uid = el.dataset.uid;
    const i = unitIndex(uid);
    if (uid === selId || uid === rangeId) el.classList.add("selected");
    else if (i0 >= 0 && i1 >= 0 && i > Math.min(i0, i1) && i < Math.max(i0, i1)) el.classList.add("inrange");
    else if (multiSel.has(uid) || regionIds.has(uid)) el.classList.add("inregion");
  });
  drawOverlay();
}

/* ---------------- unit clipboard (copy/paste on the waveform) ---------------- */
let unitClipboard = null;   // array of unit ids (resolved at paste time)

function currentSelectionIds() {
  if (multiSel.size) {
    return project.units.filter((u) => multiSel.has(u.id)).map((u) => u.id);
  }
  return selectedRangeUnits().map((u) => u.id);
}

function copySelection() {
  const ids = currentSelectionIds();
  if (!ids.length) { toast(t("toastSelectFirst")); return; }
  unitClipboard = ids;
  toast(t("toastUnitsCopied", { n: ids.length }));
}

async function pasteAt(time) {
  if (!unitClipboard || !unitClipboard.length) return;
  const ids = unitClipboard.filter((id) => unitById(id));
  if (!ids.length) { toast(t("toastNoUndo")); return; }
  snapshot();
  busy(t("busyAdd"));
  project = await api.post(`/api/projects/${project.id}/paste_units`,
    { unit_ids: ids, time: +time.toFixed(4) });
  busy("");
  renderLyrics();
  toast(t("toastPasted", { n: ids.length, time: fmtTime(time) }));
}

function clearSelection() {
  selId = null; rangeId = null;
  multiSel.clear();
  region = null; mselRange = null;
  beatSel = null;
  hideRegionBtn();
  refreshSelection();
  refreshBeatSel();
}

function onUnitClick(uid, e) {
  if (e.shiftKey && selId) {
    rangeId = uid;
  } else {
    // plain click = fresh single selection; drop any range/region/group leftovers
    selId = uid; rangeId = null;
    multiSel.clear();
    region = null; mselRange = null;
    hideRegionBtn();
    const u = unitById(uid);
    if (u?.start != null && ws) ws.setTime(u.start);
  }
  refreshSelection();
}

/* ---------------- beat view (lyrics/beats tabs) ---------------- */
let currentView = "lyrics";           // "lyrics" | "beats"
let beatSel = null;                   // {group, a, b} contiguous range in one group

function beatGroups() {
  const b = project?.beats || {};
  return [
    { key: "downbeats", label: t("grpDownbeats"), items: b.downbeats || [], cls: "b-down", hcls: "bg-down" },
    { key: "beats",     label: t("grpBeats"),     items: b.beats || [],     cls: "b-beat", hcls: "bg-beat" },
    { key: "kicks",     label: t("grpKicks"),     items: b.kicks || [],     cls: "b-kick", hcls: "bg-kick" },
  ];
}

function setView(view) {
  currentView = view;
  $("#tabLyrics").classList.toggle("toggled", view === "lyrics");
  $("#tabBeats").classList.toggle("toggled", view === "beats");
  $("#lyricsPane").style.display = view === "lyrics" ? "block" : "none";
  $("#beatPane").style.display = view === "beats" ? "block" : "none";
  if (view === "beats") renderBeats();
}
$("#tabLyrics").onclick = () => setView("lyrics");
$("#tabBeats").onclick = () => setView("beats");

function renderBeats() {
  const pane = $("#beatPane");
  pane.innerHTML = "";
  let any = false;
  for (const g of beatGroups()) {
    if (!g.items.length) continue;
    any = true;
    const h = document.createElement("div");
    h.className = `beat-group-header ${g.hcls}`;
    h.innerHTML = `${g.label} <span class="cnt">${g.items.length}</span>`;
    pane.appendChild(h);
    const row = document.createElement("div");
    row.className = "beat-row";
    g.items.forEach((time, i) => {
      const el = document.createElement("span");
      el.className = `beat ${g.cls}`;
      el.dataset.group = g.key;
      el.dataset.i = i;
      el.innerHTML = `<span class="n">${i + 1}</span><span class="ts">${time.toFixed(2)}</span>`;
      el.onclick = (e) => onBeatClick(g.key, i, time, e);
      row.appendChild(el);
    });
    pane.appendChild(row);
  }
  if (!any) {
    const d = document.createElement("div");
    d.className = "beat-empty";
    d.textContent = t("beatEmpty");
    pane.appendChild(d);
  }
  refreshBeatSel();
}

function onBeatClick(group, i, time, e) {
  if (e.shiftKey && beatSel && beatSel.group === group) {
    beatSel.b = i;
  } else {
    beatSel = { group, a: i, b: i };
    if (ws) ws.setTime(time);
  }
  refreshBeatSel();
}

function refreshBeatSel() {
  document.querySelectorAll(".beat").forEach((el) => {
    el.classList.remove("selected", "inrange");
    if (!beatSel || el.dataset.group !== beatSel.group) return;
    const i = +el.dataset.i;
    const [a, b] = [Math.min(beatSel.a, beatSel.b), Math.max(beatSel.a, beatSel.b)];
    if (i === beatSel.a || i === beatSel.b) el.classList.add("selected");
    else if (i > a && i < b) el.classList.add("inrange");
  });
}

function selectedBeats() {
  if (!beatSel) return null;
  const g = beatGroups().find((x) => x.key === beatSel.group);
  if (!g) return null;
  const [a, b] = [Math.min(beatSel.a, beatSel.b), Math.max(beatSel.a, beatSel.b)];
  return { group: g, times: g.items.slice(a, b + 1), from: a };
}

function copyBeatSelection() {
  const sel = selectedBeats();
  if (!sel || !sel.times.length) { toast(t("toastSelectFirst")); return null; }
  const fps = +$("#fpsInput").value || 30;
  const t0 = sel.times[0];
  const L = [
    `[LyricsSync] ${project.name} — ${sel.group.label}`,
    `${t("cpAbsStart")}: ${fmtTime(t0)} (${t0.toFixed(3)}s) · fps ${fps} · frame ${toFrames(t0, fps)}` +
      (project.beats?.bpm ? ` · BPM ${project.beats.bpm}` : ""),
    "",
    t("cpRel", { first: `#${sel.from + 1}` }),
  ];
  let row = [];
  sel.times.forEach((time, k) => {
    const rel = time - t0;
    row.push(`#${sel.from + k + 1} ${rel.toFixed(3)} (f${toFrames(rel, fps)})`);
    if (row.length === 6) { L.push(row.join("  ")); row = []; }
  });
  if (row.length) L.push(row.join("  "));
  return L.join("\n");
}

// playhead highlight in the beat pane (like karaoke for lyrics)
let lastBeatHi = { downbeats: -1, beats: -1, kicks: -1 };
function updateBeatPlayhead(tNow) {
  if (currentView !== "beats" || !project) return;
  for (const g of beatGroups()) {
    let cur = -1;
    for (let i = 0; i < g.items.length; i++) {
      if (g.items[i] <= tNow) cur = i;
      else break;
    }
    if (cur === lastBeatHi[g.key]) continue;
    const prev = document.querySelector(`.beat.playing[data-group="${g.key}"]`);
    prev?.classList.remove("playing");
    if (cur >= 0) {
      const el = document.querySelector(`.beat[data-group="${g.key}"][data-i="${cur}"]`);
      el?.classList.add("playing");
      if (g.key === "beats" && ws?.isPlaying() && beatsFollow.canFollow()) {
        beatsFollow.markProgrammatic();
        el?.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }
    lastBeatHi[g.key] = cur;
  }
}

/* auto-follow guard: pause playback auto-scroll while the user is scrolling */
function makeFollowGuard(pane) {
  const st = { holdUntil: 0, programmaticUntil: 0 };
  pane.addEventListener("scroll", () => {
    if (Date.now() > st.programmaticUntil) st.holdUntil = Date.now() + 4000;
  });
  return {
    canFollow: () => Date.now() > st.holdUntil,
    markProgrammatic: () => { st.programmaticUntil = Date.now() + 1000; },
  };
}
const lyricsFollow = makeFollowGuard($("#lyricsPane"));
const beatsFollow = makeFollowGuard($("#beatPane"));

/* ---------------- karaoke highlight ---------------- */
let lastPlayingEl = null;
let lastPlayingLine = null;
let lastKaraokeT = -1;

function updateKaraoke(t) {
  if (!project || Math.abs(t - lastKaraokeT) < 0.05) return;
  lastKaraokeT = t;
  // full scan (no early break): manual moves/pastes can leave the array
  // out of chronological order, which used to freeze the highlight
  let current = null;
  for (const u of project.units) {
    if (u.start == null || u.start > t) continue;
    if (current == null || u.start > current.start) current = u;
  }
  const el = current ? document.querySelector(`.unit[data-uid="${current.id}"]`) : null;
  if (el === lastPlayingEl) return;
  lastPlayingEl?.classList.remove("playing");
  if (el) {
    el.classList.add("playing");
    // passed/upcoming classes only when the current unit changes (cheap enough)
    let passed = true;
    document.querySelectorAll(".unit").forEach((e2) => {
      if (e2 === el) { passed = false; e2.classList.remove("passed"); return; }
      e2.classList.toggle("passed", passed);
    });
    const row = el.closest(".line");
    if (row !== lastPlayingLine && ws?.isPlaying()) {
      if (lyricsFollow.canFollow()) {
        lyricsFollow.markProgrammatic();
        row?.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      lastPlayingLine = row;
    }
  }
  lastPlayingEl = el;
}

/* ---------------- context menu / popovers ---------------- */
function hidePops() {
  $("#ctxMenu").style.display = "none";
  $("#insertPop").style.display = "none";
  $("#rangePop").style.display = "none";
  $("#editPop").style.display = "none";
}
document.addEventListener("click", (e) => {
  if (!e.target.closest(".insert-pop") && !e.target.closest(".ctx-menu")) hidePops();
});

function placePop(el, x, y) {
  el.style.display = "flex";
  el.style.left = Math.min(x, innerWidth - el.offsetWidth - 12) + "px";
  el.style.top = Math.min(y, innerHeight - el.offsetHeight - 12) + "px";
}

let insertCtx = null;
function openInsertPop(e, uid, before) {
  hidePops();
  insertCtx = { uid, before };
  placePop($("#insertPop"), e.clientX, e.clientY + 8);
  $("#insertText").value = "";
  $("#insertText").focus();
}
$("#insertOk").onclick = async () => {
  const text = $("#insertText").value.trim();
  if (!text || !insertCtx) return;
  hidePops();
  snapshot();
  busy(t("busyAdd"));
  project = await api.post(`/api/projects/${project.id}/insert`,
    { unit_id: insertCtx.uid, text, before: insertCtx.before });
  busy("");
  renderLyrics();
  toast(t("toastAdded", { text }));
};
$("#insertCancel").onclick = hidePops;
$("#insertText").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("#insertOk").click();
  if (e.key === "Escape") hidePops();
});

let editUid = null;
function openEditPop(x, y, uid) {
  const u = unitById(uid);
  if (!u) return;
  hidePops();
  editUid = uid;
  $("#editText").value = u.text;
  $("#editStart").value = u.start != null ? u.start.toFixed(3) : "";
  $("#editEnd").value = u.end != null ? u.end.toFixed(3) : "";
  placePop($("#editPop"), x, y + 10);
  $("#editStart").focus();
  $("#editStart").select();
}
$("#editOk").onclick = async () => {
  if (!editUid) return;
  const text = $("#editText").value.trim();
  const start = parseFloat($("#editStart").value);
  const end = parseFloat($("#editEnd").value);
  if (!text || isNaN(start) || isNaN(end)) { toast(t("toastSelectFirst")); return; }
  hidePops();
  snapshot();
  busy(t("busyRealign"));
  project = await api.post(`/api/projects/${project.id}/edit_unit`,
    { unit_id: editUid, text, start, end });
  busy("");
  renderLyrics();
  toast(t("editSaved", { text, time: fmtTime(start) }));
};
$("#editCancel").onclick = hidePops;
$("#editPop").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("#editOk").click();
  if (e.key === "Escape") hidePops();
});

let rangeCtx = null;
function openRangePop(x, y, uid, direction) {
  rangeCtx = { uid, direction };
  $("#rangeLabel").textContent = direction === "after" ? t("dirAfter") : t("dirBefore");
  placePop($("#rangePop"), x, y);
  $("#rangeSec").focus();
}
$("#rangeOk").onclick = async () => {
  if (!rangeCtx) return;
  const sec = +$("#rangeSec").value || 10;
  hidePops();
  await doRealignRange(rangeCtx.uid, rangeCtx.direction, sec);
};
$("#rangeCancel").onclick = hidePops;

async function doRealignRange(uid, direction, seconds) {
  snapshot();
  busy(t("busyRealign"));
  project = await api.post(`/api/projects/${project.id}/realign_range`,
    { unit_id: uid, direction, seconds });
  busy("");
  renderLyrics();
  const key = direction === "after"
    ? (seconds ? "toastReAfterSec" : "toastReAfterAll")
    : (seconds ? "toastReBeforeSec" : "toastReBeforeAll");
  toast(t(key, { sec: seconds }));
}

function openCtxMenu(e, uid) {
  hidePops();
  // right-clicking inside an existing multi/range selection keeps it
  // (so "select 7 units -> right-click -> copy" works)
  if (!currentSelectionIds().includes(uid)) {
    selId = uid; rangeId = null;
  }
  refreshSelection();
  const u = unitById(uid);
  const m = $("#ctxMenu");
  const nSel = Math.max(1, currentSelectionIds().length);
  const items = [
    { label: "▶ " + t("ctxPlay"), act: () => { if (u.start != null) { ws.setTime(u.start); ws.play(); } } },
    { label: "📋 " + t("ctxCopy", { n: nSel }), hint: "Ctrl+C", act: () => {
        if (!currentSelectionIds().length) { selId = uid; rangeId = null; }
        copySelection();
      } },
    { sep: true },
    { label: "↻ " + t("ctxAfter"), hint: t("hintAfter"), act: () => doRealignRange(uid, "after", null) },
    { label: "↺ " + t("ctxBefore"), hint: t("hintBefore"), act: () => doRealignRange(uid, "before", null) },
    { label: "◔ " + t("ctxAfterN"), act: (ev) => openRangePop(ev.clientX, ev.clientY, uid, "after") },
    { label: "◕ " + t("ctxBeforeN"), act: (ev) => openRangePop(ev.clientX, ev.clientY, uid, "before") },
    { sep: true },
  ];
  if (project.anchors[uid] != null) {
    items.push({ label: "⚓ " + t("ctxAnchorClear"), act: () => clearAnchor(uid) });
  } else {
    items.push({ label: "⚓ " + t("ctxAnchor"), hint: "A", act: () => setAnchor(uid, ws.getCurrentTime()) });
  }
  items.push({ label: "✕ " + t("ctxDelete"), danger: true, act: () => doDeleteUnit(uid) });

  m.innerHTML = "";
  for (const it of items) {
    if (it.sep) {
      const s = document.createElement("div");
      s.className = "ctx-sep";
      m.appendChild(s);
      continue;
    }
    const d = document.createElement("div");
    d.className = "ctx-item" + (it.danger ? " danger" : "");
    d.innerHTML = it.label + (it.hint ? `<span class="ctx-hint">${it.hint}</span>` : "");
    d.onclick = (ev) => { m.style.display = "none"; it.act(ev); };
    m.appendChild(d);
  }
  placePop(m, e.clientX, e.clientY);
  m.style.display = "block";
}

async function doDeleteUnit(uid) {
  snapshot();
  busy(t("busyDel"));
  project = await api.post(`/api/projects/${project.id}/delete_unit`, { unit_id: uid });
  busy("");
  if (selId === uid) selId = null;
  if (rangeId === uid) rangeId = null;
  multiSel.delete(uid);
  if (unitClipboard) unitClipboard = unitClipboard.filter((id) => id !== uid);
  renderLyrics();
  toast(t("toastDeleted"));
}

/* ---------------- anchors ---------------- */
function snapshot() {
  undoStack.push({
    units_full: structuredClone(project.units),
    lines: structuredClone(project.lines),
    sections: structuredClone(project.sections),
    anchors: { ...project.anchors },
  });
  if (undoStack.length > 30) undoStack.shift();
}

async function setAnchor(uid, time) {
  snapshot();
  busy(t("busyAnchor"));
  project = await api.post(`/api/projects/${project.id}/anchor`, { unit_id: uid, time });
  busy("");
  renderLyrics();
  toast(t("toastAnchorSet", { text: unitById(uid).text, time: fmtTime(time) }));
}

async function clearAnchor(uid) {
  snapshot();
  busy(t("busyRealign"));
  project = await api.post(`/api/projects/${project.id}/anchor/clear`, { unit_id: uid });
  busy("");
  renderLyrics();
  toast(t("toastAnchorCleared"));
}

async function undo() {
  const snap = undoStack.pop();
  if (!snap) { toast(t("toastNoUndo")); return; }
  busy(t("busyUndo"));
  project = await api.post(`/api/projects/${project.id}/restore`, snap);
  busy("");
  renderLyrics();
}

/* ---------------- copy / export ---------------- */
function fmtTime(t) {
  const m = Math.floor(t / 60), s = t - m * 60;
  return `${m}:${s.toFixed(3).padStart(6, "0")}`;
}
function toFrames(t, fps) { return Math.round(t * fps); }

function selectedRangeUnits() {
  let i0 = unitIndex(selId), i1 = unitIndex(rangeId ?? selId);
  if (i0 < 0) return [];
  if (i1 < 0) i1 = i0;
  const [a, b] = [Math.min(i0, i1), Math.max(i0, i1)];
  return project.units.slice(a, b + 1);
}

$("#btnCopy").onclick = async () => {
  if (currentView === "beats") {
    const text = copyBeatSelection();
    if (text) {
      await navigator.clipboard.writeText(text);
      toast(t("toastCopied"));
    }
    return;
  }
  // works with either a shift-range or a multi-select marquee
  const ids = new Set(currentSelectionIds());
  const units = project.units.filter((u) => ids.has(u.id) && u.start != null);
  if (!units.length) { toast(t("toastSelectFirst")); return; }
  const fps = +$("#fpsInput").value || 30;
  const t0 = units[0].start;
  const lines = [
    `[LyricsSync] ${project.name}`,
    `${t("cpRange")}: ${units[0].text} … ${units[units.length - 1].text}`,
    `${t("cpAbsStart")}: ${fmtTime(t0)} (${t0.toFixed(3)}s) · fps ${fps} · frame ${toFrames(t0, fps)}`,
    project.beats?.bpm ? `BPM: ${project.beats.bpm}` : "",
    ``,
    t("cpRel", { first: units[0].text }),
  ];
  let curLine = null;
  let row = [];
  for (const u of units) {
    if (u.line_id !== curLine) {
      if (row.length) lines.push(row.join("  "));
      row = []; curLine = u.line_id;
    }
    const rel = u.start - t0;
    row.push(`${u.text} ${rel.toFixed(3)} (f${toFrames(rel, fps)})`);
  }
  if (row.length) lines.push(row.join("  "));
  const text = lines.filter((l) => l !== "").join("\n");
  await navigator.clipboard.writeText(text);
  toast(t("toastCopied"));
};

$("#btnCopyLyrics").onclick = async () => {
  await navigator.clipboard.writeText(project.lyrics_raw || "");
  toast(project.auto_lyrics ? t("toastLyricsAuto") : t("toastLyrics"));
};

/* ---------------- export formats ---------------- */
function pad2(n) { return String(n).padStart(2, "0"); }
function fmtSrtTime(sec) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60), ms = Math.round((sec % 1) * 1000);
  return `${pad2(h)}:${pad2(m)}:${pad2(s)},${String(ms).padStart(3, "0")}`;
}
function fmtLrcTime(sec) {
  const m = Math.floor(sec / 60), s = sec - m * 60;
  return `${pad2(m)}:${s.toFixed(2).padStart(5, "0")}`;
}

function exportLines() {
  const unitsById = Object.fromEntries(project.units.map((u) => [u.id, u]));
  const out = [];
  for (const sec of project.sections) {
    for (const lid of sec.line_ids) {
      const line = project.lines.find((l) => l.id === lid);
      if (!line) continue;
      const us = line.unit_ids.map((id) => unitsById[id]).filter((u) => u && u.start != null);
      if (!us.length) continue;
      out.push({ section: sec.name, line, units: us,
                 start: us[0].start, end: us[us.length - 1].end ?? us[us.length - 1].start + 0.3 });
    }
  }
  return out;
}

function genTXT() {
  const fps = +$("#fpsInput").value || 30;
  const L = [`LyricsSync — ${project.name}`,
             `BPM ${project.beats?.bpm ?? "?"} · fps ${fps} · ${fmtTime(project.duration || 0)}`, ""];
  let curSec = null;
  for (const row of exportLines()) {
    if (row.section !== curSec) {
      curSec = row.section;
      L.push(`[${curSec}]`);
    }
    L.push(`${fmtTime(row.start)}  ${row.line.text}`);
    L.push("    " + row.units.map((u) =>
      `${u.text} ${fmtTime(u.start)} (f${toFrames(u.start, fps)})`).join("  "));
    L.push("");
  }
  // beats appendix — lyrics + drums in one file for AE/LLM workflows
  const bg = beatGroups().filter((g) => g.items.length);
  if (bg.length) {
    L.push(`=== ${t("tabBeats")} ===`);
    for (const g of bg) {
      L.push("", `[${g.label}] ${g.items.length}`);
      let row = [];
      g.items.forEach((time, i) => {
        row.push(`#${i + 1} ${fmtTime(time)} (f${toFrames(time, fps)})`);
        if (row.length === 6) { L.push(row.join("  ")); row = []; }
      });
      if (row.length) L.push(row.join("  "));
    }
  }
  return L.join("\n");
}

function genSRT() {
  const rows = exportLines();
  return rows.map((row, i) =>
    `${i + 1}\n${fmtSrtTime(row.start)} --> ${fmtSrtTime(Math.max(row.end, row.start + 0.5))}\n${row.line.text}\n`
  ).join("\n");
}

function genLRC() {
  const L = [`[ti:${project.name}]`, `[tool:LyricsSync]`];
  if (project.beats?.bpm) L.push(`[bpm:${project.beats.bpm}]`);
  for (const row of exportLines()) {
    L.push(`[${fmtLrcTime(row.start)}]` +
      row.units.map((u) => `<${fmtLrcTime(u.start)}>${u.text}`).join(" "));
  }
  return L.join("\n");
}

function genExport(fmt) {
  if (fmt === "txt") return genTXT();
  if (fmt === "srt") return genSRT();
  if (fmt === "lrc") return genLRC();
  return JSON.stringify(project, null, 1);
}

function refreshExportPreview() {
  $("#exportPreview").textContent = genExport($("#exportFmt").value);
}

$("#btnExport").onclick = () => {
  refreshExportPreview();
  $("#exportModal").style.display = "flex";
};
$("#exportFmt").onchange = refreshExportPreview;
$("#exportClose").onclick = () => { $("#exportModal").style.display = "none"; };
$("#exportModal").addEventListener("click", (e) => {
  if (e.target.id === "exportModal") $("#exportModal").style.display = "none";
});
$("#exportCopy").onclick = async () => {
  await navigator.clipboard.writeText(genExport($("#exportFmt").value));
  toast(t("toastCopied"));
};
$("#exportSave").onclick = async () => {
  const fmt = $("#exportFmt").value;
  const path = await window.pywebview?.api.save_text(
    genExport(fmt), `${project.id}_lyrics.${fmt}`);
  if (path) toast(t("exported") + path, 3500);
};

$("#fpsInput").onchange = () => {
  project.fps = +$("#fpsInput").value || 30;
  api.post(`/api/projects/${project.id}/fps`, { fps: project.fps }).catch(() => {});
};

// keep the overlay in sync when the window is resized
window.addEventListener("resize", () => {
  if (project && $("#editor").style.display !== "none") drawOverlay();
});

/* ---------------- keys ---------------- */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && $("#helpModal").style.display !== "none") {
    $("#helpModal").style.display = "none";
    return;
  }
  if (e.key === "Escape" && $("#exportModal").style.display !== "none") {
    $("#exportModal").style.display = "none";
    return;
  }
  if ($("#editor").style.display === "none") return;
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
  if (e.code === "Space") { e.preventDefault(); ws?.playPause(); }
  else if (e.key === "Escape") {
    // first Esc closes any open popup, second clears the selection
    const popOpen = ["#ctxMenu", "#insertPop", "#rangePop", "#editPop"]
      .some((s) => $(s).style.display !== "none");
    hidePops();
    if (!popOpen) clearSelection();
  }
  else if ((e.key === "a" || e.key === "A") && !e.ctrlKey && !e.altKey && !e.metaKey) {
    if (selId && ws) setAnchor(selId, ws.getCurrentTime());
  }
  else if (e.ctrlKey && (e.key === "z" || e.key === "Z")) { e.preventDefault(); undo(); }
  else if (e.ctrlKey && (e.key === "c" || e.key === "C")) {
    if (selId || multiSel.size) { e.preventDefault(); copySelection(); }
  }
  else if (e.ctrlKey && (e.key === "v" || e.key === "V")) {
    if (unitClipboard?.length && ws) { e.preventDefault(); pasteAt(ws.getCurrentTime()); }
  }
});

// right-click on the waveform: unit menu on a chip, paste menu elsewhere
waveWrap.addEventListener("contextmenu", (e) => {
  if (!ws || !project) return;
  e.preventDefault();
  const p = wrapPos(e);
  const hit = showWaveLyrics && [...labelBoxes].reverse().find((b) =>
    p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h);
  if (hit) { openCtxMenu(e, hit.uid); return; }
  if (!unitClipboard || !unitClipboard.length) return;
  const at = clickTime(e);
  if (at == null) return;
  hidePops();
  const m = $("#ctxMenu");
  m.innerHTML = "";
  const d = document.createElement("div");
  d.className = "ctx-item";
  d.innerHTML = "📋 " + t("ctxPaste", { n: unitClipboard.length, time: fmtTime(at) }) +
    '<span class="ctx-hint">Ctrl+V</span>';
  d.onclick = () => { m.style.display = "none"; pasteAt(at); };
  m.appendChild(d);
  placePop(m, e.clientX, e.clientY);
  m.style.display = "block";
});

/* ---------------- waveform lyric labels toggle ---------------- */
let showWaveLyrics = localStorage.getItem("lyricssync_wavelyrics") === "1";
const btnWaveLyrics = $("#btnWaveLyrics");
function syncWaveLyricsBtn() {
  btnWaveLyrics.classList.toggle("toggled", showWaveLyrics);
  btnWaveLyrics.title = t("waveLyricsTip");
  $("#multiWrap").style.display = showWaveLyrics ? "inline-flex" : "none";
  if (!showWaveLyrics) {
    multiMode = false;
    $("#multiChk").checked = false;
    multiSel.clear();
  }
}
btnWaveLyrics.onclick = () => {
  showWaveLyrics = !showWaveLyrics;
  localStorage.setItem("lyricssync_wavelyrics", showWaveLyrics ? "1" : "0");
  syncWaveLyricsBtn();
  if (project) refreshSelection(); else drawOverlay();
};
syncWaveLyricsBtn();

$("#multiChk").onchange = () => {
  multiMode = $("#multiChk").checked;
  if (!multiMode) { multiSel.clear(); mselRange = null; }
  if (project) refreshSelection(); else drawOverlay();
};

/* ---------------- custom number spinners ---------------- */
function fancySpinner(input) {
  const wrap = document.createElement("span");
  wrap.className = "num-wrap";
  input.parentNode.insertBefore(wrap, input);
  wrap.appendChild(input);
  const btns = document.createElement("span");
  btns.className = "num-btns";
  const mk = (txt, fn) => {
    const b = document.createElement("button");
    b.type = "button";
    b.tabIndex = -1;
    b.textContent = txt;
    b.onclick = () => { fn(); input.dispatchEvent(new Event("change")); };
    btns.appendChild(b);
  };
  mk("▲", () => input.stepUp());
  mk("▼", () => input.stepDown());
  wrap.appendChild(btns);
}
fancySpinner($("#fpsInput"));
fancySpinner($("#rangeSec"));

/* ---------------- language / help ---------------- */
const langSel = $("#langSel");
for (const [code, dict] of Object.entries(I18N)) {
  const o = document.createElement("option");
  o.value = code;
  o.textContent = dict.langName;
  langSel.appendChild(o);
}
langSel.value = LANG;
langSel.onchange = () => {
  setLang(langSel.value);
  renderSystem();
  syncWaveLyricsBtn();
  loadProjects();
  if (project && $("#editor").style.display !== "none") renderLyrics();
};

function openHelp() {
  $("#helpBody").innerHTML = t("help");
  $("#helpModal").style.display = "flex";
}
$("#btnHelpHome").onclick = openHelp;
$("#btnHelpEditor").onclick = openHelp;
$("#helpClose").onclick = () => { $("#helpModal").style.display = "none"; };
$("#helpModal").addEventListener("click", (e) => {
  if (e.target.id === "helpModal") $("#helpModal").style.display = "none";
});

/* ---------------- boot ---------------- */
applyI18n();
loadProjects();

let sysInfo = null;
function renderSystem() {
  const el = $("#sysDevice");
  if (!sysInfo) return;
  if (sysInfo.device === "cuda") {
    el.textContent = t("sysAccel", { gpu: sysInfo.gpu, vram: sysInfo.vram_gb });
    el.classList.remove("cpu");
  } else {
    el.textContent = t("sysNoAccel");
    el.classList.add("cpu");
  }
}
api.get("/api/system").then((s) => { sysInfo = s; renderSystem(); }).catch(() => {});

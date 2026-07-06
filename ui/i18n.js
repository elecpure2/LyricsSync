/* LyricsSync UI translations (8 languages) */
"use strict";

window.I18N = {
/* ---------------- 한국어 ---------------- */
ko: {
  langName: "한국어",
  projects: "프로젝트", newProject: "새 프로젝트",
  lblName: "프로젝트 이름", phName: "예: Half Step Down",
  lblAudio: "음원 파일", btnPick: "파일 선택…", dropHint: "또는 여기로 드래그 앤 드랍",
  lblSongLang: "노래 언어 (가사 자동 추출 시 사용 — 가사를 직접 넣으면 무시돼요)",
  optAuto: "자동 감지",
  lblLyrics: "가사 (태그 포함 그대로 붙여넣기 — 비워두면 AI가 자동 추출)",
  phLyrics: "[Intro]\n컵 안의 파문이\n...\n\n※ 비워두고 분석을 시작하면 Whisper가 보컬에서 가사를 자동으로 받아써요.",
  btnStart: "분석 시작", noProjects: "아직 프로젝트가 없어요.",
  deleteProj: "프로젝트 삭제",
  confirmDelete: '"{name}" 프로젝트를 완전히 삭제할까요? (음원 사본·분석 데이터 모두 삭제, 되돌릴 수 없음)',
  toastProjDeleted: "프로젝트 삭제 완료",
  stReady: "완료", stAnalyzing: "분석 중…", stCreated: "대기", stError: "오류",
  needNameFile: "이름과 음원 파일은 꼭 필요해!",
  creating: "프로젝트 생성 중...", creatingAuto: "프로젝트 생성 중... (가사 자동 추출 모드)",
  analyzingWait: "분석 중... 잠시만 기다려줘 (첫 실행은 모델 다운로드 때문에 오래 걸릴 수 있어)",
  analyzingStage: "분석 중", analysisErr: "분석 오류:",
  sysAccel: "가속: {gpu} ({vram}GB)", sysNoAccel: "가속: 없음 — CPU 모드 (느림)",
  sysRecommend: "NVIDIA GPU(VRAM 6GB+) 권장 — GPU가 없어도 CPU로 동작하지만 분석이 10배 이상 느려요",
  sysFirstRun: "첫 실행 시 AI 모델 다운로드(약 4GB)가 진행돼요",
  btnHome: "← 홈", stemSource: "원곡", stemVocals: "보컬만", stemDrums: "드럼만",
  waveLyricsTip: "파형에 가사 표시 켜기/끄기 (영어는 첫 글자만)",
  tabLyrics: "가사", tabBeats: "비트",
  grpDownbeats: "다운비트 (마디 시작)", grpBeats: "비트", grpKicks: "킥 (드럼)",
  beatEmpty: "비트 데이터가 없어요 — 분석이 완료된 프로젝트인지 확인해주세요.",
  multiSel: "다중선택",
  toastMultiSel: "{n}글자 선택됨 — 선택 영역을 잡고 드래그하면 같이 이동",
  toastGroupMoved: "{n}글자 함께 이동 완료 ({sec}s)",
  zoom: "확대", btnCopyRange: "구간 복사", btnCopyLyrics: "가사 복사", btnExport: "JSON 내보내기",
  hintbar: "클릭: 이동/선택 · Shift+클릭: 범위 선택 · <b>A</b>: 앵커 · Alt+파형 클릭: 그 위치에 앵커 · <b>파형 드래그: 구간 재분석</b> · 우클릭: 재정렬 메뉴 · 글자 사이 +: 가사 추가 · Ctrl+Z: 되돌리기",
  ctxPlay: "여기부터 재생",
  ctxCopy: "복사 ({n}글자)",
  ctxPaste: "여기에 붙여넣기 ({n}글자 → {time})",
  toastUnitsCopied: "{n}글자 복사됨 — 파형에서 원하는 위치에 우클릭 또는 재생바 두고 Ctrl+V",
  toastPasted: "{n}글자 붙여넣기 완료 → {time} (간격 유지)",
  ctxAfter: "여기서 뒤로 재정렬", hintAfter: "다음 앵커/끝까지",
  ctxBefore: "여기서 앞으로 재정렬", hintBefore: "이전 앵커/처음까지",
  ctxAfterN: "뒤로 N초만 재정렬…", ctxBeforeN: "앞으로 N초만 재정렬…",
  ctxAnchor: "현재 재생 위치에 앵커", ctxAnchorClear: "앵커 해제", ctxDelete: "이 글자 삭제",
  regionSel: "이 구간에 재분석 (선택한 {n}글자)", regionAll: "이 구간 재분석 ({n}글자)",
  toastRegionInfo: "재분석 완료: {n}글자 · 신뢰도 {conf} · 기준: {src}",
  src_vocals: "보컬 스템", src_mix: "원곡", src_uniform: "균등 배치(정렬 실패)",
  phInsert: "추가할 가사 (예: 아 아아아아)", btnAdd: "추가", btnCancel: "취소",
  editText: "가사", editStart: "시작(초)", editEnd: "끝(초)", btnSave: "저장",
  editSaved: '"{text}" 수정 완료 → {time}',
  btnRealign: "재정렬", secUnit: "초", dirAfter: "여기서 뒤로", dirBefore: "여기서 앞으로",
  busyRealign: "파형에 맞춰 재정렬 중...", busyAnchor: "앵커 기준 재정렬 중...",
  busyAdd: "가사 추가 + 주변 재정렬 중...", busyDel: "삭제 중...",
  busyRegion: "선택 구간 재분석 중...", busyUndo: "되돌리는 중...",
  toastAnchorSet: '"{text}" → {time} 앵커 · 주변 재정렬 완료', toastAnchorCleared: "앵커 해제됨",
  toastAdded: '"{text}" 추가 완료 — 타이밍이 어긋나면 우클릭 재정렬로 다듬어줘',
  toastDeleted: "삭제됨 (Ctrl+Z로 되돌리기 가능)",
  toastUnitMoved: '"{text}" → {time} 이동 완료 (앞뒤 재정렬은 우클릭 메뉴에서)',
  toastReAfterSec: "뒤로 {sec}초 재정렬 완료", toastReBeforeSec: "앞으로 {sec}초 재정렬 완료",
  toastReAfterAll: "뒤 전체 재정렬 완료 (앵커/곡 경계까지)", toastReBeforeAll: "앞 전체 재정렬 완료 (앵커/곡 경계까지)",
  toastRegionDone: "{t0} ~ {t1} 구간 재분석 완료",
  toastCopied: "구간 타임코드 복사 완료! 그대로 붙여넣으면 돼",
  toastLyricsAuto: "자동 추출된 가사 복사됨 — 교정해서 새 프로젝트로 만들면 더 정확해져",
  toastLyrics: "가사 복사됨",
  toastSelectFirst: "먼저 글자를 클릭(또는 Shift+클릭으로 범위)해서 선택해줘",
  toastNoUndo: "되돌릴 게 없어", toastNotAudio: "오디오 파일이 아니야!",
  toastUploading: "파일 업로드 중...", toastUploaded: "업로드 완료", toastUploadFail: "업로드 실패",
  exported: "내보냄: ",
  exportTitle: "내보내기 — 미리보기", copyText: "복사", saveFile: "파일로 저장", cpRange: "구간", cpAbsStart: "절대 시작", cpRel: "상대 타임코드 ({first} = 0.000):",
  helpTitle: "사용 방법",
  help: `<ol>
<li><b>새 프로젝트</b>: 이름 + 음원(드래그 앤 드랍 가능) + 가사를 넣고 분석 시작. <b>가사를 비워두면 AI(Whisper)가 자동으로 추출</b>해요.</li>
<li><b>자동 분석</b>: 보컬 분리(BS-RoFormer) → 글자 단위 강제 정렬(MMS) → BPM/비트/킥 분석. 한국어·영어·일본어·중국어·러시아어 등 대부분의 언어를 지원해요.</li>
<li><b>노래방 하이라이트</b>: 재생하면 현재 글자가 빛나요. 어긋난 부분을 찾는 가장 빠른 방법!</li>
<li><b>앵커 교정</b>: 글자 클릭 → 그 글자가 들리는 순간 <b>A</b> 키 (또는 Alt+파형 클릭). 앵커 앞뒤가 파형에 맞춰 자동 재정렬돼요. 큰 것부터 잡으면 작은 것들이 수렴!</li>
<li><b>우클릭 메뉴</b>: 여기서 뒤로/앞으로 전체 재정렬, N초만 재정렬, 글자 삭제.</li>
<li><b>파형 드래그</b>: 파형에서 구간을 드래그 → "이 구간 재분석". 가사를 먼저 선택(클릭→Shift+클릭)하고 드래그하면 그 글자들을 그 구간에 강제 배치해요. 정렬기가 통째로 놓친 부분에 최고!</li>
<li><b>가사 추가</b>: 글자 사이에 마우스를 올리면 + 버튼 → 빠진 가사 입력.</li>
<li><b>구간 복사</b>: 글자 클릭 → Shift+클릭 범위 → "구간 복사". 절대 시작시간 + 상대 타임코드(첫 글자=0) + 프레임 번호가 복사돼요 (fps 변경 가능).</li>
<li><b>타임코드 힌트</b>: 가사에 <b>[Chorus @ 1:23]</b>처럼 태그에 시간을 적거나 줄 사이에 <b>@1:23</b> 한 줄을 넣으면, 첫 분석 때 그 지점 근처(±3초)에서 해당 파트를 찾아요. 어림값이어도 정확도가 크게 올라가요!</li>
<li><b>Ctrl+Z</b>: 모든 편집을 되돌릴 수 있어요. <b>Space</b>: 재생/정지.</li>
</ol>
<p style="color:var(--dim)">💡 일본어 한자 가사는 중국식 발음으로 로마자화되어 정확도가 약간 떨어질 수 있어요. 히라가나/가타카나 표기를 쓰면 더 정확해요.</p>`,
},

/* ---------------- English ---------------- */
en: {
  langName: "English",
  projects: "Projects", newProject: "New Project",
  lblName: "Project name", phName: "e.g. Half Step Down",
  lblAudio: "Audio file", btnPick: "Choose file…", dropHint: "or drag & drop here",
  lblSongLang: "Song language (for auto-lyrics only — ignored when lyrics are provided)",
  optAuto: "Auto-detect",
  lblLyrics: "Lyrics (paste as-is with tags — leave empty for AI auto-extraction)",
  phLyrics: "[Intro]\nYour lyrics here\n...\n\n※ Leave empty and Whisper will transcribe the lyrics from the vocals.",
  btnStart: "Start Analysis", noProjects: "No projects yet.",
  deleteProj: "Delete project",
  confirmDelete: 'Delete project "{name}" completely? (removes audio copy & analysis data, cannot be undone)',
  toastProjDeleted: "Project deleted",
  stReady: "Ready", stAnalyzing: "Analyzing…", stCreated: "Pending", stError: "Error",
  needNameFile: "Name and audio file are required!",
  creating: "Creating project...", creatingAuto: "Creating project... (auto-lyrics mode)",
  analyzingWait: "Analyzing... please wait (first run downloads models and takes longer)",
  analyzingStage: "Analyzing", analysisErr: "Analysis error:",
  sysAccel: "Acceleration: {gpu} ({vram}GB)", sysNoAccel: "Acceleration: none — CPU mode (slow)",
  sysRecommend: "NVIDIA GPU (6GB+ VRAM) recommended — works on CPU too, but 10x+ slower",
  sysFirstRun: "First run downloads AI models (~4GB)",
  btnHome: "← Home", stemSource: "Original", stemVocals: "Vocals", stemDrums: "Drums",
  waveLyricsTip: "Toggle lyric labels on the waveform (first letter only for words)",
  tabLyrics: "Lyrics", tabBeats: "Beats",
  grpDownbeats: "Downbeats (bar starts)", grpBeats: "Beats", grpKicks: "Kicks (drums)",
  beatEmpty: "No beat data — make sure the project finished analyzing.",
  multiSel: "Multi-select",
  toastMultiSel: "{n} units selected — drag the selection to move them together",
  toastGroupMoved: "Moved {n} units together ({sec}s)",
  zoom: "Zoom", btnCopyRange: "Copy Range", btnCopyLyrics: "Copy Lyrics", btnExport: "Export JSON",
  hintbar: "Click: seek/select · Shift+click: range · <b>A</b>: anchor · Alt+click waveform: anchor there · <b>Drag waveform: re-analyze region</b> · Right-click: realign menu · + between chars: insert lyrics · Ctrl+Z: undo",
  ctxPlay: "Play from here",
  ctxCopy: "Copy ({n} units)",
  ctxPaste: "Paste here ({n} units → {time})",
  toastUnitsCopied: "{n} units copied — right-click the waveform or set the playhead and Ctrl+V",
  toastPasted: "Pasted {n} units → {time} (spacing preserved)",
  ctxAfter: "Realign forward from here", hintAfter: "to next anchor/end",
  ctxBefore: "Realign backward from here", hintBefore: "to prev anchor/start",
  ctxAfterN: "Realign next N seconds…", ctxBeforeN: "Realign previous N seconds…",
  ctxAnchor: "Anchor at playhead", ctxAnchorClear: "Remove anchor", ctxDelete: "Delete this unit",
  regionSel: "Re-align into this region ({n} selected)", regionAll: "Re-analyze this region ({n} units)",
  toastRegionInfo: "Re-analyzed: {n} units · confidence {conf} · source: {src}",
  src_vocals: "vocal stem", src_mix: "original mix", src_uniform: "even spread (alignment failed)",
  phInsert: "Lyrics to insert (e.g. ah ah-ah)", btnAdd: "Add", btnCancel: "Cancel",
  editText: "Text", editStart: "Start(s)", editEnd: "End(s)", btnSave: "Save",
  editSaved: '"{text}" saved → {time}',
  btnRealign: "Realign", secUnit: "sec", dirAfter: "forward", dirBefore: "backward",
  busyRealign: "Realigning to waveform...", busyAnchor: "Realigning around anchor...",
  busyAdd: "Inserting + realigning...", busyDel: "Deleting...",
  busyRegion: "Re-analyzing region...", busyUndo: "Undoing...",
  toastAnchorSet: '"{text}" → {time} anchored · neighbors realigned', toastAnchorCleared: "Anchor removed",
  toastAdded: '"{text}" added — fine-tune with right-click realign if needed',
  toastDeleted: "Deleted (Ctrl+Z to undo)",
  toastUnitMoved: '"{text}" moved to {time} (right-click to realign neighbors)',
  toastReAfterSec: "Realigned {sec}s forward", toastReBeforeSec: "Realigned {sec}s backward",
  toastReAfterAll: "Realigned forward (to anchor/end)", toastReBeforeAll: "Realigned backward (to anchor/start)",
  toastRegionDone: "Region {t0} ~ {t1} re-analyzed",
  toastCopied: "Range timecodes copied!",
  toastLyricsAuto: "Auto-extracted lyrics copied — fix typos and create a new project for best accuracy",
  toastLyrics: "Lyrics copied",
  toastSelectFirst: "Select a unit first (click, or Shift+click for a range)",
  toastNoUndo: "Nothing to undo", toastNotAudio: "Not an audio file!",
  toastUploading: "Uploading...", toastUploaded: "Uploaded", toastUploadFail: "Upload failed",
  exported: "Exported: ",
  exportTitle: "Export — Preview", copyText: "Copy", saveFile: "Save to File", cpRange: "Range", cpAbsStart: "Absolute start", cpRel: "Relative timecodes ({first} = 0.000):",
  helpTitle: "How to Use",
  help: `<ol>
<li><b>New project</b>: name + audio (drag & drop OK) + lyrics, then Start. <b>Leave lyrics empty and Whisper auto-transcribes them.</b></li>
<li><b>Auto analysis</b>: vocal separation (BS-RoFormer) → per-character forced alignment (MMS) → BPM/beats/kicks. Works for Korean, English, Japanese, Chinese, Russian and most languages.</li>
<li><b>Karaoke highlight</b>: the current character glows during playback — fastest way to spot misalignments.</li>
<li><b>Anchors</b>: click a character, press <b>A</b> the moment you hear it (or Alt+click the waveform). Neighbors realign automatically; fix big errors first and small ones converge.</li>
<li><b>Right-click menu</b>: realign forward/backward fully, or only N seconds; delete units.</li>
<li><b>Waveform drag</b>: drag a region → "Re-analyze". Select lyrics first (click → Shift+click) to force them into that region — perfect when the aligner skipped a part.</li>
<li><b>Insert lyrics</b>: hover between characters → + button.</li>
<li><b>Copy Range</b>: select a range → "Copy Range" for absolute start + zero-based relative timecodes + frame numbers (fps configurable).</li>
<li><b>Timecode hints</b>: write <b>[Chorus @ 1:23]</b> in a tag or a standalone <b>@1:23</b> line in the lyrics — the first analysis searches near that point (±3s). Even rough guesses boost accuracy a lot!</li>
<li><b>Ctrl+Z</b> undoes every edit. <b>Space</b> = play/pause.</li>
</ol>
<p style="color:var(--dim)">💡 Japanese kanji lyrics are romanized with Chinese readings, slightly reducing accuracy — kana spelling works better.</p>`,
},

/* ---------------- 日本語 ---------------- */
ja: {
  langName: "日本語",
  projects: "プロジェクト", newProject: "新規プロジェクト",
  lblName: "プロジェクト名", phName: "例: Half Step Down",
  lblAudio: "音源ファイル", btnPick: "ファイルを選択…", dropHint: "またはここにドラッグ＆ドロップ",
  lblSongLang: "曲の言語（歌詞自動抽出用 — 歌詞入力時は無視されます）",
  optAuto: "自動検出",
  lblLyrics: "歌詞（タグごとそのまま貼り付け — 空欄ならAIが自動抽出）",
  phLyrics: "[Intro]\n歌詞をここに\n...\n\n※ 空欄のまま分析を開始すると、Whisperがボーカルから歌詞を自動で書き起こします。",
  btnStart: "分析開始", noProjects: "プロジェクトはまだありません。",
  deleteProj: "プロジェクトを削除",
  confirmDelete: '"{name}" を完全に削除しますか？（音源コピー・分析データも削除、元に戻せません）',
  toastProjDeleted: "プロジェクトを削除しました",
  stReady: "完了", stAnalyzing: "分析中…", stCreated: "待機", stError: "エラー",
  needNameFile: "名前と音源ファイルは必須です！",
  creating: "プロジェクト作成中...", creatingAuto: "プロジェクト作成中...（歌詞自動抽出モード）",
  analyzingWait: "分析中... お待ちください（初回はモデルのダウンロードで時間がかかります）",
  analyzingStage: "分析中", analysisErr: "分析エラー:",
  sysAccel: "アクセラレーション: {gpu} ({vram}GB)", sysNoAccel: "アクセラレーション: なし — CPUモード（低速）",
  sysRecommend: "NVIDIA GPU（VRAM 6GB以上）推奨 — CPUでも動作しますが10倍以上遅くなります",
  sysFirstRun: "初回起動時にAIモデル（約4GB）をダウンロードします",
  btnHome: "← ホーム", stemSource: "原曲", stemVocals: "ボーカル", stemDrums: "ドラム",
  waveLyricsTip: "波形に歌詞ラベルを表示/非表示（単語は頭文字のみ）",
  tabLyrics: "歌詞", tabBeats: "ビート",
  grpDownbeats: "ダウンビート（小節頭）", grpBeats: "ビート", grpKicks: "キック（ドラム）",
  beatEmpty: "ビートデータがありません — 解析が完了しているか確認してください。",
  multiSel: "複数選択",
  toastMultiSel: "{n}文字を選択 — 選択範囲をドラッグで一括移動",
  toastGroupMoved: "{n}文字をまとめて移動しました（{sec}秒）",
  zoom: "ズーム", btnCopyRange: "区間コピー", btnCopyLyrics: "歌詞コピー", btnExport: "JSON書き出し",
  hintbar: "クリック: 移動/選択 · Shift+クリック: 範囲選択 · <b>A</b>: アンカー · Alt+波形クリック: その位置にアンカー · <b>波形ドラッグ: 区間再分析</b> · 右クリック: 再整列メニュー · 文字間の+: 歌詞追加 · Ctrl+Z: 元に戻す",
  ctxPlay: "ここから再生",
  ctxCopy: "コピー（{n}文字）",
  ctxPaste: "ここに貼り付け（{n}文字 → {time}）",
  toastUnitsCopied: "{n}文字コピー — 波形上で右クリック、または再生バーを置いてCtrl+V",
  toastPasted: "{n}文字を貼り付け → {time}（間隔維持）",
  ctxAfter: "ここから後ろを再整列", hintAfter: "次のアンカー/最後まで",
  ctxBefore: "ここから前を再整列", hintBefore: "前のアンカー/最初まで",
  ctxAfterN: "後ろN秒だけ再整列…", ctxBeforeN: "前N秒だけ再整列…",
  ctxAnchor: "再生位置にアンカー", ctxAnchorClear: "アンカー解除", ctxDelete: "この文字を削除",
  regionSel: "この区間に再分析（選択中 {n}文字）", regionAll: "この区間を再分析（{n}文字）",
  toastRegionInfo: "再分析完了: {n}文字 · 信頼度 {conf} · 基準: {src}",
  src_vocals: "ボーカルステム", src_mix: "原曲", src_uniform: "均等配置（整列失敗）",
  phInsert: "追加する歌詞（例: あ ああああ）", btnAdd: "追加", btnCancel: "キャンセル",
  editText: "歌詞", editStart: "開始(秒)", editEnd: "終了(秒)", btnSave: "保存",
  editSaved: '"{text}" を保存 → {time}',
  btnRealign: "再整列", secUnit: "秒", dirAfter: "後ろへ", dirBefore: "前へ",
  busyRealign: "波形に合わせて再整列中...", busyAnchor: "アンカー基準で再整列中...",
  busyAdd: "歌詞追加＋周辺を再整列中...", busyDel: "削除中...",
  busyRegion: "選択区間を再分析中...", busyUndo: "元に戻しています...",
  toastAnchorSet: '"{text}" → {time} アンカー設定 · 周辺を再整列しました', toastAnchorCleared: "アンカーを解除しました",
  toastAdded: '"{text}" を追加 — タイミングがずれたら右クリック再整列で調整',
  toastDeleted: "削除しました（Ctrl+Zで戻せます）",
  toastUnitMoved: '"{text}" を {time} に移動（前後の再整列は右クリック）',
  toastReAfterSec: "後ろ{sec}秒を再整列しました", toastReBeforeSec: "前{sec}秒を再整列しました",
  toastReAfterAll: "後ろ全体を再整列（アンカー/曲末まで）", toastReBeforeAll: "前全体を再整列（アンカー/曲頭まで）",
  toastRegionDone: "{t0} ~ {t1} 区間を再分析しました",
  toastCopied: "区間タイムコードをコピーしました！",
  toastLyricsAuto: "自動抽出した歌詞をコピー — 修正して新規プロジェクトにするとより正確",
  toastLyrics: "歌詞をコピーしました",
  toastSelectFirst: "まず文字をクリック（Shift+クリックで範囲）して選択してください",
  toastNoUndo: "戻す操作がありません", toastNotAudio: "音声ファイルではありません！",
  toastUploading: "アップロード中...", toastUploaded: "完了", toastUploadFail: "失敗しました",
  exported: "書き出し: ",
  exportTitle: "書き出し — プレビュー", copyText: "コピー", saveFile: "ファイルに保存", cpRange: "区間", cpAbsStart: "絶対開始", cpRel: "相対タイムコード（{first} = 0.000）:",
  helpTitle: "使い方",
  help: `<ol>
<li><b>新規プロジェクト</b>: 名前＋音源（D&D可）＋歌詞で分析開始。<b>歌詞を空欄にするとWhisperが自動書き起こし。</b></li>
<li><b>自動分析</b>: ボーカル分離 → 文字単位の強制アライメント → BPM/ビート解析。日韓英中露など多言語対応。</li>
<li><b>カラオケハイライト</b>: 再生中の文字が光ります。ズレ探しに最適。</li>
<li><b>アンカー</b>: 文字をクリックし、聞こえた瞬間に<b>A</b>キー（またはAlt+波形クリック）。前後が自動再整列されます。</li>
<li><b>右クリックメニュー</b>: 前後の全体/N秒だけ再整列、文字削除。</li>
<li><b>波形ドラッグ</b>: 区間をドラッグ→「再分析」。歌詞を先に選択してからドラッグするとその区間に強制配置。</li>
<li><b>歌詞追加</b>: 文字の間にマウスを乗せて＋ボタン。</li>
<li><b>区間コピー</b>: 範囲選択→「区間コピー」で絶対開始＋相対タイムコード＋フレーム番号。</li>
<li><b>タイムコードヒント</b>: 歌詞に<b>[Chorus @ 1:23]</b>や単独行の<b>@1:23</b>を書くと、初回分析でその付近（±3秒）を探索。概算でも精度が大幅アップ！</li>
<li><b>Ctrl+Z</b>で全て取り消し可能。<b>Space</b>で再生/停止。</li>
</ol>
<p style="color:var(--dim)">💡 漢字歌詞は中国語読みでローマ字化されるため精度が少し落ちます。かな表記がより正確です。</p>`,
},

/* ---------------- 中文(简体) ---------------- */
zh: {
  langName: "中文",
  projects: "项目", newProject: "新建项目",
  lblName: "项目名称", phName: "例: Half Step Down",
  lblAudio: "音频文件", btnPick: "选择文件…", dropHint: "或拖放到此处",
  lblSongLang: "歌曲语言（仅用于自动提取歌词 — 提供歌词时忽略）",
  optAuto: "自动检测",
  lblLyrics: "歌词（含标签直接粘贴 — 留空则AI自动提取）",
  phLyrics: "[Intro]\n在此输入歌词\n...\n\n※ 留空开始分析时，Whisper会从人声中自动识别歌词。",
  btnStart: "开始分析", noProjects: "暂无项目。",
  deleteProj: "删除项目",
  confirmDelete: '确定完全删除项目 "{name}"？（音频副本和分析数据都会删除，无法恢复）',
  toastProjDeleted: "项目已删除",
  stReady: "完成", stAnalyzing: "分析中…", stCreated: "等待", stError: "错误",
  needNameFile: "名称和音频文件是必需的！",
  creating: "正在创建项目...", creatingAuto: "正在创建项目...（歌词自动提取模式）",
  analyzingWait: "分析中... 请稍候（首次运行需下载模型，耗时较长）",
  analyzingStage: "分析中", analysisErr: "分析错误:",
  sysAccel: "加速: {gpu} ({vram}GB)", sysNoAccel: "加速: 无 — CPU模式（慢）",
  sysRecommend: "推荐 NVIDIA GPU（显存6GB+）— 无GPU也可用CPU运行，但慢10倍以上",
  sysFirstRun: "首次运行将下载AI模型（约4GB）",
  btnHome: "← 主页", stemSource: "原曲", stemVocals: "人声", stemDrums: "鼓",
  waveLyricsTip: "在波形上显示/隐藏歌词标签（单词仅首字母）",
  tabLyrics: "歌词", tabBeats: "节拍",
  grpDownbeats: "强拍（小节开始）", grpBeats: "节拍", grpKicks: "底鼓（鼓）",
  beatEmpty: "没有节拍数据 — 请确认项目已完成分析。",
  multiSel: "多选",
  toastMultiSel: "已选{n}字 — 拖动选区可一起移动",
  toastGroupMoved: "已一起移动{n}字（{sec}秒）",
  zoom: "缩放", btnCopyRange: "复制区间", btnCopyLyrics: "复制歌词", btnExport: "导出JSON",
  hintbar: "点击: 定位/选择 · Shift+点击: 范围选择 · <b>A</b>: 锚点 · Alt+点击波形: 在该位置设锚点 · <b>拖动波形: 区间重新分析</b> · 右键: 重对齐菜单 · 字间+: 添加歌词 · Ctrl+Z: 撤销",
  ctxPlay: "从这里播放",
  ctxCopy: "复制（{n}字）",
  ctxPaste: "粘贴到此处（{n}字 → {time}）",
  toastUnitsCopied: "已复制{n}字 — 在波形上右键，或放好播放条后Ctrl+V",
  toastPasted: "已粘贴{n}字 → {time}（保持间距）",
  ctxAfter: "从此向后重对齐", hintAfter: "至下一锚点/结尾",
  ctxBefore: "从此向前重对齐", hintBefore: "至上一锚点/开头",
  ctxAfterN: "仅重对齐后N秒…", ctxBeforeN: "仅重对齐前N秒…",
  ctxAnchor: "在播放位置设锚点", ctxAnchorClear: "移除锚点", ctxDelete: "删除此字",
  regionSel: "重对齐到此区间（已选{n}字）", regionAll: "重新分析此区间（{n}字）",
  toastRegionInfo: "重新分析完成: {n}字 · 置信度 {conf} · 依据: {src}",
  src_vocals: "人声轨", src_mix: "原曲", src_uniform: "均匀分布（对齐失败）",
  phInsert: "要添加的歌词（例: 啊 啊啊啊）", btnAdd: "添加", btnCancel: "取消",
  editText: "歌词", editStart: "开始(秒)", editEnd: "结束(秒)", btnSave: "保存",
  editSaved: '"{text}" 已保存 → {time}',
  btnRealign: "重对齐", secUnit: "秒", dirAfter: "向后", dirBefore: "向前",
  busyRealign: "正在按波形重对齐...", busyAnchor: "正在按锚点重对齐...",
  busyAdd: "正在添加并重对齐...", busyDel: "正在删除...",
  busyRegion: "正在重新分析区间...", busyUndo: "正在撤销...",
  toastAnchorSet: '"{text}" → {time} 已设锚点 · 周边已重对齐', toastAnchorCleared: "锚点已移除",
  toastAdded: '"{text}" 已添加 — 如时间不准可用右键重对齐微调',
  toastDeleted: "已删除（Ctrl+Z可撤销）",
  toastUnitMoved: '"{text}" 已移至 {time}（右键可重对齐前后）',
  toastReAfterSec: "已向后重对齐{sec}秒", toastReBeforeSec: "已向前重对齐{sec}秒",
  toastReAfterAll: "已向后全部重对齐（至锚点/结尾）", toastReBeforeAll: "已向前全部重对齐（至锚点/开头）",
  toastRegionDone: "{t0} ~ {t1} 区间已重新分析",
  toastCopied: "区间时间码已复制！",
  toastLyricsAuto: "已复制自动提取的歌词 — 修正后新建项目更准确",
  toastLyrics: "歌词已复制",
  toastSelectFirst: "请先点击选择文字（Shift+点击选范围）",
  toastNoUndo: "没有可撤销的操作", toastNotAudio: "不是音频文件！",
  toastUploading: "上传中...", toastUploaded: "已上传", toastUploadFail: "上传失败",
  exported: "已导出: ",
  exportTitle: "导出 — 预览", copyText: "复制", saveFile: "保存为文件", cpRange: "区间", cpAbsStart: "绝对开始", cpRel: "相对时间码（{first} = 0.000）:",
  helpTitle: "使用方法",
  help: `<ol>
<li><b>新建项目</b>: 名称＋音频（可拖放）＋歌词，开始分析。<b>歌词留空则Whisper自动识别。</b></li>
<li><b>自动分析</b>: 人声分离 → 逐字强制对齐 → BPM/节拍分析。支持中日韩英俄等多种语言。</li>
<li><b>卡拉OK高亮</b>: 播放时当前字发光，快速发现偏差。</li>
<li><b>锚点</b>: 点击文字，听到它的瞬间按<b>A</b>键（或Alt+点击波形）。前后自动重对齐。</li>
<li><b>右键菜单</b>: 向前/向后全部或仅N秒重对齐，删除文字。</li>
<li><b>拖动波形</b>: 拖选区间→"重新分析"。先选歌词再拖动可将其强制放入该区间。</li>
<li><b>添加歌词</b>: 鼠标悬停字间出现+按钮。</li>
<li><b>复制区间</b>: 选范围→"复制区间"，得到绝对开始＋相对时间码＋帧号。</li>
<li><b>时间码提示</b>: 在歌词中写<b>[Chorus @ 1:23]</b>或单独一行<b>@1:23</b>，首次分析会在该点附近（±3秒）搜索。粗略估计也能大幅提高精度！</li>
<li><b>Ctrl+Z</b>可撤销所有编辑。<b>Space</b>播放/暂停。</li>
</ol>
<p style="color:var(--dim)">💡 日语汉字歌词会按中文读音罗马化，精度略降；假名更准确。</p>`,
},

/* ---------------- Español ---------------- */
es: {
  langName: "Español",
  projects: "Proyectos", newProject: "Nuevo proyecto",
  lblName: "Nombre del proyecto", phName: "ej: Half Step Down",
  lblAudio: "Archivo de audio", btnPick: "Elegir archivo…", dropHint: "o arrastra y suelta aquí",
  lblSongLang: "Idioma de la canción (solo para letra automática)",
  optAuto: "Detección automática",
  lblLyrics: "Letra (pégala tal cual con etiquetas — vacía = extracción automática por IA)",
  phLyrics: "[Intro]\nTu letra aquí\n...\n\n※ Si lo dejas vacío, Whisper transcribirá la letra desde la voz.",
  btnStart: "Iniciar análisis", noProjects: "Aún no hay proyectos.",
  deleteProj: "Eliminar proyecto",
  confirmDelete: '¿Eliminar el proyecto "{name}" por completo? (irreversible)',
  toastProjDeleted: "Proyecto eliminado",
  stReady: "Listo", stAnalyzing: "Analizando…", stCreated: "Pendiente", stError: "Error",
  needNameFile: "¡Nombre y archivo de audio obligatorios!",
  creating: "Creando proyecto...", creatingAuto: "Creando proyecto... (letra automática)",
  analyzingWait: "Analizando... espera (la primera vez descarga modelos y tarda más)",
  analyzingStage: "Analizando", analysisErr: "Error de análisis:",
  sysAccel: "Aceleración: {gpu} ({vram}GB)", sysNoAccel: "Aceleración: ninguna — modo CPU (lento)",
  sysRecommend: "Se recomienda GPU NVIDIA (6GB+ VRAM) — funciona en CPU pero 10 veces más lento",
  sysFirstRun: "La primera ejecución descarga modelos de IA (~4GB)",
  btnHome: "← Inicio", stemSource: "Original", stemVocals: "Voz", stemDrums: "Batería",
  waveLyricsTip: "Mostrar/ocultar letras en la onda (solo inicial en palabras)",
  tabLyrics: "Letra", tabBeats: "Ritmo",
  grpDownbeats: "Tiempos fuertes (compases)", grpBeats: "Pulsos", grpKicks: "Bombos",
  beatEmpty: "Sin datos de ritmo — verifica que el análisis haya terminado.",
  multiSel: "Multiselección",
  toastMultiSel: "{n} seleccionados — arrastra la selección para moverlos juntos",
  toastGroupMoved: "{n} movidos juntos ({sec}s)",
  zoom: "Zoom", btnCopyRange: "Copiar rango", btnCopyLyrics: "Copiar letra", btnExport: "Exportar JSON",
  hintbar: "Clic: buscar/seleccionar · Shift+clic: rango · <b>A</b>: ancla · Alt+clic en onda: ancla ahí · <b>Arrastrar onda: reanalizar región</b> · Clic derecho: menú · + entre letras: insertar · Ctrl+Z: deshacer",
  ctxPlay: "Reproducir desde aquí",
  ctxCopy: "Copiar ({n})",
  ctxPaste: "Pegar aquí ({n} → {time})",
  toastUnitsCopied: "{n} copiados — clic derecho en la onda o Ctrl+V en el cursor",
  toastPasted: "{n} pegados → {time} (espaciado conservado)",
  ctxAfter: "Realinear hacia adelante", hintAfter: "hasta ancla/final",
  ctxBefore: "Realinear hacia atrás", hintBefore: "hasta ancla/inicio",
  ctxAfterN: "Realinear N segundos siguientes…", ctxBeforeN: "Realinear N segundos previos…",
  ctxAnchor: "Anclar en posición actual", ctxAnchorClear: "Quitar ancla", ctxDelete: "Eliminar",
  regionSel: "Realinear en esta región ({n} selecc.)", regionAll: "Reanalizar esta región ({n})",
  toastRegionInfo: "Reanalizado: {n} · confianza {conf} · fuente: {src}",
  src_vocals: "voz", src_mix: "mezcla original", src_uniform: "distribución uniforme",
  phInsert: "Letra a insertar", btnAdd: "Añadir", btnCancel: "Cancelar",
  editText: "Texto", editStart: "Inicio(s)", editEnd: "Fin(s)", btnSave: "Guardar",
  editSaved: '"{text}" guardado → {time}',
  btnRealign: "Realinear", secUnit: "s", dirAfter: "adelante", dirBefore: "atrás",
  busyRealign: "Realineando...", busyAnchor: "Realineando por ancla...",
  busyAdd: "Insertando + realineando...", busyDel: "Eliminando...",
  busyRegion: "Reanalizando región...", busyUndo: "Deshaciendo...",
  toastAnchorSet: '"{text}" → {time} anclado · vecinos realineados', toastAnchorCleared: "Ancla quitada",
  toastAdded: '"{text}" añadido — ajusta con clic derecho si es necesario',
  toastDeleted: "Eliminado (Ctrl+Z para deshacer)",
  toastUnitMoved: '"{text}" movido a {time} (clic derecho para realinear)',
  toastReAfterSec: "Realineado {sec}s adelante", toastReBeforeSec: "Realineado {sec}s atrás",
  toastReAfterAll: "Realineado hacia adelante", toastReBeforeAll: "Realineado hacia atrás",
  toastRegionDone: "Región {t0} ~ {t1} reanalizada",
  toastCopied: "¡Códigos de tiempo copiados!",
  toastLyricsAuto: "Letra auto-extraída copiada — corrígela y crea un proyecto nuevo",
  toastLyrics: "Letra copiada",
  toastSelectFirst: "Selecciona primero (clic o Shift+clic)",
  toastNoUndo: "Nada que deshacer", toastNotAudio: "¡No es un archivo de audio!",
  toastUploading: "Subiendo...", toastUploaded: "Subido", toastUploadFail: "Error al subir",
  exported: "Exportado: ",
  exportTitle: "Exportar — Vista previa", copyText: "Copiar", saveFile: "Guardar archivo", cpRange: "Rango", cpAbsStart: "Inicio absoluto", cpRel: "Tiempos relativos ({first} = 0.000):",
  helpTitle: "Cómo usar",
  help: `<ol>
<li><b>Nuevo proyecto</b>: nombre + audio + letra. <b>Letra vacía = transcripción automática.</b></li>
<li><b>Análisis</b>: separación de voz → alineación forzada por carácter → BPM/ritmo. Multilingüe.</li>
<li><b>Resaltado karaoke</b>: el carácter actual brilla al reproducir.</li>
<li><b>Anclas</b>: clic en un carácter y pulsa <b>A</b> cuando lo oigas. Los vecinos se realinean solos.</li>
<li><b>Menú contextual</b>: realinear adelante/atrás, total o N segundos; eliminar.</li>
<li><b>Arrastrar onda</b>: selecciona una región → "Reanalizar". Con letra seleccionada, la fuerza en esa región.</li>
<li><b>Insertar</b>: pasa el ratón entre caracteres → botón +.</li>
<li><b>Copiar rango</b>: inicio absoluto + tiempos relativos + fotogramas.</li>
<li><b>Pistas de tiempo</b>: escribe <b>[Chorus @ 1:23]</b> o una línea <b>@1:23</b> en la letra — el primer análisis busca cerca de ese punto (±3s).</li>
<li><b>Ctrl+Z</b> deshace todo. <b>Espacio</b> = reproducir/pausa.</li>
</ol>`,
},

/* ---------------- Français ---------------- */
fr: {
  langName: "Français",
  projects: "Projets", newProject: "Nouveau projet",
  lblName: "Nom du projet", phName: "ex: Half Step Down",
  lblAudio: "Fichier audio", btnPick: "Choisir…", dropHint: "ou glisser-déposer ici",
  lblSongLang: "Langue de la chanson (pour paroles auto uniquement)",
  optAuto: "Détection auto",
  lblLyrics: "Paroles (coller tel quel avec les tags — vide = extraction auto par IA)",
  phLyrics: "[Intro]\nVos paroles ici\n...\n\n※ Laissez vide et Whisper transcrira les paroles depuis la voix.",
  btnStart: "Lancer l'analyse", noProjects: "Aucun projet.",
  deleteProj: "Supprimer le projet",
  confirmDelete: 'Supprimer complètement le projet "{name}" ? (irréversible)',
  toastProjDeleted: "Projet supprimé",
  stReady: "Prêt", stAnalyzing: "Analyse…", stCreated: "En attente", stError: "Erreur",
  needNameFile: "Nom et fichier audio obligatoires !",
  creating: "Création du projet...", creatingAuto: "Création... (paroles automatiques)",
  analyzingWait: "Analyse en cours... (le premier lancement télécharge les modèles)",
  analyzingStage: "Analyse", analysisErr: "Erreur d'analyse :",
  sysAccel: "Accélération : {gpu} ({vram}Go)", sysNoAccel: "Accélération : aucune — mode CPU (lent)",
  sysRecommend: "GPU NVIDIA (6Go+ VRAM) recommandé — fonctionne sur CPU mais 10x plus lent",
  sysFirstRun: "Le premier lancement télécharge les modèles IA (~4Go)",
  btnHome: "← Accueil", stemSource: "Original", stemVocals: "Voix", stemDrums: "Batterie",
  waveLyricsTip: "Afficher/masquer les paroles sur l'onde (initiale seule pour les mots)",
  tabLyrics: "Paroles", tabBeats: "Rythme",
  grpDownbeats: "Temps forts (mesures)", grpBeats: "Battements", grpKicks: "Kicks",
  beatEmpty: "Pas de données rythmiques — vérifiez que l'analyse est terminée.",
  multiSel: "Multi-sélection",
  toastMultiSel: "{n} sélectionnés — faites glisser la sélection pour les déplacer ensemble",
  toastGroupMoved: "{n} déplacés ensemble ({sec}s)",
  zoom: "Zoom", btnCopyRange: "Copier plage", btnCopyLyrics: "Copier paroles", btnExport: "Exporter JSON",
  hintbar: "Clic : chercher/sélectionner · Shift+clic : plage · <b>A</b> : ancre · Alt+clic onde : ancrer là · <b>Glisser l'onde : réanalyser la région</b> · Clic droit : menu · + entre lettres : insérer · Ctrl+Z : annuler",
  ctxPlay: "Lire à partir d'ici",
  ctxCopy: "Copier ({n})",
  ctxPaste: "Coller ici ({n} → {time})",
  toastUnitsCopied: "{n} copiés — clic droit sur l'onde ou Ctrl+V au curseur",
  toastPasted: "{n} collés → {time} (espacement conservé)",
  ctxAfter: "Réaligner vers l'avant", hintAfter: "jusqu'à l'ancre/fin",
  ctxBefore: "Réaligner vers l'arrière", hintBefore: "jusqu'à l'ancre/début",
  ctxAfterN: "Réaligner N secondes suivantes…", ctxBeforeN: "Réaligner N secondes précédentes…",
  ctxAnchor: "Ancrer à la position actuelle", ctxAnchorClear: "Retirer l'ancre", ctxDelete: "Supprimer",
  regionSel: "Réaligner dans cette région ({n} sél.)", regionAll: "Réanalyser cette région ({n})",
  toastRegionInfo: "Réanalysé : {n} · confiance {conf} · source : {src}",
  src_vocals: "piste vocale", src_mix: "mixage original", src_uniform: "répartition uniforme",
  phInsert: "Paroles à insérer", btnAdd: "Ajouter", btnCancel: "Annuler",
  editText: "Texte", editStart: "Début(s)", editEnd: "Fin(s)", btnSave: "Enregistrer",
  editSaved: '"{text}" enregistré → {time}',
  btnRealign: "Réaligner", secUnit: "s", dirAfter: "avant", dirBefore: "arrière",
  busyRealign: "Réalignement...", busyAnchor: "Réalignement par ancre...",
  busyAdd: "Insertion + réalignement...", busyDel: "Suppression...",
  busyRegion: "Réanalyse de la région...", busyUndo: "Annulation...",
  toastAnchorSet: '"{text}" → {time} ancré · voisins réalignés', toastAnchorCleared: "Ancre retirée",
  toastAdded: '"{text}" ajouté — affinez avec le clic droit si besoin',
  toastDeleted: "Supprimé (Ctrl+Z pour annuler)",
  toastUnitMoved: '"{text}" déplacé à {time} (clic droit pour réaligner)',
  toastReAfterSec: "Réaligné {sec}s vers l'avant", toastReBeforeSec: "Réaligné {sec}s vers l'arrière",
  toastReAfterAll: "Réaligné vers l'avant", toastReBeforeAll: "Réaligné vers l'arrière",
  toastRegionDone: "Région {t0} ~ {t1} réanalysée",
  toastCopied: "Timecodes copiés !",
  toastLyricsAuto: "Paroles auto-extraites copiées — corrigez puis créez un nouveau projet",
  toastLyrics: "Paroles copiées",
  toastSelectFirst: "Sélectionnez d'abord (clic ou Shift+clic)",
  toastNoUndo: "Rien à annuler", toastNotAudio: "Pas un fichier audio !",
  toastUploading: "Envoi...", toastUploaded: "Envoyé", toastUploadFail: "Échec de l'envoi",
  exported: "Exporté : ",
  exportTitle: "Exporter — Aperçu", copyText: "Copier", saveFile: "Enregistrer", cpRange: "Plage", cpAbsStart: "Début absolu", cpRel: "Timecodes relatifs ({first} = 0.000) :",
  helpTitle: "Mode d'emploi",
  help: `<ol>
<li><b>Nouveau projet</b> : nom + audio + paroles. <b>Paroles vides = transcription automatique.</b></li>
<li><b>Analyse</b> : séparation de la voix → alignement forcé par caractère → BPM/rythme. Multilingue.</li>
<li><b>Surlignage karaoké</b> : le caractère en cours brille pendant la lecture.</li>
<li><b>Ancres</b> : cliquez un caractère, appuyez sur <b>A</b> quand vous l'entendez. Les voisins se réalignent.</li>
<li><b>Menu contextuel</b> : réaligner avant/arrière, tout ou N secondes ; supprimer.</li>
<li><b>Glisser l'onde</b> : sélectionnez une région → « Réanalyser ». Avec des paroles sélectionnées, elles y sont forcées.</li>
<li><b>Insérer</b> : survolez entre les caractères → bouton +.</li>
<li><b>Copier plage</b> : début absolu + timecodes relatifs + images.</li>
<li><b>Indices temporels</b> : écrivez <b>[Chorus @ 1:23]</b> ou une ligne <b>@1:23</b> dans les paroles — la première analyse cherche près de ce point (±3s).</li>
<li><b>Ctrl+Z</b> annule tout. <b>Espace</b> = lecture/pause.</li>
</ol>`,
},

/* ---------------- Deutsch ---------------- */
de: {
  langName: "Deutsch",
  projects: "Projekte", newProject: "Neues Projekt",
  lblName: "Projektname", phName: "z.B. Half Step Down",
  lblAudio: "Audiodatei", btnPick: "Datei wählen…", dropHint: "oder hierher ziehen",
  lblSongLang: "Songsprache (nur für Auto-Text)",
  optAuto: "Automatisch",
  lblLyrics: "Songtext (mit Tags einfügen — leer = automatische KI-Extraktion)",
  phLyrics: "[Intro]\nDein Text hier\n...\n\n※ Leer lassen und Whisper transkribiert den Text aus dem Gesang.",
  btnStart: "Analyse starten", noProjects: "Noch keine Projekte.",
  deleteProj: "Projekt löschen",
  confirmDelete: 'Projekt "{name}" vollständig löschen? (nicht rückgängig zu machen)',
  toastProjDeleted: "Projekt gelöscht",
  stReady: "Fertig", stAnalyzing: "Analysiere…", stCreated: "Wartend", stError: "Fehler",
  needNameFile: "Name und Audiodatei erforderlich!",
  creating: "Projekt wird erstellt...", creatingAuto: "Projekt wird erstellt... (Auto-Text)",
  analyzingWait: "Analysiere... bitte warten (erster Lauf lädt Modelle herunter)",
  analyzingStage: "Analysiere", analysisErr: "Analysefehler:",
  sysAccel: "Beschleunigung: {gpu} ({vram}GB)", sysNoAccel: "Beschleunigung: keine — CPU-Modus (langsam)",
  sysRecommend: "NVIDIA-GPU (6GB+ VRAM) empfohlen — läuft auch auf CPU, aber 10x langsamer",
  sysFirstRun: "Beim ersten Start werden KI-Modelle (~4GB) heruntergeladen",
  btnHome: "← Start", stemSource: "Original", stemVocals: "Gesang", stemDrums: "Schlagzeug",
  waveLyricsTip: "Textlabels auf der Wellenform ein/aus (nur Anfangsbuchstabe bei Wörtern)",
  tabLyrics: "Text", tabBeats: "Beats",
  grpDownbeats: "Downbeats (Taktanfänge)", grpBeats: "Beats", grpKicks: "Kicks",
  beatEmpty: "Keine Beat-Daten — bitte prüfen, ob die Analyse abgeschlossen ist.",
  multiSel: "Mehrfachauswahl",
  toastMultiSel: "{n} ausgewählt — Auswahl ziehen, um sie gemeinsam zu verschieben",
  toastGroupMoved: "{n} gemeinsam verschoben ({sec}s)",
  zoom: "Zoom", btnCopyRange: "Bereich kopieren", btnCopyLyrics: "Text kopieren", btnExport: "JSON exportieren",
  hintbar: "Klick: suchen/wählen · Shift+Klick: Bereich · <b>A</b>: Anker · Alt+Klick auf Welle: dort ankern · <b>Welle ziehen: Region neu analysieren</b> · Rechtsklick: Menü · + zwischen Zeichen: einfügen · Strg+Z: rückgängig",
  ctxPlay: "Ab hier abspielen",
  ctxCopy: "Kopieren ({n})",
  ctxPaste: "Hier einfügen ({n} → {time})",
  toastUnitsCopied: "{n} kopiert — Rechtsklick auf die Welle oder Ctrl+V am Cursor",
  toastPasted: "{n} eingefügt → {time} (Abstände erhalten)",
  ctxAfter: "Ab hier vorwärts neu ausrichten", hintAfter: "bis Anker/Ende",
  ctxBefore: "Ab hier rückwärts neu ausrichten", hintBefore: "bis Anker/Anfang",
  ctxAfterN: "Nächste N Sekunden neu ausrichten…", ctxBeforeN: "Vorherige N Sekunden neu ausrichten…",
  ctxAnchor: "An Abspielposition ankern", ctxAnchorClear: "Anker entfernen", ctxDelete: "Zeichen löschen",
  regionSel: "In diese Region ausrichten ({n} gewählt)", regionAll: "Region neu analysieren ({n})",
  toastRegionInfo: "Neu analysiert: {n} · Konfidenz {conf} · Quelle: {src}",
  src_vocals: "Gesangsspur", src_mix: "Originalmix", src_uniform: "gleichmäßig verteilt",
  phInsert: "Einzufügender Text", btnAdd: "Hinzufügen", btnCancel: "Abbrechen",
  editText: "Text", editStart: "Start(s)", editEnd: "Ende(s)", btnSave: "Speichern",
  editSaved: '"{text}" gespeichert → {time}',
  btnRealign: "Ausrichten", secUnit: "s", dirAfter: "vorwärts", dirBefore: "rückwärts",
  busyRealign: "Richte neu aus...", busyAnchor: "Richte am Anker aus...",
  busyAdd: "Füge ein + richte aus...", busyDel: "Lösche...",
  busyRegion: "Analysiere Region...", busyUndo: "Mache rückgängig...",
  toastAnchorSet: '"{text}" → {time} verankert · Nachbarn ausgerichtet', toastAnchorCleared: "Anker entfernt",
  toastAdded: '"{text}" hinzugefügt — bei Bedarf per Rechtsklick nachjustieren',
  toastDeleted: "Gelöscht (Strg+Z zum Rückgängigmachen)",
  toastUnitMoved: '"{text}" nach {time} verschoben (Rechtsklick zum Ausrichten)',
  toastReAfterSec: "{sec}s vorwärts neu ausgerichtet", toastReBeforeSec: "{sec}s rückwärts neu ausgerichtet",
  toastReAfterAll: "Vorwärts neu ausgerichtet", toastReBeforeAll: "Rückwärts neu ausgerichtet",
  toastRegionDone: "Region {t0} ~ {t1} neu analysiert",
  toastCopied: "Timecodes kopiert!",
  toastLyricsAuto: "Auto-Text kopiert — korrigieren und neues Projekt erstellen",
  toastLyrics: "Text kopiert",
  toastSelectFirst: "Erst ein Zeichen wählen (Klick oder Shift+Klick)",
  toastNoUndo: "Nichts rückgängig zu machen", toastNotAudio: "Keine Audiodatei!",
  toastUploading: "Lade hoch...", toastUploaded: "Hochgeladen", toastUploadFail: "Upload fehlgeschlagen",
  exported: "Exportiert: ",
  exportTitle: "Export — Vorschau", copyText: "Kopieren", saveFile: "Als Datei speichern", cpRange: "Bereich", cpAbsStart: "Absoluter Start", cpRel: "Relative Timecodes ({first} = 0.000):",
  helpTitle: "Anleitung",
  help: `<ol>
<li><b>Neues Projekt</b>: Name + Audio + Text. <b>Text leer = automatische Transkription.</b></li>
<li><b>Analyse</b>: Gesangstrennung → Zeichen-Alignment → BPM/Beats. Mehrsprachig.</li>
<li><b>Karaoke-Highlight</b>: das aktuelle Zeichen leuchtet beim Abspielen.</li>
<li><b>Anker</b>: Zeichen anklicken, <b>A</b> drücken, sobald man es hört. Nachbarn richten sich automatisch aus.</li>
<li><b>Rechtsklick-Menü</b>: vorwärts/rückwärts ganz oder nur N Sekunden ausrichten; löschen.</li>
<li><b>Welle ziehen</b>: Region wählen → „Neu analysieren“. Mit gewähltem Text wird er dort erzwungen.</li>
<li><b>Einfügen</b>: zwischen Zeichen hovern → +‑Knopf.</li>
<li><b>Bereich kopieren</b>: absoluter Start + relative Timecodes + Frames.</li>
<li><b>Timecode-Hinweise</b>: <b>[Chorus @ 1:23]</b> oder eine Zeile <b>@1:23</b> im Text — die erste Analyse sucht nahe diesem Punkt (±3s).</li>
<li><b>Strg+Z</b> macht alles rückgängig. <b>Leertaste</b> = Play/Pause.</li>
</ol>`,
},

/* ---------------- Русский ---------------- */
ru: {
  langName: "Русский",
  projects: "Проекты", newProject: "Новый проект",
  lblName: "Название проекта", phName: "напр.: Half Step Down",
  lblAudio: "Аудиофайл", btnPick: "Выбрать файл…", dropHint: "или перетащите сюда",
  lblSongLang: "Язык песни (только для автотекста)",
  optAuto: "Автоопределение",
  lblLyrics: "Текст песни (вставьте как есть с тегами — пусто = автоизвлечение ИИ)",
  phLyrics: "[Intro]\nВаш текст здесь\n...\n\n※ Оставьте пустым — Whisper распознает текст из вокала.",
  btnStart: "Начать анализ", noProjects: "Проектов пока нет.",
  deleteProj: "Удалить проект",
  confirmDelete: 'Полностью удалить проект "{name}"? (безвозвратно)',
  toastProjDeleted: "Проект удалён",
  stReady: "Готово", stAnalyzing: "Анализ…", stCreated: "Ожидание", stError: "Ошибка",
  needNameFile: "Название и аудиофайл обязательны!",
  creating: "Создание проекта...", creatingAuto: "Создание проекта... (автотекст)",
  analyzingWait: "Анализ... подождите (первый запуск скачивает модели)",
  analyzingStage: "Анализ", analysisErr: "Ошибка анализа:",
  sysAccel: "Ускорение: {gpu} ({vram}ГБ)", sysNoAccel: "Ускорение: нет — режим CPU (медленно)",
  sysRecommend: "Рекомендуется NVIDIA GPU (6ГБ+ VRAM) — работает и на CPU, но в 10+ раз медленнее",
  sysFirstRun: "При первом запуске скачиваются модели ИИ (~4ГБ)",
  btnHome: "← Домой", stemSource: "Оригинал", stemVocals: "Вокал", stemDrums: "Ударные",
  waveLyricsTip: "Показать/скрыть текст на волне (для слов — первая буква)",
  tabLyrics: "Текст", tabBeats: "Ритм",
  grpDownbeats: "Сильные доли (такты)", grpBeats: "Доли", grpKicks: "Бочка",
  beatEmpty: "Нет данных о ритме — убедитесь, что анализ завершён.",
  multiSel: "Мультивыбор",
  toastMultiSel: "Выбрано {n} — перетащите выделение, чтобы двигать вместе",
  toastGroupMoved: "Перемещено вместе: {n} ({sec}с)",
  zoom: "Масштаб", btnCopyRange: "Копир. диапазон", btnCopyLyrics: "Копир. текст", btnExport: "Экспорт JSON",
  hintbar: "Клик: перейти/выбрать · Shift+клик: диапазон · <b>A</b>: якорь · Alt+клик по волне: якорь там · <b>Перетащить волну: переанализ участка</b> · ПКМ: меню · + между буквами: вставить · Ctrl+Z: отмена",
  ctxPlay: "Играть отсюда",
  ctxCopy: "Копировать ({n})",
  ctxPaste: "Вставить сюда ({n} → {time})",
  toastUnitsCopied: "Скопировано {n} — ПКМ по волне или Ctrl+V у курсора",
  toastPasted: "Вставлено {n} → {time} (интервалы сохранены)",
  ctxAfter: "Выровнять вперёд отсюда", hintAfter: "до якоря/конца",
  ctxBefore: "Выровнять назад отсюда", hintBefore: "до якоря/начала",
  ctxAfterN: "Выровнять следующие N секунд…", ctxBeforeN: "Выровнять предыдущие N секунд…",
  ctxAnchor: "Якорь на позиции воспроизведения", ctxAnchorClear: "Убрать якорь", ctxDelete: "Удалить",
  regionSel: "Выровнять в этот участок (выбрано {n})", regionAll: "Переанализировать участок ({n})",
  toastRegionInfo: "Переанализировано: {n} · уверенность {conf} · источник: {src}",
  src_vocals: "вокал", src_mix: "оригинал", src_uniform: "равномерно",
  phInsert: "Текст для вставки", btnAdd: "Добавить", btnCancel: "Отмена",
  editText: "Текст", editStart: "Начало(с)", editEnd: "Конец(с)", btnSave: "Сохранить",
  editSaved: '"{text}" сохранено → {time}',
  btnRealign: "Выровнять", secUnit: "с", dirAfter: "вперёд", dirBefore: "назад",
  busyRealign: "Выравнивание...", busyAnchor: "Выравнивание по якорю...",
  busyAdd: "Вставка + выравнивание...", busyDel: "Удаление...",
  busyRegion: "Переанализ участка...", busyUndo: "Отмена...",
  toastAnchorSet: '"{text}" → {time} закреплено · соседи выровнены', toastAnchorCleared: "Якорь убран",
  toastAdded: '"{text}" добавлено — при необходимости подправьте через ПКМ',
  toastDeleted: "Удалено (Ctrl+Z — отмена)",
  toastUnitMoved: '"{text}" перемещено на {time} (ПКМ — выровнять соседей)',
  toastReAfterSec: "Выровнено {sec}с вперёд", toastReBeforeSec: "Выровнено {sec}с назад",
  toastReAfterAll: "Выровнено вперёд", toastReBeforeAll: "Выровнено назад",
  toastRegionDone: "Участок {t0} ~ {t1} переанализирован",
  toastCopied: "Таймкоды скопированы!",
  toastLyricsAuto: "Автотекст скопирован — исправьте и создайте новый проект",
  toastLyrics: "Текст скопирован",
  toastSelectFirst: "Сначала выберите символ (клик или Shift+клик)",
  toastNoUndo: "Нечего отменять", toastNotAudio: "Это не аудиофайл!",
  toastUploading: "Загрузка...", toastUploaded: "Загружено", toastUploadFail: "Ошибка загрузки",
  exported: "Экспортировано: ",
  exportTitle: "Экспорт — предпросмотр", copyText: "Копировать", saveFile: "Сохранить в файл", cpRange: "Диапазон", cpAbsStart: "Абсолютное начало", cpRel: "Относительные таймкоды ({first} = 0.000):",
  helpTitle: "Как пользоваться",
  help: `<ol>
<li><b>Новый проект</b>: название + аудио + текст. <b>Пустой текст = автораспознавание.</b></li>
<li><b>Анализ</b>: отделение вокала → пофразовое выравнивание → BPM/ритм. Многоязычный.</li>
<li><b>Караоке-подсветка</b>: текущий символ светится при воспроизведении.</li>
<li><b>Якоря</b>: кликните символ и нажмите <b>A</b> в момент, когда его слышите. Соседи выровняются сами.</li>
<li><b>Меню ПКМ</b>: выровнять вперёд/назад целиком или только N секунд; удалить.</li>
<li><b>Перетаскивание волны</b>: выделите участок → «Переанализировать». С выбранным текстом — он попадёт именно туда.</li>
<li><b>Вставка</b>: наведите между символами → кнопка +.</li>
<li><b>Копировать диапазон</b>: абсолютное начало + относительные таймкоды + кадры.</li>
<li><b>Подсказки времени</b>: напишите <b>[Chorus @ 1:23]</b> или отдельную строку <b>@1:23</b> — первый анализ ищет рядом с этой точкой (±3с).</li>
<li><b>Ctrl+Z</b> отменяет всё. <b>Пробел</b> = пуск/пауза.</li>
</ol>`,
},
};

let LANG = localStorage.getItem("lyricssync_lang");
if (!LANG || !I18N[LANG]) {
  const nav = (navigator.language || "en").slice(0, 2);
  LANG = I18N[nav] ? nav : "en";
}

function t(key, params) {
  let s = (I18N[LANG] && I18N[LANG][key]) ?? I18N.en[key] ?? key;
  if (params) for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, v);
  return s;
}

function setLang(l) {
  if (!I18N[l]) return;
  LANG = l;
  localStorage.setItem("lyricssync_lang", l);
  applyI18n();
}

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  const sel = document.getElementById("langSel");
  if (sel && sel.value !== LANG) sel.value = LANG;
}

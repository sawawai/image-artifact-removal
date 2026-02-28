'use strict';

let worker = null;

// ── i18n ─────────────────────────────────────────────────────
const TX = {
  ja: {
    'logo':              '圧縮ノイズ除去',
    'drag':              'ここにドロップ',
    'drop-label':        '画像をドロップ',
    'drop-sub':          'クリックしてファイルを選択 &nbsp;·&nbsp; <kbd>Ctrl+V</kbd> でペースト',
    'before':            '処理前',
    'after':             '処理後',
    'sb-filter':         'フィルタ',
    'fchoice-a':         'シャープ',
    'fchoice-b':         'ソフト（低速）',
    'sb-strength':       'フィルタの強さ',
    'str-lo':            '元の画像（0%）',
    'str-hi':            '最大除去（100%）',
    'btn-process':       '画像ノイズを除去',
    'btn-cancel':        'キャンセル',
    'btn-dl':            '画像を保存',
    'btn-clear':         '画像をクリア',
    'side-orig':         '元の画像',
    'side-done':         f => f === 'a' ? 'シャープ 適用済み' : 'ソフト 適用済み',
    'about-title':       'このツールについて',
    'sb-desc-1':         '画像の圧縮ノイズやアーティファクトを除去します。',
    'sb-desc-2':         'ブラウザ内で完結します。選択したフィルタ（約32 MB）は初回のみダウンロードされ、端末に保存されます。',
    'sb-desc-3':         'GPUが利用可能な場合はGPUで処理します。GPUがない場合、処理にかなり時間がかかることがあります。',
    'credits-models-label':    'フィルタ',
    'filter-b-note':           '（出力は元画像の解像度に合わせて調整されます。）',
    'credits-by':              'モデル提供：limitlesslab',
    'credits-license':         'ライセンス：CC BY-NC-SA 4.0',
    'credits-inference-label': '実行環境',
    'credits-gpu-note-1':      '利用可能な場合はWebGPUを使用',
    'credits-gpu-note-2':      'それ以外の場合はCPUで動作',
    'gpu-status-ok':           'GPU 利用可能',
    'gpu-status-no':           'GPU 非対応 — 処理が遅くなります',
    'bl-original':             '元の解像度',
    'bl-displayed':            '表示サイズ',
    'px-dims':           (w, h) => `${w} × ${h} px`,
    'filter-dl':         p      => `フィルタをダウンロード中... ${p}%`,
    'filter-loading':           'フィルタを読み込み中...',
    'filter-ready':             'フィルタ読み込み完了',
    'filter-err':               'フィルタの読み込みに失敗しました。',
    'strength-hint':            '変更はリアルタイムで反映されます。',
    'proc-pct':          p      => `処理中... ${p}%`,
    'proc-ok':           s      => `${s}秒で完了しました`,
    'toast-dl':          '保存しました',
    'toast-ok':          '除去が完了しました',
    'toast-cancel':      'キャンセルしました',
    'load-err':          '読み込みに失敗しました。モデルファイルが ./model/ に存在するか確認してください。',
    'proc-err':          'エラーが発生しました。',
    'proc-cancelled':    'キャンセルしました。',
    'mwarn-title':       'このツールはデスクトップ向けです',
    'mwarn-body':        'このツールはブラウザ内で直接画像を処理するため、デスクトップ向けに設計されています。モバイルデバイスでは非常に遅くなるか、動作しない場合があります。デスクトップまたはノートPCでのご利用を推奨します。',
    'mwarn-btn':         '続けて試す',
    'view-mode-label':   '表示モード',
    'view-mode-fit':     'フィット',
    'view-mode-pixel':   '等倍',
    'vmode-desc-fit':    '画像をキャンバスに合わせて表示\nスライダーで比較',
    'vmode-desc-pixel':  '画像を実寸で表示\n画像をドラッグして移動',
  },
  en: {
    'logo':              'Artifact Removal',
    'drag':              'Drop image here',
    'drop-label':        'Drop an image here',
    'drop-sub':          'Click to browse &nbsp;·&nbsp; paste with <kbd>Ctrl+V</kbd>',
    'before':            'Before',
    'after':             'After',
    'sb-filter':         'Filter',
    'fchoice-a':         'Sharp',
    'fchoice-b':         'Soft (slower)',
    'sb-strength':       'Filter strength',
    'str-lo':            'Original image (0%)',
    'str-hi':            'Full correction (100%)',
    'btn-process':       'Remove image artifacts',
    'btn-cancel':        'Cancel',
    'btn-dl':            'Save image',
    'btn-clear':         'Clear image',
    'side-orig':         'Original image',
    'side-done':         f => f === 'a' ? 'Sharp filter applied' : 'Soft filter applied',
    'about-title':       'About this tool',
    'sb-desc-1':         'Removes compression artifacts and noise from images.',
    'sb-desc-2':         'Runs entirely in the browser. The selected filter (~32 MB) is downloaded once and stored locally.',
    'sb-desc-3':         'Uses the GPU when available. Without GPU support, processing can take considerably longer.',
    'credits-models-label':    'Filters',
    'filter-b-note':           '(Output is resized to match the original image.)',
    'credits-by':              'Models by limitlesslab',
    'credits-license':         'License: CC BY-NC-SA 4.0',
    'credits-inference-label': 'Runtime',
    'credits-gpu-note-1':      'Uses WebGPU when available',
    'credits-gpu-note-2':      'Falls back to CPU otherwise',
    'gpu-status-ok':           'GPU available',
    'gpu-status-no':           'GPU not available — processing will be slower',
    'bl-original':             'Input resolution',
    'bl-displayed':            'Rendered size',
    'px-dims':           (w, h) => `${w} × ${h} px`,
    'filter-dl':         p      => `Downloading filter... ${p}%`,
    'filter-loading':           'Loading filter...',
    'filter-ready':             'Filter ready',
    'filter-err':               'Failed to load filter.',
    'strength-hint':            'Changes apply in real time.',
    'proc-pct':          p      => `Processing... ${p}%`,
    'proc-ok':           s      => `Completed in ${s}s`,
    'toast-dl':          'Saved',
    'toast-ok':          'Processing complete',
    'toast-cancel':      'Cancelled',
    'load-err':          'Failed to load. Check that the model file exists in ./model/.',
    'proc-err':          'An error occurred.',
    'proc-cancelled':    'Cancelled.',
    'mwarn-title':       'Designed for desktop use',
    'mwarn-body':        'This tool processes images directly in your browser and is designed for desktop use. On mobile devices it will be extremely slow or may not work at all. A desktop or laptop computer is strongly recommended.',
    'mwarn-btn':         'Try anyway',
    'view-mode-label':   'View mode',
    'view-mode-fit':     'Fit',
    'view-mode-pixel':   '1:1',
    'vmode-desc-fit':    'Image fit to canvas\nDrag slider to compare',
    'vmode-desc-pixel':  'Image at actual size\nDrag image to pan',
  },
};

let lang = 'ja';
function t(k, ...a) {
  const v = TX[lang][k];
  return typeof v === 'function' ? v(...a) : (v ?? k);
}

const tMap = {
  't-logo':                    'logo',
  't-drag':                    'drag',
  't-drop-label':              'drop-label',
  't-drop-sub':                'drop-sub',
  't-before':                  'before',
  't-after':                   'after',
  't-sb-filter':               'sb-filter',
  't-fchoice-a':               'fchoice-a',
  't-fchoice-b':               'fchoice-b',
  't-sb-strength':             'sb-strength',
  't-str-lo':                  'str-lo',
  't-str-hi':                  'str-hi',
  't-btn-process':             'btn-process',
  't-btn-cancel':              'btn-cancel',
  't-btn-dl':                  'btn-dl',
  't-btn-clear':               'btn-clear',
  't-about-title':             'about-title',
  't-sb-desc-1':               'sb-desc-1',
  't-sb-desc-2':               'sb-desc-2',
  't-sb-desc-3':               'sb-desc-3',
  't-credits-models-label':    'credits-models-label',
  't-filter-b-note':           'filter-b-note',
  't-credits-by':              'credits-by',
  't-credits-license':         'credits-license',
  't-credits-inference-label': 'credits-inference-label',
  't-credits-gpu-note-1':      'credits-gpu-note-1',
  't-credits-gpu-note-2':      'credits-gpu-note-2',
  't-bl-original':             'bl-original',
  't-bl-displayed':            'bl-displayed',
  't-mwarn-title':             'mwarn-title',
  't-mwarn-body':              'mwarn-body',
  't-mwarn-btn':               'mwarn-btn',
  't-strength-hint':           'strength-hint',
  't-view-mode-label':         'view-mode-label',
};

function applyLang() {
  document.documentElement.lang = lang;
  document.title = t('logo');
  for (const [id, key] of Object.entries(tMap)) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = t(key);
  }
  updateProcStatus();
  // Re-translate filter status if it's currently showing
  if (S.filterStatusState) {
    const { key, arg, variant = '', suffix = '' } = S.filterStatusState;
    setFilterStatus(key, arg, variant, suffix);
  }
  updateStateGrid();
  updateProcessBtn();
  updateGpuStatus();
  updateViewModeDisplay();
}

function setLang(l) {
  lang = l;
  setCookie('lang', l, 365);
  document.querySelectorAll('.lang-switch button').forEach((b, i) => {
    b.classList.toggle('active', (i === 0 && l === 'ja') || (i === 1 && l === 'en'));
  });
  applyLang();
}

// ── State ─────────────────────────────────────────────────────
const S = {
  inputFilename:    'image',
  filterChoice:     'a',
  filterLoaded:     null,
  filterReady:      false,
  filterLoading:    false,
  processAfterLoad: false,
  filterStatusState: null,
  procStatusState:   null,
  inputImg:         null,
  alphaMask:        null,
  processedImgs:    { a: null, b: null },
  processedFor:     null,
  strength:         80,
  imageState:       'none',
  lastElapsed:      { a: null, b: null },
  sliderPct:        50,
  dragging:         false,
  viewMode:         'fit',
  panX:             0,
  panY:             0,
  panning:          false,
  panStartX:        0,
  panStartY:        0,
  panStartPanX:     0,
  panStartPanY:     0,
  processing:       false,
  t0:               0,
};

// ── DOM helpers ───────────────────────────────────────────────
const $ = id => document.getElementById(id);

let toastT;
function showToast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove('on'), 2500);
}

function setStrengthEnabled(on) {
  $('strength-section').classList.toggle('sb-group--muted', !on);
  $('strength').disabled = !on;
}

function setProcStatus(key, arg, variant = '', suffix = '') {
  S.procStatusState = key ? { key, arg, variant, suffix } : null;
  updateProcStatus();
}

function updateProcStatus() {
  const el = $('proc-status');
  const ps = S.procStatusState;
  if (!ps) { el.textContent = ''; el.className = 'inline-status'; return; }
  if (ps.key === 'proc-ok') {
    const fresh = S.processedImgs[S.filterChoice] && S.processedFor === S.inputImg;
    if (!fresh) { el.textContent = ''; el.className = 'inline-status'; return; }
  }
  const txt = (ps.arg !== undefined ? t(ps.key, ps.arg) : t(ps.key)) + (ps.suffix || '');
  el.textContent = txt;
  el.className   = 'inline-status' + (ps.variant ? ' ' + ps.variant : '');
}

function setFilterStatus(key, arg, variant = '', suffix = '') {
  S.filterStatusState = key ? { key, arg, variant, suffix } : null;
  const el  = $('filter-status');
  const txt = key ? (arg !== undefined ? t(key, arg) : t(key)) + suffix : '';
  el.textContent   = txt;
  el.className     = 'inline-status' + (variant ? ' ' + variant : '');
  el.style.display = txt ? '' : 'none';
}

// ── Worker message handler ────────────────────────────────────
function handleWorkerMsg({ data: msg }) {
  switch (msg.type) {

    case 'log':
      console.log('[worker]', msg.msg);
      break;

    case 'dl-progress':
      setFilterStatus('filter-dl', msg.pct);
      break;

    case 'dl-done':
      setFilterStatus('filter-loading');
      break;

    case 'load-ok':
      S.filterReady   = true;
      S.filterLoading = false;
      S.filterLoaded  = S.filterChoice;
      setFilterStatus('filter-ready', undefined, 'ok');
      updateProcessBtn();
      if (S.processAfterLoad) {
        S.processAfterLoad = false;
        processImage();
      }
      break;

    case 'proc-progress': {
      const fill = $('proc-fill');
      if (fill.classList.contains('spin')) {
        // Switching from indeterminate spin to real percentage: snap to 0%
        // without a transition so the bar doesn't animate down from 38%.
        fill.style.transition = 'none';
        fill.className        = 'prog-fill';
        fill.style.width      = '0%';
        fill.getBoundingClientRect(); // force reflow to commit the above
        fill.style.transition = '';
      }
      fill.style.width           = msg.pct + '%';
      $('proc-label').textContent = t('proc-pct', Math.round(msg.pct));
      break;
    }

    case 'run-ok': {
      const W = S.inputImg.width, H = S.inputImg.height;
      if (msg.scale > 1) {
        const bigC = document.createElement('canvas');
        bigC.width  = msg.outW;
        bigC.height = msg.outH;
        bigC.getContext('2d').putImageData(
          new ImageData(new Uint8ClampedArray(msg.resultBuf), msg.outW, msg.outH), 0, 0
        );
        const smlC = document.createElement('canvas');
        smlC.width  = W;
        smlC.height = H;
        const ctx2  = smlC.getContext('2d');
        ctx2.imageSmoothingEnabled = true;
        ctx2.imageSmoothingQuality = 'high';
        ctx2.drawImage(bigC, 0, 0, W, H);
        S.processedImgs[S.filterChoice] = ctx2.getImageData(0, 0, W, H);
      } else {
        S.processedImgs[S.filterChoice] = new ImageData(new Uint8ClampedArray(msg.resultBuf), W, H);
      }
      S.processedFor = S.inputImg;
      S.imageState      = 'done';
      S.lastElapsed[S.filterChoice] = ((performance.now() - S.t0) / 1000).toFixed(1);
      applyBlend();
      updateStateGrid();
      setStrengthEnabled(true);
      $('btn-dl').disabled         = false;
      setProcStatus('proc-ok', S.lastElapsed[S.filterChoice], 'ok');
      showToast(t('toast-ok'));
      endProcessing(false);
      break;
    }

    case 'error':
      if (S.filterLoading) {
        S.filterLoading    = false;
        S.processAfterLoad = false;
        setFilterStatus('filter-err', undefined, 'err', ' (' + msg.message + ')');
        updateProcessBtn();
      } else if (S.processing) {
        setProcStatus('proc-err', undefined, 'err', ' ' + msg.message);
        endProcessing(false);
      }
      break;
  }
}

function endProcessing(cancelled) {
  S.processing = false;
  $('proc-prog').classList.remove('on');
  $('btn-cancel').style.display  = 'none';
  $('btn-process').style.display = '';
  updateProcessBtn();
  $('btn-clear').disabled = !S.inputImg;
  if (cancelled) {
    setProcStatus('proc-cancelled');
    showToast(t('toast-cancel'));
  }
}

// ── Filter selection ──────────────────────────────────────────
function selectFilter(choice) {
  if (S.processing || S.filterLoading || S.filterChoice === choice) return;
  S.filterChoice = choice;
  $('fchoice-a').classList.toggle('active', choice === 'a');
  $('fchoice-b').classList.toggle('active', choice === 'b');
  if (S.filterLoaded === choice) {
    // Switching back to the already-loaded filter
    S.filterReady = true;
    setFilterStatus('filter-ready', undefined, 'ok');
  } else {
    // Switching to a different filter — hide ready status but keep filterLoaded
    // so switching back can detect it without re-loading
    S.filterReady = false;
    setFilterStatus(null);
  }
  const hasCached = S.inputImg && S.processedImgs[choice] && S.processedFor === S.inputImg;
  if (hasCached) {
    S.imageState = 'done';
    setStrengthEnabled(true);
    $('btn-dl').disabled = false;
    applyBlend();
    setProcStatus('proc-ok', S.lastElapsed[choice], 'ok');
  } else if (S.inputImg) {
    S.imageState = 'orig';
    setStrengthEnabled(false);
    $('btn-dl').disabled = true;
    renderViewer(S.inputImg, null);
    setProcStatus(null);
  }
  updateStateGrid();
  updateProcessBtn();
}

// ── Filter loading ────────────────────────────────────────────
function loadFilter() {
  if (S.filterLoading) return;
  if (worker) { worker.terminate(); worker = null; }
  S.filterLoading = true;
  S.filterReady   = false;
  S.filterLoaded  = null;
  setProcStatus(null);
  setFilterStatus('filter-dl', 0);
  updateProcessBtn();
  worker = new Worker('./worker.js');
  worker.onmessage = handleWorkerMsg;
  worker.onerror   = e => handleWorkerMsg({ data: { type: 'error', message: e.message } });
  const modelFile = S.filterChoice === 'a' ? '1x_PureVision.onnx' : '2x_PureVision.onnx';
  worker.postMessage({ type: 'load', modelUrl: new URL('./model/' + modelFile, location.href).href });
}

// ── Strength ──────────────────────────────────────────────────
const DEFAULT_STRENGTH = 80;
function resetStrength() {
  S.strength = DEFAULT_STRENGTH;
  $('strength').value          = DEFAULT_STRENGTH;
  $('slider-fill').style.width = DEFAULT_STRENGTH + '%';
  $('str-num').textContent     = DEFAULT_STRENGTH + '%';
}

// ── Image loading ─────────────────────────────────────────────
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

async function loadFile(file) {
  if (!file || !ALLOWED_TYPES.has(file.type)) return;
  S.inputFilename = file.name?.replace(/\.[^.]+$/, '') ?? 'image';
  try {
    const bmp = await createImageBitmap(file);
    const c   = document.createElement('canvas');
    c.width   = bmp.width;
    c.height  = bmp.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(bmp, 0, 0);
    bmp.close();
    const raw = ctx.getImageData(0, 0, c.width, c.height);

    let hasAlpha = false;
    for (let i = 3; i < raw.data.length; i += 4) if (raw.data[i] < 255) { hasAlpha = true; break; }

    let flatImg;
    if (hasAlpha) {
      S.alphaMask = new Uint8Array(raw.data.length / 4);
      for (let i = 0; i < S.alphaMask.length; i++) S.alphaMask[i] = raw.data[i * 4 + 3];
      const flat  = document.createElement('canvas');
      flat.width  = c.width;
      flat.height = c.height;
      const fctx  = flat.getContext('2d');
      fctx.fillStyle = '#ffffff';
      fctx.fillRect(0, 0, flat.width, flat.height);
      fctx.drawImage(c, 0, 0);
      flatImg = fctx.getImageData(0, 0, flat.width, flat.height);
    } else {
      S.alphaMask = null;
      flatImg     = raw;
    }

    S.inputImg      = flatImg;
    S.processedImgs = { a: null, b: null };
    S.processedFor  = null;
    S.imageState      = 'orig';
    S.lastElapsed     = { a: null, b: null };
    resetStrength();
    setStrengthEnabled(false);
    $('btn-process').classList.remove('done');
    $('btn-dl').disabled                = true;
    if (S.viewMode === 'pixel') {
      S.viewMode = 'fit';
      S.panX = 0; S.panY = 0;
      viewer.classList.remove('pixel-mode');
      cvBefore.style.transform = '';
      cvAfter.style.transform  = '';
      updateViewModeDisplay();
    }
    renderViewer(S.inputImg, null);
    $('canvas-area').classList.add('viewer-active');
    $('vmode-toggle').classList.remove('disabled');
    $('vmode-seg-fit').disabled    = false;
    $('vmode-seg-pixel').disabled  = false;
    $('iinfo-dim').textContent          = t('px-dims', c.width, c.height);
    $('iinfo-disp').textContent         = '—';
    $('img-info-section').style.display = 'block';
    updateStateGrid();
    $('btn-clear').disabled      = false;
    setProcStatus(null);
    updateProcessBtn();
  } catch { /* silently ignore invalid files */ }
}

function updateStateGrid() {
  const grid = $('img-state-grid');
  if (!grid) return;
  if (S.imageState === 'none') {
    grid.style.display = 'none';
    return;
  }
  grid.style.display              = 'grid';
  $('side-left-val').textContent  = t('side-orig');
  $('side-right-val').textContent = S.imageState === 'done'
    ? t('side-done', S.filterChoice)
    : t('side-orig');
}

function clearImage() {
  if (!S.inputImg) return;
  S.inputImg      = null;
  S.alphaMask     = null;
  S.processedImgs = { a: null, b: null };
  S.processedFor  = null;
  S.imageState       = 'none';
  S.lastElapsed      = { a: null, b: null };
  S.processAfterLoad = false;
  if (S.viewMode === 'pixel') {
    S.viewMode = 'fit';
    S.panX = 0; S.panY = 0;
    viewer.classList.remove('pixel-mode');
    cvBefore.style.transform = '';
    cvAfter.style.transform  = '';
    updateViewModeDisplay();
  }
  resetStrength();
  setStrengthEnabled(false);
  $('btn-process').classList.remove('done');
  updateStateGrid();
  $('viewer').style.display           = 'none';
  $('canvas-area').classList.remove('viewer-active');
  $('drop-idle').style.display        = 'flex';
  $('img-info-section').style.display = 'none';
  $('btn-clear').disabled             = true;
  $('btn-dl').disabled                = true;
  $('vmode-toggle').classList.add('disabled');
  $('vmode-seg-fit').disabled    = true;
  $('vmode-seg-pixel').disabled  = true;
  setProcStatus(null);
  updateProcessBtn();
}

function updateProcessBtn() {
  const hasFreshResult = S.processedImgs[S.filterChoice]
    && S.processedFor === S.inputImg;
  const btn = $('btn-process');
  btn.style.transition = 'none';
  if (hasFreshResult && !S.processing) {
    btn.disabled = true;
    btn.classList.add('done');
  } else {
    btn.disabled = !(S.inputImg && !S.processing && !S.filterLoading);
    btn.classList.remove('done');
  }
  requestAnimationFrame(() => { btn.style.transition = ''; });
  const lock = S.processing || S.filterLoading;
  $('fchoice-a').disabled = lock;
  $('fchoice-b').disabled = lock;
}

// ── Viewer ────────────────────────────────────────────────────
function renderViewer(before, after) {
  cvBefore.width  = before.width;  cvBefore.height = before.height;
  cvBefore.getContext('2d').putImageData(before, 0, 0);
  const src = after || before;
  cvAfter.width   = src.width;     cvAfter.height  = src.height;
  cvAfter.getContext('2d').putImageData(src, 0, 0);
  $('drop-idle').style.display = 'none';
  viewer.style.display         = 'block';
  if (S.viewMode === 'pixel') {
    const tx = `translate(calc(-50% + ${S.panX}px), calc(-50% + ${S.panY}px))`;
    cvBefore.style.transform = tx;
    cvAfter.style.transform  = tx;
    requestAnimationFrame(() => { updatePixelModeClip(); updateDisplaySize(); });
  } else {
    requestAnimationFrame(() => { setSlider(S.sliderPct); updateDisplaySize(); });
  }
}

function updateDisplaySize() {
  if (!S.inputImg) return;
  if (S.viewMode === 'pixel') {
    $('iinfo-disp').textContent = t('px-dims', S.inputImg.width, S.inputImg.height);
    return;
  }
  const r = cvBefore.getBoundingClientRect();
  $('iinfo-disp').textContent = t('px-dims', Math.round(r.width), Math.round(r.height));
}

function applyBlend() {
  const proc = S.processedImgs[S.filterChoice];
  if (!S.inputImg || !proc) return;
  // cvBefore already holds S.inputImg (painted by renderViewer on load / filter-switch).
  // Only cvAfter needs updating — avoids a redundant full putImageData on the before canvas.
  cvAfter.getContext('2d').putImageData(blendImgs(S.inputImg, proc, S.strength / 100), 0, 0);
  requestAnimationFrame(() => {
    if (S.viewMode === 'pixel') updatePixelModeClip(); else setSlider(S.sliderPct);
  });
}

function setSlider(pct) {
  S.sliderPct = pct;
  if (S.viewMode === 'pixel') { updatePixelModeClip(); return; }
  const viewerRect = viewer.getBoundingClientRect();
  const canvasRect = cvAfter.getBoundingClientRect();
  const cvBRect    = cvBefore.getBoundingClientRect();
  const sliderPx   = pct / 100 * viewerRect.width;
  const clipLeft   = Math.max(0, sliderPx - (canvasRect.left - viewerRect.left));
  cvAfter.style.clipPath = `inset(0 0 0 ${canvasRect.width > 0 ? clipLeft / canvasRect.width * 100 : pct}%)`;
  vdivider.style.left    = pct + '%';
  const topPx    = Math.round(cvBRect.top - viewerRect.top);
  const heightPx = Math.round(cvBRect.height);
  viewer.style.setProperty('--img-top-px',    topPx              + 'px');
  viewer.style.setProperty('--img-bottom-px', (topPx + heightPx) + 'px');
}

const viewer   = $('viewer');
const vdivider = $('vdivider');
const cvBefore = $('cv-before');
const cvAfter  = $('cv-after');

vdivider.addEventListener('pointerdown', e => {
  e.preventDefault();
  vdivider.setPointerCapture(e.pointerId);
  S.dragging = true;
  doSlide(e);
});
vdivider.addEventListener('pointermove', e => {
  if (!S.dragging) return;
  doSlide(e);
});
vdivider.addEventListener('pointerup',     () => S.dragging = false);
vdivider.addEventListener('pointercancel', () => S.dragging = false);

function doSlide(e) {
  const r = viewer.getBoundingClientRect();
  setSlider(Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)));
}

// ── Pixel mode / pan ─────────────────────────────────────────
function updatePixelModeClip() {
  if (S.viewMode !== 'pixel') return;
  const w = cvAfter.width;
  if (!w) return;
  const clipPct = Math.max(0, Math.min(100, 50 - (S.panX / w) * 100));
  cvAfter.style.clipPath = `inset(0 0 0 ${clipPct}%)`;
  vdivider.style.left    = '50%';
}

function toggleViewMode() {
  if (!S.inputImg) return;
  if (S.viewMode === 'fit') {
    S.viewMode = 'pixel';
    S.panX = 0; S.panY = 0;
    viewer.classList.add('pixel-mode');
    updateViewModeDisplay();
    requestAnimationFrame(() => { updatePixelModeClip(); updateDisplaySize(); });
  } else {
    S.viewMode = 'fit';
    viewer.classList.remove('pixel-mode');
    cvBefore.style.transform = '';
    cvAfter.style.transform  = '';
    updateViewModeDisplay();
    requestAnimationFrame(() => { setSlider(50); updateDisplaySize(); });
  }
}

function updateViewModeDisplay() {
  const isFit    = S.viewMode === 'fit';
  const segFit   = $('vmode-seg-fit');
  const segPixel = $('vmode-seg-pixel');
  const desc     = $('vmode-desc');
  if (segFit)   segFit.classList.toggle('active',  isFit);
  if (segPixel) segPixel.classList.toggle('active', !isFit);
  if (desc)     desc.textContent = t(isFit ? 'vmode-desc-fit' : 'vmode-desc-pixel');
}

function setViewMode(mode) {
  if (S.viewMode === mode || !S.inputImg) return;
  toggleViewMode();
}

viewer.addEventListener('pointerdown', e => {
  if (S.viewMode !== 'pixel') return;
  if (e.target !== cvBefore && e.target !== cvAfter) return;
  e.preventDefault();
  viewer.setPointerCapture(e.pointerId);
  S.panning      = true;
  S.panStartX    = e.clientX;
  S.panStartY    = e.clientY;
  S.panStartPanX = S.panX;
  S.panStartPanY = S.panY;
  viewer.classList.add('panning-active');
});
viewer.addEventListener('pointermove', e => {
  if (!S.panning) return;
  const vW = viewer.clientWidth, vH = viewer.clientHeight;
  const cW = cvAfter.width,      cH = cvAfter.height;
  S.panX = Math.max(60 - vW / 2 - cW / 2, Math.min(vW / 2 + cW / 2 - 60,  S.panStartPanX + (e.clientX - S.panStartX)));
  S.panY = Math.max(60 - vH / 2 - cH / 2, Math.min(vH / 2 + cH / 2 - 60, S.panStartPanY + (e.clientY - S.panStartY)));
  const tx = `translate(calc(-50% + ${S.panX}px), calc(-50% + ${S.panY}px))`;
  cvBefore.style.transform = tx;
  cvAfter.style.transform  = tx;
  updatePixelModeClip();
});
const endPan = () => { S.panning = false; viewer.classList.remove('panning-active'); };
viewer.addEventListener('pointerup',     endPan);
viewer.addEventListener('pointercancel', endPan);

window.addEventListener('resize', () => {
  if (S.inputImg && viewer.style.display !== 'none') {
    requestAnimationFrame(() => {
      if (S.viewMode === 'pixel') updatePixelModeClip(); else setSlider(S.sliderPct);
      updateDisplaySize();
    });
  }
});

// ── Strength slider ───────────────────────────────────────────
$('strength').addEventListener('input', e => {
  const v = +e.target.value;
  S.strength                   = v;
  $('slider-fill').style.width = v + '%';
  $('str-num').textContent     = v + '%';
  const proc = S.processedImgs[S.filterChoice];
  if (proc && S.processedFor === S.inputImg) {
    cvAfter.getContext('2d').putImageData(blendImgs(S.inputImg, proc, v / 100), 0, 0);
  }
});

// ── Process / cancel ──────────────────────────────────────────
function processImage() {
  if (!S.inputImg || S.processing) return;

  // Filter not ready — trigger load first, then auto-process on completion
  if (!S.filterReady || S.filterLoaded !== S.filterChoice) {
    if (S.filterLoading) return;
    S.processAfterLoad = true;
    loadFilter();
    return;
  }

  // Fresh result already exists for this image + filter — just re-apply blend
  if (S.processedImgs[S.filterChoice] && S.processedFor === S.inputImg) {
    applyBlend();
    $('btn-dl').disabled = false;
    return;
  }

  S.processing = true;
  updateProcessBtn();
  $('btn-clear').disabled        = true;
  $('btn-process').style.display = 'none';
  $('btn-cancel').style.display  = '';
  $('proc-prog').classList.add('on');
  $('proc-fill').className       = 'prog-fill spin';
  $('proc-fill').style.width     = '';
  $('proc-label').textContent    = t('proc-pct', 0);
  setProcStatus(null);
  S.t0 = performance.now();
  const imgBuf = S.inputImg.data.buffer.slice(0);
  worker.postMessage(
    { type: 'run', imgBuffer: imgBuf, W: S.inputImg.width, H: S.inputImg.height },
    [imgBuf]
  );
}

function cancelProcessing() {
  if (!S.processing) return;
  worker.terminate();
  worker             = null;
  S.filterReady      = false;
  S.filterLoaded     = null;
  S.filterLoading    = false;
  S.processAfterLoad = false;
  setFilterStatus(null);
  updateGpuStatus();
  endProcessing(true);
}

// ── Blend + download ──────────────────────────────────────────
function blendImgs(orig, proc, s) {
  const o   = new ImageData(orig.width, orig.height);
  const inv = 1 - s;
  const mask = S.alphaMask;
  // Two specialised loops avoid a per-pixel branch and eliminate the second
  // alpha-restore pass that existed when alphaMask was applied separately.
  if (mask) {
    for (let i = 0, j = 0; i < orig.data.length; i += 4, j++) {
      o.data[i]   = (orig.data[i]   * inv + proc.data[i]   * s + 0.5) | 0;
      o.data[i+1] = (orig.data[i+1] * inv + proc.data[i+1] * s + 0.5) | 0;
      o.data[i+2] = (orig.data[i+2] * inv + proc.data[i+2] * s + 0.5) | 0;
      o.data[i+3] = mask[j];
    }
  } else {
    for (let i = 0; i < orig.data.length; i += 4) {
      o.data[i]   = (orig.data[i]   * inv + proc.data[i]   * s + 0.5) | 0;
      o.data[i+1] = (orig.data[i+1] * inv + proc.data[i+1] * s + 0.5) | 0;
      o.data[i+2] = (orig.data[i+2] * inv + proc.data[i+2] * s + 0.5) | 0;
      o.data[i+3] = orig.data[i+3];
    }
  }
  return o;
}

function downloadResult() {
  const proc = S.processedImgs[S.filterChoice];
  if (!proc) return;
  const b = blendImgs(S.inputImg, proc, S.strength / 100);
  const c = document.createElement('canvas');
  c.width  = b.width;
  c.height = b.height;
  c.getContext('2d').putImageData(b, 0, 0);
  const filterName = S.filterChoice === 'a'
    ? (lang === 'ja' ? 'シャープ' : 'sharp')
    : (lang === 'ja' ? 'ソフト'   : 'soft');
  const sfx = lang === 'ja'
    ? `_除去_${filterName}_${S.strength}`
    : `_denoised_${filterName}_${S.strength}`;
  const filename = S.inputFilename + sfx + '.png';
  // toBlob is async — avoids blocking the main thread with a synchronous PNG encode.
  c.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.download = filename;
    a.href     = url;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
  showToast(t('toast-dl'));
}

// ── File / drag / paste ───────────────────────────────────────
$('file-input').addEventListener('change', e => { loadFile(e.target.files[0]); e.target.value = ''; });

const dropIdle = $('drop-idle');
dropIdle.addEventListener('dragover',  e => { e.preventDefault(); dropIdle.classList.add('drag-over'); });
dropIdle.addEventListener('dragleave', ()  => dropIdle.classList.remove('drag-over'));
dropIdle.addEventListener('drop', e => {
  e.preventDefault();
  dropIdle.classList.remove('drag-over');
  loadFile(e.dataTransfer.files[0]);
});

let dc = 0;
document.addEventListener('dragenter', e => { e.preventDefault(); dc++; $('drag-overlay').classList.add('on'); });
document.addEventListener('dragleave', () => { dc = Math.max(0, dc - 1); if (!dc) $('drag-overlay').classList.remove('on'); });
document.addEventListener('dragover',  e => e.preventDefault());
document.addEventListener('drop', e => {
  e.preventDefault();
  dc = 0;
  $('drag-overlay').classList.remove('on');
  const f = e.dataTransfer.files[0];
  if (f && ALLOWED_TYPES.has(f.type)) loadFile(f);
});
document.addEventListener('paste', e => {
  for (const item of (e.clipboardData?.items || [])) {
    if (item.type.startsWith('image/') && ALLOWED_TYPES.has(item.type)) {
      loadFile(item.getAsFile());
      break;
    }
  }
});

// ── Cookies ───────────────────────────────────────────────────
function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + days * 864e5);
  document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}
function getCookie(name) {
  const v = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith(name + '='));
  return v ? v.split('=')[1] : null;
}

// ── GPU detection ─────────────────────────────────────────────
let gpuAvailable = null;
const gpuEl     = document.getElementById('t-gpu-status');
const gpuDot    = document.getElementById('gpu-banner-dot');
const gpuBanner = document.getElementById('gpu-banner');

function updateGpuStatus() {
  if (!gpuEl) return;
  if (gpuAvailable === null) {
    gpuEl.textContent       = '';
    gpuBanner.style.display = 'none';
  } else if (gpuAvailable) {
    gpuEl.textContent       = t('gpu-status-ok');
    gpuDot.className        = 'gpu-banner-dot gpu-banner-dot--ok';
    gpuBanner.style.display = 'flex';
  } else {
    gpuEl.textContent       = t('gpu-status-no');
    gpuDot.className        = 'gpu-banner-dot gpu-banner-dot--warn';
    gpuBanner.style.display = 'flex';
  }
}

(async function detectGpu() {
  try {
    gpuAvailable = !!(navigator.gpu && await navigator.gpu.requestAdapter());
  } catch (e) {
    gpuAvailable = false;
  }
  updateGpuStatus();
}());

// ── Mobile warning ────────────────────────────────────────────
function dismissMobileWarning() {
  $('mobile-warning').classList.remove('on');
  sessionStorage.setItem('mwarn-dismissed', '1');
}

if (!sessionStorage.getItem('mwarn-dismissed') && window.matchMedia('(pointer: coarse)').matches) {
  $('mobile-warning').classList.add('on');
}

// ── Init ──────────────────────────────────────────────────────
const savedLang = getCookie('lang');
if (savedLang === 'ja' || savedLang === 'en') {
  lang = savedLang;
  document.querySelectorAll('.lang-switch button').forEach((b, i) => {
    b.classList.toggle('active', (i === 0 && lang === 'ja') || (i === 1 && lang === 'en'));
  });
}

applyLang();

// Explicitly reset button states on every page load. The browser's form state
// restoration can leave buttons visually enabled from the previous session while
// JS state is reset to empty — this ensures they always match the actual state.
$('btn-dl').disabled    = true;
$('btn-clear').disabled = true;
$('btn-process').classList.remove('done');

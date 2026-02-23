'use strict';

let worker = null;

// ── i18n ─────────────────────────────────────────────────────
const TX = {
  ja: {
    'logo':              '画像圧縮ノイズ除去',
    'drag':              'ここにドロップ',
    'drop-label':        '画像をドロップ',
    'drop-sub':          'クリックしてファイルを選択 &nbsp;·&nbsp; <kbd>Ctrl+V</kbd> でペースト',
    'before':            '除去前',
    'after':             '除去後',
    'sb-filter':         'フィルタ',
    'fchoice-a':         'シャープ',
    'fchoice-b':         '自然（低速）',
    'btn-load':          'フィルタを読み込む',
    'btn-load-loading':  '読み込み中...',
    'btn-load-loaded':   '読み込み済み',
    'sb-strength':       '除去の強さ',
    'str-lo':            '元の画像（0%）',
    'str-hi':            '最大除去（100%）',
    'btn-process':       'ノイズを除去',
    'btn-cancel':        'キャンセル',
    'btn-dl':            '結果を保存',
    'btn-clear':         '画像をクリア',
    'side-orig':         '元の画像',
    'side-done':         f => f === 'a' ? 'シャープ フィルタ 適用済み' : '自然 フィルタ 適用済み',
    'about-title':       'このツールについて',
    'sb-desc-1':         '画像の圧縮アーティファクトやノイズを除去します。',
    'sb-desc-2':         'ブラウザ内で完結します。選択したフィルタ（約32 MB）は初回のみダウンロードされ、ローカルに保存されます。',
    'sb-desc-3':         'GPUが利用可能な場合はGPUで処理します。GPUがない場合は処理に時間がかかる場合があります。',
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
  },
  en: {
    'logo':              'Image Artifact Removal',
    'drag':              'Drop image here',
    'drop-label':        'Drop an image here',
    'drop-sub':          'Click to browse &nbsp;·&nbsp; paste with <kbd>Ctrl+V</kbd>',
    'before':            'Before',
    'after':             'After',
    'sb-filter':         'Filter',
    'fchoice-a':         'Sharp',
    'fchoice-b':         'Natural (slower)',
    'btn-load':          'Load filter',
    'btn-load-loading':  'Loading...',
    'btn-load-loaded':   'Loaded',
    'sb-strength':       'Correction strength',
    'str-lo':            'Original image (0%)',
    'str-hi':            'Full correction (100%)',
    'btn-process':       'Remove noise',
    'btn-cancel':        'Cancel',
    'btn-dl':            'Save result',
    'btn-clear':         'Clear image',
    'side-orig':         'Original image',
    'side-done':         f => f === 'a' ? 'Sharp filter applied' : 'Natural filter applied',
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
    'gpu-status-no':           'GPU not available — processing will be much slower',
    'bl-original':             'Input resolution',
    'bl-displayed':            'Rendered size',
    'px-dims':           (w, h) => `${w} × ${h} px`,
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
  't-btn-load':                'btn-load',
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
};

function applyLang() {
  document.documentElement.lang = lang;
  document.title = t('logo');
  for (const [id, key] of Object.entries(tMap)) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = t(key);
  }
  syncFilterUI();
  if (S.lastElapsed !== null) $('proc-status').textContent = t('proc-ok', S.lastElapsed);
  updateStateGrid();
  updateProcessBtn();
  updateGpuStatus();
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
  inputFilename:   'image',
  filterChoice:    'a',
  filterLoaded:    null,
  filterReady:     false,
  filterLoading:   false,
  inputImg:        null,
  alphaMask:       null,
  processedImg:    null,
  processedFor:    null,
  processedFilter: null,
  strength:        80,
  imageState:      'none',
  lastElapsed:     null,
  sliderPct:       50,
  dragging:        false,
  processing:      false,
  t0:              0,
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

// ── Worker message handler ────────────────────────────────────
function handleWorkerMsg({ data: msg }) {
  switch (msg.type) {

    case 'log':
      console.log('[worker]', msg.msg);
      break;

    case 'load-ok':
      S.filterReady   = true;
      S.filterLoading = false;
      S.filterLoaded  = S.filterChoice;
      syncFilterUI();
      updateProcessBtn();
      break;

    case 'proc-progress':
      $('proc-fill').className    = 'prog-fill';
      $('proc-fill').style.width  = msg.pct + '%';
      $('proc-label').textContent = t('proc-pct', Math.round(msg.pct));
      break;

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
        S.processedImg = ctx2.getImageData(0, 0, W, H);
      } else {
        S.processedImg = new ImageData(new Uint8ClampedArray(msg.resultBuf), W, H);
      }
      S.processedFor    = S.inputImg;
      S.processedFilter = S.filterChoice;
      S.imageState      = 'done';
      S.lastElapsed     = ((performance.now() - S.t0) / 1000).toFixed(1);
      applyBlend();
      updateStateGrid();
      setStrengthEnabled(true);
      $('btn-dl').disabled         = false;
      $('proc-status').textContent = t('proc-ok', S.lastElapsed);
      $('proc-status').className   = 'inline-status';
      showToast(t('toast-ok'));
      endProcessing(false);
      break;
    }

    case 'error':
      if (S.filterLoading) {
        S.filterLoading = false;
        syncFilterUI();
        const ls     = $('load-status');
        ls.textContent   = t('load-err') + ' (' + msg.message + ')';
        ls.className     = 'inline-status err';
        ls.style.display = '';
      } else if (S.processing) {
        $('proc-status').textContent = t('proc-err') + ' ' + msg.message;
        $('proc-status').className   = 'inline-status err';
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
    $('proc-status').textContent = t('proc-cancelled');
    $('proc-status').className   = 'inline-status';
    showToast(t('toast-cancel'));
  }
}

// ── Filter selection ──────────────────────────────────────────
function selectFilter(choice) {
  if (S.processing || S.filterLoading || S.filterChoice === choice) return;
  S.filterChoice = choice;
  $('fchoice-a').classList.toggle('active', choice === 'a');
  $('fchoice-b').classList.toggle('active', choice === 'b');
  syncFilterUI();
  updateProcessBtn();
}

function syncFilterUI() {
  if (S.filterLoading) {
    $('btn-load').disabled    = true;
    $('btn-load').textContent = t('btn-load-loading');
    $('btn-load').classList.remove('btn-load--loaded');
    return;
  }
  const selectedReady = S.filterReady && S.filterLoaded === S.filterChoice;
  $('btn-load').disabled    = selectedReady;
  $('btn-load').textContent = selectedReady ? t('btn-load-loaded') : t('btn-load');
  $('btn-load').classList.toggle('btn-load--loaded', selectedReady);
  updateGpuStatus();
}

// ── Filter loading ────────────────────────────────────────────
function loadFilter() {
  if (S.filterLoading) return;
  if (worker) { worker.terminate(); worker = null; }
  S.filterLoading = true;
  S.filterReady   = false;
  S.filterLoaded  = null;
  const ls = $('load-status');
  ls.textContent   = '';
  ls.style.display = 'none';
  syncFilterUI();
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

function loadFile(file) {
  if (!file || !ALLOWED_TYPES.has(file.type)) return;
  S.inputFilename = file.name ? file.name.replace(/\.[^.]+$/, '') : 'image';
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const c   = document.createElement('canvas');
      c.width   = img.naturalWidth;
      c.height  = img.naturalHeight;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
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

      S.inputImg        = flatImg;
      S.processedImg    = null;
      S.processedFor    = null;
      S.processedFilter = null;
      S.imageState      = 'orig';
      S.lastElapsed     = null;
      resetStrength();
      setStrengthEnabled(false);
      $('btn-process').classList.remove('done');
      $('btn-dl').disabled                = true;
      renderViewer(S.inputImg, null);
      $('canvas-area').classList.add('viewer-active');
      $('iinfo-dim').textContent          = t('px-dims', c.width, c.height);
      $('iinfo-disp').textContent         = '—';
      $('img-info-section').style.display = 'block';
      updateStateGrid();
      $('btn-clear').disabled      = false;
      $('proc-status').textContent = '';
      $('proc-status').className   = 'inline-status';
      updateProcessBtn();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
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
    ? t('side-done', S.processedFilter || S.filterChoice)
    : t('side-orig');
}

function clearImage() {
  if (!S.inputImg) return;
  S.inputImg        = null;
  S.alphaMask       = null;
  S.processedImg    = null;
  S.processedFor    = null;
  S.processedFilter = null;
  S.imageState      = 'none';
  S.lastElapsed     = null;
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
  $('proc-status').textContent        = '';
  $('proc-status').className          = 'inline-status';
  updateProcessBtn();
}

function updateProcessBtn() {
  const selectedReady  = S.filterReady && S.filterLoaded === S.filterChoice;
  const hasFreshResult = S.processedImg
    && S.processedFor    === S.inputImg
    && S.processedFilter === S.filterChoice;
  const btn = $('btn-process');
  btn.style.transition = 'none';
  if (hasFreshResult && !S.processing) {
    btn.disabled = true;
    btn.classList.add('done');
  } else {
    btn.disabled = !(selectedReady && S.inputImg && !S.processing);
    btn.classList.remove('done');
  }
  requestAnimationFrame(() => { btn.style.transition = ''; });
  const lock = S.processing || S.filterLoading;
  $('fchoice-a').disabled = lock;
  $('fchoice-b').disabled = lock;
}

// ── Viewer ────────────────────────────────────────────────────
function renderViewer(before, after) {
  const cvB = $('cv-before'), cvA = $('cv-after');
  cvB.width  = before.width;  cvB.height = before.height;
  cvB.getContext('2d').putImageData(before, 0, 0);
  const src  = after || before;
  cvA.width  = src.width;     cvA.height = src.height;
  cvA.getContext('2d').putImageData(src, 0, 0);
  $('drop-idle').style.display = 'none';
  $('viewer').style.display    = 'block';
  requestAnimationFrame(() => { setSlider(S.sliderPct); updateDisplaySize(); });
}

function updateDisplaySize() {
  if (!S.inputImg) return;
  const r = $('cv-before').getBoundingClientRect();
  $('iinfo-disp').textContent = t('px-dims', Math.round(r.width), Math.round(r.height));
}

function applyBlend() {
  if (!S.inputImg || !S.processedImg) return;
  renderViewer(S.inputImg, blendImgs(S.inputImg, S.processedImg, S.strength / 100));
}

function setSlider(pct) {
  S.sliderPct = pct;
  const cvA        = $('cv-after');
  const viewerEl   = $('viewer');
  const viewerRect = viewerEl.getBoundingClientRect();
  const canvasRect = cvA.getBoundingClientRect();
  const sliderPx   = pct / 100 * viewerRect.width;
  const clipLeft   = Math.max(0, sliderPx - (canvasRect.left - viewerRect.left));
  cvA.style.clipPath       = `inset(0 0 0 ${canvasRect.width > 0 ? clipLeft / canvasRect.width * 100 : pct}%)`;
  $('vdivider').style.left = pct + '%';

  const viewerTop = viewerRect.top;
  const cvBRect   = $('cv-before').getBoundingClientRect();
  const topPx     = Math.round(cvBRect.top - viewerTop);
  const heightPx  = Math.round(cvBRect.height);
  viewerEl.style.setProperty('--img-top-px',    topPx              + 'px');
  viewerEl.style.setProperty('--img-bottom-px', (topPx + heightPx) + 'px');
}

const viewer = $('viewer');
viewer.addEventListener('mousedown',  e => { S.dragging = true;  doSlide(e); });
viewer.addEventListener('touchstart', e => { S.dragging = true;  doSlide(e); }, { passive: true });
window.addEventListener('mousemove',  e => { if (S.dragging) doSlide(e); });
window.addEventListener('touchmove',  e => { if (S.dragging) doSlide(e); }, { passive: true });
window.addEventListener('mouseup',    () => S.dragging = false);
window.addEventListener('touchend',   () => S.dragging = false);

function doSlide(e) {
  const r  = viewer.getBoundingClientRect();
  const cx = e.touches ? e.touches[0].clientX : e.clientX;
  setSlider(Math.max(0, Math.min(100, (cx - r.left) / r.width * 100)));
}

window.addEventListener('resize', () => {
  if (S.inputImg && $('viewer').style.display !== 'none') {
    requestAnimationFrame(() => { setSlider(S.sliderPct); updateDisplaySize(); });
  }
});

// ── Strength slider ───────────────────────────────────────────
$('strength').addEventListener('input', function () {
  const snapped = Math.round(parseInt(this.value) / 10) * 10;
  this.value                   = snapped;
  S.strength                   = snapped;
  $('slider-fill').style.width = snapped + '%';
  $('str-num').textContent     = snapped + '%';
  if (S.processedImg && S.processedFor === S.inputImg && S.processedFilter === S.filterChoice) {
    const b   = blendImgs(S.inputImg, S.processedImg, snapped / 100);
    const cvA = $('cv-after');
    cvA.width  = b.width;
    cvA.height = b.height;
    cvA.getContext('2d').putImageData(b, 0, 0);
  }
});

// ── Process / cancel ──────────────────────────────────────────
function processImage() {
  if (!S.filterReady || S.filterLoaded !== S.filterChoice || !S.inputImg || S.processing) return;
  if (S.processedImg && S.processedFor === S.inputImg && S.processedFilter === S.filterChoice) {
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
  $('proc-status').textContent   = '';
  $('proc-status').className     = 'inline-status';
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
  worker          = null;
  S.filterReady   = false;
  S.filterLoaded  = null;
  S.filterLoading = false;
  syncFilterUI();
  endProcessing(true);
}

// ── Blend + download ──────────────────────────────────────────
function blendImgs(orig, proc, s) {
  const o = new ImageData(orig.width, orig.height);
  for (let i = 0; i < orig.data.length; i++) {
    o.data[i] = (i & 3) === 3
      ? orig.data[i]
      : (orig.data[i] * (1 - s) + proc.data[i] * s + 0.5) | 0;
  }
  if (S.alphaMask) {
    for (let i = 0; i < S.alphaMask.length; i++) o.data[i * 4 + 3] = S.alphaMask[i];
  }
  return o;
}

function downloadResult() {
  if (!S.processedImg) return;
  const b = blendImgs(S.inputImg, S.processedImg, S.strength / 100);
  const c = document.createElement('canvas');
  c.width  = b.width;
  c.height = b.height;
  c.getContext('2d').putImageData(b, 0, 0);
  const filterName = S.processedFilter === 'a'
    ? (lang === 'ja' ? 'シャープ' : 'sharp')
    : (lang === 'ja' ? '自然'     : 'natural');
  const sfx = lang === 'ja'
    ? `_除去_${filterName}_${S.strength}`
    : `_denoised_${filterName}_${S.strength}`;
  const a    = document.createElement('a');
  a.download = S.inputFilename + sfx + '.png';
  a.href     = c.toDataURL('image/png');
  a.click();
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

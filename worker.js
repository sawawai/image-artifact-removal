'use strict';

importScripts('https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.2/dist/ort.all.min.js');

// 512px tiles with 64px overlap → step of 448px.
// ~3× fewer session.run() calls vs 256px tiles on 1080p images.
const TILE = 512;
const OV   = 64;

let session     = null;
let modelScale  = 1;   // 1 for model 'a' (1x_PureVision), 2 for model 'b' (2x_PureVision)
let isNHWC      = false;

// Models are fp16 — build tile data directly into Float16Array to avoid
// a separate f32→f16 conversion step. Falls back to f32 if Float16Array
// is unavailable (very old environments).
const F16OK   = typeof Float16Array !== 'undefined';
const tileBuf = F16OK
  ? new Float16Array(3 * TILE * TILE)   // written directly, no f32 intermediate
  : new Float32Array(3 * TILE * TILE);
const DTYPE   = F16OK ? 'float16' : 'float32';

async function loadModel(modelUrl) {
  ort.env.wasm.wasmPaths  = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.2/dist/';
  ort.env.wasm.numThreads = Math.max(1, (navigator.hardwareConcurrency || 4) - 1);

  // ── Download model ────────────────────────────────────────────
  const resp = await fetch(modelUrl);
  if (!resp.ok) throw new Error('HTTP ' + resp.status + ' fetching model');
  const total  = parseInt(resp.headers.get('Content-Length') || '0');
  const reader = resp.body.getReader();
  const chunks = [];
  let got = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    got += value.length;
    if (total > 0) postMessage({ type: 'dl-progress', pct: Math.round(got / total * 100) });
  }
  const buf = new Uint8Array(got);
  let off = 0;
  for (const c of chunks) { buf.set(c, off); off += c.length; }
  postMessage({ type: 'dl-done' });

  // Scale is determined by which model file was requested — no need to probe
  modelScale = modelUrl.includes('2x_') ? 2 : 1;

  // ── Select execution providers ────────────────────────────────
  let providers = ['wasm'];
  if (typeof navigator !== 'undefined' && navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) {
        providers = ['webgpu', 'wasm'];
        postMessage({ type: 'log', msg: 'WebGPU adapter: ' + (adapter.info?.description || 'unknown') });
      } else {
        postMessage({ type: 'log', msg: 'WebGPU: requestAdapter returned null' });
      }
    } catch (e) {
      postMessage({ type: 'log', msg: 'WebGPU adapter error: ' + e.message });
    }
  } else {
    postMessage({ type: 'log', msg: 'navigator.gpu not available' });
  }

  session = await ort.InferenceSession.create(buf.buffer.slice(0), {
    executionProviders: providers,
    graphOptimizationLevel: 'all',
  });

  // ── Detect output layout (NCHW vs NHWC) with a warm-up run ───
  // Firefox's wgpu backend returns NHWC [1,H,W,3] instead of NCHW [1,3,H,W].
  // Detect once at load time and select the matching blend function.
  // This also JIT-warms the session before real inference begins.
  {
    const inName  = session.inputNames[0];
    const outName = session.outputNames[0];
    const probe   = new ort.Tensor(DTYPE, new (F16OK ? Float16Array : Float32Array)(3 * TILE * TILE), [1, 3, TILE, TILE]);
    const res     = await session.run({ [inName]: probe });
    const dims    = res[outName].dims;
    isNHWC = (dims[3] === 3);
    postMessage({ type: 'log', msg: 'output dims: ' + dims.join(',') + ' isNHWC=' + isNHWC });
  }

  const backend = (providers[0] === 'webgpu') ? 'WebGPU' : 'WASM (CPU)';
  postMessage({ type: 'load-ok', backend });
}

// Fill the shared tileBuf (Float16Array or Float32Array) with TILE×TILE CHW data.
// Valid pixels come from the tw×th region at (tx,ty); rest is zero-padded.
// Writing directly to Float16Array avoids a separate f32→f16 conversion pass.
function fillTile(data, W, tx, ty, tw, th) {
  tileBuf.fill(0);
  const area = TILE * TILE;
  for (let py = 0; py < th; py++) {
    const srcRow = ((ty + py) * W + tx) * 4;
    const dstRow = py * TILE;
    for (let px = 0; px < tw; px++) {
      const s = srcRow + px * 4;
      tileBuf[dstRow + px]          = data[s]     / 255;
      tileBuf[area  + dstRow + px]  = data[s + 1] / 255;
      tileBuf[2*area + dstRow + px] = data[s + 2] / 255;
    }
  }
}

async function runTiled(imgBuf, W, H) {
  const data = new Uint8ClampedArray(imgBuf);
  const step = TILE - OV;
  const tiles = [];
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      const x2 = Math.min(x + TILE, W), y2 = Math.min(y + TILE, H);
      const tx = Math.max(0, x2 - TILE), ty = Math.max(0, y2 - TILE);
      tiles.push({ tx, ty, tw: x2 - tx, th: y2 - ty });
    }
  }

  const inName  = session.inputNames[0];
  const outName = session.outputNames[0];
  const scale   = modelScale;
  const outW    = W * scale;
  const outH    = H * scale;

  const outR  = new Float32Array(outW * outH);
  const outG  = new Float32Array(outW * outH);
  const outB  = new Float32Array(outW * outH);
  const outWt = new Float32Array(outW * outH);

  // Select blend function once — avoids a per-pixel branch inside the inner loop
  const blendTile = isNHWC ? blendNHWC : blendNCHW;

  for (let i = 0; i < tiles.length; i++) {
    const { tx, ty, tw, th } = tiles[i];
    fillTile(data, W, tx, ty, tw, th);

    const inp = new ort.Tensor(DTYPE, tileBuf, [1, 3, TILE, TILE]);
    const res = await session.run({ [inName]: inp });
    const od  = res[outName].data;

    const validOW = tw * scale;
    const validOH = th * scale;
    const otx     = tx * scale;
    const oty     = ty * scale;

    const wx = new Float32Array(validOW);
    const wy = new Float32Array(validOH);
    for (let p = 0; p < validOW; p++) wx[p] = Math.sin(Math.PI * (p + 0.5) / validOW);
    for (let p = 0; p < validOH; p++) wy[p] = Math.sin(Math.PI * (p + 0.5) / validOH);

    blendTile(od, validOW, validOH, otx, oty, outW, outH, wx, wy, outR, outG, outB, outWt);

    postMessage({ type: 'proc-progress', pct: (i + 1) / tiles.length * 100 });
  }

  const result = new Uint8ClampedArray(outW * outH * 4);
  for (let i = 0; i < outW * outH; i++) {
    const w = outWt[i] || 1;
    result[i*4]   = Math.max(0, Math.min(255, (outR[i] / w * 255 + 0.5) | 0));
    result[i*4+1] = Math.max(0, Math.min(255, (outG[i] / w * 255 + 0.5) | 0));
    result[i*4+2] = Math.max(0, Math.min(255, (outB[i] / w * 255 + 0.5) | 0));
    result[i*4+3] = 255;
  }
  return { buffer: result.buffer, scale, outW, outH };
}

// Blend functions — one per layout, selected at load time via function reference.

function blendNHWC(od, validOW, validOH, otx, oty, outW, outH, wx, wy, outR, outG, outB, outWt) {
  const oW = TILE * modelScale;
  for (let py = 0; py < validOH; py++) {
    const oy = oty + py; if (oy >= outH) continue;
    const db  = oy * outW;
    const wyp = wy[py];
    for (let px = 0; px < validOW; px++) {
      const ox = otx + px; if (ox >= outW) continue;
      const w    = wx[px] * wyp;
      const di   = db + ox;
      const base = (py * oW + px) * 3;
      outR[di] += Number(od[base])     * w;
      outG[di] += Number(od[base + 1]) * w;
      outB[di] += Number(od[base + 2]) * w;
      outWt[di] += w;
    }
  }
}

function blendNCHW(od, validOW, validOH, otx, oty, outW, outH, wx, wy, outR, outG, outB, outWt) {
  const oW = TILE * modelScale;
  const oa = oW * oW;
  for (let py = 0; py < validOH; py++) {
    const oy = oty + py; if (oy >= outH) continue;
    const db  = oy * outW;
    const wyp = wy[py];
    for (let px = 0; px < validOW; px++) {
      const ox = otx + px; if (ox >= outW) continue;
      const w  = wx[px] * wyp;
      const di = db + ox;
      const ri = py * oW + px;
      outR[di] += Number(od[ri])        * w;
      outG[di] += Number(od[oa  + ri])  * w;
      outB[di] += Number(od[2*oa + ri]) * w;
      outWt[di] += w;
    }
  }
}

self.onmessage = async ({ data: msg }) => {
  try {
    if (msg.type === 'load') {
      await loadModel(msg.modelUrl);
    } else if (msg.type === 'run') {
      const { buffer, scale, outW, outH } = await runTiled(msg.imgBuffer, msg.W, msg.H);
      postMessage({ type: 'run-ok', resultBuf: buffer, scale, outW, outH }, [buffer]);
    }
  } catch (e) {
    postMessage({ type: 'error', message: e.message });
  }
};

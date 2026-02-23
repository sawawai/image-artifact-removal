'use strict';

importScripts('https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.2/dist/ort.all.min.js');

const TILE = 256;
const OV   = 32;

let session = null;
let useF16  = true;
const F16OK = typeof Float16Array !== 'undefined';

async function loadModel(modelUrl) {
  ort.env.wasm.wasmPaths  = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.2/dist/';
  ort.env.wasm.numThreads = Math.max(1, (navigator.hardwareConcurrency || 4) - 1);

  const resp = await fetch(modelUrl);
  if (!resp.ok) throw new Error('HTTP ' + resp.status + ' fetching model');
  const total = parseInt(resp.headers.get('Content-Length') || '0');
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

  const backend = (providers[0] === 'webgpu') ? 'WebGPU' : 'WASM (CPU)';
  postMessage({ type: 'load-ok', backend });
}

function buildTile(data, W, tx, ty, tw, th) {
  const f32  = new Float32Array(3 * th * tw);
  const area = th * tw;
  for (let py = 0; py < th; py++) {
    const srcRow = ((ty + py) * W + tx) * 4;
    const dstRow = py * tw;
    for (let px = 0; px < tw; px++) {
      const s = srcRow + px * 4;
      f32[dstRow + px]          = data[s]     / 255;
      f32[area  + dstRow + px]  = data[s + 1] / 255;
      f32[2*area + dstRow + px] = data[s + 2] / 255;
    }
  }
  return f32;
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

  let scale = null, outW, outH;
  let outR, outG, outB, outWt;

  for (let i = 0; i < tiles.length; i++) {
    const { tx, ty, tw, th } = tiles[i];
    const f32 = buildTile(data, W, tx, ty, tw, th);

    let inp = (useF16 && F16OK)
      ? new ort.Tensor('float16', new Float16Array(f32), [1, 3, th, tw])
      : new ort.Tensor('float32', f32, [1, 3, th, tw]);

    let res;
    try {
      res = await session.run({ [inName]: inp });
    } catch (e) {
      if (useF16) {
        useF16 = false;
        res = await session.run({ [inName]: new ort.Tensor('float32', f32, [1, 3, th, tw]) });
      } else {
        throw e;
      }
    }

    const outTensor = res[outName];
    const od   = outTensor.data;
    const dims = outTensor.dims;
    const isNHWC = (dims[3] === 3);
    const oH = isNHWC ? dims[1] : dims[2];
    const oW = isNHWC ? dims[2] : dims[3];

    if (i === 0) {
      postMessage({ type: 'log', msg: 'output dims: ' + dims.join(',') + ' isNHWC=' + isNHWC });
    }

    if (scale === null) {
      scale = Math.max(1, Math.round(Math.max(oW / tw, oH / th)));
      outW  = Math.round(W * scale);
      outH  = Math.round(H * scale);
      outR  = new Float32Array(outW * outH);
      outG  = new Float32Array(outW * outH);
      outB  = new Float32Array(outW * outH);
      outWt = new Float32Array(outW * outH);
      postMessage({ type: 'log', msg: 'scale=' + scale + ' outW=' + outW + ' outH=' + outH });
    }

    const otx = Math.round(tx * scale);
    const oty = Math.round(ty * scale);
    const wx  = new Float32Array(oW);
    const wy  = new Float32Array(oH);
    for (let p = 0; p < oW; p++) wx[p] = Math.sin(Math.PI * (p + 0.5) / oW);
    for (let p = 0; p < oH; p++) wy[p] = Math.sin(Math.PI * (p + 0.5) / oH);

    for (let py = 0; py < oH; py++) {
      const oy  = oty + py; if (oy >= outH) continue;
      const db  = oy * outW;
      const wyp = wy[py];
      for (let px = 0; px < oW; px++) {
        const ox = otx + px; if (ox >= outW) continue;
        const w  = wx[px] * wyp;
        const di = db + ox;
        let r, g, b;
        if (isNHWC) {
          const base = (py * oW + px) * 3;
          r = Number(od[base]); g = Number(od[base + 1]); b = Number(od[base + 2]);
        } else {
          const ri = py * oW + px, oa = oH * oW;
          r = Number(od[ri]); g = Number(od[oa + ri]); b = Number(od[2*oa + ri]);
        }
        outR[di] += r * w; outG[di] += g * w; outB[di] += b * w; outWt[di] += w;
      }
    }

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

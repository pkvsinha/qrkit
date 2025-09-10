// examples/diff.js
import { encodeJS } from "../dist/esm/index.js";

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

// Load UMD reference encoder (defines window.qrcode)
await loadScript(
  "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"
);

function drawMatrix(ctx, grid, size, scale, margin = 4) {
  const n = size,
    s = scale,
    q = margin,
    W = (n + 2 * q) * s;
  ctx.canvas.width = W;
  ctx.canvas.height = W;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, W);
  ctx.fillStyle = "#000";
  let i = 0;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++, i++) {
      if (grid[i]) ctx.fillRect((x + q) * s, (y + q) * s, s, s);
    }
  }
}

function toBool2DFromFlat(grid, size) {
  const out = [];
  for (let y = 0; y < size; y++) {
    const row = [];
    for (let x = 0; x < size; x++) {
      row.push(!!grid[y * size + x]);
    }
    out.push(row);
  }
  return out;
}

function drawDiff(ctx, A, B, scale, margin = 4) {
  const n = A.length,
    s = scale,
    q = margin,
    W = (n + 2 * q) * s;
  ctx.canvas.width = W;
  ctx.canvas.height = W;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, W);

  const matchDark = "#0a0";
  const matchLight = "#e6e6e6";
  const mismatch = "#d00";

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const a = A[y][x],
        b = B[y][x];
      const color = a === b ? (a ? matchDark : matchLight) : mismatch;
      ctx.fillStyle = color;
      ctx.fillRect((x + q) * s, (y + q) * s, s, s);
    }
  }
}

// Reference encode using UMD qrcode-generator
function refEncode(payload, ecc, forcedVersion) {
  const typeNum = forcedVersion ?? 0; // 0 = auto
  // Provided by the UMD script we loaded
  const qr = window.qrcode(typeNum, ecc);
  qr.addData(payload);
  qr.make();

  const size = qr.getModuleCount();
  const flat = new Uint8Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      flat[y * size + x] = qr.isDark(y, x) ? 1 : 0;
    }
  }
  return { grid: flat, size, version: qr.typeNumber };
}

async function run() {
  const payload = document.getElementById("payload").value;
  const ecc = document.getElementById("ecc").value;
  const verSel = document.getElementById("version").value;
  const scale = +document.getElementById("scale").value || 6;
  const forcedVersion = verSel === "auto" ? undefined : +verSel;

  // A) qrkit (yours)
  const a = encodeJS(payload, {
    ecc,
    version: forcedVersion ?? "auto",
    mask: "auto",
  });
  const a2d = toBool2DFromFlat(a.grid.data, a.grid.size);

  // B) reference
  const b = refEncode(payload, ecc, forcedVersion);
  const b2d = toBool2DFromFlat(b.grid, b.size);

  // Draw
  const ctxA = document.getElementById("cvA").getContext("2d");
  const ctxB = document.getElementById("cvB").getContext("2d");
  const ctxD = document.getElementById("cvD").getContext("2d");
  drawMatrix(ctxA, a.grid.data, a.grid.size, scale, 4);
  drawMatrix(ctxB, b.grid, b.size, scale, 4);

  const n = Math.min(a.grid.size, b.size);
  const aCrop = a2d.slice(0, n).map((r) => r.slice(0, n));
  const bCrop = b2d.slice(0, n).map((r) => r.slice(0, n));
  drawDiff(ctxD, aCrop, bCrop, scale, 4);

  // Stats
  let mismatch = 0,
    total = n * n;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) if (aCrop[y][x] !== bCrop[y][x]) mismatch++;
  const meta = document.getElementById("meta");
  meta.innerHTML = `
    <div>qrkit: version=${a.version}, mask=${a.mask}, ecc=${a.ecc}</div>
    <div>ref:   version=${b.version}, size=${b.size}</div>
    <div>${
      mismatch === 0
        ? '<span style="color:#0a0">Matrices match ✅</span>'
        : `<span style="color:#a00;font-weight:600">${mismatch} / ${total} modules differ ❌</span>`
    }</div>
  `;

  document.getElementById("infoA").textContent = `size=${
    a.grid.size
  }, modules=${a.grid.size * a.grid.size}`;
  document.getElementById("infoB").textContent = `size=${b.size}, modules=${
    b.size * b.size
  }`;
}

document.getElementById("run").addEventListener("click", run);
await run();

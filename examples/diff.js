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

// Build a function-pattern map for version v (true = function cell, false = data)
function buildFunctionMap(size, version) {
  const F = Array.from({ length: size }, () => Array(size).fill(false));
  // finders + separators
  const placeFinder = (x, y) => {
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < 7; c++) F[y + r][x + c] = true;
    for (let i = -1; i <= 7; i++) {
      const a = y - 1 + i,
        b = x - 1 + i;
      if (y - 1 >= 0 && x + i >= 0 && x + i < size) F[y - 1][x + i] = true;
      if (y + 7 < size && x + i >= 0 && x + i < size) F[y + 7][x + i] = true;
      if (x - 1 >= 0 && y + i >= 0 && y + i < size) F[y + i][x - 1] = true;
      if (x + 7 < size && y + i >= 0 && y + i < size) F[y + i][x + 7] = true;
    }
  };
  placeFinder(0, 0);
  placeFinder(size - 7, 0);
  placeFinder(0, size - 7);

  // timing
  for (let i = 8; i < size - 8; i++) {
    F[6][i] = true;
    F[i][6] = true;
  }

  // alignment centers (v1 has none)
  const centers = {
    2: [6, 18],
    3: [6, 22],
    4: [6, 26],
    5: [6, 30],
    6: [6, 34],
    7: [6, 22, 38],
    8: [6, 24, 42],
    9: [6, 26, 46],
    10: [6, 28, 50],
  };
  const cs = version === 1 ? [] : centers[version] || [];
  for (const cy of cs)
    for (const cx of cs) {
      // skip overlap with finders
      if (
        (cx <= 7 && cy <= 7) ||
        (cx >= size - 8 && cy <= 7) ||
        (cx <= 7 && cy >= size - 8)
      )
        continue;
      for (let r = -2; r <= 2; r++)
        for (let c = -2; c <= 2; c++) {
          F[cy + r][cx + c] = true;
        }
    }

  // format info areas (exact 15+15 cells)
  const A = [
    [8, 0],
    [8, 1],
    [8, 2],
    [8, 3],
    [8, 4],
    [8, 5],
    [8, 7],
    [8, 8],
    [7, 8],
    [5, 8],
    [4, 8],
    [3, 8],
    [2, 8],
    [1, 8],
    [0, 8],
  ];
  const B = [
    [size - 1, 8],
    [size - 2, 8],
    [size - 3, 8],
    [size - 4, 8],
    [size - 5, 8],
    [size - 6, 8],
    [size - 7, 8],
    [8, size - 8],
    [8, size - 7],
    [8, size - 6],
    [8, size - 5],
    [8, size - 4],
    [8, size - 3],
    [8, size - 2],
    [8, size - 1],
  ];
  for (const [r, c] of [...A, ...B]) F[r][c] = true;

  // dark module
  const dr = 4 * version + 9,
    dc = 8;
  if (dr < size) F[dr][dc] = true;

  // version info (v>=7): mark blocks so we don't treat them as data
  if (version >= 7) {
    for (let r = 0; r < 6; r++)
      for (let c = 0; c < 3; c++) F[r][size - 11 + c] = true; // top-right 3x6
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 6; c++) F[size - 11 + r][c] = true; // bottom-left 6x3
  }
  return F;
}

// Flip mask delta on DATA modules only
function remaskDataOnly(grid, size, fromMask, toMask, F) {
  const out = grid.slice();
  const delta = fromMask ^ toMask;
  const shouldFlip = (m, r, c) => {
    switch (m) {
      case 0:
        return (r + c) % 2 === 0;
      case 1:
        return r % 2 === 0;
      case 2:
        return c % 3 === 0;
      case 3:
        return (r + c) % 3 === 0;
      case 4:
        return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
      case 5:
        return ((r * c) % 2) + ((r * c) % 3) === 0;
      case 6:
        return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
      case 7:
        return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
      default:
        return false;
    }
  };
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) {
      if (!F[r][c] && shouldFlip(delta, r, c)) out[r * size + c] ^= 1;
    }
  return out;
}

// Mask predicate: same as ISO/IEC 18004
function shouldFlip(maskId, r, c) {
  switch (maskId) {
    case 0:
      return (r + c) % 2 === 0;
    case 1:
      return r % 2 === 0;
    case 2:
      return c % 3 === 0;
    case 3:
      return (r + c) % 3 === 0;
    case 4:
      return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
    case 5:
      return ((r * c) % 2) + ((r * c) % 3) === 0;
    case 6:
      return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
    case 7:
      return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
    default:
      return false;
  }
}

// Apply a mask to a flat grid, but only to data modules.
// We don't know which are data vs function in the reference, so for A/B we flip *all* modules.
// For a strict test, you’d pass a maskable bitmap.
function applyMaskFlat(grid, size, maskId) {
  const out = grid.slice();
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (shouldFlip(maskId, r, c)) out[r * size + c] ^= 1;
  return out;
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
    mask: 0,
  });
  const a2d = toBool2DFromFlat(a.grid.data, a.grid.size);

  // B) reference
  const b = refEncode(payload, ecc, forcedVersion);
  const b2d = toBool2DFromFlat(b.grid, b.size);

  const F = buildFunctionMap(a.grid.size, a.version);
  let bestMask = a.mask,
    bestDiff = Infinity;
  for (let m = 0; m < 8; m++) {
    const remasked = remaskDataOnly(a.grid.data, a.grid.size, a.mask, m, F);
    let diff = 0;
    for (let i = 0; i < remasked.length; i++)
      if (remasked[i] !== b.grid[i]) diff++;
    if (diff < bestDiff) {
      bestDiff = diff;
      bestMask = m;
    }
  }
  console.log("bestMaskVsRef=", bestMask, "diff=", bestDiff);
  // show bestMismatch; if it goes ~0–few, the only difference was mask choice

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
    <div>Best Mask vs Ref=${bestMask}, Best diff=${bestDiff}</div>
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

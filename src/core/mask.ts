import type { ECC } from "./tables";

export function applyBestMask(mx: (0 | 1 | null)[][], maskable: boolean[]) {
  const n = mx.length;
  const base = flatten(mx);
  let bestScore = Infinity,
    bestMask = 0,
    bestGrid = base;
  for (let m = 0; m < 8; m++) {
    const g = base.slice();
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const idx = y * n + x;
        if (maskable[idx] && shouldFlip(m, y, x)) g[idx] ^= 1;
      }
    const score = penalty(g, n);
    if (score < bestScore || (score === bestScore && m < bestMask)) {
      bestScore = score;
      bestMask = m;
      bestGrid = g;
    }
  }
  return { grid: bestGrid, mask: bestMask };
}
function flatten(mx: (0 | 1 | null)[][]) {
  const n = mx.length;
  const out = new Uint8Array(n * n);
  let i = 0;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++, i++) out[i] = (mx[y][x] ?? 0) as 0 | 1;
  return out;
}
function shouldFlip(m: number, y: number, x: number) {
  switch (m) {
    case 0:
      return (y + x) % 2 === 0;
    case 1:
      return y % 2 === 0;
    case 2:
      return x % 3 === 0;
    case 3:
      return (y + x) % 3 === 0;
    case 4:
      return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0;
    case 5:
      return ((y * x) % 2) + ((y * x) % 3) === 0;
    case 6:
      return (((y * x) % 2) + ((y * x) % 3)) % 2 === 0;
    case 7:
      return (((y + x) % 2) + ((y * x) % 3)) % 2 === 0;
  }
  return false;
}

function penalty(g: Uint8Array, n: number) {
  let s = 0;
  for (let y = 0; y < n; y++) s += linePenalty(g.subarray(y * n, (y + 1) * n));
  for (let x = 0; x < n; x++) {
    const col = new Uint8Array(n);
    for (let y = 0; y < n; y++) col[y] = g[y * n + x];
    s += linePenalty(col);
  }
  for (let y = 0; y < n - 1; y++)
    for (let x = 0; x < n - 1; x++) {
      const c = g[y * n + x];
      if (
        c === g[y * n + x + 1] &&
        c === g[(y + 1) * n + x] &&
        c === g[(y + 1) * n + x + 1]
      )
        s += 3;
    }
  s += patternPenalty(g, n);
  const dark = g.reduce((a, b) => a + b, 0);
  const pct = (dark * 100) / (n * n);
  s += Math.floor(Math.abs(pct - 50) / 5) * 10;
  return s;
}
function linePenalty(arr: Uint8Array) {
  let s = 0,
    run = 1;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] === arr[i - 1]) run++;
    else {
      if (run >= 5) s += 3 + (run - 5);
      run = 1;
    }
  }
  if (run >= 5) s += 3 + (run - 5);
  return s;
}

function patternPenalty(g: Uint8Array, n: number) {
  const pattF = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const pattR = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
  let s = 0;

  // rows
  for (let y = 0; y < n; y++) {
    for (let x = 0; x <= n - pattF.length; x++) {
      let okF = true,
        okR = true;
      for (let k = 0; k < pattF.length; k++) {
        const v = g[y * n + x + k];
        if (v !== pattF[k]) okF = false;
        if (v !== pattR[k]) okR = false;
        if (!okF && !okR) break;
      }
      if (okF || okR) s += 40;
    }
  }
  // cols
  for (let x = 0; x < n; x++) {
    for (let y = 0; y <= n - pattF.length; y++) {
      let okF = true,
        okR = true;
      for (let k = 0; k < pattF.length; k++) {
        const v = g[(y + k) * n + x];
        if (v !== pattF[k]) okF = false;
        if (v !== pattR[k]) okR = false;
        if (!okF && !okR) break;
      }
      if (okF || okR) s += 40;
    }
  }
  return s;
}

// ---- Format info (BCH(15,5)) ----
const GEN_POLY_FORMAT = 0b10100110111; // 0x537
const FORMAT_MASK = 0b101010000010010; // 0x5412
const EC2 = { L: 0b01, M: 0b00, Q: 0b11, H: 0b10 } as const;

function makeFormatBits(ecc: "L" | "M" | "Q" | "H", mask: number) {
  const f5 = ((EC2[ecc] & 0b11) << 3) | (mask & 0b111); // 5 bits
  let v = f5 << 10;
  for (let i = 14; i >= 10; i--)
    if ((v >>> i) & 1) v ^= GEN_POLY_FORMAT << (i - 10);
  return ((f5 << 10) | v) ^ FORMAT_MASK; // 15 bits (b14..b0)
}

/**
 * Write both copies of the 15 format bits in the spec order.
 * IMPORTANT: call this AFTER masking the data modules.
 */
export function writeFormatInfo(
  grid: Uint8Array,
  size: number,
  ecc: "L" | "M" | "Q" | "H",
  mask: number
) {
  const fmt = makeFormatBits(ecc, mask); // b14..b0

  // Copy #1 around top-left finder
  // bits b0..b5: (row 0..5, col 8)
  for (let i = 0; i <= 5; i++) grid[i * size + 8] = ((fmt >>> i) & 1) as 0 | 1;
  // b6: (row 7, col 8)
  grid[7 * size + 8] = ((fmt >>> 6) & 1) as 0 | 1;
  // b7: (row 8, col 8)
  grid[8 * size + 8] = ((fmt >>> 7) & 1) as 0 | 1;
  // b8: (row 8, col 7)
  grid[8 * size + 7] = ((fmt >>> 8) & 1) as 0 | 1;
  // b9..b14: (row 8, col 14..9)  => map i=9..14 to col = 14 - i
  for (let i = 9; i <= 14; i++)
    grid[8 * size + (14 - i)] = ((fmt >>> i) & 1) as 0 | 1;

  // Copy #2 (the other L-shape)
  // b0..b7: (row size-1..size-8, col 8)
  for (let i = 0; i <= 7; i++)
    grid[(size - 1 - i) * size + 8] = ((fmt >>> i) & 1) as 0 | 1;
  // b8..b14: (row 8, col size-8..size-1)
  for (let i = 8; i <= 14; i++)
    grid[8 * size + (size - 8 + (i - 8))] = ((fmt >>> i) & 1) as 0 | 1;
}

// --- Version info (v >= 7) ---
const VER_GEN = 0x1f25; // generator polynomial for (18,6) Golay
export function writeVersionInfo(
  grid: Uint8Array,
  size: number,
  version: number
) {
  if (version < 7) return;

  // 6-bit version + 12-bit EC = 18 bits
  let vbits = version & 0x3f; // 6 bits
  let data = vbits << 12; // pad right with 12 zeros

  // BCH: divide by generator to get 12 EC bits
  let rem = data;
  for (let i = 17; i >= 12; i--) {
    if ((rem >>> i) & 1) rem ^= VER_GEN << (i - 12);
  }
  const full = (data | rem) & 0x3ffff; // 18 bits

  // Place into two blocks:
  // Bottom-left block: 6 cols wide x 3 rows high above the lower-left finder
  // Top-right block: 3 cols wide x 6 rows high to the left of the upper-right finder
  // Bit order per spec tables (LSB = bit 0). See Thonky “Format and Version Information”.
  // Bottom-left (rows: size-11..size-9, cols: 0..5)
  let bit = 0;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 6; c++, bit++) {
      const y = size - 11 + r;
      const x = c;
      grid[y * size + x] = ((full >>> bit) & 1) as 0 | 1;
    }
  }
  // Top-right (rows: 0..5, cols: size-11..size-9)
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 3; c++, bit++) {
      const y = r;
      const x = size - 11 + c;
      grid[y * size + x] = ((full >>> bit) & 1) as 0 | 1;
    }
  }
}

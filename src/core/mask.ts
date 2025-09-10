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
        if (maskable[idx]) {
          if (shouldFlip(m, y, x)) g[idx] ^= 1;
        }
      }
    const score = penalty(g, n);
    if (score < bestScore) {
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
  const patt = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  let s = 0;
  for (let y = 0; y < n; y++)
    for (let x = 0; x <= n - patt.length; x++) {
      let ok = true;
      for (let k = 0; k < patt.length; k++) {
        if (g[y * n + x + k] !== patt[k]) {
          ok = false;
          break;
        }
      }
      if (ok) s += 40;
    }
  for (let x = 0; x < n; x++)
    for (let y = 0; y <= n - patt.length; y++) {
      let ok = true;
      for (let k = 0; k < patt.length; k++) {
        if (g[(y + k) * n + x] !== patt[k]) {
          ok = false;
          break;
        }
      }
      if (ok) s += 40;
    }
  return s;
}

const GEN_POLY_FORMAT = 0b10100110111;      // 0x537
const FORMAT_MASK     = 0b101010000010010;  // 0x5412
const EC2 = { L: 0b01, M: 0b00, Q: 0b11, H: 0b10 } as const;

function makeFormatBits(ecc:'L'|'M'|'Q'|'H', mask:number){
  const f5 = ((EC2[ecc] & 0b11) << 3) | (mask & 0b111); // 5 bits
  let v = f5 << 10;
  for (let i = 14; i >= 10; i--) if ((v >>> i) & 1) v ^= GEN_POLY_FORMAT << (i - 10);
  return ((f5 << 10) | v) ^ FORMAT_MASK;               // 15 bits
}

export function writeFormatInfo(grid: Uint8Array, size: number, ecc:'L'|'M'|'Q'|'H', mask:number){
  const fmt = makeFormatBits(ecc, mask);

  // Copy A (around top-left finder) — 15 cells
  const A: Array<[number,number]> = [
    // row 8, col 0..5  (6)
    [8,0],[8,1],[8,2],[8,3],[8,4],[8,5],
    // row 8, col 7; row 8, col 8; row 7, col 8  (3)
    [8,7],[8,8],[7,8],
    // row 5..0, col 8  (6)
    [5,8],[4,8],[3,8],[2,8],[1,8],[0,8],
  ];

  // Copy B (bottom-left column + top-right row) — 15 cells
  // Column segment: rows size-1..size-7 at col 8 (7)
  // Row segment:    row 8 at cols size-8..size-1 (8)  <- **eight** positions here
  const B: Array<[number,number]> = [
    [size-1,8],[size-2,8],[size-3,8],[size-4,8],[size-5,8],[size-6,8],[size-7,8],
    [8,size-8],[8,size-7],[8,size-6],[8,size-5],[8,size-4],[8,size-3],[8,size-2],[8,size-1],
  ];

  for (let i = 0; i < 15; i++){
    const bit = (fmt >>> i) & 1 as 0|1;
    const [ar, ac] = A[i]; grid[ar*size + ac] = bit;
    const [br, bc] = B[i]; grid[br*size + bc] = bit;
  }
}

// --- Version info (v >= 7) ---
const VER_GEN = 0x1f25; // generator polynomial for (18,6) Golay
export function writeVersionInfo(grid:Uint8Array, size:number, version:number) {
  if (version < 7) return;

  // 6-bit version + 12-bit EC = 18 bits
  let vbits = version & 0x3f;     // 6 bits
  let data = vbits << 12;         // pad right with 12 zeros

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
      grid[y*size + x] = ((full >>> bit) & 1) as 0|1;
    }
  }
  // Top-right (rows: 0..5, cols: size-11..size-9)
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 3; c++, bit++) {
      const y = r;
      const x = size - 11 + c;
      grid[y*size + x] = ((full >>> bit) & 1) as 0|1;
    }
  }
}

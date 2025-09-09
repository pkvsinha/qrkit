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

const GEN_POLY_FORMAT = 0b10100110111;
const FORMAT_MASK = 0b101010000010010;
const ECC2 = { L: 0b01, M: 0b00, Q: 0b11, H: 0b10 } as const;

export function writeFormatInfo(
  grid: Uint8Array,
  size: number,
  ecc: ECC,
  mask: number,
) {
  const fmt = makeFormatBits(ecc, mask);
  const set = (y: number, x: number, val: number) => {
    grid[y * size + x] = val as 0 | 1;
  };
  for (let i = 0; i < 6; i++) set(i, 8, (fmt >>> i) & 1);
  set(7, 8, (fmt >>> 6) & 1);
  set(8, 8, (fmt >>> 7) & 1);
  set(8, 7, (fmt >>> 8) & 1);
  for (let i = 9; i < 15; i++) set(8, 14 - i, (fmt >>> i) & 1);
  for (let i = 0; i < 8; i++) set(8, size - 1 - i, (fmt >>> i) & 1);
  for (let i = 8; i < 15; i++) set(size - 15 + i, 8, (fmt >>> i) & 1);
}

function makeFormatBits(ecc: ECC, mask: number) {
  const fmt5 = ((ECC2[ecc] & 0b11) << 3) | (mask & 0b111);
  let v = fmt5 << 10;
  for (let i = 14; i >= 10; i--)
    if ((v >>> i) & 1) v ^= GEN_POLY_FORMAT << (i - 10);
  return ((fmt5 << 10) | v) ^ FORMAT_MASK;
}

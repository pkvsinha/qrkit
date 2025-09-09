import { V, ALNUM_TABLE, MODE_INDICATOR, CHAR_COUNT_BITS } from "./tables";
import { rsEncode } from "./reedsolomon";
import { buildMatrix, placeFunctionPatterns, placeData } from "./matrix";
import { applyBestMask, writeFormatInfo, writeVersionInfo } from "./mask";
import type { EncodeOptions, EncodeResult } from "./types";

const toBits = (n: number, len: number) => {
  const out: number[] = [];
  for (let i = len - 1; i >= 0; i--) out.push((n >>> i) & 1);
  return out;
};

export function encode(input: string, opts: EncodeOptions = {}): EncodeResult {
  const ecc = opts.ecc ?? "M";
  const version = chooseVersion(input, ecc, opts.mode ?? "auto", opts.version);
  const info = V[version][ecc];
  const mode = (opts.mode ?? chooseMode(input)) as
    | "numeric"
    | "alphanumeric"
    | "byte";

  let bits: number[] = [];
  bits.push(...toBits(MODE_INDICATOR[mode], 4));
  bits.push(...toBits(charCount(input, mode), CHAR_COUNT_BITS(version, mode)));
  bits.push(...payloadBits(input, mode));

  const totalDataBits = totalDataCodewords(info) * 8;
  const rem = totalDataBits - bits.length;
  const term = Math.min(4, Math.max(0, rem));
  for (let i = 0; i < term; i++) bits.push(0);
  while (bits.length % 8) bits.push(0);
  let padToggle = true;
  while (bits.length < totalDataBits) {
    const b = padToggle ? 0xec : 0x11;
    padToggle = !padToggle;
    bits.push(...toBits(b, 8));
  }

  const dataBytes = bitsToBytes(bits);

  const dataBlocks: Uint8Array[] = [];
  let offset = 0;
  for (const [blocks, cw] of info.groups) {
    for (let b = 0; b < blocks; b++) {
      dataBlocks.push(dataBytes.subarray(offset, offset + cw));
      offset += cw;
    }
  }
  const ecBlocks = dataBlocks.map((db) => rsEncode(db, info.ecPerBlock));
  const inter = interleave(dataBlocks, ecBlocks);

  const mx = buildMatrix(info.size);
  placeFunctionPatterns(mx, version);
  const placed = placeData(mx, bytesToBits(inter));
  const masked = applyBestMask(mx, placed.maskable);
  writeFormatInfo(masked.grid, info.size, ecc, masked.mask);
  writeVersionInfo(masked.grid, info.size, version);
  return {
    grid: { size: info.size, data: masked.grid },
    version,
    mask: masked.mask,
    ecc,
  };
}

function chooseMode(s: string): "numeric" | "alphanumeric" | "byte" {
  if (/^[0-9]+$/.test(s)) return "numeric";
  if (/^[0-9A-Z $%*+\-./:]+$/.test(s)) return "alphanumeric";
  return "byte";
}
function charCount(s: string, mode: "numeric" | "alphanumeric" | "byte") {
  return mode === "byte" ? new TextEncoder().encode(s).length : s.length;
}
function payloadBits(s: string, mode: "numeric" | "alphanumeric" | "byte") {
  const out: number[] = [];
  const push = (n: number, l: number) => {
    for (let i = l - 1; i >= 0; i--) out.push((n >>> i) & 1);
  };
  if (mode === "numeric") {
    for (let i = 0; i < s.length; i += 3) {
      const chunk = s.slice(i, i + 3);
      const n = parseInt(chunk, 10);
      push(n, chunk.length === 3 ? 10 : chunk.length === 2 ? 7 : 4);
    }
  } else if (mode === "alphanumeric") {
    for (let i = 0; i < s.length; i += 2) {
      const a = ALNUM_TABLE.indexOf(s[i]);
      const b = i + 1 < s.length ? ALNUM_TABLE.indexOf(s[i + 1]) : -1;
      if (b >= 0) push(a * 45 + b, 11);
      else push(a, 6);
    }
  } else {
    const bytes = new TextEncoder().encode(s);
    for (const b of bytes) push(b, 8);
  }
  return out;
}
function totalDataCodewords(v: { groups: Array<[number, number]> }) {
  return v.groups.reduce((s, [b, c]) => s + b * c, 0);
}
function bitsToBytes(bits: number[]) {
  const out = new Uint8Array(bits.length / 8);
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | (bits[i + j] || 0);
    out[i >> 3] = b;
  }
  return out;
}
function bytesToBits(bytes: Uint8Array) {
  const out: number[] = [];
  for (const b of bytes) for (let i = 7; i >= 0; i--) out.push((b >>> i) & 1);
  return out;
}
function interleave(datas: Uint8Array[], ecs: Uint8Array[]) {
  const maxData = Math.max(...datas.map((d) => d.length));
  const maxEc = Math.max(...ecs.map((e) => e.length));
  const out: number[] = [];
  for (let i = 0; i < maxData; i++)
    for (const d of datas) if (i < d.length) out.push(d[i]);
  for (let i = 0; i < maxEc; i++)
    for (const e of ecs) if (i < e.length) out.push(e[i]);
  return new Uint8Array(out);
}

export function chooseVersion(
  input: string,
  ecc: "L" | "M" | "Q" | "H",
  mode: EncodeOptions["mode"],
  requested: number | "auto" | undefined,
) {
  if (requested && requested !== "auto") return requested;
  const m =
    mode && mode !== "auto"
      ? (mode as "numeric" | "alphanumeric" | "byte")
      : chooseMode(input);
  for (let v = 1; v <= 10; v++) {
    if (fits(v, ecc, m, input)) return v;
  }
  throw new Error(
    "Input too long for supported versions (1–10 in this build).",
  );
}

function fits(
  v: number,
  ecc: "L" | "M" | "Q" | "H",
  m: "numeric" | "alphanumeric" | "byte",
  s: string,
) {
  const info = V[v][ecc];
  const ccBits = CHAR_COUNT_BITS(v, m);
  let bits = 4 + ccBits + payloadBitsLength(s, m);
  const capacity = totalDataCodewords(info) * 8;
  const term = Math.min(4, Math.max(0, capacity - bits));
  bits += term;
  bits += (8 - (bits % 8)) % 8;
  return bits <= capacity;
}
function payloadBitsLength(s: string, m: "numeric" | "alphanumeric" | "byte") {
  if (m === "numeric") {
    let n = 0;
    for (let i = 0; i < s.length; i += 3) {
      n += i + 3 <= s.length ? 10 : i + 2 <= s.length ? 7 : 4;
    }
    return n;
  }
  if (m === "alphanumeric") {
    let n = 0;
    for (let i = 0; i < s.length; i += 2) {
      n += i + 2 <= s.length ? 11 : 6;
    }
    return n;
  }
  return new TextEncoder().encode(s).length * 8;
}

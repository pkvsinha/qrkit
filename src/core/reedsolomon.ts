import { gf } from "./gf256";

export function generatorPoly(deg: number): number[] {
  let g = [1];
  for (let i = 0; i < deg; i++) {
    const a = gf.pow(2, i);
    const next = new Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) {
      next[j] ^= g[j];
      next[j + 1] ^= gf.mul(g[j], a);
    }
    g = next;
  }
  return g;
}

export function rsEncode(data: Uint8Array, ecLen: number): Uint8Array {
  const gen = generatorPoly(ecLen);
  const res = new Uint8Array(ecLen);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ res[0];
    res.copyWithin(0, 1);
    res[ecLen - 1] = 0;
    for (let j = 0; j < ecLen; j++) res[j] ^= gf.mul(gen[j], factor);
  }
  return res;
}

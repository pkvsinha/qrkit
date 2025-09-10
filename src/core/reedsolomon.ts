import { gf } from "./gf256";

export function generatorPoly(d: number) {
  // g(x) = ∏_{i=0}^{d-1} (x - α^i), degree = d
  let g = [1]; // g[0] = 1
  for (let i = 0; i < d; i++) {
    const a = gf.pow(2, i);
    const next = new Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) {
      // Multiply by (x) term
      next[j] ^= g[j];
      // Multiply by (-a) term  => in GF(256), minus == plus
      next[j + 1] ^= gf.mul(g[j], a);
    }
    g = next;
  }
  return g; // length = d + 1 ; g[0] == 1
}

export function rsEncode(data: Uint8Array, ecLen: number) {
  const gen = generatorPoly(ecLen); // length ecLen + 1, gen[0] = 1
  const rem = new Uint8Array(ecLen); // remainder register

  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ rem[0];
    // shift left by 1 (multiply by x)
    rem.copyWithin(0, 1);
    rem[ecLen - 1] = 0;
    if (factor) {
      // XOR with factor * (g(x) - leading term)
      // i.e., use gen[1..ecLen], not gen[0]
      for (let j = 0; j < ecLen; j++) {
        rem[j] ^= gf.mul(gen[j + 1], factor);
      }
    }
  }
  return rem; // parity bytes
}

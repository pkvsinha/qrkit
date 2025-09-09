const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(function init() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

export const gf = {
  mul(a: number, b: number) {
    if (!a || !b) return 0;
    return EXP[LOG[a] + LOG[b]];
  },
  pow(a: number, e: number) {
    if (!e) return 1;
    if (!a) return 0;
    return EXP[(LOG[a] * e) % 255];
  },
  exp: EXP,
  log: LOG,
};

import { stat } from 'node:fs/promises';

async function sz(path) {
  try { const s = await stat(path); return s.size; }
  catch { return 0; }
}
const limit = 80 * 1024; // 80 KB soft limit for main entry, tune to taste

const esm = await sz('dist/index.mjs');
const cjs = await sz('dist/index.cjs');

console.log(`Size: dist/index.mjs = ${esm} bytes, dist/index.cjs = ${cjs} bytes`);
if (esm > limit || cjs > limit) {
  console.warn(`⚠️  Bundle exceeds ${limit} bytes. Consider code-splitting or deferring heavy features.`);
}

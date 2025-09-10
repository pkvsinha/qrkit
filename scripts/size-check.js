import { stat } from "node:fs/promises";

async function sz(p) {
  try {
    return (await stat(p)).size;
  } catch {
    return 0;
  }
}

const limit = 120 * 1024; // adjust as you see fit

const esm = await sz("dist/esm/index.mjs");
const cjs = await sz("dist/cjs/index.cjs");
const umd = await sz("dist/umd/symbol-codec.min.js");

console.log(`Size:
  dist/esm/index.mjs = ${esm} bytes
  dist/cjs/index.cjs = ${cjs} bytes
  dist/umd/symbol-codec.min.js = ${umd} bytes`);
if (umd > limit) {
  console.warn(
    `⚠️  CDN bundle exceeds ${limit} bytes. Consider trimming public API or code-splitting.`
  );
}

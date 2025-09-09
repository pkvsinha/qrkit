import { stat } from "node:fs/promises";

async function sz(path) {
  try {
    const s = await stat(path);
    return s.size;
  } catch {
    return 0;
  }
}

const limit = 80 * 1024; // tune as needed

const esm = await sz("dist/esm/index.mjs");
const cjs = await sz("dist/cjs/index.cjs");

console.log(
  `Size: dist/esm/index.mjs = ${esm} bytes, dist/cjs/index.cjs = ${cjs} bytes`
);
if (esm > limit || cjs > limit) {
  console.warn(
    `⚠️  Bundle exceeds ${limit} bytes. Consider code-splitting or deferring heavy features.`
  );
}

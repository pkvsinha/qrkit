import { defineConfig } from "tsup";

const entry = {
  index: "src/index.ts",
  "render/index": "src/render/svg.ts",
  "helpers/index": "src/helpers/index.ts",
  "wasm/index": "src/wasm/index.ts",
};

export default defineConfig([
  // ESM (tree-shake)
  {
    entry,
    format: ["esm"],
    outDir: "dist/esm",
    dts: false,
    sourcemap: true,
    clean: false,
    splitting: false,
    shims: false,
    target: "es2020",
    minify: false,
    esbuildOptions(o) {
      (o as any).sourcesContent = true;
    },
  },
  // CJS (Node)
  {
    entry,
    format: ["cjs"],
    outDir: "dist/cjs",
    dts: false,
    sourcemap: true,
    clean: false,
    splitting: false,
    shims: false,
    target: "es2020",
    minify: false,
    esbuildOptions(o) {
      (o as any).sourcesContent = true;
    },
  },
  // IIFE for CDN (single file, minified, window.SymbolCodec)
  {
    entry: { "symbol-codec": "src/index.ts" },
    format: ["iife"],
    outDir: "dist/umd",
    dts: false,
    sourcemap: true,
    clean: false,
    splitting: false,
    shims: false,
    target: "es2018",
    minify: true,
    globalName: "SymbolCodec",
    esbuildOptions(o) {
      (o as any).sourcesContent = true;
    },
  },
]);

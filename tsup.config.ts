import { defineConfig } from 'tsup';

const entry = {
  index: 'src/index.ts',
  'render/index': 'src/render/svg.ts',
  'helpers/index': 'src/helpers/index.ts',
  'wasm/index': 'src/wasm/index.ts',
};

// JS builds only; types via TSC into dist/types
export default defineConfig([
  {
    entry,
    format: ['esm'],
    outDir: 'dist/esm',
    dts: false,
    sourcemap: true,
    clean: false,
    splitting: false,
    shims: false,
    target: 'es2020',
    minify: false,
    esbuildOptions(o) { (o as any).sourcesContent = true; }
  },
  {
    entry,
    format: ['cjs'],
    outDir: 'dist/cjs',
    dts: false,
    sourcemap: true,
    clean: false,
    splitting: false,
    shims: false,
    target: 'es2020',
    minify: false,
    esbuildOptions(o) { (o as any).sourcesContent = true; }
  }
]);

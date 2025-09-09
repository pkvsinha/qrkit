import { defineConfig } from 'tsup';

const entry = {
  index: 'src/index.ts',
  'render/index': 'src/render/svg.ts',
  'helpers/index': 'src/helpers/index.ts',
  'wasm/index': 'src/wasm/index.ts',
};

// We generate types separately via tsc, so dts:false here.
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
    minify: false
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
    minify: false
  }
]);

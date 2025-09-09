import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'render/index': 'src/render/svg.ts',
    'helpers/index': 'src/helpers/index.ts',
    'wasm/index': 'src/wasm/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,   // keep simple, library-style output
  shims: false,
  target: 'es2020',
  outDir: 'dist',
  minify: false
});

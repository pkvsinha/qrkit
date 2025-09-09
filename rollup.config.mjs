import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

/**
 * Minimal alternative build (in addition to tsup).
 * Writes bundles under dist/rollup/ for comparison.
 */
export default {
  input: 'src/index.ts',
  output: [
    { file: 'dist/rollup/index.mjs', format: 'esm', sourcemap: true },
    { file: 'dist/rollup/index.cjs', format: 'cjs', sourcemap: true }
  ],
  plugins: [resolve({ extensions: ['.ts', '.js'] }), commonjs()],
  treeshake: true
};

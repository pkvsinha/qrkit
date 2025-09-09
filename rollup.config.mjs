import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

/**
 * Minimal alternative build (for comparison).
 * Writes to dist/rollup/{esm|cjs}.
 */
export default [
  {
    input: "src/index.ts",
    output: {
      file: "dist/rollup/esm/index.mjs",
      format: "esm",
      sourcemap: true,
    },
    plugins: [resolve({ extensions: [".ts", ".js"] }), commonjs()],
    treeshake: true,
  },
  {
    input: "src/index.ts",
    output: {
      file: "dist/rollup/cjs/index.cjs",
      format: "cjs",
      sourcemap: true,
    },
    plugins: [resolve({ extensions: [".ts", ".js"] }), commonjs()],
    treeshake: true,
  },
];

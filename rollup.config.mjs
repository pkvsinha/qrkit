import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import esbuild from "rollup-plugin-esbuild";
import terser from "@rollup/plugin-terser";

/**
 * Minimal alternative build (for comparison).
 * Writes to dist/rollup/{esm|cjs}.
 */
export default [
  {
    input: "src/index.ts", // TS entry
    output: {
      file: "dist/umd/symbol-codec.min.js", // exact filename you wanted
      format: "umd",
      name: "SymbolCodec", // window.SymbolCodec
      sourcemap: true,
      exports: "named",
    },
    plugins: [
      resolve({ browser: true, extensions: [".ts", ".js"] }),
      commonjs(),
      esbuild({
        include: /\.[jt]s?$/, // transpile TS/JS
        target: "es2018",
        tsconfig: "tsconfig.json", // picks up your TS settings
        minify: false, // keep minification for terser
      }),
      terser(), // minify the UMD
    ],
    treeshake: true,
  },
];

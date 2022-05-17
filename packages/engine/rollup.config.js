import typescript from "rollup-plugin-typescript2";
import pathsTransformer from "ts-transform-paths";
import dts from "rollup-plugin-dts";

const tsPlugins = [
  typescript({
    tsconfig: "tsconfig.build.json",
    transformers: [pathsTransformer]
  }),
];

export default [{
  input: './src/index.ts',
  output: [{ file: './dist/index.js', format: 'es' }],
  plugins: tsPlugins,
}, {
  input: './src/index.ts',
  output: [{ file: './dist/index.d.ts', format: 'es' }],
  plugins: [dts()],
}];

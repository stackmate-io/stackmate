import typescript from "rollup-plugin-typescript2";
import pathsTransformer from "ts-transform-paths";

export default {
  input: './src/index.ts',
  output: {
    exports: 'auto',
    format: 'cjs',
    dir: './lib',
  },
  plugins: [
    typescript({
      tsconfig: "tsconfig.build.json",
      transformers: [pathsTransformer]
    }),
  ],
};

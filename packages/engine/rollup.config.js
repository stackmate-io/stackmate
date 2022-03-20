import typescript from "rollup-plugin-typescript2";
import pathsTransformer from "ts-transform-paths";

export default {
  input: './src/index.ts',
  output: [{
    dir: './dist',
    format: 'cjs',
    exports: 'auto',
    entryFileNames: '[name].js',
  }],
  plugins: [
    typescript({
      tsconfig: "tsconfig.build.json",
      transformers: [pathsTransformer]
    }),
  ],
};

import typescript from "rollup-plugin-typescript2";
import pathsTransformer from "ts-transform-paths";
import multiInput from 'rollup-plugin-multi-input';

export default {
  input: ['./src/**/*.ts'],
  output: {
    exports: 'auto',
    format: 'cjs',
    dir: './dist',
  },
  plugins: [
    multiInput(),
    typescript({
      build: true,
      tsconfig: "tsconfig.build.json",
      transformers: [pathsTransformer]
    }),
  ],
};

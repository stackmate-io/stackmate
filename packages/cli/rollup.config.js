import typescript from "rollup-plugin-typescript2";
import pathsTransformer from "ts-transform-paths";
import multiInput from 'rollup-plugin-multi-input';

export default {
  input: ['./src/**/*.ts'],
  output: {
    exports: 'auto',
    format: 'cjs',
    dir: './lib',
  },
  plugins: [
    multiInput(),
    typescript({
      tsconfig: "tsconfig.build.json",
      transformers: [pathsTransformer]
    }),
  ],
};

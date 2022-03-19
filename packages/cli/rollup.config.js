import typescript from "rollup-plugin-typescript2";
import pathsTransformer from "ts-transform-paths";
import multiInput from 'rollup-plugin-multi-input';

export default {
  input: ['./src/**/*.ts'],
  // We're using CommonJS because oclif v1 doesn't work well with ESM
  // We have to switch to ESM once oclif v2 is out and integrated
  // See https://github.com/oclif/core/issues/130
  output: [{
    dir: './dist',
    format: 'cjs',
    exports: 'auto',
    entryFileNames: '[name].js',
  }],
  plugins: [
    multiInput(),
    typescript({
      build: true,
      tsconfig: "tsconfig.build.json",
      transformers: [pathsTransformer]
    }),
  ],
};

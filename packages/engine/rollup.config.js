import typescript from 'rollup-plugin-typescript2';
import pathsTransformer from 'ts-transform-paths';
import copy from 'rollup-plugin-copy';
import dts from 'rollup-plugin-dts';
import multi from '@rollup/plugin-multi-entry';

export default [{
  // main package
  input: './src/index.ts',
  output: [{ file: './dist/index.js', format: 'es' }],
  plugins: [
    typescript({
      tsconfig: "tsconfig.build.json",
      transformers: [pathsTransformer]
    }),
    copy({
      targets: [{ src: './src/stackmate.schema.json', dest: './dist/' }],
    }),
  ],
}, {
  // type definitions
  input: './src/index.ts',
  output: [{ file: './dist/index.d.ts', format: 'es' }],
  plugins: [dts()],
}, {
  // profiles
  input: './src/profiles/**/*.ts',
  output: { dir: './dist/profiles' },
  plugins: [
    multi(),
    typescript({
      tsconfig: "tsconfig.build.json",
      transformers: [pathsTransformer]
    }),
  ],
}];

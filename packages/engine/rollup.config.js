import typescript from 'rollup-plugin-typescript2';
import pathsTransformer from 'ts-transform-paths';
import copy from 'rollup-plugin-copy';
import dts from 'rollup-plugin-dts';

export default [{
  input: './src/index.ts',
  output: [{ file: './dist/index.js', format: 'es' }],
  plugins: [
    typescript({
      tsconfig: "tsconfig.build.json",
      transformers: [pathsTransformer]
    }),
    copy({
      targets: [{ src: 'stackmate.schema.json', dest: 'dist/' }],
    }),
  ],
}, {
  input: './src/index.ts',
  output: [{ file: './dist/index.d.ts', format: 'es' }],
  plugins: [dts()],
}];

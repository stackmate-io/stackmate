/**
 * The purpose of this file is to allow babel-jest
 * to transpile the ES6 output we generate from the @stackmate/engine package.
 *
 * If we remove this, we'll run into the common Jest error where it can't process ES modules
 */
const presets = [
  [
    '@babel/preset-env',
    {
      targets: {
        node: 'current',
      },
    },
  ],
];

module.exports = function babelConfig(api) {
  api.cache(false);

  return {
    presets,
  };
};

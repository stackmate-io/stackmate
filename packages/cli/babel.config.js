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

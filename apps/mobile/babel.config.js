module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // WatermelonDB exige o plugin de decorators (ative ao adicionar os models):
    // plugins: [['@babel/plugin-proposal-decorators', { legacy: true }]],
  };
};

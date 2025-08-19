// config-overrides.js
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

function tweakRule(rule) {
  if (!rule) return;
  if (rule.oneOf) return rule.oneOf.forEach(tweakRule);
  if (rule.rules) return rule.rules.forEach(tweakRule);

  // 1) Webpack 5 asset modules (images/fonts)
  if (rule.type === 'asset' || rule.type === 'asset/resource') {
    rule.generator = { ...(rule.generator || {}), filename: 'static/media/[name].[ext]' };
  }

  // 2) Older loaders CRA still uses for some cases (SVG)
  const patchLoader = (u) => {
    if (u && u.loader && /(file-loader|url-loader)/.test(u.loader)) {
      u.options = { ...(u.options || {}), name: 'static/media/[name].[ext]' };
    }
  };
  if (Array.isArray(rule.use)) rule.use.forEach(patchLoader);
  else if (rule.use && Array.isArray(rule.use.oneOf)) rule.use.oneOf.forEach(patchLoader);
  else if (rule.loader) patchLoader(rule);
}

module.exports = function override(config) {
  // JS/CSS names without hashes
  config.output.filename = 'static/js/[name].js';
  config.output.chunkFilename = 'static/js/[name].chunk.js';
  config.plugins = config.plugins.map((p) =>
    p?.constructor?.name === 'MiniCssExtractPlugin'
      ? new MiniCssExtractPlugin({
          filename: 'static/css/[name].css',
          chunkFilename: 'static/css/[name].chunk.css',
        })
      : p
  );

  (config.module.rules || []).forEach(tweakRule);

  // Optional: readable chunk IDs (avoid numbers like 453)
  config.optimization = config.optimization || {};
  config.optimization.moduleIds = 'named';
  config.optimization.chunkIds = 'named';
  if (config.optimization.splitChunks) config.optimization.splitChunks.name = true;

  return config;
};

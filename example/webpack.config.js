const webpack = require('webpack');

module.exports = {
  entry: './index.ts',
  mode: 'development',
  module: {
    rules: [
      { test: /\.css?$/, loader: ['style-loader', 'css-loader'] },
      { test: /\.ts?$/, loader: 'ts-loader' }
    ]
  },
  output: { filename: 'bundle.js' },
  optimization: { minimize: true },
  resolve: { extensions: ['.css', '.js', '.ts'] }
};

const webpack = require('webpack')
const path = require('path')
const AssetsPlugin = require('assets-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const sharedConfig = require('./config.shared')

const { CommonsChunkPlugin } = webpack.optimize
const { paths, getEntry } = sharedConfig

module.exports = function clientConfig (opts = {}) {
  opts = Object.assign({
    env: process.env.NODE_ENV,
    browser: true,
  }, opts)

  const isDev = opts.env !== 'production'
  const config = sharedConfig(opts)

  return Object.assign(config, {
    name: 'client',
    target: 'web',

    entry: {
      client: getEntry(
        path.join(paths.src, 'client.js'),
        isDev
      ),
      vendor: [
        'react',
        'react-dom',
        'react-router',
        'react-motion',
        'react-redux',
        'react-helmet',
        'immutable',
        'react-ga',
      ],
    },

    plugins: [
      ...config.plugins,
      new AssetsPlugin({
        filename: 'manifest.json',
        path: path.join(paths.build),
      }),
      new CommonsChunkPlugin({
        name: 'vendor',
        filename: '[name].[hash].js',
        minChunks: Infinity,
      }),
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: false,
      }),
    ],
  })
}

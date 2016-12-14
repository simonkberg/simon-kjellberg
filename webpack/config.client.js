const webpack = require('webpack')
const path = require('path')
const AssetsPlugin = require('assets-webpack-plugin')
const sharedConfig = require('./config.shared')

const { CommonsChunkPlugin } = webpack.optimize
const { paths, getEntry } = sharedConfig

module.exports = function clientConfig (opts = {}) {
  opts = Object.assign({
    env: process.env.NODE_ENV,
    browser: true,
  }, opts)

  const config = sharedConfig(opts)

  return Object.assign(config, {
    name: 'client',
    target: 'web',

    entry: {
      client: getEntry(
        path.join(paths.src, 'client.js'),
        opts.env !== 'production'
      ),
      vendor: [
        'react',
        'react-dom',
        'react-router',
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
    ],
  })
}

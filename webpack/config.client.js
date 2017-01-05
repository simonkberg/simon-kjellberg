const path = require('path')
const { CommonsChunkPlugin } = require('webpack').optimize
const AssetsPlugin = require('assets-webpack-plugin')
const SWPrecachePlugin = require('sw-precache-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

const sharedConfig = require('./config.shared')
const { paths, getEntry } = sharedConfig

module.exports = function clientConfig (opts = {}) {
  opts = Object.assign({
    env: process.env.NODE_ENV,
    browser: true,
  }, opts)

  const isDev = opts.env !== 'production'
  const config = sharedConfig(opts)

  return Object.assign({}, config, {
    name: 'client',
    target: 'web',

    entry: {
      client: getEntry(
        path.join(paths.src, 'client.js'),
        isDev
      ),
      vendor: [
        'immutable',
        'react-addons-css-transition-group',
        'react-dom',
        'react-ga',
        'react-helmet',
        'react-motion',
        'react-redux',
        'react',
        'redux-immutable',
        'redux-thunk',
        'redux',
        'reselect',
      ],
    },

    plugins: [
      ...config.plugins,
      new AssetsPlugin({
        filename: 'manifest.json',
        path: paths.build,
      }),
      new CommonsChunkPlugin({
        names: ['vendor', 'manifest'],
        filename: 'static/js/[name].[hash:8].js',
        minChunks: Infinity,
      }),
      new SWPrecachePlugin({
        cacheId: 'simon-kjellberg',
        filename: 'sw.js',
        verbose: false,
      }),
      new BundleAnalyzerPlugin({
        analyzerMode: isDev ? 'static' : 'static',
        openAnalyzer: false,
      }),
    ],

    resolve: Object.assign({}, config.resolve, {
      mainFields: ['browser', 'module', 'jesnext:main', 'main'],
    }),
  })
}

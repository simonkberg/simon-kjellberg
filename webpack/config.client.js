const path = require('path')
const { DefinePlugin } = require('webpack')
const AssetsPlugin = require('assets-webpack-plugin')
const SWPrecachePlugin = require('sw-precache-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

const sharedConfig = require('./config.shared')
const { paths, getEntry } = sharedConfig

module.exports = function clientConfig(opts = {}) {
  opts = Object.assign(
    {
      env: process.env.NODE_ENV,
      debug: process.env.DEBUG,
      browser: true,
    },
    opts
  )

  const isDev = opts.env !== 'production'
  const config = sharedConfig(opts)

  return Object.assign({}, config, {
    name: 'client',
    target: 'web',

    entry: {
      client: getEntry(path.join(paths.src, 'client.js'), isDev),
    },

    plugins: [
      ...config.plugins,
      new DefinePlugin({
        'process.env.DEBUG': `"${opts.debug}"`,
      }),
      new AssetsPlugin({
        filename: 'manifest.json',
        path: paths.build,
      }),
      new SWPrecachePlugin({
        cacheId: 'simon-kjellberg',
        filename: 'sw.js',
        verbose: false,
        minify: true,
      }),
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: false,
        logLevel: 'error',
      }),
    ],

    resolve: Object.assign({}, config.resolve, {
      mainFields: ['browser', 'module', 'jesnext:main', 'main'],
    }),
  })
}

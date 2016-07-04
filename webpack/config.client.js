const path = require('path')
const AssetsPlugin = require('assets-webpack-plugin')
const sharedConfig = require('./config.shared')

const { paths, getEntry } = sharedConfig

module.exports = function clientConfig (opts = {}) {
  opts.browser = true

  const config = sharedConfig(opts)

  return Object.assign(config, {
    name: 'client',
    target: 'web',

    entry: {
      client: getEntry(
        path.join(paths.src, 'client.js'),
        opts.env !== 'production'
      ),
    },

    plugins: [
      ...config.plugins,
      new AssetsPlugin({
        filename: 'manifest.json',
        path: path.join(paths.build),
      }),
    ],
  })
}

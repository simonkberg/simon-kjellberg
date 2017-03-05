const path = require('path')
const sharedConfig = require('./config.shared')

const { paths } = sharedConfig

module.exports = function serverConfig (opts = {}) {
  opts = Object.assign(
    {
      env: process.env.NODE_ENV,
    },
    opts
  )

  const config = sharedConfig(opts)

  return Object.assign(config, {
    name: 'server',
    target: 'node',

    entry: {
      server: path.join(paths.src, 'server.js'),
    },

    output: {
      path: paths.build,
      filename: 'server.js',
      libraryTarget: 'commonjs2',
    },

    resolve: Object.assign({}, config.resolve, {
      mainFields: ['module', 'jesnext:main', 'main'],
    }),

    node: {
      __filename: true,
      __dirname: true,
    },
  })
}

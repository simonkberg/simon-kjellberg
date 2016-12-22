
const clientConfig = require('./webpack/config.client')
const serverConfig = require('./webpack/config.server')

module.exports = function webpackConfig (opts = {}) {
  // Default options
  opts = Object.assign({
    env: process.env.NODE_ENV || 'development',
  }, opts)

  return [
    clientConfig(opts),
    serverConfig(opts),
  ]
}

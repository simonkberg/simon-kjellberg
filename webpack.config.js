
const clientConfig = require('./config/webpack/client')
const serverConfig = require('./config/webpack/server')

module.exports = function webpackConfig (opts = {}) {
  // Default options
  opts = Object.assign({
    env: process.env.NODE_ENV,
  }, opts)

  return [
    clientConfig(opts),
    serverConfig(opts),
  ]
}

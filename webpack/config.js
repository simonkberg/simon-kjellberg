
const clientConfig = require('./config.client')
const serverConfig = require('./config.server')

module.exports = function webpackConfig (opts = {}) {
  return [
    clientConfig(opts),
    serverConfig(opts)
  ]
}

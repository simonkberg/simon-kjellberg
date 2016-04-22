
import 'babel-polyfill'
import clientConfig from './config.client'
import serverConfig from './config.server'

module.exports = function (opts = {}) {
  return [
    clientConfig(opts),
    serverConfig(opts)
  ]
}

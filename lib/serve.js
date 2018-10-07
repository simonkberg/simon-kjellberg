// @flow strict

'use strict'

process.env.NODE_ENV = 'production'

const next = require('next')
const createServer = require('./createServer')

/*::
import type { ServerOptions } from './types'
*/

module.exports = async (opts /*: ServerOptions */) => {
  const app = next({ dev: false, dir: './src' })
  const server = await createServer(app)

  server.listen(opts.port, opts.host, undefined, () => {
    console.log(`🚀 Ready on http://localhost:${opts.port}`)
  })
}

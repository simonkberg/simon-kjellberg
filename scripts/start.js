// @flow strict

'use strict'

process.env.NODE_ENV = 'development'

const next = require('next')
const options = require('../lib/options')
const createServer = require('../lib/createServer')

/*::
import type { Options } from '../lib/options'
*/

module.exports = options(async (opts /*: Options */) => {
  const app = next({ dev: true, dir: './src' })
  const server = await createServer(app)

  server.listen(opts.port, opts.host, undefined, () => {
    console.log(`🚀 Ready on http://localhost:${opts.port}`)
  })
})
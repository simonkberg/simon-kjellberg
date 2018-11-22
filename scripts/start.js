// @flow strict

'use strict'

process.env.NODE_ENV = 'development'

const opn = require('opn')
const next = require('next')
const options = require('../lib/options')
const createServer = require('../lib/createServer')
const config = require('../app.config')

/*::
import type { Options } from '../lib/options'
*/

module.exports = options(async (opts /*: Options */) => {
  const app = next({ dev: true, dir: config.src })
  const server = await createServer(app)

  server.listen(opts.port, opts.host, undefined, () => {
    const url = `http://localhost:${opts.port}`
    console.log(`🚀 Ready on ${url}`)
    opn(url, { wait: false })
  })
})

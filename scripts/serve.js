// @flow strict

'use strict'

require('dotenv').config()

const newrelic =
  process.env.NEW_RELIC_LICENSE_KEY != null ? require('newrelic') : undefined

process.env.NODE_ENV = 'production'

const perf = require('../lib/perf')

perf.mark('boot start')

const next = require('next-server')
const options = require('../lib/options')
const createServer = require('../lib/createServer')
const config = require('../app.config')

/*::
import type { Options } from '../lib/options'
*/

module.exports = options(async (opts /*: Options */) => {
  const app = next({ dev: false, dir: config.src })
  const server = await createServer(app, { newrelic })

  server.listen(opts.port, opts.host, undefined, () => {
    perf.mark('boot end')
    perf.measure('boot', 'boot start', 'boot end')

    console.log(`🚀 Ready on http://localhost:${opts.port}`)
  })
})

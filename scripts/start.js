'use strict'

require('dotenv').config()

process.env.NODE_ENV = 'development'

const open = require('open')
const next = require('next')
const execa = require('execa')
const options = require('../lib/options')
const createServer = require('../lib/createServer')
const config = require('../app.config')

module.exports = options(async opts => {
  await execa('bsb', ['-make-world'])
  const app = next({ dev: true, dir: config.src, customServer: true })
  const server = await createServer(app)

  server.listen(opts.port, opts.host, undefined, () => {
    const url = `http://localhost:${opts.port}`
    console.log(`🚀 Ready on ${url}`)
    open(url, { url: true })
  })
})

'use strict'

require('dotenv').config()

const minimist = require('minimist')

const {
  _: [commandName],
  ...opts
} = minimist(process.argv.slice(2), {
  alias: {
    host: 'h',
    port: 'p',
  },
  default: {
    host: process.env.HOST || '0.0.0.0',
    port: parseInt(process.env.PORT, 10) || 3000,
  },
})

const command = require(`./lib/${commandName}`)

command(opts).catch(err => {
  console.error(err)
  process.exit(1)
})

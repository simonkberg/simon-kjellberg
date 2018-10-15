// @flow strict
'use strict'

const invariant = require('invariant')
const Redis = require('ioredis')

const { REDIS_URL } = process.env

invariant(
  REDIS_URL,
  '[lib/redis] Missing required environment variable `REDIS_URL`.'
)

module.exports = new Redis(REDIS_URL)

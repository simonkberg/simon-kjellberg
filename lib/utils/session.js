'use strict'

const session = require('express-session')
const RedisStore = require('connect-redis')(session)

const { REDIS_URL } = process.env

const getStore = () => {
  if (REDIS_URL) {
    return new RedisStore({ url: REDIS_URL })
  } else {
    return new session.MemoryStore()
  }
}

module.exports = opts => session({ ...opts, store: getStore() })

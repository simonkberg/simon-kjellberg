'use strict'

const session = require('express-session')
const RedisStore = require('connect-redis')(session)
const client = require('./redis')

const store = new RedisStore({ client, disableTTL: true })

module.exports = opts => session({ ...opts, store })

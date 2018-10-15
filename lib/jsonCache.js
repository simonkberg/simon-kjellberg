// @flow strict
'use strict'

const fetch = require('cross-fetch')
const redis = require('./redis')

const jsonCache = async (url /*: string */, ttl /*: number */) => {
  const value = await redis.get(url)

  if (value != null) {
    return JSON.parse(value)
  }

  const response = await fetch(url)
  const json = await response.json()

  await redis.setex(url, ttl, JSON.stringify(json))

  return json
}

module.exports = jsonCache

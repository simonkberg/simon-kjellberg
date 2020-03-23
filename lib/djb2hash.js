// @flow strict
'use strict'

const LRU = require('lru-cache')

const cache = new LRU({ max: 500 })
const charToCharCode = s => s.charCodeAt(0)
const hashReducer = (a, c) => ((a << 5) + a) ^ c

module.exports = function djb2hash(string /*: string */) {
  if (!string.length) return 0

  if (cache.has(string)) {
    return cache.get(string)
  }

  const hash = string.split('').map(charToCharCode).reduce(hashReducer, 5381)

  cache.set(string, hash)

  return hash
}

'use strict'

const lru = require('lru-cache')
const emojiParser = require('./emojiParser')
const textParser = require('./textParser')

const cache = lru({ max: 1000 })

module.exports = function parse(input) {
  if (cache.has(input)) {
    return cache.get(input)
  }

  const output = emojiParser(textParser(input))

  cache.set(input, output)

  return output
}

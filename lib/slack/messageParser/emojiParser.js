// @flow strict

'use strict'

const LRU = require('lru-cache')
const emojiData = require('./emojiData')

const cache = new LRU({ max: 1000 })
const regexKeys = Array.from(emojiData.keys).join('|').replace(/[+]/g, '\\$&')
const regex = new RegExp(`:(${regexKeys})(?:::)?(skin-tone-[2-6])?:`, 'gim')

const getEmoji = (emojiKey, skinKey) => {
  const emoji = emojiData.getEmoji(emojiKey.toLowerCase())

  if (emoji != null && skinKey != null && emoji.skins != null) {
    const { skins } = emoji // preserve flow's type refinement
    const skin = emojiData.getEmoji(skinKey.toLowerCase())

    if (skin != null && skins.has(skin.name)) {
      return skins.get(skin.name)
    }
  }

  return emoji
}

const replacer = (match, emojiKey, skinKey, index) => {
  if (cache.has(match)) {
    return cache.get(match)
  }

  const emoji = getEmoji(emojiKey, skinKey)

  if (emoji != null) {
    const result = emoji.string

    cache.set(match, result)

    return result
  }

  return match
}

module.exports = function emojiParser(string /*: string */) {
  return string.replace(regex, replacer)
}

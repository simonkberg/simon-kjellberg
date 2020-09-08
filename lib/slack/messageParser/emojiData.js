'use strict'

const LRU = require('lru-cache')
const rawEmojiData = require('emoji-datasource')
const codePointsToString = require('./codePointsToString')

const cache = new LRU({ max: 1000 })

const createAliasReducer = name => (acc, alias) => {
  acc.set(alias, name)
  return acc
}

const emojiData = rawEmojiData.reduce(
  (acc, emoji) => {
    // assign alias
    emoji.short_names.reduce(createAliasReducer(emoji.short_name), acc.alias)

    acc.data.set(emoji.short_name, emoji)

    return acc
  },
  {
    data: new Map(),
    alias: new Map(),
  }
)

const createSkinReducer = skins => (acc, key) => {
  const skin = skins[key]
  const name = skin.unified.toLowerCase()

  acc.set(key.toLowerCase(), {
    name,
    string: codePointsToString(name),
  })

  return acc
}

const parseEmoji = data => {
  const name = data.unified.toLowerCase()

  return {
    name,
    string: codePointsToString(name),
    skins:
      data.skin_variations != null
        ? // Workaround for flow lacking proper support for Object.entries
          Object.keys(data.skin_variations).reduce(
            createSkinReducer(data.skin_variations),
            new Map()
          )
        : null,
  }
}

const getEmoji = name => {
  const key = emojiData.alias.get(name.toLowerCase())

  if (cache.has(key)) {
    return cache.get(key)
  }

  const data = emojiData.data.get(key)

  if (data != null) {
    const emoji = parseEmoji(data)

    cache.set(key, emoji)

    return emoji
  }

  return null
}

module.exports = {
  ...emojiData,
  getEmoji,
  keys: emojiData.alias.keys(),
}

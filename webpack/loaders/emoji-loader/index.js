const convert = unicode => {
  if (unicode.indexOf('-') > -1) {
    return unicode
      .split('-')
      .map(part => convert(part))
      .join('')
  }

  const char = parseInt(unicode, 16)

  if (char >= 0x10000 && char <= 0x10ffff) {
    const high = Math.floor((char - 0x10000) / 0x400) + 0xd800
    const low = (char - 0x10000) % 0x400 + 0xdc00

    return String.fromCharCode(high) + String.fromCharCode(low)
  }

  return String.fromCharCode(char)
}

module.exports = function(source) {
  this.cacheable()

  const value = typeof source === 'string' ? JSON.parse(source) : source
  const result = value.reduce(
    (result, emoji) =>
      emoji.short_names.reduce((result, shortName) => {
        const name = emoji.unified.toLowerCase()

        result[shortName] = {
          name,
          unicode: convert(name),
          skins: Object.entries(emoji.skin_variations || {}).reduce(
            (acc, [key, skin]) => {
              const name = skin.unified.toLowerCase()
              const unicode = convert(name)

              acc[key.toLowerCase()] = { name, unicode }

              return acc
            },
            {}
          ),
        }

        return result
      }, result),
    {}
  )

  this.value = [result]

  return `module.exports = ${JSON.stringify(result)};`
}

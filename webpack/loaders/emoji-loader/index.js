const convert = unicode => {
  if (unicode.indexOf('-') > -1) {
    return unicode.split('-').map(part => convert(part)).join('')
  }

  const char = parseInt(unicode, 16)

  if (char >= 0x10000 && char <= 0x10ffff) {
    let high = Math.floor((char - 0x10000) / 0x400) + 0xd800
    var low = (char - 0x10000) % 0x400 + 0xdc00

    return String.fromCharCode(high) + String.fromCharCode(low)
  }

  return String.fromCharCode(char)
}

module.exports = function(source) {
  this.cacheable()

  const value = typeof source === 'string' ? JSON.parse(source) : source
  const result = {}

  value.forEach(({ unified, short_names }) => {
    short_names.forEach(shortName => {
      const name = unified.toLowerCase()
      const unicode = convert(name)

      result[shortName] = { name, unicode }
    })
  })

  this.value = [result]

  return `module.exports = ${JSON.stringify(result)};`
}

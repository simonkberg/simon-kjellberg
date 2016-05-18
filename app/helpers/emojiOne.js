import React from 'react'
import emojis from '../shared/data/emoji.json'

const CDN_URL = 'https://cdn.jsdelivr.net/emojione/assets/png/'
const EMOJI_MAP = new Map()

emojis.forEach(({ unified, short_names }) => {
  short_names.forEach(shortName => {
    EMOJI_MAP.set(shortName, unified.toLowerCase())
  })
})

const REGEX_KEYS = [...EMOJI_MAP.keys()].join('|').replace(/[+]/g, '\\$&')
const REGEX = new RegExp(`:(${REGEX_KEYS})(?:::)?(skin-tone-[2-6])?:`, 'g')

export const replace = (match, p1, p2) => {
  let unicode = EMOJI_MAP.get(p1)

  if (p2) {
    unicode = `${unicode}-${EMOJI_MAP.get(p2)}`
  }

  return <img src={`${CDN_URL}${unicode}.png`} alt={convert(unicode)} style={{width: '1em', height: '1em'}} />
}

export const parse = (string) => {
  const output = []
  const storedLastIndex = REGEX.lastIndex

  REGEX.lastIndex = 0

  let result
  let lastIndex = 0

  while (result = REGEX.exec(string)) {
    let index = result.index

    if (index !== lastIndex) {
      output.push(string.substring(lastIndex, index))
    }

    let match = result[0]
    lastIndex = index + match.length

    let out = replace(...result.concat(index, result.input))

    output.push(out)
  }

  if (lastIndex < string.length) {
    output.push(string.substring(lastIndex))
  }

  REGEX.lastIndex = storedLastIndex

  return output
}

export const convert = (unicode) => {
  if (unicode.indexOf('-') > -1) {
    return unicode.split('-').map(part => convert(part)).join('')
  }

  const char = parseInt(unicode, 16)

  if (char >= 0x10000 && char <= 0x10FFFF) {
    let high = Math.floor((char - 0x10000) / 0x400) + 0xD800
    var low = ((char - 0x10000) % 0x400) + 0xDC00

    return (String.fromCharCode(high) + String.fromCharCode(low))
  }

  return String.fromCharCode(char)
}

export default function emoji (string) {
  return React.createElement('span', null, parse(string))
}

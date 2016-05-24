import React from 'react'
import emojis from '../shared/data/emoji.json'

const cdnUrl = 'https://twemoji.maxcdn.com/2/72x72/'
const emojiMap = new Map()

emojis.forEach(({ unified, short_names }) => {
  short_names.forEach(shortName => {
    emojiMap.set(shortName, unified.toLowerCase())
  })
})

const regexKeys = [...emojiMap.keys()].join('|').replace(/[+]/g, '\\$&')
const regex = new RegExp(`:(${regexKeys})(?:::)?(skin-tone-[2-6])?:`, 'g')

export const replace = (match, p1, p2, index) => {
  let name = emojiMap.get(p1)

  if (p2) {
    name = `${name}-${emojiMap.get(p2)}`
  }

  const unicode = convert(name)

  const props = {
    src: `${cdnUrl}${name}.png`,
    title: p1,
    alt: unicode,
    key: index,
    style: {
      width: '1.25em',
      height: '1.25em'
    }
  }

  const emoji = <img {...props} />

  return emoji
}

export const parse = (string) => {
  const output = []
  const storedLastIndex = regex.lastIndex

  regex.lastIndex = 0

  let result
  let lastIndex = 0

  while (result = regex.exec(string)) {
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

  regex.lastIndex = storedLastIndex

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

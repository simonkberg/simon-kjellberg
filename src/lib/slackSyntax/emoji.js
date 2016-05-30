import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import emojis from './emoji.json'
// import replace from './replace'

const cdnUrl = 'https://twemoji.maxcdn.com/2/72x72/'
const emojiMap = new Map()
const cache = new Map()

emojis.forEach(({ unified, short_names }) => {
  short_names.forEach(shortName => {
    emojiMap.set(shortName, unified.toLowerCase())
  })
})

const regexKeys = [...emojiMap.keys()].join('|').replace(/[+]/g, '\\$&')
const regex = new RegExp(`:(${regexKeys})(?:::)?(skin-tone-[2-6])?:`, 'g')

export const transform = (match, p1, p2, index) => {
  if (cache.has(match)) {
    return cache.get(match)
  }

  let name = emojiMap.get(p1)

  if (p2) {
    name = `${name}-${emojiMap.get(p2)}`
  }

  const unicode = convert(name)

  const props = {
    src: `${cdnUrl}${name}.png`,
    title: p1,
    alt: unicode,
    style: {
      width: '1.25em',
      height: '1.25em'
    }
  }

  const result = renderToStaticMarkup(<img {...props} />)

  cache.set(match, result)

  return result
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
  return string.replace(regex, transform)

  // return React.createElement('span', null, result)
}

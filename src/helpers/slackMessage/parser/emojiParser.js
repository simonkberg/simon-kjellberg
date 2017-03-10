import { emojiCache } from './cache'
import emojis from 'emoji-datasource'

const regexKeys = [...Object.keys(emojis)].join('|').replace(/[+]/g, '\\$&')
const regex = new RegExp(`:(${regexKeys})(?:::)?(skin-tone-[2-6])?:`, 'g')

const render = (props = {}) =>
  `<img ${Object.keys(props).reduce((tpl, prop) => `${tpl} ${prop}="${props[prop]}"`, '')}/>`

const replace = (options = {}) => {
  const {
    cdnUrl = 'https://twemoji.maxcdn.com/2/72x72/',
    className = 'slack-emoji',
    cache = emojiCache,
    ...other
  } = options

  return (match, p1, p2, index) => {
    if (cache.has(match)) {
      return cache.get(match)
    }

    let { name, unicode } = emojis[p1]

    if (p2) {
      let suffix = emojis[p2]
      name = `${name}-${suffix.name}`
      unicode += suffix.unicode
    }

    const props = {
      src: `${cdnUrl}${name}.png`,
      title: p1,
      alt: unicode,
      class: className,
      ...other,
    }

    const result = render(props)

    cache.set(match, result)

    return result
  }
}

export default function emojiParser (string, options = {}) {
  return string.replace(regex, replace(options))
}

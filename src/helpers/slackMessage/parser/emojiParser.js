import { emojiCache } from './cache'
import emojis from 'emoji-datasource'

const regexKeys = [...Object.keys(emojis)].join('|').replace(/[+]/g, '\\$&')
const regex = new RegExp(`:(${regexKeys})(?:::)?(skin-tone-[2-6])?:`, 'gi')

const render = (props = {}) =>
  `<img ${Object.keys(props).reduce(
    (tpl, prop) => `${tpl} ${prop}="${props[prop]}"`,
    ''
  )}/>`

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

    const emoji = emojis[p1.toLowerCase()]
    const skin = p2 && emojis[p2.toLowerCase()]
    const { name, unicode } = skin ? emoji.skins[skin.name] : emoji

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

export default function emojiParser(string, options = {}) {
  return string.replace(regex, replace(options))
}

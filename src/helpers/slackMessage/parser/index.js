import textParser from './textParser'
import emojiParser from './emojiParser'
import { parseCache, emojiCache, cacheShape } from './cache'

export default function parser (input, {
  parser: {
    cache = parseCache,
    component = 'span'
  } = {},
  emoji
} = {}) {
  if (cache.has(input)) {
    return cache.get(input)
  }

  let output = input

  output = textParser(output)
  output = emojiParser(output, emoji)

  cache.set(input, output)

  return output
}
export {
  textParser,
  emojiParser,
  parseCache,
  emojiCache,
  cacheShape
}

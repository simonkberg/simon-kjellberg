import textParser from './textParser'
import emojiParser from './emojiParser'
import { parserCache, emojiCache, cacheShape } from './cache'

export default function parser(
  input,
  { parser: { cache = parserCache, component = 'span' } = {}, emoji } = {}
) {
  if (cache.has(input)) {
    return cache.get(input)
  }

  let output = input

  output = textParser(output)
  output = emojiParser(output, emoji)

  cache.set(input, output)

  return output
}

export { textParser, emojiParser, parserCache, emojiCache, cacheShape }

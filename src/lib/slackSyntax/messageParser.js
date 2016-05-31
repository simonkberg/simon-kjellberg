import React from 'react'
import { Parser } from 'html-to-react'
import textParser from './textParser'
import emojiParser from './emojiParser'
import { parseCache } from './cache'

const { parse } = Parser(React)

export default function messageParser (input, {
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
  output = parse(`<${component}>${output}</${component}>`)

  cache.set(input, output)

  return output
}

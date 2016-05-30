import React from 'react'
import { Parser } from 'html-to-react'
import formatting from './formatting'
import { parseCache } from './cache'
import emoji from './emoji'
import links from './links'

const { parse } = Parser(React)

export default function parser (input, {
  parser: {
    cache = parseCache,
    component = 'span'
  } = {},
  emoji: emojiOpts
} = {}) {
  if (cache.has(input)) {
    return cache.get(input)
  }

  let output = input

  output = links(output)
  output = formatting(output)
  output = emoji(output, emojiOpts)
  output = parse(`<${component}>${output}</${component}>`)

  cache.set(input, output)

  return output
}

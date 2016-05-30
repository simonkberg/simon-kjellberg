import React from 'react'
import { Parser } from 'html-to-react'
import formatting from './formatting'
import emoji from './emoji'
import links from './links'

const cache = new Map()
const { parse } = Parser(React)

export default function slackSyntax (input) {
  if (cache.has(input)) {
    return cache.get(input)
  }

  let output = input

  output = links(output)
  output = formatting(output)
  output = emoji(output)
  output = parse(`<span>${output}</span>`)

  cache.set(input, output)

  return output
}

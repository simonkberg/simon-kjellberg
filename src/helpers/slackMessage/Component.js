import React, { Component, PropTypes } from 'react'
import parser, { parseCache, emojiCache, cacheShape } from './parser'

const { string } = PropTypes

export default class SlackMessage extends Component {
  static propTypes = {
    children: string,
    component: string,
    parserCache: cacheShape,
    emojiCache: cacheShape
  }

  static defaultProps = {
    children: '',
    component: 'span',
    parseCache,
    emojiCache
  }

  render () {
    const {
      children,
      component,
      parserCache,
      emojiCache
    } = this.props

    const __html = children && parser(children, {
      parser: { cache: parserCache },
      emoji: { cache: emojiCache }
    }) || ''

    return <component dangerouslySetInnerHTML={{__html}} />
  }
}

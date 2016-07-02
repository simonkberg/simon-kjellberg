import React, { Component, PropTypes } from 'react'
import shallowCompare from 'react-addons-shallow-compare'
import parser, { parserCache, emojiCache, cacheShape } from './parser'

const { string } = PropTypes

export default class SlackMessage extends Component {
  static propTypes = {
    children: string,
    component: string,
    parserCache: cacheShape,
    emojiCache: cacheShape,
    emojiCdn: string,
    emojiClassName: string
  }

  static defaultProps = {
    children: '',
    component: 'span',
    parserCache,
    emojiCache
  }

  shouldComponentUpdate (nextProps, nextState) {
    return shallowCompare(this, nextProps, nextState)
  }

  render () {
    const {
      component: Component,
      children,
      parserCache,
      emojiCache,
      emojiCdn,
      emojiClassName,
      ...props
    } = this.props

    const __html = children && parser(children, {
      parser: { cache: parserCache },
      emoji: {
        cache: emojiCache,
        cdnUrl: emojiCdn,
        className: emojiClassName
      }
    }) || ''

    return <Component dangerouslySetInnerHTML={{__html}} {...props} />
  }
}

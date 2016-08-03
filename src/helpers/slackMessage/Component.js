import React, { Component, PropTypes } from 'react'
import parser, { parserCache, emojiCache, cacheShape } from './parser'

const { string } = PropTypes

const SlackMessage = ({
  component: Component,
  children,
  parserCache,
  emojiCache,
  emojiCdn,
  emojiClassName,
  ...props,
}) => {
  const parserOptions = {
    parser: { cache: parserCache },
    emoji: {
      cache: emojiCache,
      cdnUrl: emojiCdn,
      className: emojiClassName,
    },
  }

  const __html = children && parser(children, parserOptions) || ''

  return <Component dangerouslySetInnerHTML={{__html}} {...props} />
}

SlackMessage.propTypes = {
  children: string,
  component: string,
  parserCache: cacheShape,
  emojiCache: cacheShape,
  emojiCdn: string,
  emojiClassName: string,
}

SlackMessage.defaultProps = {
  children: '',
  component: 'span',
  parserCache,
  emojiCache,
}

export default SlackMessage

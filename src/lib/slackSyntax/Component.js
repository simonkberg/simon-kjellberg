import { Component, PropTypes } from 'react'
import { parseCache, emojiCache } from './cache'
import messageParser from './messageParser'

const { string, shape, func } = PropTypes

const cacheShape = shape({
  has: func,
  get: func,
  set: func
})

export default class SlackMessage extends Component {
  static propTypes = {
    children: string.isRequired,
    component: string,
    parser: shape({
      cache: cacheShape
    }),
    emoji: shape({
      cache: cacheShape
    })
  }

  static defaultProps = {
    component: 'span',
    parser: {
      cache: parseCache
    },
    emoji: {
      cache: emojiCache
    }
  }

  render () {
    const {
      children,
      component,
      parser,
      emoji
    } = this.props

    return messageParser(children, {
      parser: {
        component,
        ...parser
      },
      emoji
    })
  }
}

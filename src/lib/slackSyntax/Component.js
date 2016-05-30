import { Component, PropTypes } from 'react'
import parser from './parser'
import { parseCache, emojiCache } from './cache'

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
    parseCache: cacheShape,
    emojiCache: cacheShape
  }

  static defaultProps = {
    component: 'span',
    parseCache,
    emojiCache
  }

  render () {
    const {
      children,
      component,
      parseCache,
      emojiCache
    } = this.props

    return parser(children, {
      parser: {
        component,
        cache: parseCache
      },
      emoji: {
        cache: emojiCache
      }
    })
  }
}

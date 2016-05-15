import React, { Component, PropTypes } from 'react'
import classNames from 'classnames'
import { TransitionMotion, spring, presets } from 'react-motion'
import ChatMessage from './ChatMessage'

const { bool, object } = PropTypes

class ChatMessageList extends Component {
  static propTypes = {
    open: bool,
    messages: object,
    users: object,
    styles: object
  }

  _list = null
  _shouldScroll = true

  componentWillUpdate () {
    const { _list: el } = this

    if (el) {
      this._shouldScroll = el.scrollTop + el.offsetHeight === el.scrollHeight
    }
  }

  componentDidUpdate () {
    const { _list: el, _shouldScroll: shouldScroll } = this

    if (el && shouldScroll) {
      setTimeout(() => {
        el.scrollTop = el.scrollHeight
      }, 0)
    }
  }

  getStyles (style = {}) {
    const { messages } = this.props
    const messageList = Object.values(messages)
      .sort((a, b) => a.ts - b.ts)

    return messageList.map(message => ({
      data: {...message},
      key: message.ts,
      style: {...style}
    }))
  }

  render () {
    const { open, users, styles } = this.props

    const transition = {
      defaultStyles: this.getStyles({
        translateX: 0,
        opacity: 0
      }),
      styles: this.getStyles({
        translateX: spring(0),
        opacity: spring(1, presets.gentle)
      }),
      willEnter: () => ({
        translateX: -50,
        opacity: 0
      }),
      willLeave: () => ({
        translateX: spring(-50),
        opacity: spring(0)
      })
    }

    const list = {
      className: classNames(styles.messageList, {
        [styles.messageListOpen]: open
      }),
      ref: (el) => {
        this._list = el
      },
      onTransitionEnd: ({ target }) => {
        target.scrollTop = target.scrollHeight
      }
    }

    return (
      <TransitionMotion {...transition}>
        {motion =>
          <ul {...list}>
            {motion.map(({style: {opacity, translateX}, key, data}) => {
              const props = {
                message: data,
                user: users[data.user],
                styles: styles,
                style: {
                  opacity,
                  transform: `translateX(${translateX}%)`
                },
                key: key
              }

              return <ChatMessage {...props} />
            })}
          </ul>
        }
      </TransitionMotion>
    )
  }
}

export default ChatMessageList

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

  list = null
  shouldScroll = true

  componentDidMount () {
    this.scrollToBottom()
  }

  componentWillUpdate () {
    if (this.list) {
      const maxScroll = this.list.scrollTop + this.list.offsetHeight

      this.shouldScroll = maxScroll === this.list.scrollHeight
    }
  }

  componentDidUpdate () {
    if (this.shouldScroll) {
      setTimeout(this.scrollToBottom, 0)
    }
  }

  scrollToBottom = () => {
    if (this.list) {
      this.list.scrollTop = this.list.scrollHeight
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
      <div className={styles.messageListWrapper}>
        <TransitionMotion {...transition}>
          {motion =>
            <ul {...list}>
              {motion.map(({style: {opacity, translateX}, key, data}) => {
                const props = {
                  message: data,
                  user: data.username || users[data.user],
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
      </div>
    )
  }
}

export default ChatMessageList

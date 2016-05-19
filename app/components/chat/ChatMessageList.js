import React, { Component, PropTypes } from 'react'
import shallowCompare from 'react-addons-shallow-compare'
import classNames from 'classnames'
import { connect } from 'react-redux'
import { TransitionMotion, spring, presets } from 'react-motion'
import ChatMessage from './ChatMessage'

const { bool, object, array } = PropTypes

class ChatMessageList extends Component {
  static propTypes = {
    open: bool,
    messageIds: array,
    styles: object
  }

  list = null
  shouldScroll = true

  componentDidMount () {
    this.scrollToBottom()
  }

  shouldComponentUpdate (nextProps, nextState) {
    return shallowCompare(this, nextProps, nextState)
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
    const { messageIds } = this.props

    return messageIds.map(id => ({
      key: id,
      style: {...style}
    }))
  }

  getWillEnterStyles = () => ({
    translateX: -50,
    opacity: 0
  })

  getWillLeaveStyles = () => ({
    translateX: spring(-50),
    opacity: spring(0)
  })

  onListMount = (el) => {
    this.list = el
  }

  render () {
    const { open, styles } = this.props

    const transition = {
      defaultStyles: this.getStyles({
        translateX: 0,
        opacity: 0
      }),
      styles: this.getStyles({
        translateX: spring(0),
        opacity: spring(1, presets.gentle)
      }),
      willEnter: this.getWillEnterStyles,
      willLeave: this.getWillLeaveStyles
    }

    const list = {
      className: classNames(styles.messageList, {
        [styles.messageListOpen]: open
      }),
      ref: this.onListMount,
      onTransitionEnd: this.scrollToBottom
    }

    return (
      <div className={styles.messageListWrapper}>
        <TransitionMotion {...transition}>
          {motion =>
            <ul {...list}>
              {motion.map(({style: {opacity, translateX}, key}) => {
                const props = {
                  id: key,
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

const mapStateToProps = ({ chat: { messages } }) => {
  return {
    messageIds: [...messages.ids].sort()
  }
}

export default connect(mapStateToProps)(ChatMessageList)

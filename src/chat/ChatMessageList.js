import React, { PureComponent, PropTypes } from 'react'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group'
import { findDOMNode } from 'react-dom'
import classNames from 'classnames'
import raf from 'raf'
import { connect } from 'react-redux'

import ChatMessage from './ChatMessage'
import { getChatMessageIds } from './chatSelectors'

const { bool, object, array } = PropTypes

class ChatMessageList extends PureComponent {
  static propTypes = {
    open: bool,
    messageIds: array,
    messages: object,
    users: object,
    styles: object,
  }

  raf = null
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

  componentDidUpdate (prevProps) {
    if (this.shouldScroll) {
      setTimeout(this.scrollToBottom, 0)

      if (prevProps.open !== this.props.open) {
        this.startAnimation()
      }
    }
  }

  componentWillUnmount () {
    this.cancelAnimation()
  }

  startAnimation = () => {
    this.scrollToBottom()
    this.raf = raf(this.startAnimation)
  }

  cancelAnimation = () => {
    raf.cancel(this.raf)
  }

  scrollToBottom = () => {
    if (this.list) {
      this.list.scrollTop = this.list.scrollHeight
    }
  }

  setListRef = (el) => {
    this.list = findDOMNode(el)
  }

  render () {
    const { open, styles, messageIds } = this.props

    const list = {
      component: 'ul',
      className: classNames(styles.messageList, {
        [styles.messageListOpen]: open,
      }),
      ref: this.setListRef,
      onTransitionEnd: this.cancelAnimation,
      transitionAppear: true,
      transitionName: {
        enter: styles.messageEnter,
        enterActive: styles.messageEnterActive,
        leave: styles.messageLeave,
        leaveActive: styles.messageLeaveActive,
        appear: styles.messageAppear,
        appearActive: styles.messageAppearActive,
      },
      transitionAppearTimeout: 500,
      transitionEnterTimeout: 500,
      transitionLeaveTimeout: 500,
    }

    return (
      <div className={styles.messageListWrapper}>
        <ReactCSSTransitionGroup {...list}>
          {messageIds.map(id => <ChatMessage key={id} id={id} styles={styles} />)}
        </ReactCSSTransitionGroup>
      </div>
    )
  }
}

const mapStateToProps = (state) => ({
  messageIds: getChatMessageIds(state),
})

export default connect(mapStateToProps)(ChatMessageList)

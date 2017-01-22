import React, { PureComponent, PropTypes } from 'react'
import { findDOMNode } from 'react-dom'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group'
import ResizeObserver from 'resize-observer-polyfill'
import { connect } from 'react-redux'

import ChatMessage from './ChatMessage'
import { getMainChatMessageIds } from './chatSelectors'

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
  wrapper = null
  shouldScroll = true

  componentDidMount () {
    this.scrollToBottom()

    this.observer = new ResizeObserver(this.onResize)
    this.observer.observe(this.wrapper)
    this.observer.observe(this.list)

    this.wrapper.addEventListener('scroll', this.onScroll, { passive: true })
  }

  componentWillUnmount () {
    this.observer.disconnect(this.wrapper)
    this.observer.disconnect(this.list)

    this.wrapper.removeEventListener('scroll', this.onScroll)
  }

  onScroll = event => {
    const { scrollTop, scrollHeight, offsetHeight } = this.wrapper

    this.shouldScroll = (scrollTop + offsetHeight) >= scrollHeight
  }

  onResize = entries => {
    if (this.shouldScroll) {
      this.scrollToBottom()
    }
  }

  scrollToBottom = () => {
    if (this.wrapper) {
      this.wrapper.scrollTop = this.wrapper.scrollHeight
    }
  }

  setWrapperRef = el => {
    this.wrapper = el
  }

  setListRef = el => {
    this.list = el && findDOMNode(el)
  }

  render () {
    const { styles, messageIds } = this.props

    const wrapper = {
      className: styles.messageListWrapper,
      ref: this.setWrapperRef,
    }

    const list = {
      component: 'ul',
      className: styles.messageList,
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
      ref: this.setListRef,
    }

    return (
      <div {...wrapper}>
        <ReactCSSTransitionGroup {...list}>
          {messageIds.map(id =>
            <ChatMessage key={id} id={id} styles={styles} />
          )}
        </ReactCSSTransitionGroup>
      </div>
    )
  }
}

const mapStateToProps = (state) => ({
  messageIds: getMainChatMessageIds(state),
})

export default connect(
  mapStateToProps,
  null,
  null,
  { withRef: true }
)(ChatMessageList)

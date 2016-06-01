import React, { Component, PropTypes } from 'react'
import shallowCompare from 'react-addons-shallow-compare'
import classNames from 'classnames'
import raf from 'raf'
import { connect } from 'react-redux'
import { TransitionMotion, spring, presets } from 'react-motion'
import Scrollbars from 'react-custom-scrollbars'

import ChatMessage from './ChatMessage'
import { getChatMessageIds } from './chatSelectors'

const { bool, object, array } = PropTypes

class ChatMessageList extends Component {
  static propTypes = {
    open: bool,
    messageIds: array,
    messages: object,
    users: object,
    styles: object
  }

  raf = null
  list = null
  shouldScroll = true

  componentDidMount () {
    this.scrollToBottom()
  }

  shouldComponentUpdate (nextProps, nextState) {
    return shallowCompare(this, nextProps, nextState)
  }

  componentWillUpdate () {
    if (this.scrollbars) {
      const scrollTop = this.scrollbars.getScrollTop()
      const clientHeight = this.scrollbars.getClientHeight()
      const maxScroll = scrollTop + clientHeight

      this.shouldScroll = maxScroll === this.scrollbars.getScrollHeight()
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
    if (this.scrollbars) {
      this.scrollbars.scrollToBottom()
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

  setScrollbarsRef = (el) => {
    this.scrollbars = el
  }

  renderMessageList = (messages) => {
    const { styles } = this.props

    return (
      <ul className={styles.messageList}>
        {messages.map(this.renderMessage)}
      </ul>
    )
  }

  renderMessage = ({ key, style: { opacity, translateX } }) => {
    const { styles } = this.props

    const style = {
      opacity,
      transform: `translateX(${translateX}%)`
    }

    const props = { id: key, key, style, styles }

    return <ChatMessage {...props} />
  }

  render () {
    const { open, styles } = this.props

    const container = {
      className: classNames(styles.messageListWrapper, {
        [styles.messageListWrapperOpen]: open
      }),
      onTransitionEnd: this.cancelAnimation
    }

    const scrollbars = {
      ref: this.setScrollbarsRef,
      autoHide: true,
      autoHeight: true,
      universal: true
    }

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

    return (
      <div {...container}>
        <Scrollbars {...scrollbars}>
          <TransitionMotion {...transition}>
            {messages => this.renderMessageList(messages)}
          </TransitionMotion>
        </Scrollbars>
      </div>
    )
  }
}

const mapStateToProps = (state) => ({
  messageIds: getChatMessageIds(state)
})

export default connect(mapStateToProps)(ChatMessageList)

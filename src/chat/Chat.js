import React, { PureComponent, PropTypes } from 'react'
import classNames from 'classnames'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import withSocket from 'helpers/withSocket'
import withStyles from 'helpers/withStyles'
import log from 'helpers/log'

import ChatMessageList from './ChatMessageList'
import ChatInput from './ChatInput'
import * as chatActions from './chatActions'
import { getChatLoading } from './chatSelectors'
import Styles from './Chat.css'

const { object, func, bool } = PropTypes

export class Chat extends PureComponent {
  static propTypes = {
    styles: object,
    messages: object,
    users: object,
    loading: bool,
    loadChatHistory: func,
    loadChatUsers: func,
    addChatMessage: func,
    updateChatMessage: func,
    removeChatMessage: func,
    socket: object,
    socketOpen: bool,
  }

  static defaultProps = {
    messages: {},
    users: {},
    loading: false,
  }

  state = { open: __DEV__ }

  componentDidMount () {
    const { loadChatHistory, loadChatUsers } = this.props

    loadChatHistory()
    loadChatUsers()
  }

  openChat = () => this.setState({ open: true })
  closeChat = () => this.setState({ open: false })
  toggleChat = () => this.setState(state => ({ open: !state.open }))

  onSocketError = event => {
    log('Socket Error', event)
  }

  onSocketMessage = (event, data) => {
    log('Socket Message', event)

    const {
      removeChatMessage,
      updateChatMessage,
      addChatMessage,
    } = this.props

    switch (data.subtype) {
      case 'message_deleted':
        removeChatMessage(data)
        break
      case 'message_changed':
      case 'message_replied':
        updateChatMessage(data)
        break
      default:
        addChatMessage(data)
    }
  }

  sendMessage = message => {
    const { socket } = this.props

    if (socket) {
      socket.send(message)
    }
  }

  onTransitionEnd = () => {
    if (this.list) {
      this.list.cancelAnimation()
    }
  }

  setListRef = el => {
    this.list = el && el.getWrappedInstance()
  }

  render () {
    const { open } = this.state
    const { styles, loading, socketOpen } = this.props

    if (!socketOpen) return null

    const wrapper = {
      className: classNames(styles.wrapper, {
        [styles.isOpen]: !!open,
      }),
      onTransitionEnd: this.onTransitionEnd,
    }

    const button = {
      className: classNames(styles.toggle, {
        [styles.toggleOpen]: open === false,
        [styles.toggleClose]: open === true,
      }),
      onClick: this.toggleChat,
    }

    const list = {
      ...this.props,
      ref: this.setListRef,
      open,
    }

    const input = {
      sendMessage: this.sendMessage,
      openChat: this.openChat,
      styles,
    }

    return (
      <div {...wrapper}>
        <button {...button}>
          <span className={styles.toggleText}>{open ? 'Close' : 'Open'}</span>
        </button>
        <div className={styles.container}>
          {!loading &&
            <ChatMessageList {...list} />}
          <ChatInput {...input} />
        </div>
      </div>
    )
  }
}

const WithSocket = withSocket()(Chat)
const WithStyles = withStyles(Styles)(WithSocket)

const mapStateToProps = (state) => ({
  loading: getChatLoading(state),
})

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({...chatActions}, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(WithStyles)

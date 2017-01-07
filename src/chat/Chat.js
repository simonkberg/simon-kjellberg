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
import { getChatOpen, getChatLoading } from './chatSelectors'
import Styles from './Chat.css'

const { object, func, bool } = PropTypes

export class Chat extends PureComponent {
  static propTypes = {
    styles: object,
    open: bool,
    messages: object,
    users: object,
    loading: bool,
    loadChatHistory: func,
    loadChatUsers: func,
    addChatMessage: func,
    removeChatMessage: func,
    openChat: func,
    closeChat: func,
    socket: object,
    socketOpen: bool,
  }

  static defaultProps = {
    open: false,
    messages: {},
    users: {},
    loading: false,
  }

  _socket = null

  componentDidMount () {
    const { loadChatHistory, loadChatUsers } = this.props

    loadChatHistory()
    loadChatUsers()
  }

  onSocketError = event => {
    log('Socket Error', event)
  }

  onSocketMessage = (event, data) => {
    log('Socket Message', event)

    const { removeChatMessage, addChatMessage } = this.props

    if (data.subtype && data.subtype === 'message_deleted') {
      removeChatMessage(data)
    } else {
      addChatMessage(data)
    }
  }

  sendMessage = message => {
    const { socket } = this.props

    if (socket) {
      socket.send(message)
    }
  }

  render () {
    const { styles, open, loading, openChat, closeChat, socketOpen } = this.props

    if (!socketOpen) return null

    const button = {
      className: classNames(styles.toggle, {
        [styles.toggleOpen]: open === false,
        [styles.toggleClose]: open === true,
      }),
      onClick: open
        ? closeChat
        : openChat,
    }

    const input = {
      sendMessage: this.sendMessage,
      styles,
      openChat,
    }

    return (
      <div className={styles.wrapper}>
        <button {...button}>
          <span className={styles.toggleText}>{open ? 'Close' : 'Open'}</span>
        </button>
        <div className={styles.container}>
          {!loading &&
            <ChatMessageList {...this.props} />}
          <ChatInput {...input} />
        </div>
      </div>
    )
  }
}

const WithSocket = withSocket()(Chat)
const WithStyles = withStyles(Styles)(WithSocket)

const mapStateToProps = (state) => ({
  open: getChatOpen(state),
  loading: getChatLoading(state),
})

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({...chatActions}, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(WithStyles)

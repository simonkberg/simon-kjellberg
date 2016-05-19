import React, { Component, PropTypes } from 'react'
import shallowCompare from 'react-addons-shallow-compare'
import classNames from 'classnames'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import withSocket from 'helpers/withSocket'
import withStyles from 'helpers/withStyles'
import * as ChatActions from 'actions/ChatActions'

import ChatMessageList from './ChatMessageList'
import styles from './Chat.css'

const { object, func, bool } = PropTypes

export class Chat extends Component {
  static propTypes = {
    open: bool,
    messages: object,
    users: object,
    loading: bool,
    loadChatHistory: func,
    loadChatUsers: func,
    addChatMessage: func,
    removeChatMessage: func,
    openChat: func,
    closeChat: func
  }

  static defaultProps = {
    open: false,
    messages: {},
    users: {},
    loading: false
  }

  _socket = null

  componentDidMount () {
    const { loadChatHistory, loadChatUsers } = this.props

    loadChatHistory()
    loadChatUsers()
  }

  shouldComponentUpdate (nextProps, nextState) {
    return shallowCompare(this, nextProps, nextState)
  }

  onSocketOpen = (event, socket) => {
    console.log('Socket Open', event)

    this._socket = socket
  }

  onSocketClose = (event) => {
    console.log('Socket Close', event)

    this._socket = null
  }

  onSocketError = (event) => {
    console.log('Socket Error', event)
  }

  onSocketMessage = (event, data) => {
    console.log('Socket Message', event)

    const { removeChatMessage, addChatMessage } = this.props

    if (data.subtype && data.subtype === 'message_deleted') {
      removeChatMessage(data)
    } else {
      addChatMessage(data)
    }
  }

  _onSubmit = (event) => {
    event.preventDefault()

    const { target } = event
    const data = new FormData(target)

    this.sendMessage(data.get('message'))

    target.children.namedItem('message').value = ''
  }

  sendMessage (message) {
    if (this._socket) {
      this._socket.send(message)
    }
  }

  render () {
    const { open, loading, openChat, closeChat } = this.props

    const button = {
      className: classNames(styles.toggle, {
        [styles.toggleOpen]: open === false,
        [styles.toggleClose]: open === true
      }),
      onClick: open
        ? closeChat
        : openChat
    }

    const input = {
      className: styles.input,
      type: 'text',
      name: 'message',
      placeholder: 'Type a message...',
      onFocus: openChat
    }

    return (
      <div className={styles.wrapper}>
        <button {...button}>
          <span className={styles.toggleText}>{open ? 'Close' : 'Open'}</span>
        </button>
        <div className={styles.container}>
          {!loading &&
            <ChatMessageList {...this.props} styles={styles} />}
          <form onSubmit={this._onSubmit} autoComplete='off'>
            <input {...input} />
          </form>
        </div>
      </div>
    )
  }
}

const WithSocket = withSocket()(Chat)
const WithStyles = withStyles(styles)(WithSocket)

const mapStateToProps = ({ chat }) => {
  const { open, messages, users } = chat

  return {
    open,
    loading: messages.loading || users.loading
  }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({...ChatActions}, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(WithStyles)

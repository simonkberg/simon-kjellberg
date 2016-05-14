import React, { Component, PropTypes } from 'react'
import withSocket from 'helpers/withSocket'
import withStyles from 'helpers/withStyles'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as ChatActions from 'actions/ChatActions'

import ChatMessageList from './ChatMessageList'
import styles from './Chat.css'

const { object, func, bool } = PropTypes

export class Chat extends Component {
  static propTypes = {
    messages: object,
    users: object,
    loading: bool,
    loadChatHistory: func,
    loadChatUsers: func,
    addChatMessage: func,
    removeChatMessage: func
  }

  static defaultProps = {
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
    const { messages, users, loading } = this.props
    const input = {
      className: styles.input,
      type: 'text',
      name: 'message',
      placeholder: 'Type a message...'
    }

    return (
      <div className={styles.wrapper}>
        <button className={styles.toggle} />
        <div className={styles.container}>
          {!loading &&
            <ChatMessageList messages={messages} users={users} styles={styles} />}
          <form onSubmit={this._onSubmit}>
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
  const { entities, messages, users } = chat

  return {
    messages: entities.messages,
    users: entities.users,
    loading: messages.loading || users.loading
  }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({...ChatActions}, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(WithStyles)

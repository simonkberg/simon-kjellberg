import React, { Component, PropTypes } from 'react'
import withSocket from 'helpers/withSocket'
import withStyles from 'helpers/withStyles'
import { connect } from 'react-redux'
import {
  loadChatHistory,
  addChatMessage,
  removeChatMessage,
  loadChatUsers
} from 'actions'

import styles from './Chat.css'

const { object, func, bool } = PropTypes

class Chat extends Component {
  static propTypes = {
    messages: object,
    users: object,
    loading: bool,
    dispatch: func
  }

  static defaultProps = {
    messages: {},
    users: {},
    loading: false
  }

  _socket = null

  componentDidMount () {
    const { dispatch } = this.props

    dispatch(loadChatHistory())
    dispatch(loadChatUsers())
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

    const { dispatch } = this.props

    if (data.subtype && data.subtype === 'message_deleted') {
      dispatch(removeChatMessage(data))
    } else {
      dispatch(addChatMessage(data))
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

  renderMessages () {
    const { messages, users } = this.props

    return Object.values(messages)
      .sort((a, b) => a.ts - b.ts)
      .map((message) => {
        const user = users[message.user]

        if (!user) return null

        return (
          <li key={message.ts}>
            <strong style={{color: `#${user.color}`}}>{user.name}: </strong>
            {message.text}
          </li>
        )
      })
  }

  render () {
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
          <ul>
            {this.renderMessages()}
          </ul>
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
const WithConnect = connect(({ chat }) => {
  const { entities, messages, users } = chat

  return {
    messages: entities.messages,
    users: entities.users,
    loading: messages.loading || users.loading
  }
})(WithStyles)

export default WithConnect

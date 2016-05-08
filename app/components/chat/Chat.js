import React, { Component, PropTypes } from 'react'
import withSocket from 'helpers/withSocket'
import { connect } from 'react-redux'
import {
  loadChatHistory,
  addChatMessage,
  removeChatMessage,
  loadChatUsers
} from 'actions'

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

    const data = new FormData(event.target)

    this.sendMessage(data.get('message'))
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
    return (
      <div>
        <h2>Chat</h2>
        <ul>
          {this.renderMessages()}
        </ul>
        <form onSubmit={this._onSubmit}>
          <input type='text' name='message' />
          <button type='submit'>Send</button>
        </form>
      </div>
    )
  }
}

const WithSocket = withSocket()(Chat)
const WithRedux = connect(({ chat }) => {
  const { entities, messages, users } = chat

  return {
    messages: entities.messages,
    users: entities.users,
    loading: messages.loading || users.loading
  }
})(WithSocket)

export default WithRedux

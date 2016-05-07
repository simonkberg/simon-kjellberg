import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { loadChatHistory, addChatMessage, loadChatUsers } from 'actions'

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

  _ws = null

  componentDidMount () {
    const { dispatch } = this.props

    dispatch(loadChatHistory())
    dispatch(loadChatUsers())

    this._ws = new WebSocket(`ws://${window.location.host}`)
    this._ws.addEventListener('open', this._onSocketOpen)
    this._ws.addEventListener('close', this._onSocketClose)
    this._ws.addEventListener('error', this._onSocketError)
  }

  componentWillUnmount () {
    if (this._ws) {
      this._ws.close()
    }
  }

  _onSocketOpen = (event) => {
    console.log('Socket Open', event)
    this._ws.addEventListener('message', this._onSocketMessage)
  }

  _onSocketClose = (event) => {
    console.log('Socket Close', event)
    this._ws.removeEventListener('message', this._onSocketMessage)
  }

  _onSocketError = (event) => {
    console.log('Socket Error', event)
  }

  _onSocketMessage = (event) => {
    console.log('Socket Message', event)

    const { dispatch } = this.props
    const message = JSON.parse(event.data)

    dispatch(addChatMessage(message))
  }

  _onSubmit = (event) => {
    event.persist()
    event.preventDefault()

    const data = new FormData(event.target)

    this.sendMessage(data.get('message'))
  }

  sendMessage (message) {
    if (this._ws) {
      this._ws.send(message)
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

export default connect(({ chat }) => {
  const { entities, messages, users } = chat

  return {
    messages: entities.messages,
    users: entities.users,
    loading: messages.loading || users.loading
  }
})(Chat)

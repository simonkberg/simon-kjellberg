import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { loadChatHistory, loadChatUsers } from 'actions'

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

  componentDidMount () {
    const { dispatch } = this.props

    dispatch(loadChatHistory())
    dispatch(loadChatUsers())
  }

  renderMessages () {
    const { messages, users } = this.props

    return Object.values(messages).reverse().map((message) => {
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

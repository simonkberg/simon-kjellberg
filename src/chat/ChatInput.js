import React, { Component, PropTypes } from 'react'

const { func, object } = PropTypes

class ChatInput extends Component {
  static propTypes = {
    styles: object,
    sendMessage: func,
    openChat: func,
  }

  state = { value: '' }

  onChange = ({ target: { value } }) => this.setState({ value })

  onSubmit = event => {
    event.preventDefault()

    this.props.sendMessage(this.state.value)
    this.setState({ value: '' })
  }

  render () {
    const input = {
      className: this.props.styles.input,
      type: 'text',
      name: 'message',
      placeholder: 'Type a message...',
      value: this.state.value,
      onFocus: this.props.openChat,
      onChange: this.onChange,
    }

    return (
      <form onSubmit={this.onSubmit} autoComplete='off'>
        <input {...input} />
      </form>
    )
  }
}

export default ChatInput

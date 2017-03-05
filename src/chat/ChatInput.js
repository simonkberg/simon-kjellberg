import React, { Component, PropTypes } from 'react'

const { func, object } = PropTypes

class ChatInput extends Component {
  static propTypes = {
    styles: object,
    sendMessage: func.isRequired,
    openChat: func.isRequired,
  };

  state = { value: '' };

  onChange = ({ target: { value } }) => this.setState({ value });

  onSubmit = event => {
    event.preventDefault()

    this.props.sendMessage(this.state.value)
    this.setState({ value: '' })
  };

  render () {
    const { value } = this.state
    const { styles, openChat } = this.props

    const form = {
      className: styles.form,
      onSubmit: this.onSubmit,
      autoComplete: 'off',
    }

    const input = {
      className: styles.input,
      type: 'text',
      name: 'message',
      placeholder: 'Type a message...',
      onFocus: openChat,
      onChange: this.onChange,
      value,
    }

    return (
      <form {...form}>
        <input {...input} />
      </form>
    )
  }
}

export default ChatInput

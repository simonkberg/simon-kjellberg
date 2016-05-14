import React, { PropTypes } from 'react'
import ChatMessage from './ChatMessage'

const ChatMessageList = ({ messages, users, styles }) => {
  const messageList = Object.values(messages)
    .sort((a, b) => a.ts - b.ts)

  return (
    <ul className={styles.messageList}>
        {messageList.map(message => {
          const props = {
            message: message,
            user: users[message.user],
            styles: styles,
            key: message.ts
          }

          return <ChatMessage {...props} />
        })}
    </ul>
  )
}

ChatMessageList.propTypes = {
  messages: PropTypes.object,
  users: PropTypes.object,
  styles: PropTypes.object
}

export default ChatMessageList

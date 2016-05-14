import React, { PropTypes } from 'react'
import ChatMessage from './ChatMessage'
import Transition from 'react-motion-ui-pack'

const ChatMessageList = ({ messages, users, styles }) => {
  const messageList = Object.values(messages)
    .sort((a, b) => a.ts - b.ts)

  const props = {
    component: 'ul',
    className: styles.messageList,
    appear: {
      translateX: 0,
      opacity: 0
    },
    enter: {
      translateX: 0,
      opacity: 1
    },
    leave: {
      translateX: -100,
      opacity: 0
    }
  }

  return (
    <Transition {...props}>
        {messageList.map(message => {
          const props = {
            message: message,
            user: users[message.user],
            styles: styles,
            key: message.ts
          }

          return <ChatMessage {...props} />
        })}
    </Transition>
  )
}

ChatMessageList.propTypes = {
  messages: PropTypes.object,
  users: PropTypes.object,
  styles: PropTypes.object
}

export default ChatMessageList

import React, { PropTypes } from 'react'

const ChatMessage = ({ message, user, styles }) => {
  return user && message ? (
    <li className={styles.message}>
      <strong style={{color: `#${user.color}`}}>{user.name}: </strong>
      {message.text}{' '}
      {message.edited &&
        <small className={styles.messageEdited}>(edited)</small>}
    </li>
  ) : null
}

ChatMessage.propTypes = {
  message: PropTypes.object,
  user: PropTypes.object,
  styles: PropTypes.object
}

export default ChatMessage

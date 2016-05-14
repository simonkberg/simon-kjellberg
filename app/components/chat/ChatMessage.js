import React, { PropTypes } from 'react'

const ChatMessage = ({ message, user, styles, style }) => {
  return (
    <li style={style} className={styles.message}>
      <strong style={{color: `#${user.color}`}}>{user.name}: </strong>
      {message.text}{' '}
      {message.edited &&
        <small className={styles.messageEdited}>(edited)</small>}
    </li>
  )
}

ChatMessage.propTypes = {
  message: PropTypes.object,
  user: PropTypes.object,
  styles: PropTypes.object.isRequired,
  style: PropTypes.object
}

ChatMessage.defaultProps = {
  message: {},
  user: {}
}

export default ChatMessage

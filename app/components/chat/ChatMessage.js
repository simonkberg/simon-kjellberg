import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import colorHash from 'helpers/colorHash'

const ChatMessage = ({ message = {}, user = '', styles, style }) => {
  const username = typeof user === 'string' ? user : user.name

  return (
    <li style={style} className={styles.message}>
      <strong style={{color: colorHash(username)}}>{username}: </strong>
      {message.text}{' '}
      {message.edited &&
        <small className={styles.messageEdited}>(edited)</small>}
    </li>
  )
}

ChatMessage.propTypes = {
  id: PropTypes.string.isRequired,
  message: PropTypes.object,
  user: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  styles: PropTypes.object.isRequired,
  style: PropTypes.object.isRequired
}

const mapStateToProps = ({ chat }, { id, ...props }) => {
  const { entities: { messages, users } } = chat
  const message = messages[id]

  return {
    message: message,
    user: message.username || users[message.user]
  }
}

export default connect(mapStateToProps)(ChatMessage)

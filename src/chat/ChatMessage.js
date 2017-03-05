import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import SlackMessage from 'helpers/slackMessage'
import colorHash from 'helpers/colorHash'
import { getChatMessage, getChatUser } from './chatSelectors'
import ChatMessageThread from './ChatMessageThread'

export const ChatMessage = ({ message = {}, user = {}, styles }) => {
  const { ts, text, edited, replies } = message
  const { name } = user

  return (
    <li className={styles.message}>
      <strong style={{ color: colorHash(name) }}>{name}: </strong>
      <SlackMessage emojiClassName={styles.messageEmoji}>
        {text}
      </SlackMessage>
      {' '}
      {edited && <small className={styles.messageEdited}>(edited)</small>}
      {replies &&
        replies.length > 0 &&
        <ChatMessageThread id={ts} styles={styles} />}
    </li>
  )
}

ChatMessage.propTypes = {
  message: PropTypes.object,
  user: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  styles: PropTypes.object.isRequired,
}

const mapStateToProps = (state, { id }) => {
  const message = getChatMessage(state, id)
  const name = message.username
  const user = name !== void 0 ? { name } : getChatUser(state, message.user)

  return { message, user }
}

export default connect(mapStateToProps)(ChatMessage)

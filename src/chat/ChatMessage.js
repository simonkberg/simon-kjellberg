import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import SlackMessage from 'helpers/slackMessage'
import colorHash from 'helpers/colorHash'

import {
  makeGetChatMessageEntity,
  makeGetChatUserEntity
} from './chatSelectors'

export const ChatMessage = ({ message = {}, user = 'anon', styles }) => {
  const isUserString = typeof user === 'string'
  const username = isUserString ? user : user.name
  const color = isUserString ? colorHash(username) : `#${user.color}`

  return (
    <li className={styles.message}>
      <strong style={{color: color}}>{username}: </strong>
      <SlackMessage emojiClassName={styles.messageEmoji}>
        {message.text}
      </SlackMessage>
      {' '}
      {message.edited &&
        <small className={styles.messageEdited}>(edited)</small>}
    </li>
  )
}

ChatMessage.propTypes = {
  message: PropTypes.object,
  user: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  styles: PropTypes.object.isRequired
}

const makeMapStateToProps = () => {
  const getChatMessageEntity = makeGetChatMessageEntity()
  const getChatUserEntity = makeGetChatUserEntity()

  return (state, { id }) => {
    const message = getChatMessageEntity(state, id)
    const user = message.username || getChatUserEntity(state, message.user)

    return {message, user}
  }
}

export default connect(makeMapStateToProps)(ChatMessage)

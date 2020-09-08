'use strict'

const { PubSub } = require('apollo-server-express')
const slack = require('../slack')

const pubSub = new PubSub()
const CHAT_MESSAGE_ADDED = 'CHAT_MESSAGE_ADDED'
const CHAT_MESSAGE_EDITED = 'CHAT_MESSAGE_EDITED'
const CHAT_MESSAGE_DELETED = 'CHAT_MESSAGE_DELETED'

slack.rtm.start()

slack.rtm.on('message', event => {
  if (event.channel === slack.channel) {
    if (event.subtype == null || event.subtype === 'bot_message') {
      pubSub.publish(CHAT_MESSAGE_ADDED, {
        chatMessageAdded: { chatMessage: event },
      })
    }

    if (event.subtype === 'message_changed') {
      pubSub.publish(CHAT_MESSAGE_EDITED, {
        chatMessageEdited: { chatMessage: event.message },
      })
    }

    if (event.subtype === 'message_deleted') {
      pubSub.publish(CHAT_MESSAGE_DELETED, {
        chatMessageDeleted: { chatMessage: event.previous_message },
      })
    }
  }
})

module.exports = {
  pubSub,
  CHAT_MESSAGE_ADDED,
  CHAT_MESSAGE_EDITED,
  CHAT_MESSAGE_DELETED,
}
